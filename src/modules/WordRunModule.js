/**
 * Placeholder module implementation
 */
class WordRunModule {
  constructor() {
    this.name = 'wordrunmodule';
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

module.exports = WordRunModule;
