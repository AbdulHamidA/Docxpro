/**
 * Template parser for handling placeholder syntax and control structures
 */
class TemplateParser {
  constructor(options = {}) {
    this.options = options;
    
    // Regular expressions for different template constructs
    this.patterns = {
      // Simple placeholders: {{variable}}
      placeholder: /\{\{([^}]+)\}\}/g,
      
      // Loop constructs: {%loop item in items%}...{%endloop%}
      loop: /\{%\s*loop\s+(\w+)\s+in\s+([^%]+)\s*%\}(.*?)\{%\s*endloop\s*%\}/gs,
      
      // Conditional constructs: {%if condition%}...{%endif%}
      conditional: /\{%\s*if\s+([^%]+)\s*%\}(.*?)(?:\{%\s*else\s*%\}(.*?))?\{%\s*endif\s*%\}/gs,
      
      // Module-specific tags: {%module_name data%}
      moduleTag: /\{%\s*(\w+)\s+([^%]*)\s*%\}/g,
      
      // Raw XML insertion: {@rawXml}
      rawXml: /\{@([^}]+)\}/g,
      
      // Paragraph placeholder: {{?optional_content}}
      paragraphPlaceholder: /\{\{\?([^}]+)\}\}/g
    };
  }

  /**
   * Parse template content and identify all template constructs
   * @param {string} content - Template content to parse
   * @returns {Object} - Parsed template structure
   */
  parse(content) {
    const tokens = [];
    let position = 0;
    
    // Find all template constructs in order
    const allMatches = this._findAllMatches(content);
    
    // Sort matches by position
    allMatches.sort((a, b) => a.index - b.index);
    
    // Build token structure
    for (const match of allMatches) {
      // Add text before this match
      if (match.index > position) {
        tokens.push({
          type: 'text',
          content: content.substring(position, match.index),
          index: position
        });
      }
      
      // Add the match token
      tokens.push(match);
      position = match.index + match.length;
    }
    
    // Add remaining text
    if (position < content.length) {
      tokens.push({
        type: 'text',
        content: content.substring(position),
        index: position
      });
    }
    
    return {
      tokens,
      originalContent: content
    };
  }

  /**
   * Find all template matches in content
   * @private
   */
  _findAllMatches(content) {
    const matches = [];
    
    // Find loops
    let match;
    while ((match = this.patterns.loop.exec(content)) !== null) {
      matches.push({
        type: 'loop',
        index: match.index,
        length: match[0].length,
        variable: match[1].trim(),
        collection: match[2].trim(),
        content: match[3],
        fullMatch: match[0]
      });
    }
    
    // Reset regex
    this.patterns.loop.lastIndex = 0;
    
    // Find conditionals
    while ((match = this.patterns.conditional.exec(content)) !== null) {
      matches.push({
        type: 'conditional',
        index: match.index,
        length: match[0].length,
        condition: match[1].trim(),
        ifContent: match[2],
        elseContent: match[3] || '',
        fullMatch: match[0]
      });
    }
    
    // Reset regex
    this.patterns.conditional.lastIndex = 0;
    
    // Find module tags
    while ((match = this.patterns.moduleTag.exec(content)) !== null) {
      // Skip if this is part of a loop or conditional (already captured)
      if (!this._isPartOfLargerConstruct(content, match.index, matches)) {
        matches.push({
          type: 'module',
          index: match.index,
          length: match[0].length,
          moduleName: match[1].trim(),
          data: match[2].trim(),
          fullMatch: match[0]
        });
      }
    }
    
    // Reset regex
    this.patterns.moduleTag.lastIndex = 0;
    
    // Find simple placeholders
    while ((match = this.patterns.placeholder.exec(content)) !== null) {
      // Skip if this is part of a larger construct
      if (!this._isPartOfLargerConstruct(content, match.index, matches)) {
        matches.push({
          type: 'placeholder',
          index: match.index,
          length: match[0].length,
          variable: match[1].trim(),
          fullMatch: match[0]
        });
      }
    }
    
    // Reset regex
    this.patterns.placeholder.lastIndex = 0;
    
    // Find raw XML tags
    while ((match = this.patterns.rawXml.exec(content)) !== null) {
      if (!this._isPartOfLargerConstruct(content, match.index, matches)) {
        matches.push({
          type: 'rawXml',
          index: match.index,
          length: match[0].length,
          variable: match[1].trim(),
          fullMatch: match[0]
        });
      }
    }
    
    // Reset regex
    this.patterns.rawXml.lastIndex = 0;
    
    // Find paragraph placeholders
    while ((match = this.patterns.paragraphPlaceholder.exec(content)) !== null) {
      if (!this._isPartOfLargerConstruct(content, match.index, matches)) {
        matches.push({
          type: 'paragraphPlaceholder',
          index: match.index,
          length: match[0].length,
          variable: match[1].trim(),
          fullMatch: match[0]
        });
      }
    }
    
    // Reset regex
    this.patterns.paragraphPlaceholder.lastIndex = 0;
    
    return matches;
  }

  /**
   * Check if a match is part of a larger construct (to avoid double-processing)
   * @private
   */
  _isPartOfLargerConstruct(content, index, existingMatches) {
    return existingMatches.some(match => 
      index >= match.index && index < match.index + match.length
    );
  }

  /**
   * Validate template syntax
   * @param {string} content - Template content to validate
   * @returns {Array} - Array of validation errors
   */
  validate(content) {
    const errors = [];
    
    // Check for unmatched loop tags
    const loopStarts = (content.match(/\{%\s*loop\s+/g) || []).length;
    const loopEnds = (content.match(/\{%\s*endloop\s*%\}/g) || []).length;
    
    if (loopStarts !== loopEnds) {
      errors.push({
        type: 'syntax',
        message: `Unmatched loop tags: ${loopStarts} starts, ${loopEnds} ends`
      });
    }
    
    // Check for unmatched conditional tags
    const ifStarts = (content.match(/\{%\s*if\s+/g) || []).length;
    const ifEnds = (content.match(/\{%\s*endif\s*%\}/g) || []).length;
    
    if (ifStarts !== ifEnds) {
      errors.push({
        type: 'syntax',
        message: `Unmatched conditional tags: ${ifStarts} starts, ${ifEnds} ends`
      });
    }
    
    // Check for malformed placeholders
    const malformedPlaceholders = content.match(/\{[^{%@]|[^}%@]\}/g);
    if (malformedPlaceholders) {
      errors.push({
        type: 'syntax',
        message: `Malformed placeholders found: ${malformedPlaceholders.join(', ')}`
      });
    }
    
    return errors;
  }
}

module.exports = TemplateParser;

