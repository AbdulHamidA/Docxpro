# @new-templater/image-module

A module for `@new-templater/core` that enables dynamic image insertion into DOCX documents. This module fetches images from URLs and embeds them into the generated document.

## Features

- Dynamically insert images from web URLs into DOCX documents.
- Integrates seamlessly with `@new-templater/core`.
- Handles image fetching and embedding into the DOCX structure.
- Provides error handling for invalid image URLs or failed fetches.

## Installation

```bash
npm install @new-templater/image-module
```

This module requires `@new-templater/core` as a peer dependency.

## Usage

To use the `ImageModule`, attach it to your `NewTemplaterCore` instance:

```javascript
const { NewTemplaterCore } = require("@new-templater/core");
const ImageModule = require("@new-templater/image-module");
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

async function imageModuleExample() {
  console.log("Image Module Example");
  console.log("====================");

  try {
    const templater = new NewTemplaterCore({
      errorOnMissingData: false,
      debug: true
    });

    templater.attachModule(new ImageModule());
    console.log("✓ ImageModule attached.");

    // Create a mock DOCX template content with an image tag
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p>\n      <w:r>\n        <w:t>Here is an image:</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>{%image myImageUrl%}</w:t>\n      </w:r>\n    </w:p>\n  </w:body>\n</w:document>`;

    const zip = new JSZip();
    zip.file("word/document.xml", templateXml);
    zip.file("[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"></Types>");
    zip.file("_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"></Relationships>");
    
    const templateBuffer = await zip.generateAsync({ type: "nodebuffer" });

    await templater.loadTemplate(templateBuffer);
    console.log("✓ Template loaded successfully");

    const context = {
      myImageUrl: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
    };

    templater.setContext(context);
    console.log("✓ Context data set.");

    const outputBuffer = await templater.render();
    console.log("✓ Document rendered successfully.");

    const outputPath = path.join(__dirname, "output_image_example.docx");
    fs.writeFileSync(outputPath, outputBuffer);
    console.log(`✓ Output document saved to: ${outputPath}`);

    const errors = templater.getErrors();
    if (errors.length > 0) {
      console.log("⚠ Errors encountered:");
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
      });
    } else {
      console.log("✓ No errors encountered");
    }

    console.log("\nImage Module example completed successfully!");

  } catch (error) {
    console.error("❌ Error in Image module example:", error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  imageModuleExample();
}

module.exports = imageModuleExample;
```

## API Reference

### `ImageModule`

Extends `BaseModule` from `@new-templater/core`.

#### Constructor

```javascript
new ImageModule(options)
```

**Options:**
- No specific options for this module currently.

#### Properties

- `name`: "ImageModule"
- `tags`: `["image"]`
- `supportedFileTypes`: `["docx"]`
- `priority`: `30`

## Contributing

Contributions are welcome! Please refer to the main `@new-templater/core` repository for contribution guidelines.

## License

MIT License

## Issues

Report issues and feature requests on the [GitHub Issues page](https://github.com/your-org/new-templater/issues).

