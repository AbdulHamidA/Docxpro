const { NewTemplaterCore } = require("@new-templater/core");
const HtmlModule = require("../index");
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

async function htmlModuleExample() {
  console.log("HTML Module Example");
  console.log("===================");

  try {
    const templater = new NewTemplaterCore({
      errorOnMissingData: false,
      debug: true
    });

    templater.attachModule(new HtmlModule());
    console.log("✓ HtmlModule attached.");

    // Create a mock DOCX template content with an HTML tag
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p>\n      <w:r>\n        <w:t>Here is some rich text from HTML:</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>{%html richTextContent%}</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>And here is a list:</w:t>\n      </w:r>\n    </w:p>\n    <w:p>\n      <w:r>\n        <w:t>{%html listContent%}</w:t>\n      </w:r>\n    </w:p>
  </w:body>\n</w:document>`;

    const zip = new JSZip();
    zip.file("word/document.xml", templateXml);
    zip.file("[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"></Types>");
    zip.file("_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"></Relationships>");
    
    const templateBuffer = await zip.generateAsync({ type: "nodebuffer" });

    await templater.loadTemplate(templateBuffer);
    console.log("✓ Template loaded successfully");

    const context = {
      richTextContent: "<p>This is <strong>bold</strong> and <em>italic</em> text.</p>",
      listContent: "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>"
    };

    templater.setContext(context);
    console.log("✓ Context data set.");

    const outputBuffer = await templater.render();
    console.log("✓ Document rendered successfully.");

    const outputPath = path.join(__dirname, "output_html_example.docx");
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


