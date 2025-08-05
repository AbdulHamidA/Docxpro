const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const TemplateParser = require('./TemplateParser');
const ContextProcessor = require('./ContextProcessor');
const ModuleManager = require('./ModuleManager');
const DocumentProcessor = require('../parsers/DocumentProcessor');

/**
 * Main class for the DocxTemplaterPro library
 * Provides document templating capabilities for DOCX, PPTX, and XLSX files
 */
class DocxTemplaterPro {
  constructor(options = {}) {
    this.options = {
      errorOnMissingData: false,
      nullGetter: () => '',
      ...options
    };
    
    this.moduleManager = new ModuleManager();
    this.templateParser = new TemplateParser(this.options);
    this.contextProcessor = new ContextProcessor(this.options);
    this.documentProcessor = new DocumentProcessor();
    
    this.template = null;
    this.zip = null;
    this.context = {};
    this.errors = [];
  }

  /**
   * Load a template from file path or buffer
   * @param {string|Buffer} template - Path to template file or buffer
   */
  async loadTemplate(template) {
    try {
      let buffer;
      
      if (typeof template === 'string') {
        buffer = fs.readFileSync(template);
      } else if (Buffer.isBuffer(template)) {
        buffer = template;
      } else {
        throw new Error('Template must be a file path or Buffer');
      }
      
      this.zip = await JSZip.loadAsync(buffer);
      this.template = buffer;
      
      // Determine document type
      this.documentType = this._detectDocumentType();
      
      return this;
    } catch (error) {
      throw new Error(`Failed to load template: ${error.message}`);
    }
  }

  /**
   * Set the context data for template processing
   * @param {Object} context - Data to be used in template
   */
  setContext(context) {
    this.context = context || {};
    return this;
  }

  /**
   * Register a module with the templater
   * @param {Object} module - Module to register
   */
  attachModule(module) {
    this.moduleManager.register(module);
    return this;
  }

  /**
   * Process the template with the given context
   * @returns {Promise<Buffer>} - Generated document as buffer
   */
  async render() {
    if (!this.zip) {
      throw new Error('No template loaded. Call loadTemplate() first.');
    }

    try {
      this.errors = [];
      
      // Process the document based on type
      const processedZip = await this._processDocument();
      
      // Generate the final document
      const buffer = await processedZip.generateAsync({ type: 'nodebuffer' });
      
      return buffer;
    } catch (error) {
      throw new Error(`Failed to render template: ${error.message}`);
    }
  }

  /**
   * Get any errors that occurred during processing
   * @returns {Array} - Array of error objects
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Save the rendered document to a file
   * @param {string} outputPath - Path to save the document
   */
  async saveAs(outputPath) {
    const buffer = await this.render();
    fs.writeFileSync(outputPath, buffer);
    return this;
  }

  /**
   * Detect the document type based on content
   * @private
   */
  _detectDocumentType() {
    const contentTypes = this.zip.file('[Content_Types].xml');
    if (!contentTypes) {
      throw new Error('Invalid document: missing Content_Types.xml');
    }
    
    // Read content types to determine document format
    const contentTypesXml = contentTypes.asText();
    
    if (contentTypesXml.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml')) {
      return 'docx';
    } else if (contentTypesXml.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml')) {
      return 'pptx';
    } else if (contentTypesXml.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml')) {
      return 'xlsx';
    }
    
    throw new Error('Unsupported document type');
  }

  /**
   * Process the document based on its type
   * @private
   */
  async _processDocument() {
    const processedZip = this.zip.clone();
    
    switch (this.documentType) {
      case 'docx':
        return await this._processDocx(processedZip);
      case 'pptx':
        return await this._processPptx(processedZip);
      case 'xlsx':
        return await this._processXlsx(processedZip);
      default:
        throw new Error(`Unsupported document type: ${this.documentType}`);
    }
  }

  /**
   * Process DOCX document
   * @private
   */
  async _processDocx(zip) {
    // Process main document
    const documentXml = zip.file('word/document.xml');
    if (documentXml) {
      const content = await documentXml.async('text');
      const processedContent = await this._processXmlContent(content, 'docx');
      zip.file('word/document.xml', processedContent);
    }

    // Process headers and footers
    const headerFooterFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('word/header') || name.startsWith('word/footer')
    );
    
    for (const fileName of headerFooterFiles) {
      const file = zip.file(fileName);
      if (file) {
        const content = await file.async('text');
        const processedContent = await this._processXmlContent(content, 'docx');
        zip.file(fileName, processedContent);
      }
    }

    return zip;
  }

  /**
   * Process PPTX document
   * @private
   */
  async _processPptx(zip) {
    // Find all slide files
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );
    
    for (const fileName of slideFiles) {
      const file = zip.file(fileName);
      if (file) {
        const content = await file.async('text');
        const processedContent = await this._processXmlContent(content, 'pptx');
        zip.file(fileName, processedContent);
      }
    }

    return zip;
  }

  /**
   * Process XLSX document
   * @private
   */
  async _processXlsx(zip) {
    // Process shared strings
    const sharedStrings = zip.file('xl/sharedStrings.xml');
    if (sharedStrings) {
      const content = await sharedStrings.async('text');
      const processedContent = await this._processXmlContent(content, 'xlsx');
      zip.file('xl/sharedStrings.xml', processedContent);
    }

    // Process worksheets
    const worksheetFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('xl/worksheets/sheet') && name.endsWith('.xml')
    );
    
    for (const fileName of worksheetFiles) {
      const file = zip.file(fileName);
      if (file) {
        const content = await file.async('text');
        const processedContent = await this._processXmlContent(content, 'xlsx');
        zip.file(fileName, processedContent);
      }
    }

    return zip;
  }

  /**
   * Process XML content with template parsing and module processing
   * @private
   */
  async _processXmlContent(xmlContent, documentType) {
    try {
      // Parse template tags
      const parsedContent = this.templateParser.parse(xmlContent);
      
      // Process with context
      let processedContent = this.contextProcessor.process(parsedContent, this.context);
      
      // Apply modules
      processedContent = await this.moduleManager.process(processedContent, {
        context: this.context,
        documentType,
        zip: this.zip
      });
      
      return processedContent;
    } catch (error) {
      this.errors.push({
        message: error.message,
        location: 'XML processing',
        documentType
      });
      
      if (this.options.errorOnMissingData) {
        throw error;
      }
      
      return xmlContent; // Return original content if error handling is lenient
    }
  }
}

module.exports = DocxTemplaterPro;

