/**
 * Placeholder module implementation
 */
class PptxSubModule {
  constructor() {
    this.name = 'pptxsubmodule';
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

module.exports = PptxSubModule;
