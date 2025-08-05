/**
 * Placeholder module implementation
 */
class MetaModule {
  constructor() {
    this.name = 'metamodule';
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

module.exports = MetaModule;
