const { NewTemplaterCore } = require('../index');
const fs = require('fs');
const path = require('path');

/**
 * Basic usage example for @new-templater/core
 * This example demonstrates how to use the core library for simple template processing
 */
async function basicUsageExample() {
  console.log('Basic Usage Example');
  console.log('==================');

  try {
    // Create a new templater instance
    const templater = new NewTemplaterCore({
      errorOnMissingData: false,
      debug: true
    });

    // Create a simple DOCX template content
    const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Hello {{name}}!</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Welcome to {{company}}. Today is {{date}}.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Your account status: {{status}}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

    // Create a mock DOCX buffer (in real usage, you'd load from a file)
    const JSZip = require('jszip');
    const zip = new JSZip();
    zip.file('word/document.xml', templateXml);
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
    
    const templateBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Load the template
    await templater.loadTemplate(templateBuffer);
    console.log('✓ Template loaded successfully');

    // Set the context data
    const context = {
      name: 'John Doe',
      company: 'Acme Corporation',
      date: new Date().toLocaleDateString(),
      status: 'Active'
    };

    templater.setContext(context);
    console.log('✓ Context data set:', context);

    // Render the document
    const outputBuffer = await templater.render();
    console.log('✓ Document rendered successfully');

    // In a real application, you would save the output buffer to a file
    // fs.writeFileSync('output.docx', outputBuffer);
    console.log('✓ Output buffer generated (size:', outputBuffer.length, 'bytes)');

    // Check for any errors
    const errors = templater.getErrors();
    if (errors.length > 0) {
      console.log('⚠ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
      });
    } else {
      console.log('✓ No errors encountered');
    }

    console.log('\nBasic usage example completed successfully!');

  } catch (error) {
    console.error('❌ Error in basic usage example:', error.message);
    console.error(error.stack);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  basicUsageExample();
}

module.exports = basicUsageExample;

