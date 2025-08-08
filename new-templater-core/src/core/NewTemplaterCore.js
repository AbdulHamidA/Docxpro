const JSZip = require("jszip");
const { parseStringPromise, Builder } = require("xml2js");
const BaseModule = require("./BaseModule");
const ContextResolver = require("../utils/ContextResolver"); // Import ContextResolver

/**
 * Core library for modular document templating.
 * Handles document loading, XML parsing, module orchestration, and rendering.
 */
class NewTemplaterCore {
  constructor(options = {}) {
    this.options = {
      errorOnMissingData: false,
      nullGetter: () => "",
      debug: false,
      ...options,
    };
    this.zip = null;
    this.context = {};
    this.modules = [];
    this.errors = [];
    this.fileType = null; // docx, pptx, xlsx
    this.xmlParser = parseStringPromise; // Use parseStringPromise directly
    this.xmlBuilder = new Builder();
    this.logger = console; // Default logger
    // Make ContextResolver available as a property for modules to access
    this.contextResolver = ContextResolver;
  }

  /**
   * Loads a template from a file path or buffer.
   * @param {string|Buffer} template - File path or buffer of the template.
   */
  async loadTemplate(template) {
    let buffer;
    if (typeof template === "string") {
      // In a real scenario, you'd use fs.promises.readFile here
      // For sandbox, we'll assume template is a buffer or will be provided as such
      throw new Error("File path loading not implemented in sandbox. Provide a Buffer.");
    } else if (template instanceof Buffer) {
      buffer = template;
    } else {
      throw new Error("Invalid template type. Must be a Buffer.");
    }

    this.zip = await JSZip.loadAsync(buffer);
    this.fileType = this._detectFileType();
    this.log("info", `Template loaded. Detected file type: ${this.fileType}`);
  }

  /**
   * Sets the data context for template processing.
   * @param {Object} data - The data object to be used for templating.
   */
  setContext(data) {
    this.context = data;
    this.log("info", "Context data set.");
  }

  /**
   * Attaches a module to the core templater.
   * @param {BaseModule} moduleInstance - An instance of a module extending BaseModule.
   */
  attachModule(moduleInstance) {
    if (!(moduleInstance instanceof BaseModule)) {
      throw new Error("Attached module must be an instance of BaseModule.");
    }
    // Pass the core instance to the module so it can access core utilities like contextResolver and options
    moduleInstance.setCore(this);
    this.modules.push(moduleInstance);
    // Sort modules by priority (lower number = higher priority)
    this.modules.sort((a, b) => a.priority - b.priority);
    this.log("info", `Module attached: ${moduleInstance.name}`);
  }

  /**
   * Renders the template with the provided context and attached modules.
   * @returns {Promise<Buffer>} - The generated document as a Buffer.
   */
  async render() {
    if (!this.zip) {
      throw new Error("No template loaded. Call loadTemplate() first.");
    }

    this.errors = []; // Reset errors for new render cycle
    this.log("info", "Starting document rendering...");

    const filesToProcess = this._getFilesToProcess();

    for (const filePath of filesToProcess) {
      this.log("debug", `Processing file: ${filePath}`);
      let xmlContent = await this.zip.file(filePath).async("text");

      // 1. Pre-parse stage (modules can modify raw XML)
      for (const module of this.modules) {
        if (module.shouldProcess(xmlContent, this.fileType)) {
          xmlContent = await module.preparse(xmlContent, this.fileType);
        }
      }

      // Parse XML into a JS object
      let parsedXml = await this.xmlParser(xmlContent, { explicitArray: false, mergeAttrs: true });

      // 2. Core parsing and module parsing (identify tags, tokenize)
      // This is a simplified representation. A real parser would tokenize XML nodes.
      // For now, we'll pass the string content for modules to work on.
      let processedContent = xmlContent; // Start with original XML content for modules

      for (const module of this.modules) {
        if (module.shouldProcess(processedContent, this.fileType)) {
          // Modules will need to implement their own parsing/replacement logic
          // This is where modules would typically transform `processedContent`
          // based on their specific tags and the context.
          processedContent = await module.render(processedContent, this.context, this.fileType);
        }
      }

      // 3. Post-render stage (modules can make final XML modifications)
      for (const module of this.modules) {
        if (module.shouldProcess(processedContent, this.fileType)) {
          processedContent = await module.postrender(processedContent, this.fileType);
        }
      }

      // Rebuild XML and update zip file
      // This step assumes processedContent is valid XML after module rendering
      // In a real scenario, modules would modify parsedXml object, then rebuild
      const finalXml = processedContent; // Simplified: assume modules return valid XML string
      this.zip.file(filePath, finalXml);
    }

    this.log("info", "Document rendering complete.");
    return this.zip.generateAsync({ type: "nodebuffer" });
  }

  /**
   * Saves the generated document to a file.
   * @param {string} outputPath - The path where the document should be saved.
   */
  async saveAs(outputPath) {
    const buffer = await this.render();
    // In a real scenario, you'd use fs.promises.writeFile here
    throw new Error("File saving not implemented in sandbox. Use the returned Buffer.");
  }

  /**
   * Returns any errors encountered during processing.
   * @returns {Array<Error>} - An array of errors.
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Adds an error to the error list.
   * @param {Error} error - The error to add.
   */
  addError(error) {
    this.errors.push(error);
    if (this.options.errorOnMissingData) {
      throw error; // Or rethrow based on specific error type
    }
  }

  /**
   * Returns the XML parser instance.
   * @returns {Builder} - The xml2js Builder instance.
   */
  getXmlParser() {
    return parseStringPromise;
  }

  /**
   * Returns the XML builder instance.
   * @returns {Builder} - The xml2js Builder instance.
   */
  getXmlBuilder() {
    return this.xmlBuilder;
  }

  /**
   * Returns the JSZip instance.
   * @returns {JSZip} - The JSZip instance.
   */
  getZipInstance() {
    return this.zip;
  }

  /**
   * Internal method to detect the file type (docx, pptx, xlsx).
   * @returns {string} - The detected file type.
   * @private
   */
  _detectFileType() {
    if (this.zip.file("word/document.xml")) return "docx";
    if (this.zip.file("ppt/presentation.xml")) return "pptx";
    if (this.zip.file("xl/workbook.xml")) return "xlsx";
    throw new Error("Unsupported file type. Not a valid DOCX, PPTX, or XLSX file.");
  }

  /**
   * Internal method to get a list of XML files to process based on file type.
   * @returns {Array<string>} - List of file paths within the zip.
   * @private
   */
  _getFilesToProcess() {
    switch (this.fileType) {
      case "docx":
        return [
          "word/document.xml",
          ...Object.keys(this.zip.files).filter(name => name.startsWith("word/header") || name.startsWith("word/footer"))
        ];
      case "pptx":
        return Object.keys(this.zip.files).filter(name => name.startsWith("ppt/slides/slide"));
      case "xlsx":
        return Object.keys(this.zip.files).filter(name => name.startsWith("xl/worksheets/sheet"));
      default:
        return [];
    }
  }

  /**
   * Internal logging utility.
   * @param {string} level - Log level (info, warn, error, debug).
   * @param {string} message - Message to log.
   * @private
   */
  log(level, message) {
    if (this.options.debug || level !== "debug") {
      this.logger[level](`[NewTemplaterCore] ${message}`);
    }
  }
}

module.exports = NewTemplaterCore;

