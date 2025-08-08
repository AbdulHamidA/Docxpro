# @new-templater/html-module

A module for `@new-templater/core` that enables embedding HTML content directly into DOCX documents. This module converts a subset of HTML tags into their corresponding WordML (OpenXML) fragments, allowing for rich text and basic structural elements to be inserted dynamically.

## Features

- Convert HTML snippets to WordML for DOCX documents.
- Supports basic HTML tags: `<p>`, `<b>`, `<strong>`, `<i>`, `<em>`, `<ul>`, `<li>`, `<h1>` to `<h6>`, `<div>`, `<span>`.
- Integrates seamlessly with `@new-templater/core`.
- Provides robust error handling for invalid HTML content.

## Installation

```bash
npm install @new-templater/html-module
```

This module requires `@new-templater/core` as a peer dependency.

## Usage

To use the `HtmlModule`, attach it to your `NewTemplaterCore` instance:

```javascript
const { NewTemplaterCore } = require("@new-templater/core");
const HtmlModule = require("@new-templater/html-module");
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

async function htmlModuleExample() {
  console.log("HTML Module Example");
  console.log("===================");

  try {
    const templater = new NewTemplaterCore();
    templater.attachModule(new HtmlModule());

    // Create a mock DOCX template content with an HTML tag
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p>\n      <w:r>\n        <w:t>Here is some HTML content:</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>{%html myRichText%}</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>And a list:</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>{%html myList%}</w:t>\n      </w:r>\n    </w:p>\n  </w:body>\n</w:document>`;

    const zip = new JSZip();
    zip.file("word/document.xml", templateXml);
    zip.file("[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"></Types>");
    zip.file("_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"></Relationships>");
    
    const templateBuffer = await zip.generateAsync({ type: "nodebuffer" });

    await templater.loadTemplate(templateBuffer);

    const context = {
      myRichText: "<p>This is <strong>bold</strong> and <em>italic</em> text.</p>",
      myList: "<ul><li>Item 1</li><li>Item 2</li></ul>"
    };
    templater.setContext(context);

    const outputBuffer = await templater.render();

    // In a real application, you would save the output buffer to a file
    // fs.writeFileSync("output_with_html.docx", outputBuffer);
    console.log("✓ Document rendered with HTML content.");

    const errors = templater.getErrors();
    if (errors.length > 0) {
      console.log("⚠ Errors encountered:");
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
      });
    } else {
      console.log("✓ No errors encountered");
    }

    console.log("\nHTML Module example completed successfully!");

  } catch (error) {
    console.error("❌ Error in HTML module example:", error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  htmlModuleExample();
}

module.exports = htmlModuleExample;
```

## Supported HTML Tags

The `HtmlModule` converts the following HTML tags to their WordML equivalents:

- `<p>`: Paragraphs
- `<b>`, `<strong>`: Bold text
- `<i>`, `<em>`: Italic text
- `<ul>`, `<ol>`: Unordered and ordered lists (simplified bullet/numbering)
- `<h1>` - `<h6>`: Headings (simplified to bold paragraphs)
- `<div>`, `<span>`: Processed as containers, their children are rendered.

Unsupported tags and attributes will be ignored or their content will be rendered as plain text.

## API Reference

### `HtmlModule`

Extends `BaseModule` from `@new-templater/core`.

#### Constructor

```javascript
new HtmlModule(options)
```

**Options:**
- No specific options for this module currently.

#### Properties

- `name`: "HtmlModule"
- `tags`: `["html"]`
- `supportedFileTypes`: `["docx"]`
- `priority`: `20`

## Contributing

Contributions are welcome! Please refer to the main `@new-templater/core` repository for contribution guidelines.

## License

MIT License

## Issues

Report issues and feature requests on the [GitHub Issues page](https://github.com/your-org/new-templater/issues).

