const { NewTemplaterCore } = require("@new-templater/core");
const ImageModule = require("../index");
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

