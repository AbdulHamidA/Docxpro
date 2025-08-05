/**
 * Placeholder module implementation
 */
class ChartModule {
  constructor() {
    this.name = 'chartmodule';
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

module.exports = ChartModule;
