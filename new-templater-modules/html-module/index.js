const { BaseModule } = require("@new-templater/core");
const { parse } = require("node-html-parser");

/**
 * HTML Module for @new-templater/core.
 * Enables embedding HTML content directly into DOCX documents by converting HTML snippets to WordML.
 * Supports a limited subset of HTML tags.
 */
class HtmlModule extends BaseModule {
  constructor(options = {}) {
    super(options);
    this.name = "HtmlModule";
    this.tags = ["html"];
    this.supportedFileTypes = ["docx"]; // HTML module primarily works with DOCX
    this.priority = 20; // Higher priority to process HTML before other content
  }

  /**
   * Converts a given HTML string into WordML (OpenXML) fragments.
   * This is a simplified converter supporting basic tags.
   * @param {string} htmlString - The HTML content to convert.
   * @returns {string} - The corresponding WordML fragment.
   */
  _convertHtmlToWordML(htmlString) {
    const root = parse(htmlString);
    let wordMl = "";

    root.childNodes.forEach(node => {
      wordMl += this._processNode(node);
    });

    return wordMl;
  }

  /**
   * Recursively processes an HTML node and converts it to WordML.
   * @param {Object} node - The HTML node from node-html-parser.
   * @returns {string} - The corresponding WordML fragment.
   */
  _processNode(node) {
    let wordMl = "";
    if (node.nodeType === 1) { // Element node
      switch (node.tagName.toLowerCase()) {
        case "p":
          wordMl += `<w:p>${this._processChildren(node)}</w:p>`;
          break;
        case "b":
        case "strong":
          wordMl += `<w:r><w:rPr><w:b/></w:rPr>${this._processChildren(node)}</w:r>`;
          break;
        case "i":
        case "em":
          wordMl += `<w:r><w:rPr><w:i/></w:rPr>${this._processChildren(node)}</w:r>`;
          break;
        case "ul":
        case "ol":
          // For lists, we'll iterate through list items and apply basic list formatting
          node.childNodes.forEach(li => {
            if (li.tagName && li.tagName.toLowerCase() === "li") {
              // Simple bullet for ul, or number for ol (requires more complex WordML for proper numbering)
              const prefix = (node.tagName.toLowerCase() === "ul") ? "• " : "1. "; // Simplified
              wordMl += `<w:p><w:r><w:t>${prefix}</w:t></w:r>${this._processChildren(li)}</w:p>`;
            }
          });
          break;
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          // Basic heading style (e.g., bold and larger font, simplified here)
          wordMl += `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${this._processChildren(node)}</w:t></w:r></w:p>`;
          break;
        case "div":
        case "span":
          wordMl += this._processChildren(node); // Process children directly
          break;
        default:
          // For unrecognized tags, just process their children as plain text
          wordMl += this._processChildren(node); 
          break;
      }
    } else if (node.nodeType === 3) { // Text node
      wordMl += `<w:t>${node.text}</w:t>`;
    }
    return wordMl;
  }

  /**
   * Processes all child nodes of a given HTML node.
   * @param {Object} node - The parent HTML node.
   * @returns {string} - Concatenated WordML fragments of children.
   */
  _processChildren(node) {
    let childrenWordMl = "";
    node.childNodes.forEach(child => {
      childrenWordMl += this._processNode(child);
    });
    return childrenWordMl;
  }

  /**
   * Processes the content, replacing HTML tags with their DOCX equivalent.
   * This module operates in the render phase, transforming the HTML string into WordML.
   * @param {string} content - The XML content of the document part.
   * @param {Object} context - The data context.
   * @param {string} fileType - The type of the file (e.g., 'docx').
   * @returns {Promise<string>} - The processed XML content.
   */
  async render(content, context, fileType) {
    if (fileType !== "docx") {
      this.log("warn", `HtmlModule only supports DOCX files. Skipping for ${fileType}.`);
      return content;
    }

    // Regex to find {%html variableName%} tags
    const htmlTagRegex = new RegExp(`\\{%\\s*html\\s+([^%]+)%\\}`, "g");

    let processedContent = content;
    let match;

    const replacements = [];

    // Reset regex lastIndex before starting
    htmlTagRegex.lastIndex = 0;

    while ((match = htmlTagRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const variablePath = match[1].trim();

      // Access contextResolver and nullGetter from this.core
      const htmlString = this.core.contextResolver.resolve(context, variablePath, this.core.options.nullGetter());

      if (typeof htmlString !== "string") {
        this.core.addError(new Error(`HtmlModule: Expected HTML content for variable \'${variablePath}\' to be a string, but got ${typeof htmlString}.`));
        replacements.push({ fullMatch, replacement: "" }); // Remove the tag if content is invalid
        continue;
      }

      try {
        const wordMlFragment = this._convertHtmlToWordML(htmlString);
        replacements.push({ fullMatch, replacement: wordMlFragment });
        this.log("info", `Processed HTML for variable: ${variablePath}`);
      } catch (error) {
        this.core.addError(new Error(`HtmlModule: Failed to process HTML for variable \'${variablePath}\': ${error.message}`));
        replacements.push({ fullMatch, replacement: "" });
      }
    }

    // Apply replacements from last to first to avoid issues with index changes
    for (let i = replacements.length - 1; i >= 0; i--) {
      const rep = replacements[i];
      processedContent = processedContent.replace(rep.fullMatch, rep.replacement);
    }

    return processedContent;
  }
}

module.exports = HtmlModule;

