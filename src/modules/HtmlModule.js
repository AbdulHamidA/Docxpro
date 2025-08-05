/**
 * HTML Module - Allows embedding HTML content in DOCX documents
 */
class HtmlModule {
  constructor() {
    this.name = 'html';
    this.priority = 50;
    this.supportedTypes = ['docx'];
  }

  /**
   * Process content and convert HTML tags to WordML
   * @param {string} content - Content to process
   * @param {Object} context - Processing context
   * @returns {Promise<string>} - Processed content
   */
  async process(content, context) {
    // Find HTML module tags: {%html variable_name%}
    const htmlPattern = /\{%\s*html\s+([^%]+)\s*%\}/g;
    let processedContent = content;
    let match;

    while ((match = htmlPattern.exec(content)) !== null) {
      const variableName = match[1].trim();
      const htmlContent = this._getHtmlContent(variableName, context.context);
      
      if (htmlContent) {
        const wordMl = this._convertHtmlToWordMl(htmlContent);
        processedContent = processedContent.replace(match[0], wordMl);
      } else {
        processedContent = processedContent.replace(match[0], '');
      }
    }

    return processedContent;
  }

  /**
   * Check if content has HTML tags to process
   * @param {string} content - Content to check
   * @returns {boolean} - True if has HTML tags
   */
  hasTagsToProcess(content) {
    return /\{%\s*html\s+[^%]+\s*%\}/.test(content);
  }

  /**
   * Get HTML content from context
   * @private
   */
  _getHtmlContent(variableName, context) {
    try {
      const keys = variableName.split('.');
      let value = context;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return null;
        }
      }
      
      return typeof value === 'string' ? value : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convert HTML to WordML (Word Markup Language)
   * @private
   */
  _convertHtmlToWordMl(html) {
    let wordMl = '';
    
    // Parse HTML and convert to WordML
    const htmlContent = this._parseHtml(html);
    
    for (const element of htmlContent) {
      wordMl += this._convertElementToWordMl(element);
    }
    
    return wordMl;
  }

  /**
   * Parse HTML into structured elements
   * @private
   */
  _parseHtml(html) {
    const elements = [];
    
    // Simple HTML parser - in production, use a proper HTML parser
    const tagPattern = /<(\/?)([\w]+)([^>]*)>/g;
    let lastIndex = 0;
    let match;
    const tagStack = [];
    
    while ((match = tagPattern.exec(html)) !== null) {
      // Add text before tag
      if (match.index > lastIndex) {
        const text = html.substring(lastIndex, match.index);
        if (text.trim()) {
          elements.push({
            type: 'text',
            content: text,
            styles: this._getCurrentStyles(tagStack)
          });
        }
      }
      
      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();
      const attributes = this._parseAttributes(match[3]);
      
      if (isClosing) {
        // Pop from stack
        if (tagStack.length > 0 && tagStack[tagStack.length - 1].name === tagName) {
          tagStack.pop();
        }
      } else {
        // Push to stack
        tagStack.push({ name: tagName, attributes });
        
        // Handle self-closing or block elements
        if (this._isBlockElement(tagName)) {
          elements.push({
            type: 'block',
            tagName,
            attributes,
            styles: this._getCurrentStyles(tagStack)
          });
        }
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < html.length) {
      const text = html.substring(lastIndex);
      if (text.trim()) {
        elements.push({
          type: 'text',
          content: text,
          styles: this._getCurrentStyles(tagStack)
        });
      }
    }
    
    return elements;
  }

  /**
   * Convert a parsed element to WordML
   * @private
   */
  _convertElementToWordMl(element) {
    switch (element.type) {
      case 'text':
        return this._createTextRun(element.content, element.styles);
      
      case 'block':
        switch (element.tagName) {
          case 'p':
            return this._createParagraph(element);
          case 'table':
            return this._createTable(element);
          case 'ul':
          case 'ol':
            return this._createList(element);
          default:
            return '';
        }
      
      default:
        return '';
    }
  }

  /**
   * Create a WordML text run
   * @private
   */
  _createTextRun(text, styles) {
    let runProperties = '';
    
    if (styles.bold) {
      runProperties += '<w:b/>';
    }
    
    if (styles.italic) {
      runProperties += '<w:i/>';
    }
    
    if (styles.underline) {
      runProperties += '<w:u w:val="single"/>';
    }
    
    if (styles.color) {
      runProperties += `<w:color w:val="${styles.color}"/>`;
    }
    
    if (styles.fontSize) {
      runProperties += `<w:sz w:val="${styles.fontSize * 2}"/>`;
    }
    
    const rPr = runProperties ? `<w:rPr>${runProperties}</w:rPr>` : '';
    const escapedText = this._escapeXml(text);
    
    return `<w:r>${rPr}<w:t>${escapedText}</w:t></w:r>`;
  }

  /**
   * Create a WordML paragraph
   * @private
   */
  _createParagraph(element) {
    return `<w:p><w:pPr></w:pPr></w:p>`;
  }

  /**
   * Create a WordML table
   * @private
   */
  _createTable(element) {
    return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr></w:tbl>`;
  }

  /**
   * Create a WordML list
   * @private
   */
  _createList(element) {
    const isOrdered = element.tagName === 'ol';
    return `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${isOrdered ? '1' : '2'}"/></w:numPr></w:pPr></w:p>`;
  }

  /**
   * Parse HTML attributes
   * @private
   */
  _parseAttributes(attrString) {
    const attributes = {};
    const attrPattern = /(\w+)=["']([^"']+)["']/g;
    let match;
    
    while ((match = attrPattern.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }
    
    return attributes;
  }

  /**
   * Get current styles from tag stack
   * @private
   */
  _getCurrentStyles(tagStack) {
    const styles = {
      bold: false,
      italic: false,
      underline: false,
      color: null,
      fontSize: null
    };
    
    for (const tag of tagStack) {
      switch (tag.name) {
        case 'b':
        case 'strong':
          styles.bold = true;
          break;
        case 'i':
        case 'em':
          styles.italic = true;
          break;
        case 'u':
          styles.underline = true;
          break;
        case 'span':
          if (tag.attributes.style) {
            this._parseInlineStyles(tag.attributes.style, styles);
          }
          break;
      }
    }
    
    return styles;
  }

  /**
   * Parse inline CSS styles
   * @private
   */
  _parseInlineStyles(styleString, styles) {
    const stylePattern = /([^:;]+):\s*([^;]+)/g;
    let match;
    
    while ((match = stylePattern.exec(styleString)) !== null) {
      const property = match[1].trim();
      const value = match[2].trim();
      
      switch (property) {
        case 'color':
          styles.color = value.replace('#', '');
          break;
        case 'font-size':
          const fontSize = parseInt(value);
          if (!isNaN(fontSize)) {
            styles.fontSize = fontSize;
          }
          break;
        case 'font-weight':
          if (value === 'bold' || parseInt(value) >= 600) {
            styles.bold = true;
          }
          break;
        case 'font-style':
          if (value === 'italic') {
            styles.italic = true;
          }
          break;
        case 'text-decoration':
          if (value.includes('underline')) {
            styles.underline = true;
          }
          break;
      }
    }
  }

  /**
   * Check if element is a block element
   * @private
   */
  _isBlockElement(tagName) {
    const blockElements = ['p', 'div', 'table', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    return blockElements.includes(tagName);
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

module.exports = HtmlModule;

