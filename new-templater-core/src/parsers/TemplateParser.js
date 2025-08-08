/**
 * Parses template content to identify placeholders, loops, conditionals, and module tags.
 * Inspired by docxtemplater's lexer and parser.
 */
class TemplateParser {
  constructor(options = {}) {
    this.options = {
      delimiters: { start: "{{", end: "}}" },
      moduleDelimiters: { start: "{%", end: "%}" },
      rawXmlDelimiter: { start: "{@", end: "}" },
      ...
      options,
    };
  }

  /**
   * Parses the given content and returns an array of tokens.
   * @param {string} content - The template content (e.g., XML string from document.xml).
   * @returns {Array<Object>} - An array of parsed tokens.
   */
  parse(content) {
    const tokens = [];
    let cursor = 0;

    while (cursor < content.length) {
      const remainingContent = content.substring(cursor);

      // Try to match raw XML tag
      const rawXmlMatch = this._matchTag(remainingContent, this.options.rawXmlDelimiter);
      if (rawXmlMatch) {
        tokens.push({
          type: "rawXml",
          value: rawXmlMatch.value,
          fullMatch: rawXmlMatch.fullMatch,
        });
        cursor += rawXmlMatch.fullMatch.length;
        continue;
      }

      // Try to match module tag (loops, conditionals, custom modules)
      const moduleMatch = this._matchTag(remainingContent, this.options.moduleDelimiters);
      if (moduleMatch) {
        const parts = moduleMatch.value.trim().split(/\s+/);
        const tagType = parts[0];
        const tagData = parts.slice(1).join(" ");

        tokens.push({
          type: "moduleTag",
          tagType: tagType,
          tagData: tagData,
          value: moduleMatch.value,
          fullMatch: moduleMatch.fullMatch,
        });
        cursor += moduleMatch.fullMatch.length;
        continue;
      }

      // Try to match standard placeholder tag
      const placeholderMatch = this._matchTag(remainingContent, this.options.delimiters);
      if (placeholderMatch) {
        tokens.push({
          type: "placeholder",
          value: placeholderMatch.value,
          fullMatch: placeholderMatch.fullMatch,
        });
        cursor += placeholderMatch.fullMatch.length;
        continue;
      }

      // If no tag is matched, it's plain text
      const nextTagIndex = Math.min(
        this._findNextDelimiter(remainingContent, this.options.rawXmlDelimiter.start),
        this._findNextDelimiter(remainingContent, this.options.moduleDelimiters.start),
        this._findNextDelimiter(remainingContent, this.options.delimiters.start)
      );

      if (nextTagIndex === -1) {
        // No more tags, add remaining content as text
        tokens.push({ type: "text", value: remainingContent });
        cursor = content.length;
      } else {
        // Add text up to the next tag
        tokens.push({ type: "text", value: remainingContent.substring(0, nextTagIndex) });
        cursor += nextTagIndex;
      }
    }

    return tokens;
  }

  /**
   * Helper to find and extract content between delimiters.
   * @param {string} text - The text to search within.
   * @param {Object} delimiters - Object with 'start' and 'end' delimiter strings.
   * @returns {Object|null} - An object containing value and fullMatch, or null if not found.
   * @private
   */
  _matchTag(text, delimiters) {
    const startIndex = text.indexOf(delimiters.start);
    if (startIndex === -1) {
      return null;
    }

    const endIndex = text.indexOf(delimiters.end, startIndex + delimiters.start.length);
    if (endIndex === -1) {
      return null; // Unclosed tag
    }

    const value = text.substring(startIndex + delimiters.start.length, endIndex);
    const fullMatch = text.substring(startIndex, endIndex + delimiters.end.length);

    return { value, fullMatch };
  }

  /**
   * Helper to find the index of the next occurrence of any start delimiter.
   * @param {string} text - The text to search within.
   * @param {string} startDelimiter - The start delimiter to search for.
   * @returns {number} - The index of the next start delimiter, or -1 if not found.
   * @private
   */
  _findNextDelimiter(text, startDelimiter) {
    const index = text.indexOf(startDelimiter);
    return index === -1 ? Infinity : index; // Return Infinity if not found to simplify Math.min
  }
}

module.exports = TemplateParser;

