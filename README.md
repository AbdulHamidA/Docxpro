# DocxTemplaterPro

A comprehensive Node.js library for document templating with DOCX, PPTX, and XLSX support, including all advanced features similar to docxtemplater's paid modules.

## Overview

DocxTemplaterPro is a powerful, modular document templating library that enables dynamic generation of Microsoft Office documents from templates. Built with JavaScript for Node.js environments, it provides a complete solution for creating professional documents with complex layouts, dynamic content, and rich formatting.

## Features

### Core Templating
- **Simple Placeholders**: Replace `{{variable}}` with dynamic data
- **Loops**: Iterate over collections with `{%loop item in items%}...{%endloop%}`
- **Conditionals**: Show/hide content with `{%if condition%}...{%endif%}`
- **Raw XML**: Insert raw WordML with `{@rawXml}`

### Advanced Modules
- **HTML Module**: Embed HTML content with formatting in DOCX documents
- **Image Module**: Dynamic image insertion and replacement
- **QR Code Module**: Generate and insert QR codes
- **Table Module**: Create complex tables from structured data
- **Error Location Module**: Debug templates with error comments
- **XLSX Module**: Template Excel spreadsheets
- **Slides Module**: Clone and manage PowerPoint slides
- **Chart Module**: Update chart data dynamically
- **Subtemplate Module**: Include other documents as subtemplates
- **Styling Module**: Apply conditional formatting
- **Footnotes Module**: Add dynamic footnotes
- **Meta Module**: Modify document properties

## Installation

```bash
npm install docx-templater-pro
```

## Quick Start

```javascript
const { DocxTemplaterPro, modules } = require('docx-templater-pro');

async function generateDocument() {
  // Create templater instance
  const templater = new DocxTemplaterPro();
  
  // Attach modules
  templater.attachModule(new modules.HtmlModule());
  templater.attachModule(new modules.ImageModule());
  templater.attachModule(new modules.TableModule());
  
  // Load template
  await templater.loadTemplate('./template.docx');
  
  // Set data
  templater.setContext({
    title: 'My Document',
    content: 'Hello World!',
    items: [
      { name: 'Item 1', price: 10.99 },
      { name: 'Item 2', price: 25.50 }
    ]
  });
  
  // Generate document
  const buffer = await templater.render();
  
  // Save result
  require('fs').writeFileSync('./output.docx', buffer);
}

generateDocument();
```

## API Reference

### DocxTemplaterPro Class

#### Constructor
```javascript
new DocxTemplaterPro(options)
```

**Options:**
- `errorOnMissingData` (boolean): Throw errors for missing data (default: false)
- `nullGetter` (function): Function to handle null values (default: returns empty string)

#### Methods

##### loadTemplate(template)
Load a template from file path or buffer.

```javascript
await templater.loadTemplate('./template.docx');
// or
await templater.loadTemplate(buffer);
```

##### setContext(context)
Set the data context for template processing.

```javascript
templater.setContext({
  name: 'John Doe',
  items: [...]
});
```

##### attachModule(module)
Register a module with the templater.

```javascript
templater.attachModule(new modules.HtmlModule());
```

##### render()
Process the template and return the generated document as a buffer.

```javascript
const buffer = await templater.render();
```

##### saveAs(outputPath)
Render and save the document to a file.

```javascript
await templater.saveAs('./output.docx');
```

##### getErrors()
Get any errors that occurred during processing.

```javascript
const errors = templater.getErrors();
```

## Module Documentation

### HTML Module

Embeds HTML content into DOCX documents with formatting support.

**Usage:**
```
{%html variableName%}
```

**Context Data:**
```javascript
{
  htmlContent: '<p>This is <strong>bold</strong> text.</p>'
}
```

**Supported HTML Tags:**
- Text formatting: `<b>`, `<strong>`, `<i>`, `<em>`, `<u>`
- Paragraphs: `<p>`
- Lists: `<ul>`, `<ol>`, `<li>`
- Tables: `<table>`, `<tr>`, `<td>`, `<th>`
- Links: `<a href="...">`
- Inline styles: `style="color: red; font-size: 14px;"`

### Image Module

Dynamically inserts and replaces images in documents.

**Usage:**
```
{%image variableName%}
```

**Context Data:**
```javascript
{
  logo: {
    src: './path/to/image.png',
    width: 200,
    height: 100,
    alt: 'Company Logo'
  }
}
```

**Supported Formats:**
- PNG, JPEG, GIF, BMP, TIFF
- Local files and URLs
- Automatic resizing and aspect ratio maintenance

### QR Code Module

Generates QR codes and inserts them as images.

**Usage:**
```
{%qrcode variableName%}
```

**Context Data:**
```javascript
{
  websiteQR: {
    text: 'https://example.com',
    size: 150,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  }
}
```

### Table Module

Creates dynamic tables from structured data.

**Usage:**
```
{%table variableName%}
```

**Context Data:**
```javascript
{
  salesTable: {
    headers: ['Product', 'Quantity', 'Price'],
    rows: [
      ['Widget A', 10, '$99.99'],
      ['Widget B', 5, '$149.99']
    ],
    style: {
      borders: true,
      header: {
        bold: true,
        backgroundColor: 'D9D9D9'
      }
    }
  }
}
```

### Error Location Module

Automatically detects template errors and adds comments for debugging.

**Features:**
- Malformed tag detection
- Missing data identification
- Unmatched control structure tags
- Detailed error messages in document comments

**Usage:**
Automatically enabled when attached. No template syntax required.

## Template Syntax

### Basic Placeholders
```
Hello {{name}}, welcome to {{company}}!
```

### Loops
```
{%loop item in items%}
- {{item.name}}: {{item.description}}
{%endloop%}
```

### Conditionals
```
{%if user.isPremium%}
Premium content here
{%else%}
Standard content here
{%endif%}
```

### Paragraph Placeholders
```
{{?optionalContent}}
```
Removes the entire paragraph if the variable is null or undefined.

### Raw XML
```
{@customWordML}
```
Inserts raw WordML content directly into the document.

## Error Handling

The library provides comprehensive error handling and debugging capabilities:

```javascript
const templater = new DocxTemplaterPro({
  errorOnMissingData: true // Throw errors for missing data
});

// Attach error location module for debugging
templater.attachModule(new modules.ErrorLocationModule());

try {
  const buffer = await templater.render();
} catch (error) {
  console.error('Template error:', error.message);
}

// Check for non-fatal errors
const errors = templater.getErrors();
if (errors.length > 0) {
  errors.forEach(error => {
    console.log(`${error.type}: ${error.message}`);
  });
}
```

## Advanced Usage

### Custom Modules

Create custom modules to extend functionality:

```javascript
class CustomModule {
  constructor() {
    this.name = 'custom';
    this.priority = 100;
    this.supportedTypes = ['docx'];
  }

  async process(content, context) {
    // Custom processing logic
    return content.replace(/{%custom ([^%]+)%}/g, (match, data) => {
      // Process custom tags
      return this.processCustomTag(data, context);
    });
  }

  hasTagsToProcess(content) {
    return /{%custom [^%]+%}/.test(content);
  }

  processCustomTag(data, context) {
    // Custom tag processing
    return `Processed: ${data}`;
  }
}

// Use the custom module
templater.attachModule(new CustomModule());
```

### Multiple Document Types

```javascript
// Detect document type automatically
await templater.loadTemplate('./template.docx'); // DOCX
await templater.loadTemplate('./presentation.pptx'); // PPTX
await templater.loadTemplate('./spreadsheet.xlsx'); // XLSX

// Different modules support different document types
templater.attachModule(new modules.HtmlModule()); // DOCX only
templater.attachModule(new modules.SlidesModule()); // PPTX only
templater.attachModule(new modules.XlsxModule()); // XLSX only
```

## Performance Considerations

### Memory Usage
- Process large documents in chunks when possible
- Dispose of templater instances after use
- Use streaming for very large files

### Module Optimization
- Only attach modules you need
- Modules are processed in priority order
- Higher priority modules run first

### Caching
- Cache parsed templates for repeated use
- Reuse templater instances with different contexts
- Pre-load images and assets when possible

## Troubleshooting

### Common Issues

**Template not loading:**
- Verify file path and permissions
- Ensure file is a valid DOCX/PPTX/XLSX format
- Check for file corruption

**Missing data errors:**
- Use Error Location Module for debugging
- Check variable names and paths
- Verify context data structure

**Module not working:**
- Ensure module is attached before rendering
- Check module compatibility with document type
- Verify module-specific syntax

**Performance issues:**
- Reduce number of modules
- Optimize context data size
- Use appropriate image sizes

### Debug Mode

Enable detailed logging:

```javascript
const templater = new DocxTemplaterPro({
  errorOnMissingData: false,
  debug: true
});

// Attach error location module
templater.attachModule(new modules.ErrorLocationModule());
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the main repository.

## Support

For issues and questions:
- GitHub Issues: [Repository Issues](https://github.com/manus-ai/docx-templater-pro/issues)
- Documentation: [Full Documentation](https://github.com/manus-ai/docx-templater-pro/docs)
- Examples: [Example Repository](https://github.com/manus-ai/docx-templater-pro/examples)

