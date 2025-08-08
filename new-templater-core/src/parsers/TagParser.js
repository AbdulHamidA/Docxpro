/**
 * Parses template content to identify various tag types: placeholders, loops, conditionals, raw XML, and module tags.
 * This parser aims to be compatible with docxtemplater's tag syntax.
 */
class TagParser {
  constructor(options = {}) {
    this.options = {
      delimiters: { start: "{{", end: "}}" }, // Default for placeholders
      moduleDelimiters: { start: "{%", end: "%}" }, // For loops, conditionals, and module-specific tags
      rawXmlDelimiter: { start: "{@", end: "}" }, // For raw XML insertion
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

      // Order of matching matters: raw XML, then module tags, then placeholders
      // This is because module tags and raw XML tags might contain characters that look like placeholder delimiters.

      // 1. Try to match raw XML tag (e.g., {@myRawXml})
      const rawXmlMatch = this._matchTag(remainingContent, this.options.rawXmlDelimiter);
      if (rawXmlMatch) {
        tokens.push({
          type: "rawXml",
          value: rawXmlMatch.value.trim(),
          fullMatch: rawXmlMatch.fullMatch,
          start: cursor,
          end: cursor + rawXmlMatch.fullMatch.length,
        });
        cursor += rawXmlMatch.fullMatch.length;
        continue;
      }

      // 2. Try to match module tag (e.g., {%loop item in items%}, {%if condition%}, {%image myImage%})
      const moduleMatch = this._matchTag(remainingContent, this.options.moduleDelimiters);
      if (moduleMatch) {
        const tagContent = moduleMatch.value.trim();
        const firstSpaceIndex = tagContent.indexOf(" ");
        let tagType, tagData;

        if (firstSpaceIndex !== -1) {
          tagType = tagContent.substring(0, firstSpaceIndex);
          tagData = tagContent.substring(firstSpaceIndex + 1).trim();
        } else {
          tagType = tagContent;
          tagData = "";
        }

        // Differentiate between loop, conditional, and generic module tags
        if (tagType.startsWith("loop") || tagType.startsWith("endloop")) {
          tokens.push({
            type: "loop",
            tagType: tagType, // e.g., 'loop', 'endloop'
            tagData: tagData,
            value: moduleMatch.value,
            fullMatch: moduleMatch.fullMatch,
            start: cursor,
            end: cursor + moduleMatch.fullMatch.length,
          });
        } else if (tagType.startsWith("if") || tagType.startsWith("endif") || tagType.startsWith("else")) {
          tokens.push({
            type: "condition",
            tagType: tagType, // e.g., 'if', 'endif', 'else'
            tagData: tagData,
            value: moduleMatch.value,
            fullMatch: moduleMatch.fullMatch,
            start: cursor,
            end: cursor + moduleMatch.fullMatch.length,
          });
        } else {
          // Generic module tag
          tokens.push({
            type: "moduleTag",
            moduleName: tagType, // e.g., 'image', 'html'
            tagData: tagData,
            value: moduleMatch.value,
            fullMatch: moduleMatch.fullMatch,
            start: cursor,
            end: cursor + moduleMatch.fullMatch.length,
          });
        }
        cursor += moduleMatch.fullMatch.length;
        continue;
      }

      // 3. Try to match standard placeholder tag (e.g., {{myVariable}})
      const placeholderMatch = this._matchTag(remainingContent, this.options.delimiters);
      if (placeholderMatch) {
        tokens.push({
          type: "placeholder",
          value: placeholderMatch.value.trim(),
          fullMatch: placeholderMatch.fullMatch,
          start: cursor,
          end: cursor + placeholderMatch.fullMatch.length,
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

      if (nextTagIndex === Infinity) {
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
   * @returns {number} - The index of the next start delimiter, or Infinity if not found.
   * @private
   */
  _findNextDelimiter(text, startDelimiter) {
    const index = text.indexOf(startDelimiter);
    return index === -1 ? Infinity : index; // Return Infinity if not found to simplify Math.min
  }
}

module.exports = TagParser;

