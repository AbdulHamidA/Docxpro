/**
 * Placeholder module implementation
 */
class SubtemplateModule {
  constructor() {
    this.name = 'subtemplatemodule';
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

module.exports = SubtemplateModule;
