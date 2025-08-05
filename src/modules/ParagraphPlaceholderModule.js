/**
 * Placeholder module implementation
 */
class ParagraphPlaceholderModule {
  constructor() {
    this.name = 'paragraphplaceholdermodule';
    this.priority = 100;
    this.supportedTypes = ['docx', 'pptx', 'xlsx'];
  }

  async process(content, context) {
    return content;
  }

  hasTagsToProcess(content) {
    return false;
  }
}

module.exports = ParagraphPlaceholderModule;
