const { DocxTemplaterPro, modules } = require('../index');
const fs = require('fs');
const path = require('path');

async function basicExample() {
  try {
    console.log('DocxTemplaterPro Basic Example');
    console.log('==============================');
    
    // Create a new templater instance
    const templater = new DocxTemplaterPro({
      errorOnMissingData: false
    });
    
    // Attach modules
    templater.attachModule(new modules.HtmlModule());
    templater.attachModule(new modules.ImageModule());
    templater.attachModule(new modules.TableModule());
    templater.attachModule(new modules.QrCodeModule());
    templater.attachModule(new modules.ErrorLocationModule());
    
    console.log('Modules attached successfully');
    
    // Create a simple template for demonstration
    const templateContent = createSampleTemplate();
    
    // Save template to file
    const templatePath = path.join(__dirname, 'sample-template.docx');
    fs.writeFileSync(templatePath, templateContent);
    
    console.log('Sample template created');
    
    // Load the template
    await templater.loadTemplate(templatePath);
    
    console.log('Template loaded successfully');
    
    // Set context data
    const context = {
      title: 'Sample Document',
      author: 'DocxTemplaterPro',
      date: new Date().toLocaleDateString(),
      content: 'This is a sample document generated using DocxTemplaterPro.',
      items: [
        { name: 'Item 1', description: 'First item description', price: 10.99 },
        { name: 'Item 2', description: 'Second item description', price: 25.50 },
        { name: 'Item 3', description: 'Third item description', price: 8.75 }
      ],
      htmlContent: '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>',
      qrData: 'https://github.com/manus-ai/docx-templater-pro',
      tableData: {
        headers: ['Product', 'Description', 'Price'],
        rows: [
          ['Item 1', 'First item description', '$10.99'],
          ['Item 2', 'Second item description', '$25.50'],
          ['Item 3', 'Third item description', '$8.75']
        ],
        style: {
          borders: true,
          header: { bold: true, backgroundColor: 'D9D9D9' }
        }
      }
    };
    
    templater.setContext(context);
    
    console.log('Context data set');
    
    // Render the document
    const outputBuffer = await templater.render();
    
    console.log('Document rendered successfully');
    
    // Save the output
    const outputPath = path.join(__dirname, 'output-document.docx');
    fs.writeFileSync(outputPath, outputBuffer);
    
    console.log(`Output saved to: ${outputPath}`);
    
    // Check for errors
    const errors = templater.getErrors();
    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.type}: ${error.message}`);
      });
    } else {
      console.log('\nNo errors found');
    }
    
    console.log('\nExample completed successfully!');
    
  } catch (error) {
    console.error('Error in basic example:', error.message);
    console.error(error.stack);
  }
}

function createSampleTemplate() {
  // This is a simplified template creation
  // In a real scenario, you would use an actual DOCX template file
  const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Title: {{title}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Author: {{author}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Date: {{date}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Content: {{content}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>HTML Content: {%html htmlContent%}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>QR Code: {%qrcode qrData%}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Table: {%table tableData%}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Items:</w:t>
      </w:r>
    </w:p>
    {%loop item in items%}
    <w:p>
      <w:r>
        <w:t>- {{item.name}}: {{item.description}} ({{item.price}})</w:t>
      </w:r>
    </w:p>
    {%endloop%}
  </w:body>
</w:document>`;
  
  // This is a simplified representation
  // A real DOCX file would need proper ZIP structure with multiple XML files
  return Buffer.from(templateXml);
}

// Run the example if this file is executed directly
if (require.main === module) {
  basicExample();
}

module.exports = basicExample;

