const TagParser = require("../src/parsers/TagParser");
const assert = require("assert");

describe("TagParser", () => {
  let parser;

  beforeEach(() => {
    parser = new TagParser();
  });

  it("should parse a simple placeholder tag", () => {
    const content = "Hello {{name}}!";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      { type: "text", value: "Hello " },
      { type: "placeholder", value: "name", fullMatch: "{{name}}", start: 6, end: 14 },
      { type: "text", value: "!" },
    ]);
  });

  it("should parse multiple placeholder tags", () => {
    const content = "{{greeting}} {{name}}!";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      { type: "placeholder", value: "greeting", fullMatch: "{{greeting}}", start: 0, end: 12 },
      { type: "text", value: " " },
      { type: "placeholder", value: "name", fullMatch: "{{name}}", start: 13, end: 21 },
      { type: "text", value: "!" },
    ]);
  });

  it("should parse a loop tag", () => {
    const content = "{%loop item in items%}{{item}}{%endloop%}";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      {
        type: "loop",
        tagType: "loop",
        tagData: "item in items",
        value: "loop item in items",
        fullMatch: "{%loop item in items%}",
        start: 0,
        end: 21,
      },
      { type: "placeholder", value: "item", fullMatch: "{{item}}", start: 21, end: 29 },
      {
        type: "loop",
        tagType: "endloop",
        tagData: "",
        value: "endloop",
        fullMatch: "{%endloop%}",
        start: 29,
        end: 40,
      },
    ]);
  });

  it("should parse a conditional tag", () => {
    const content = "{%if condition%}Content{%endif%}";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      {
        type: "condition",
        tagType: "if",
        tagData: "condition",
        value: "if condition",
        fullMatch: "{%if condition%}",
        start: 0,
        end: 17,
      },
      { type: "text", value: "Content" },
      {
        type: "condition",
        tagType: "endif",
        tagData: "",
        value: "endif",
        fullMatch: "{%endif%}",
        start: 24,
        end: 34,
      },
    ]);
  });

  it("should parse a raw XML tag", () => {
    const content = "Start {@rawXmlContent} End";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      { type: "text", value: "Start " },
      { type: "rawXml", value: "rawXmlContent", fullMatch: "{@rawXmlContent}", start: 6, end: 22 },
      { type: "text", value: " End" },
    ]);
  });

  it("should parse a module tag", () => {
    const content = "{%image myImage%}";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      {
        type: "moduleTag",
        moduleName: "image",
        tagData: "myImage",
        value: "image myImage",
        fullMatch: "{%image myImage%}",
        start: 0,
        end: 18,
      },
    ]);
  });

  it("should handle mixed tags and text", () => {
    const content = "Hello {{name}}, your score is {%if score > 10%}{{score}}{%endif%}. Good job! {@signature}";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      { type: "text", value: "Hello " },
      { type: "placeholder", value: "name", fullMatch: "{{name}}", start: 6, end: 14 },
      { type: "text", value: ", your score is " },
      {
        type: "condition",
        tagType: "if",
        tagData: "score > 10",
        value: "if score > 10",
        fullMatch: "{%if score > 10%}",
        start: 31,
        end: 49,
      },
      { type: "placeholder", value: "score", fullMatch: "{{score}}", start: 49, end: 58 },
      {
        type: "condition",
        tagType: "endif",
        tagData: "",
        value: "endif",
        fullMatch: "{%endif%}",
        start: 58, end: 68
      },
      { type: "text", value: ". Good job! " },
      { type: "rawXml", value: "signature", fullMatch: "{@signature}", start: 81, end: 94 },
    ]);
  });

  it("should handle unclosed tags gracefully (treat as text)", () => {
    const content = "Text with {{unclosed tag";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      { type: "text", value: "Text with {{unclosed tag" },
    ]);
  });

  it("should handle empty content", () => {
    const content = "";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, []);
  });

  it("should handle content with only text", () => {
    const content = "This is just plain text.";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      { type: "text", value: "This is just plain text." },
    ]);
  });

  it("should handle tags at the beginning and end of content", () => {
    const content = "{{startTag}}middle{%endTag%}";
    const tokens = parser.parse(content);
    assert.deepStrictEqual(tokens, [
      { type: "placeholder", value: "startTag", fullMatch: "{{startTag}}", start: 0, end: 12 },
      { type: "text", value: "middle" },
      {
        type: "moduleTag",
        moduleName: "endTag",
        tagData: "",
        value: "endTag",
        fullMatch: "{%endTag%}",
        start: 18,
        end: 29,
      },
    ]);
  });
});

