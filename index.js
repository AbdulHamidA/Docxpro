const DocxTemplaterPro = require('./src/core/DocxTemplaterPro');
const { 
  HtmlModule,
  ImageModule,
  XlsxModule,
  SlidesModule,
  ChartModule,
  TableModule,
  ErrorLocationModule,
  SubtemplateModule,
  PptxSubModule,
  SubsectionModule,
  QrCodeModule,
  WordRunModule,
  MetaModule,
  StylingModule,
  HtmlPptxModule,
  FootnotesModule,
  ParagraphPlaceholderModule
} = require('./src/modules');

module.exports = {
  DocxTemplaterPro,
  modules: {
    HtmlModule,
    ImageModule,
    XlsxModule,
    SlidesModule,
    ChartModule,
    TableModule,
    ErrorLocationModule,
    SubtemplateModule,
    PptxSubModule,
    SubsectionModule,
    QrCodeModule,
    WordRunModule,
    MetaModule,
    StylingModule,
    HtmlPptxModule,
    FootnotesModule,
    ParagraphPlaceholderModule
  }
};

