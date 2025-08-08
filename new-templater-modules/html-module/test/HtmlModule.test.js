const HtmlModule = require("../index");
const { NewTemplaterCore } = require("@new-templater/core");
const assert = require("assert");

describe("HtmlModule", () => {
  let htmlModule;
  let mockCore;

  beforeEach(() => {
    htmlModule = new HtmlModule();
    mockCore = {
      contextResolver: {
        resolve: (context, path, defaultValue) => {
          const parts = path.split(".");
          let current = context;
          for (const part of parts) {
            if (current && typeof current === "object" && current.hasOwnProperty(part)) {
              current = current[part];
            } else {
              return defaultValue;
            }
          }
          return current;
        }
      },
      options: {
        nullGetter: () => ""
      },
      addError: (error) => {
        mockCore.errors = mockCore.errors || [];
        mockCore.errors.push(error);
      },
      errors: []
    };
    htmlModule.setCore(mockCore);
  });

  it("should initialize with correct properties", () => {
    assert.strictEqual(htmlModule.name, "HtmlModule");
    assert.deepStrictEqual(htmlModule.tags, ["html"]);
    assert.deepStrictEqual(htmlModule.supportedFileTypes, ["docx"]);
    assert.strictEqual(htmlModule.priority, 20);
  });

  it("should process HTML tags in DOCX content", async () => {
    const content = `<w:document>
      <w:body>
        <w:p><w:r><w:t>Before {%html myHtml%} After</w:t></w:r></w:p>
      </w:body>
    </w:document>`;

    const context = {
      myHtml: "<p><strong>Bold text</strong> and <em>italic text</em></p>"
    };

    const result = await htmlModule.render(content, context, "docx");
    
    // Check that the HTML tag is replaced with WordML
    assert.ok(result.includes("<w:p><w:r><w:t>"));
    assert.ok(result.includes("<w:rPr><w:b/></w:rPr>"));
    assert.ok(result.includes("Bold text"));
    assert.ok(!result.includes("{%html myHtml%}"));
  });

  it("should handle multiple HTML tags", async () => {
    const content = `<w:document>
      <w:body>
        <w:p><w:r><w:t>{%html header%}</w:t></w:r></w:p>
        <w:p><w:r><w:t>{%html content%}</w:t></w:r></w:p>
      </w:body>
    </w:document>`;

    const context = {
      header: "<h1>Title</h1>",
      content: "<p>Paragraph content</p>"
    };

    const result = await htmlModule.render(content, context, "docx");
    
    // Check that both HTML tags are processed
    assert.ok(result.includes("Title"));
    assert.ok(result.includes("Paragraph content"));
    assert.ok(!result.includes("{%html header%}"));
    assert.ok(!result.includes("{%html content%}"));
  });

  it("should handle nested object paths", async () => {
    const content = `<w:document>
      <w:body>
        <w:p><w:r><w:t>{%html user.profile.bio%}</w:t></w:r></w:p>
      </w:body>
    </w:document>`;

    const context = {
      user: {
        profile: {
          bio: "<p>User biography with <strong>formatting</strong></p>"
        }
      }
    };

    const result = await htmlModule.render(content, context, "docx");
    
    assert.ok(result.includes("User biography with"));
    assert.ok(result.includes("<w:rPr><w:b/></w:rPr>"));
    assert.ok(result.includes("formatting"));
    assert.ok(!result.includes("{%html user.profile.bio%}"));
  });

  it("should handle missing variables gracefully", async () => {
    const content = `<w:document>
      <w:body>
        <w:p><w:r><w:t>Before {%html missing%} After</w:t></w:r></w:p>
      </w:body>
    </w:document>`;

    const context = {};

    const result = await htmlModule.render(content, context, "docx");
    
    assert.ok(result.includes("Before"));
    assert.ok(result.includes("After"));
    assert.ok(!result.includes("{%html missing%}"));
    // The missing variable should be replaced with empty string (nullGetter result)
  });

  it("should add error for non-string HTML content", async () => {
    const content = `<w:document>
      <w:body>
        <w:p><w:r><w:t>{%html invalidContent%}</w:t></w:r></w:p>
      </w:body>
    </w:document>`;

    const context = {
      invalidContent: 123 // Not a string
    };

    const result = await htmlModule.render(content, context, "docx");
    
    assert.strictEqual(mockCore.errors.length, 1);
    assert.ok(mockCore.errors[0].message.includes("Expected HTML content"));
    assert.ok(!result.includes("{%html invalidContent%}"));
  });

  it("should skip processing for non-DOCX files", async () => {
    const content = `<presentation>
      <slide>
        <text>{%html myHtml%}</text>
      </slide>
    </presentation>`;

    const context = {
      myHtml: "<p>HTML content</p>"
    };

    const result = await htmlModule.render(content, context, "pptx");
    
    assert.strictEqual(result, content); // Should be unchanged
    assert.ok(result.includes("{%html myHtml%}")); // Tag should still be there
  });

  it("should handle HTML tags with extra whitespace", async () => {
    const content = `<w:document>
      <w:body>
        <w:p><w:r><w:t>{%  html   myHtml  %}</w:t></w:r></w:p>
      </w:body>
    </w:document>`;

    const context = {
      myHtml: "<p>Content</p>"
    };

    const result = await htmlModule.render(content, context, "docx");
    
    assert.ok(result.includes("Content"));
    assert.ok(!result.includes("{%  html   myHtml  %}"));
  });

  it("should handle complex HTML content", async () => {
    const content = `<w:document>
      <w:body>
        <w:p><w:r><w:t>{%html complexHtml%}</w:t></w:r></w:p>
      </w:body>
    </w:document>`;

    const context = {
      complexHtml: `
        <div>
          <h2>Section Title</h2>
          <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </div>
      `
    };

    const result = await htmlModule.render(content, context, "docx");
    
    assert.ok(result.includes("Section Title"));
    assert.ok(result.includes("This is a paragraph with"));
    assert.ok(result.includes("<w:rPr><w:b/></w:rPr>"));
    assert.ok(result.includes("<w:rPr><w:i/></w:rPr>"));
    // For list items, check for the generated WordML structure
    assert.ok(result.includes("<w:p><w:r><w:t>• </w:t></w:r><w:t>List item 1</w:t></w:p>"));
    assert.ok(result.includes("<w:p><w:r><w:t>• </w:t></w:r><w:t>List item 2</w:t></w:p>"));
    assert.ok(!result.includes("{%html complexHtml%}"));
  });

  it("should work with the core templater", async () => {
    const core = new NewTemplaterCore();
    core.attachModule(new HtmlModule());

    // This test would require a real DOCX template and JSZip operations
    // For now, we\\\"ll just verify the module is attached correctly
    assert.strictEqual(core.modules.length, 1);
    assert.strictEqual(core.modules[0].name, "HtmlModule");
  });
});

