const { NewTemplaterCore } = require("../index");
const HtmlModule = require("../../new-templater-modules/html-module");
const ImageModule = require("../../new-templater-modules/image-module");
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

/**
 * Example demonstrating the usage of HtmlModule and ImageModule with NewTemplaterCore.
 * This example creates a DOCX template with HTML and image tags, processes it,
 * and generates an output DOCX file.
 */
async function modulesUsageExample() {
  console.log("Modules Usage Example");
  console.log("=====================");

  try {
    // Create a new templater instance
    const templater = new NewTemplaterCore({
      errorOnMissingData: false,
      debug: true
    });

    // Attach the modules
    templater.attachModule(new HtmlModule());
    templater.attachModule(new ImageModule());
    console.log("✓ HtmlModule and ImageModule attached.");

    // Create a mock DOCX template content with HTML and image tags
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p>\n      <w:r>\n        <w:t>Hello {{name}}!</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>Here is some rich text from HTML:</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>{%html richTextContent%}</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>And here is an image:</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>{%image imageUrl%}</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>This is a list:</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>{%html listContent%}</w:t>\n      </w:r>\n    </w:p>\n  </w:body>\n</w:document>`;

    // Create a mock DOCX buffer
    const zip = new JSZip();
    zip.file("word/document.xml", templateXml);
    zip.file("[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"></Types>");
    zip.file("_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"></Relationships>");
    
    const templateBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Load the template
    await templater.loadTemplate(templateBuffer);
    console.log("✓ Template loaded successfully");

    // Set the context data
    const context = {
      name: "Module Test User",
      richTextContent: "<p>This is <strong>very important</strong> <em>information</em>.</p>",
      imageUrl: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
      listContent: "<ul><li>First item</li><li>Second item</li></ul>"
    };

    templater.setContext(context);
    console.log("✓ Context data set.");

    // Render the document
    const outputBuffer = await templater.render();
    console.log("✓ Document rendered successfully.");

    // Save the output buffer to a file (for manual inspection)
    const outputPath = path.join(__dirname, "output_modules_example.docx");
    fs.writeFileSync(outputPath, outputBuffer);
    console.log(`✓ Output document saved to: ${outputPath}`);

    // Check for any errors
    const errors = templater.getErrors();
    if (errors.length > 0) {
      console.log("⚠ Errors encountered:");
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
      });
    } else {
      console.log("✓ No errors encountered");
    }

    console.log("\nModules usage example completed successfully!");

  } catch (error) {
    console.error("❌ Error in modules usage example:", error.message);
    console.error(error.stack);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  modulesUsageExample();
}

module.exports = modulesUsageExample;

