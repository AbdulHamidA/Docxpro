/**
 * Placeholder module implementation
 */
class StylingModule {
  constructor() {
    this.name = 'stylingmodule';
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

module.exports = StylingModule;
