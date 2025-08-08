const BaseModule = require("../src/core/BaseModule");
const assert = require("assert");

describe("BaseModule", () => {
  let module;

  beforeEach(() => {
    module = new BaseModule();
  });

  it("should initialize with default properties", () => {
    assert.strictEqual(module.name, "BaseModule");
    assert.deepStrictEqual(module.tags, []);
    assert.deepStrictEqual(module.supportedFileTypes, ["docx", "pptx", "xlsx"]);
    assert.strictEqual(module.priority, 100);
    assert.deepStrictEqual(module.options, {});
    assert.strictEqual(module.core, null);
  });

  it("should accept options in constructor", () => {
    const options = { customOption: "value" };
    const moduleWithOptions = new BaseModule(options);
    assert.deepStrictEqual(moduleWithOptions.options, options);
  });

  it("should set core instance", () => {
    const mockCore = { name: "MockCore" };
    module.setCore(mockCore);
    assert.strictEqual(module.core, mockCore);
  });

  it("should return original content in default preparse", async () => {
    const xmlContent = "<xml>test</xml>";
    const result = await module.preparse(xmlContent, "docx");
    assert.strictEqual(result, xmlContent);
  });

  it("should return original tokens in default parse", () => {
    const tokens = [{ type: "text", value: "test" }];
    const result = module.parse(tokens, "docx");
    assert.deepStrictEqual(result, tokens);
  });

  it("should return original content in default render", async () => {
    const content = "test content";
    const context = { name: "test" };
    const result = await module.render(content, context, "docx");
    assert.strictEqual(result, content);
  });

  it("should return original XML in default postrender", async () => {
    const finalXml = "<xml>final</xml>";
    const result = await module.postrender(finalXml, "docx");
    assert.strictEqual(result, finalXml);
  });

  it("should return empty errors array in default validate", () => {
    const templateContent = "{{name}}";
    const errors = module.validate(templateContent);
    assert.deepStrictEqual(errors, []);
  });

  it("should check if module should process content based on supported file types", () => {
    module.supportedFileTypes = ["docx"];
    assert.strictEqual(module.shouldProcess("content", "docx"), false); // No tags defined
    assert.strictEqual(module.shouldProcess("content", "pptx"), false); // Unsupported file type
  });

  it("should check if module should process content based on tags", () => {
    module.tags = ["image"];
    module.supportedFileTypes = ["docx"];
    
    assert.strictEqual(module.shouldProcess("{%image test%}", "docx"), true);
    assert.strictEqual(module.shouldProcess("no tags here", "docx"), false);
    assert.strictEqual(module.shouldProcess("{%html test%}", "docx"), false); // Wrong tag
  });

  it("should return correct configuration", () => {
    module.name = "TestModule";
    module.tags = ["test"];
    module.supportedFileTypes = ["docx"];
    module.priority = 50;
    module.options = { option1: "value1" };

    const config = module.getConfig();
    assert.deepStrictEqual(config, {
      name: "TestModule",
      tags: ["test"],
      supportedFileTypes: ["docx"],
      priority: 50,
      options: { option1: "value1" },
    });
  });

  it("should log messages with module name prefix", () => {
    let loggedMessage = "";
    let loggedLevel = "";
    
    // Mock console
    const originalConsole = console.info;
    console.info = (message) => {
      loggedLevel = "info";
      loggedMessage = message;
    };

    module.log("info", "test message");
    assert.strictEqual(loggedLevel, "info");
    assert.strictEqual(loggedMessage, "[BaseModule] test message");

    // Restore console
    console.info = originalConsole;
  });

  it("should use core logger if available", () => {
    let loggedMessage = "";
    let loggedLevel = "";
    
    const mockCore = {
      logger: {
        info: (message) => {
          loggedLevel = "info";
          loggedMessage = message;
        },
      },
    };

    module.setCore(mockCore);
    module.log("info", "test message");
    assert.strictEqual(loggedLevel, "info");
    assert.strictEqual(loggedMessage, "[BaseModule] test message");
  });

  it("should handle complex tag patterns", () => {
    module.tags = ["image", "html"];
    module.supportedFileTypes = ["docx"];

    // Test various tag formats
    assert.strictEqual(module.shouldProcess("{%image src%}", "docx"), true);
    assert.strictEqual(module.shouldProcess("{% image src %}", "docx"), true); // With spaces
    assert.strictEqual(module.shouldProcess("{%html content%}", "docx"), true);
    assert.strictEqual(module.shouldProcess("text {%image src%} more text", "docx"), true);
    assert.strictEqual(module.shouldProcess("{%other tag%}", "docx"), false);
  });

  it("should handle multiple file types", () => {
    module.tags = ["test"];
    module.supportedFileTypes = ["docx", "pptx"];

    assert.strictEqual(module.shouldProcess("{%test data%}", "docx"), true);
    assert.strictEqual(module.shouldProcess("{%test data%}", "pptx"), true);
    assert.strictEqual(module.shouldProcess("{%test data%}", "xlsx"), false);
  });
});

// Test custom module extending BaseModule
class TestModule extends BaseModule {
  constructor() {
    super();
    this.name = "TestModule";
    this.tags = ["test"];
    this.priority = 50;
  }

  async render(content, context, fileType) {
    return content.replace(/{%test ([^%]+)%}/g, (match, data) => {
      return `PROCESSED: ${data}`;
    });
  }
}

describe("TestModule (extending BaseModule)", () => {
  let testModule;

  beforeEach(() => {
    testModule = new TestModule();
  });

  it("should have custom properties", () => {
    assert.strictEqual(testModule.name, "TestModule");
    assert.deepStrictEqual(testModule.tags, ["test"]);
    assert.strictEqual(testModule.priority, 50);
  });

  it("should process test tags in render method", async () => {
    const content = "Hello {%test world%}!";
    const result = await testModule.render(content, {}, "docx");
    assert.strictEqual(result, "Hello PROCESSED: world!");
  });

  it("should detect test tags for processing", () => {
    assert.strictEqual(testModule.shouldProcess("{%test data%}", "docx"), true);
    assert.strictEqual(testModule.shouldProcess("no tags", "docx"), false);
  });
});

