const NewTemplaterCore = require("../src/core/NewTemplaterCore");
const BaseModule = require("../src/core/BaseModule");
const assert = require("assert");
const JSZip = require("jszip");

describe("NewTemplaterCore", () => {
  let core;

  beforeEach(() => {
    core = new NewTemplaterCore();
  });

  it("should initialize with default options", () => {
    assert.strictEqual(core.options.errorOnMissingData, false);
    assert.strictEqual(core.options.nullGetter(), "");
    assert.strictEqual(core.options.debug, false);
    assert.strictEqual(core.zip, null);
    assert.deepStrictEqual(core.context, {});
    assert.deepStrictEqual(core.modules, []);
    assert.deepStrictEqual(core.errors, []);
    assert.strictEqual(core.fileType, null);
  });

  it("should load a docx template from a buffer", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", "<w:document></w:document>");
    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });
    await core.loadTemplate(docxBuffer);
    assert.ok(core.zip instanceof JSZip);
    assert.strictEqual(core.fileType, "docx");
  });

  it("should load a pptx template from a buffer", async () => {
    const zip = new JSZip();
    zip.file("ppt/presentation.xml", "<p:presentation></p:presentation>");
    const pptxBuffer = await zip.generateAsync({ type: "nodebuffer" });
    await core.loadTemplate(pptxBuffer);
    assert.ok(core.zip instanceof JSZip);
    assert.strictEqual(core.fileType, "pptx");
  });

  it("should load an xlsx template from a buffer", async () => {
    const zip = new JSZip();
    zip.file("xl/workbook.xml", "<xl:workbook></xl:workbook>");
    const xlsxBuffer = await zip.generateAsync({ type: "nodebuffer" });
    await core.loadTemplate(xlsxBuffer);
    assert.ok(core.zip instanceof JSZip);
    assert.strictEqual(core.fileType, "xlsx");
  });

  it("should throw error for unsupported file type", async () => {
    const zip = new JSZip();
    zip.file("unsupported.txt", "some content");
    const unsupportedBuffer = await zip.generateAsync({ type: "nodebuffer" });
    await assert.rejects(core.loadTemplate(unsupportedBuffer), /Unsupported file type/);
  });

  it("should set context data", () => {
    const data = { name: "Test", value: 123 };
    core.setContext(data);
    assert.deepStrictEqual(core.context, data);
  });

  it("should attach a module and sort by priority", () => {
    class ModuleA extends BaseModule { constructor() { super(); this.name = "ModuleA"; this.priority = 50; } }
    class ModuleB extends BaseModule { constructor() { super(); this.name = "ModuleB"; this.priority = 10; } }
    class ModuleC extends BaseModule { constructor() { super(); this.name = "ModuleC"; this.priority = 100; } }

    const moduleA = new ModuleA();
    const moduleB = new ModuleB();
    const moduleC = new ModuleC();

    core.attachModule(moduleA);
    core.attachModule(moduleC);
    core.attachModule(moduleB);

    assert.strictEqual(core.modules.length, 3);
    assert.strictEqual(core.modules[0].name, "ModuleB");
    assert.strictEqual(core.modules[1].name, "ModuleA");
    assert.strictEqual(core.modules[2].name, "ModuleC");
  });

  it("should throw error if attached module is not an instance of BaseModule", () => {
    assert.throws(() => core.attachModule({}), /Attached module must be an instance of BaseModule./);
  });

  it("should render a simple docx template with placeholder", async () => {
    const templateContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>Hello {{name}}!</w:t></w:r></w:p>\n  </w:body>\n</w:document>`;
    const zip = new JSZip();
    zip.file("word/document.xml", templateContent);
    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

    core.setContext({ name: "World" });
    await core.loadTemplate(docxBuffer);

    const outputBuffer = await core.render();
    const outputZip = await JSZip.loadAsync(outputBuffer);
    const outputXml = await outputZip.file("word/document.xml").async("text");

    assert.ok(outputXml.includes("Hello World!"));
  });

  it("should handle raw XML tags during rendering", async () => {
    const templateContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>Before {@rawXmlContent} After</w:t></w:r></w:p>\n  </w:body>\n</w:document>`;
    const rawXml = `<w:r><w:t><b>Bold Text</b></w:t></w:r>`;
    const zip = new JSZip();
    zip.file("word/document.xml", templateContent);
    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

    core.setContext({ rawXmlContent: rawXml });
    await core.loadTemplate(docxBuffer);

    const outputBuffer = await core.render();
    const outputZip = await JSZip.loadAsync(outputBuffer);
    const outputXml = await outputZip.file("word/document.xml").async("text");

    assert.ok(outputXml.includes("Before " + rawXml + " After"));
  });

  it("should process module tags via attached modules", async () => {
    class TestModule extends BaseModule {
      constructor() { super(); this.name = "TestModule"; this.tags = ["testtag"]; }
      async render(content, context, fileType) {
        // This module will replace {%testtag data%} with PROCESSED_data_CONTEXT
        return content.replace(/{%testtag ([^%]+)%}/g, (match, data) => {
          return `PROCESSED_${data}_${context.value}`; // Simulate module processing
        });
      }
    }
    core.attachModule(new TestModule());

    const templateContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>Data: {%testtag mydata%}</w:t></w:r></w:p>\n  </w:body>\n</w:document>`;
    const zip = new JSZip();
    zip.file("word/document.xml", templateContent);
    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

    core.setContext({ value: "CONTEXT" });
    await core.loadTemplate(docxBuffer);

    const outputBuffer = await core.render();
    const outputZip = await JSZip.loadAsync(outputBuffer);
    const outputXml = await outputZip.file("word/document.xml").async("text");

    assert.ok(outputXml.includes("Data: PROCESSED_mydata_CONTEXT"));
  });

  it("should collect errors", async () => {
    core.options.errorOnMissingData = false; // Don\\\'t throw immediately
    const templateContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>Hello {{missing}}!</w:t></w:r></w:p>\n  </w:body>\n</w:document>`;
    const zip = new JSZip();
    zip.file("word/document.xml", templateContent);
    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

    await core.loadTemplate(docxBuffer);
    await core.render();

    const errors = core.getErrors();
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].message.includes("Could not resolve placeholder: missing"));
  });

  it("should throw error on missing data if errorOnMissingData is true", async () => {
    core.options.errorOnMissingData = true;
    const templateContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>Hello {{missing}}!</w:t></w:r></w:p>\n  </w:body>\n</w:document>`;
    const zip = new JSZip();
    zip.file("word/document.xml", templateContent);
    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

    await core.loadTemplate(docxBuffer);
    await assert.rejects(core.render(), /Could not resolve placeholder: missing/);
  });
});

