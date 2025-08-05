/**
 * Error Location Module - Adds comments to document at error locations for debugging
 */
class ErrorLocationModule {
  constructor() {
    this.name = 'errorLocation';
    this.priority = 10; // High priority to catch errors early
    this.supportedTypes = ['docx'];
    this.errors = [];
    this.commentCounter = 1;
  }

  /**
   * Process content and add error location comments
   * @param {string} content - Content to process
   * @param {Object} context - Processing context
   * @returns {Promise<string>} - Processed content with error comments
   */
  async process(content, context) {
    this.errors = [];
    let processedContent = content;
    
    // Check for common template errors
    processedContent = this._checkForMalformedTags(processedContent, context);
    processedContent = this._checkForMissingData(processedContent, context);
    processedContent = this._checkForUnmatchedTags(processedContent, context);
    
    // Add comments to document if errors found
    if (this.errors.length > 0) {
      processedContent = await this._addErrorComments(processedContent, context);
    }
    
    return processedContent;
  }

  /**
   * Check if content has potential errors to process
   * @param {string} content - Content to check
   * @returns {boolean} - Always true as this module should always run
   */
  hasTagsToProcess(content) {
    return true; // Always process to check for errors
  }

  /**
   * Get collected errors
   * @returns {Array} - Array of error objects
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Check for malformed template tags
   * @private
   */
  _checkForMalformedTags(content, context) {
    // Check for incomplete opening braces
    const incompleteOpenPattern = /\{(?!\{)[^}]*$/gm;
    let match;
    
    while ((match = incompleteOpenPattern.exec(content)) !== null) {
      this._addError({
        type: 'malformed_tag',
        message: 'Incomplete opening brace - missing closing brace',
        position: match.index,
        text: match[0]
      });
    }
    
    // Check for incomplete closing braces
    const incompleteClosePattern = /^[^{]*\}(?!\})/gm;
    while ((match = incompleteClosePattern.exec(content)) !== null) {
      this._addError({
        type: 'malformed_tag',
        message: 'Incomplete closing brace - missing opening brace',
        position: match.index,
        text: match[0]
      });
    }
    
    // Check for mismatched braces
    const mismatchedPattern = /\{[^{%@}]*\}|\{%[^%]*\}|\{@[^}]*\}/g;
    while ((match = mismatchedPattern.exec(content)) !== null) {
      const tag = match[0];
      
      // Check if it's a valid tag format
      if (!this._isValidTagFormat(tag)) {
        this._addError({
          type: 'malformed_tag',
          message: `Invalid tag format: ${tag}`,
          position: match.index,
          text: tag
        });
      }
    }
    
    return content;
  }

  /**
   * Check for missing data references
   * @private
   */
  _checkForMissingData(content, context) {
    // Find all placeholder references
    const placeholderPattern = /\{\{([^}]+)\}\}/g;
    let match;
    
    while ((match = placeholderPattern.exec(content)) !== null) {
      const variableName = match[1].trim();
      
      if (!this._hasDataPath(variableName, context.context)) {
        this._addError({
          type: 'missing_data',
          message: `Missing data for placeholder: ${variableName}`,
          position: match.index,
          text: match[0],
          variable: variableName
        });
      }
    }
    
    // Find all module tag references
    const modulePattern = /\{%\s*(\w+)\s+([^%]*)\s*%\}/g;
    while ((match = modulePattern.exec(content)) !== null) {
      const moduleName = match[1];
      const dataPath = match[2].trim();
      
      if (dataPath && !this._hasDataPath(dataPath, context.context)) {
        this._addError({
          type: 'missing_data',
          message: `Missing data for ${moduleName} module: ${dataPath}`,
          position: match.index,
          text: match[0],
          variable: dataPath
        });
      }
    }
    
    return content;
  }

  /**
   * Check for unmatched control structure tags
   * @private
   */
  _checkForUnmatchedTags(content, context) {
    // Check loop tags
    const loopStarts = this._findMatches(content, /\{%\s*loop\s+/g);
    const loopEnds = this._findMatches(content, /\{%\s*endloop\s*%\}/g);
    
    if (loopStarts.length !== loopEnds.length) {
      this._addError({
        type: 'unmatched_tags',
        message: `Unmatched loop tags: ${loopStarts.length} starts, ${loopEnds.length} ends`,
        position: loopStarts.length > loopEnds.length ? 
          loopStarts[loopEnds.length]?.index || 0 : 
          (loopEnds[loopStarts.length]?.index || 0)
      });
    }
    
    // Check conditional tags
    const ifStarts = this._findMatches(content, /\{%\s*if\s+/g);
    const ifEnds = this._findMatches(content, /\{%\s*endif\s*%\}/g);
    
    if (ifStarts.length !== ifEnds.length) {
      this._addError({
        type: 'unmatched_tags',
        message: `Unmatched conditional tags: ${ifStarts.length} starts, ${ifEnds.length} ends`,
        position: ifStarts.length > ifEnds.length ? 
          ifStarts[ifEnds.length]?.index || 0 : 
          (ifEnds[ifStarts.length]?.index || 0)
      });
    }
    
    return content;
  }

  /**
   * Add error comments to the document
   * @private
   */
  async _addErrorComments(content, context) {
    let processedContent = content;
    
    // Sort errors by position (reverse order to maintain positions)
    const sortedErrors = [...this.errors].sort((a, b) => b.position - a.position);
    
    for (const error of sortedErrors) {
      const comment = this._createErrorComment(error);
      
      // Find the nearest paragraph to insert the comment
      const insertPosition = this._findNearestParagraph(processedContent, error.position);
      
      if (insertPosition !== -1) {
        processedContent = this._insertComment(processedContent, insertPosition, comment);
      }
    }
    
    // Add comments part to the document
    await this._addCommentsToDocument(context);
    
    return processedContent;
  }

  /**
   * Create error comment XML
   * @private
   */
  _createErrorComment(error) {
    const commentId = this.commentCounter++;
    
    return {
      id: commentId,
      author: 'DocxTemplaterPro',
      date: new Date().toISOString(),
      text: `${error.type.toUpperCase()}: ${error.message}`,
      xml: `<w:commentRangeStart w:id="${commentId}"/>
             <w:r><w:t>ERROR</w:t></w:r>
             <w:commentRangeEnd w:id="${commentId}"/>
             <w:r><w:commentReference w:id="${commentId}"/></w:r>`
    };
  }

  /**
   * Insert comment at position
   * @private
   */
  _insertComment(content, position, comment) {
    return content.slice(0, position) + comment.xml + content.slice(position);
  }

  /**
   * Find nearest paragraph to insert comment
   * @private
   */
  _findNearestParagraph(content, position) {
    // Look for the nearest paragraph start before the error position
    const beforeContent = content.slice(0, position);
    const paragraphMatch = beforeContent.lastIndexOf('<w:p>');
    
    if (paragraphMatch !== -1) {
      // Find the end of the paragraph opening tag
      const tagEnd = content.indexOf('>', paragraphMatch);
      return tagEnd !== -1 ? tagEnd + 1 : paragraphMatch;
    }
    
    // If no paragraph found, insert at the beginning
    return 0;
  }

  /**
   * Add comments part to document
   * @private
   */
  async _addCommentsToDocument(context) {
    if (this.errors.length === 0) return;
    
    // Create comments.xml content
    let commentsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    commentsXml += '<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">';
    
    for (let i = 0; i < this.errors.length; i++) {
      const error = this.errors[i];
      const commentId = i + 1;
      
      commentsXml += `<w:comment w:id="${commentId}" w:author="DocxTemplaterPro" w:date="${new Date().toISOString()}">
        <w:p>
          <w:pPr>
            <w:pStyle w:val="CommentText"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rStyle w:val="CommentReference"/>
            </w:rPr>
            <w:annotationRef/>
          </w:r>
          <w:r>
            <w:t xml:space="preserve"> ${this._escapeXml(error.message)}</w:t>
          </w:r>
        </w:p>
      </w:comment>`;
    }
    
    commentsXml += '</w:comments>';
    
    // Add comments.xml to the document
    context.zip.file('word/comments.xml', commentsXml);
    
    // Update relationships
    await this._updateRelationships(context);
    
    // Update content types
    await this._updateContentTypes(context);
  }

  /**
   * Update document relationships for comments
   * @private
   */
  async _updateRelationships(context) {
    const relsPath = 'word/_rels/document.xml.rels';
    const relsFile = context.zip.file(relsPath);
    
    if (relsFile) {
      let relsContent = await relsFile.async('text');
      
      // Add comments relationship if not exists
      if (!relsContent.includes('comments.xml')) {
        const commentsRel = '<Relationship Id="rIdComments" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>';
        relsContent = relsContent.replace('</Relationships>', `${commentsRel}</Relationships>`);
        context.zip.file(relsPath, relsContent);
      }
    }
  }

  /**
   * Update content types for comments
   * @private
   */
  async _updateContentTypes(context) {
    const contentTypesPath = '[Content_Types].xml';
    const contentTypesFile = context.zip.file(contentTypesPath);
    
    if (contentTypesFile) {
      let contentTypesContent = await contentTypesFile.async('text');
      
      // Add comments content type if not exists
      if (!contentTypesContent.includes('comments.xml')) {
        const commentsOverride = '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>';
        contentTypesContent = contentTypesContent.replace('</Types>', `${commentsOverride}</Types>`);
        context.zip.file(contentTypesPath, contentTypesContent);
      }
    }
  }

  /**
   * Add an error to the collection
   * @private
   */
  _addError(error) {
    this.errors.push({
      ...error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if a tag format is valid
   * @private
   */
  _isValidTagFormat(tag) {
    const validPatterns = [
      /^\{\{[^}]+\}\}$/, // {{variable}}
      /^\{%\s*\w+[^%]*%\}$/, // {%module data%}
      /^\{@[^}]+\}$/, // {@rawXml}
      /^\{\{\?[^}]+\}\}$/ // {{?optional}}
    ];
    
    return validPatterns.some(pattern => pattern.test(tag));
  }

  /**
   * Check if data path exists in context
   * @private
   */
  _hasDataPath(path, context) {
    try {
      const keys = path.split('.');
      let value = context;
      
      for (const key of keys) {
        if (value === null || value === undefined || typeof value !== 'object') {
          return false;
        }
        
        if (!(key in value)) {
          return false;
        }
        
        value = value[key];
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find all matches for a pattern
   * @private
   */
  _findMatches(content, pattern) {
    const matches = [];
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      matches.push({
        index: match.index,
        text: match[0]
      });
    }
    
    return matches;
  }

  /**
   * Escape XML special characters
   * @private
   */
  _escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = ErrorLocationModule;

