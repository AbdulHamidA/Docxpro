# Installation Guide

## Prerequisites

- Node.js >= 14.0.0
- npm or yarn package manager

## Installation

### From npm (when published)

```bash
npm install docx-templater-pro
```

### From Source

1. Download the source code:
```bash
git clone https://github.com/manus-ai/docx-templater-pro.git
cd docx-templater-pro
```

2. Install dependencies:
```bash
npm install
```

3. Run tests to verify installation:
```bash
npm test
```

## Quick Setup

1. Create a new Node.js project:
```bash
mkdir my-document-project
cd my-document-project
npm init -y
```

2. Install DocxTemplaterPro:
```bash
npm install docx-templater-pro
```

3. Create a simple script:
```javascript
// app.js
const { DocxTemplaterPro, modules } = require('docx-templater-pro');

async function main() {
  const templater = new DocxTemplaterPro();
  
  // Attach modules you need
  templater.attachModule(new modules.HtmlModule());
  templater.attachModule(new modules.ImageModule());
  
  // Load template and process
  await templater.loadTemplate('./template.docx');
  templater.setContext({ name: 'World' });
  
  const buffer = await templater.render();
  require('fs').writeFileSync('./output.docx', buffer);
  
  console.log('Document generated successfully!');
}

main().catch(console.error);
```

4. Run your script:
```bash
node app.js
```

## Development Setup

For contributing to the project:

1. Clone the repository:
```bash
git clone https://github.com/manus-ai/docx-templater-pro.git
cd docx-templater-pro
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
npm test
```

4. Run examples:
```bash
npm run example
```

## Troubleshooting

### Common Issues

**Error: Cannot find module 'docx-templater-pro'**
- Ensure the package is installed: `npm install docx-templater-pro`
- Check your Node.js version: `node --version` (should be >= 14.0.0)

**Template loading errors**
- Verify the template file exists and is a valid DOCX/PPTX/XLSX file
- Check file permissions
- Ensure the file is not corrupted

**Module not working**
- Verify the module is attached before calling render()
- Check if the module supports your document type
- Review the module-specific documentation

### Getting Help

- Check the [README.md](./README.md) for detailed documentation
- Review [examples](./examples/) for usage patterns
- Open an issue on GitHub for bugs or feature requests

## Next Steps

- Read the [API Documentation](./README.md#api-reference)
- Explore [Examples](./examples/)
- Check out [Advanced Usage](./README.md#advanced-usage)
- Review [Module Documentation](./README.md#module-documentation)

