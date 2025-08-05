const xml2js = require('xml2js');

/**
 * Document processor for handling document-specific XML operations
 */
class DocumentProcessor {
  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      explicitRoot: false
    });
    
    this.builder = new xml2js.Builder({
      explicitArray: false,
      mergeAttrs: true,
      explicitRoot: false,
      headless: true
    });
  }

  /**
   * Parse XML content to JavaScript object
   * @param {string} xmlContent - XML content to parse
   * @returns {Promise<Object>} - Parsed XML object
   */
  async parseXml(xmlContent) {
    try {
      return await this.parser.parseStringPromise(xmlContent);
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error.message}`);
    }
  }

  /**
   * Build XML content from JavaScript object
   * @param {Object} xmlObject - JavaScript object to convert to XML
   * @returns {string} - XML content
   */
  buildXml(xmlObject) {
    try {
      return this.builder.buildObject(xmlObject);
    } catch (error) {
      throw new Error(`Failed to build XML: ${error.message}`);
    }
  }

  /**
   * Extract text content from Word document XML
   * @param {string} xmlContent - Word document XML
   * @returns {Array} - Array of text runs
   */
  extractTextRuns(xmlContent) {
    const textRuns = [];
    
    // Simple regex to find text runs in Word XML
    const textPattern = /<w:t[^>]*>(.*?)<\/w:t>/g;
    let match;
    
    while ((match = textPattern.exec(xmlContent)) !== null) {
      textRuns.push({
        text: this._decodeXmlEntities(match[1]),
        fullMatch: match[0],
        index: match.index
      });
    }
    
    return textRuns;
  }

  /**
   * Extract paragraphs from Word document XML
   * @param {string} xmlContent - Word document XML
   * @returns {Array} - Array of paragraph objects
   */
  extractParagraphs(xmlContent) {
    const paragraphs = [];
    
    // Find paragraph elements
    const paragraphPattern = /<w:p[^>]*>(.*?)<\/w:p>/gs;
    let match;
    
    while ((match = paragraphPattern.exec(xmlContent)) !== null) {
      paragraphs.push({
        content: match[1],
        fullMatch: match[0],
        index: match.index
      });
    }
    
    return paragraphs;
  }

  /**
   * Extract tables from Word document XML
   * @param {string} xmlContent - Word document XML
   * @returns {Array} - Array of table objects
   */
  extractTables(xmlContent) {
    const tables = [];
    
    // Find table elements
    const tablePattern = /<w:tbl[^>]*>(.*?)<\/w:tbl>/gs;
    let match;
    
    while ((match = tablePattern.exec(xmlContent)) !== null) {
      tables.push({
        content: match[1],
        fullMatch: match[0],
        index: match.index
      });
    }
    
    return tables;
  }

  /**
   * Extract images from document XML
   * @param {string} xmlContent - Document XML
   * @returns {Array} - Array of image references
   */
  extractImages(xmlContent) {
    const images = [];
    
    // Find image references in Word documents
    const imagePattern = /<a:blip[^>]*r:embed="([^"]*)"[^>]*>/g;
    let match;
    
    while ((match = imagePattern.exec(xmlContent)) !== null) {
      images.push({
        relationshipId: match[1],
        fullMatch: match[0],
        index: match.index
      });
    }
    
    return images;
  }

  /**
   * Replace text in XML while preserving structure
   * @param {string} xmlContent - XML content
   * @param {string} searchText - Text to search for
   * @param {string} replaceText - Text to replace with
   * @returns {string} - Modified XML content
   */
  replaceText(xmlContent, searchText, replaceText) {
    // Escape XML entities in replacement text
    const escapedReplace = this._escapeXmlEntities(replaceText);
    
    // Replace text while preserving XML structure
    return xmlContent.replace(
      new RegExp(this._escapeRegex(searchText), 'g'),
      escapedReplace
    );
  }

  /**
   * Insert XML content at a specific position
   * @param {string} xmlContent - Original XML content
   * @param {number} position - Position to insert at
   * @param {string} insertContent - Content to insert
   * @returns {string} - Modified XML content
   */
  insertXmlAt(xmlContent, position, insertContent) {
    return xmlContent.slice(0, position) + insertContent + xmlContent.slice(position);
  }

  /**
   * Remove XML element by pattern
   * @param {string} xmlContent - XML content
   * @param {RegExp} pattern - Pattern to match for removal
   * @returns {string} - Modified XML content
   */
  removeElement(xmlContent, pattern) {
    return xmlContent.replace(pattern, '');
  }

  /**
   * Validate XML structure
   * @param {string} xmlContent - XML content to validate
   * @returns {boolean} - True if valid XML
   */
  isValidXml(xmlContent) {
    try {
      this.parser.parseStringPromise(xmlContent);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get document relationships from relationships XML
   * @param {string} relsXml - Relationships XML content
   * @returns {Object} - Map of relationship IDs to targets
   */
  parseRelationships(relsXml) {
    const relationships = {};
    
    const relPattern = /<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"[^>]*>/g;
    let match;
    
    while ((match = relPattern.exec(relsXml)) !== null) {
      relationships[match[1]] = match[2];
    }
    
    return relationships;
  }

  /**
   * Create a new relationship entry
   * @param {string} id - Relationship ID
   * @param {string} type - Relationship type
   * @param {string} target - Target path
   * @returns {string} - Relationship XML
   */
  createRelationship(id, type, target) {
    return `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`;
  }

  /**
   * Decode XML entities
   * @private
   */
  _decodeXmlEntities(text) {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  /**
   * Escape XML entities
   * @private
   */
  _escapeXmlEntities(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Escape regex special characters
   * @private
   */
  _escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = DocumentProcessor;

