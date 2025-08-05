/**
 * Context processor for handling data binding and template evaluation
 */
class ContextProcessor {
  constructor(options = {}) {
    this.options = {
      nullGetter: () => '',
      errorOnMissingData: false,
      ...options
    };
  }

  /**
   * Process parsed template with context data
   * @param {Object} parsedTemplate - Parsed template structure
   * @param {Object} context - Data context
   * @returns {string} - Processed content
   */
  process(parsedTemplate, context) {
    let result = '';
    
    for (const token of parsedTemplate.tokens) {
      switch (token.type) {
        case 'text':
          result += token.content;
          break;
          
        case 'placeholder':
          result += this._processPlaceholder(token, context);
          break;
          
        case 'loop':
          result += this._processLoop(token, context);
          break;
          
        case 'conditional':
          result += this._processConditional(token, context);
          break;
          
        case 'rawXml':
          result += this._processRawXml(token, context);
          break;
          
        case 'paragraphPlaceholder':
          result += this._processParagraphPlaceholder(token, context);
          break;
          
        case 'module':
          // Module processing is handled by ModuleManager
          result += token.fullMatch;
          break;
          
        default:
          result += token.fullMatch || token.content;
      }
    }
    
    return result;
  }

  /**
   * Process a simple placeholder
   * @private
   */
  _processPlaceholder(token, context) {
    try {
      const value = this._getValue(token.variable, context);
      return this._formatValue(value);
    } catch (error) {
      if (this.options.errorOnMissingData) {
        throw new Error(`Missing data for placeholder: ${token.variable}`);
      }
      return this.options.nullGetter();
    }
  }

  /**
   * Process a loop construct
   * @private
   */
  _processLoop(token, context) {
    try {
      const collection = this._getValue(token.collection, context);
      
      if (!Array.isArray(collection)) {
        if (this.options.errorOnMissingData) {
          throw new Error(`Loop collection is not an array: ${token.collection}`);
        }
        return '';
      }
      
      let result = '';
      
      for (let i = 0; i < collection.length; i++) {
        const item = collection[i];
        const loopContext = {
          ...context,
          [token.variable]: item,
          $index: i,
          $first: i === 0,
          $last: i === collection.length - 1,
          $length: collection.length
        };
        
        // Recursively process the loop content
        const parsedContent = this._parseContent(token.content);
        result += this.process(parsedContent, loopContext);
      }
      
      return result;
    } catch (error) {
      if (this.options.errorOnMissingData) {
        throw error;
      }
      return '';
    }
  }

  /**
   * Process a conditional construct
   * @private
   */
  _processConditional(token, context) {
    try {
      const conditionResult = this._evaluateCondition(token.condition, context);
      const contentToProcess = conditionResult ? token.ifContent : token.elseContent;
      
      if (contentToProcess) {
        const parsedContent = this._parseContent(contentToProcess);
        return this.process(parsedContent, context);
      }
      
      return '';
    } catch (error) {
      if (this.options.errorOnMissingData) {
        throw error;
      }
      return token.elseContent ? this._parseContent(token.elseContent) : '';
    }
  }

  /**
   * Process raw XML insertion
   * @private
   */
  _processRawXml(token, context) {
    try {
      const value = this._getValue(token.variable, context);
      return value || '';
    } catch (error) {
      if (this.options.errorOnMissingData) {
        throw error;
      }
      return '';
    }
  }

  /**
   * Process paragraph placeholder (removes paragraph if value is null/undefined)
   * @private
   */
  _processParagraphPlaceholder(token, context) {
    try {
      const value = this._getValue(token.variable, context);
      
      if (value === null || value === undefined || value === '') {
        // Find the containing paragraph and remove it
        return this._removeParagraph(token);
      }
      
      return this._formatValue(value);
    } catch (error) {
      if (this.options.errorOnMissingData) {
        throw error;
      }
      // Remove paragraph if data is missing
      return this._removeParagraph(token);
    }
  }

  /**
   * Get value from context using dot notation
   * @private
   */
  _getValue(path, context) {
    const keys = path.split('.');
    let value = context;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        throw new Error(`Cannot access property '${key}' of ${value}`);
      }
      
      if (typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        throw new Error(`Property '${key}' not found in context`);
      }
    }
    
    return value;
  }

  /**
   * Evaluate a condition expression
   * @private
   */
  _evaluateCondition(condition, context) {
    try {
      // Simple condition evaluation
      // Support for basic comparisons: ==, !=, >, <, >=, <=
      const operators = ['==', '!=', '>=', '<=', '>', '<'];
      
      for (const op of operators) {
        if (condition.includes(op)) {
          const [left, right] = condition.split(op).map(s => s.trim());
          const leftValue = this._getValue(left, context);
          const rightValue = this._parseValue(right, context);
          
          switch (op) {
            case '==': return leftValue == rightValue;
            case '!=': return leftValue != rightValue;
            case '>': return leftValue > rightValue;
            case '<': return leftValue < rightValue;
            case '>=': return leftValue >= rightValue;
            case '<=': return leftValue <= rightValue;
          }
        }
      }
      
      // Simple truthiness check
      const value = this._getValue(condition, context);
      return !!value;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse a value (could be a literal or a context reference)
   * @private
   */
  _parseValue(value, context) {
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // Check if it's a number
    if (!isNaN(value)) {
      return parseFloat(value);
    }
    
    // Check if it's a boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Try to get from context
    try {
      return this._getValue(value, context);
    } catch (error) {
      return value; // Return as literal string
    }
  }

  /**
   * Format a value for output
   * @private
   */
  _formatValue(value) {
    if (value === null || value === undefined) {
      return this.options.nullGetter();
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Parse content into tokens (simplified version for nested processing)
   * @private
   */
  _parseContent(content) {
    // This is a simplified parser for nested content
    // In a full implementation, this would use the TemplateParser
    return {
      tokens: [{
        type: 'text',
        content: content
      }]
    };
  }

  /**
   * Remove paragraph containing the placeholder
   * @private
   */
  _removeParagraph(token) {
    // This is a placeholder implementation
    // In a full implementation, this would analyze the XML structure
    // and remove the containing paragraph element
    return '';
  }
}

module.exports = ContextProcessor;

