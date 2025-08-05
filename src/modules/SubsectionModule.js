/**
 * Placeholder module implementation
 */
class SubsectionModule {
  constructor() {
    this.name = 'subsectionmodule';
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

module.exports = SubsectionModule;
