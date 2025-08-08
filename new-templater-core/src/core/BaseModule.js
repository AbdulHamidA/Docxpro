/**
 * Base class for all modules in the new-templater ecosystem
 * All modules must extend this class and implement the required methods
 */
class BaseModule {
  constructor(options = {}) {
    this.name = this.constructor.name;
    this.tags = []; // Tags this module is responsible for (e.g., ['html', 'image'])
    this.supportedFileTypes = ['docx', 'pptx', 'xlsx']; // Which file types this module can process
    this.priority = 100; // Lower number means higher priority for processing
    this.options = options;
    this.core = null; // Will be set by the core when module is attached
  }

  /**
   * Called by the core to initialize the module with core utilities
   * @param {NewTemplaterCore} coreInstance - The core templater instance
   */
  setCore(coreInstance) {
    this.core = coreInstance;
  }

  /**
   * Pre-parsing stage: modify raw XML before core parsing
   * @param {string} xmlContent - Raw XML content
   * @param {string} fileType - Type of file being processed (docx, pptx, xlsx)
   * @returns {Promise<string>} - Modified XML content
   */
  async preparse(xmlContent, fileType) {
    return xmlContent;
  }

  /**
   * Parsing stage: identify and transform module-specific tags into internal representations
   * @param {Array} tokens - Array of parsed tokens from the core
   * @param {string} fileType - Type of file being processed
   * @returns {Array} - Modified tokens array
   */
  parse(tokens, fileType) {
    return tokens;
  }

  /**
   * Rendering stage: process internal representations and replace with final XML/content
   * @param {string} processedContent - Content after core processing
   * @param {Object} context - Data context for template variables
   * @param {string} fileType - Type of file being processed
   * @returns {Promise<string>} - Final processed content
   */
  async render(processedContent, context, fileType) {
    return processedContent;
  }

  /**
   * Post-rendering stage: final modifications after all rendering
   * @param {string} finalXml - Final XML content after all processing
   * @param {string} fileType - Type of file being processed
   * @returns {Promise<string>} - Final modified XML
   */
  async postrender(finalXml, fileType) {
    return finalXml;
  }

  /**
   * Optional: Validate module-specific syntax in the template
   * @param {string} templateContent - Template content to validate
   * @returns {Array} - Array of validation errors
   */
  validate(templateContent) {
    return []; // Array of errors
  }

  /**
   * Check if this module should process the given content
   * @param {string} content - Content to check
   * @param {string} fileType - Type of file
   * @returns {boolean} - True if module should process this content
   */
  shouldProcess(content, fileType) {
    if (!this.supportedFileTypes.includes(fileType)) {
      return false;
    }

    // Check if any of the module's tags are present in the content
    return this.tags.some(tag => {
      const tagPattern = new RegExp(`\\{%\\s*${tag}\\s+[^%]*%\\}`, 'g');
      return tagPattern.test(content);
    });
  }

  /**
   * Get the module's configuration
   * @returns {Object} - Module configuration
   */
  getConfig() {
    return {
      name: this.name,
      tags: this.tags,
      supportedFileTypes: this.supportedFileTypes,
      priority: this.priority,
      options: this.options
    };
  }

  /**
   * Log a message (uses core's logger if available)
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Message to log
   */
  log(level, message) {
    if (this.core && this.core.logger) {
      this.core.logger[level](`[${this.name}] ${message}`);
    } else {
      console[level](`[${this.name}] ${message}`);
    }
  }
}

module.exports = BaseModule;

