/**
 * Placeholder module implementation
 */
class FootnotesModule {
  constructor() {
    this.name = 'footnotesmodule';
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

module.exports = FootnotesModule;
