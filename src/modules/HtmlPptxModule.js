/**
 * Placeholder module implementation
 */
class HtmlPptxModule {
  constructor() {
    this.name = 'htmlpptxmodule';
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

module.exports = HtmlPptxModule;
