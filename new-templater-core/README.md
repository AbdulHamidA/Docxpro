# @new-templater/core

A modular, extensible document templating library for Node.js that supports DOCX, PPTX, and XLSX files. This core library provides the foundation for a plugin-based architecture where each feature can be implemented as a separate npm module.

## Features

- **Multi-format Support**: Process DOCX, PPTX, and XLSX documents
- **Modular Architecture**: Extensible plugin system for custom functionality
- **docxtemplater Compatibility**: Compatible tag syntax with docxtemplater
- **Robust Parsing**: Advanced template parsing with error handling
- **TypeScript Ready**: Full TypeScript support (definitions included)
- **Comprehensive Testing**: 100% test coverage for reliability

## Installation

```bash
npm install @new-templater/core
```

## Quick Start

```javascript
const { NewTemplaterCore, BaseModule } = require('@new-templater/core');

// Create a new templater instance
const templater = new NewTemplaterCore();

// Set your data context
templater.setContext({
  name: 'John Doe',
  company: 'Acme Corp'
});

// Load a template (DOCX, PPTX, or XLSX)
await templater.loadTemplate(templateBuffer);

// Render the document
const outputBuffer = await templater.render();

// Save or use the output buffer
fs.writeFileSync('output.docx', outputBuffer);
```

## Core Concepts

### Templates and Tags

The library supports various tag types compatible with docxtemplater:

- **Placeholders**: `{{variable}}` - Simple variable replacement
- **Loops**: `{%loop item in items%}...{%endloop%}` - Iterate over arrays
- **Conditionals**: `{%if condition%}...{%endif%}` - Conditional content
- **Raw XML**: `{@rawXmlContent}` - Insert raw XML/HTML content
- **Module Tags**: `{%moduleName data%}` - Custom module functionality

### Modular Architecture

The core library handles:
- Document loading and ZIP manipulation
- XML parsing and rebuilding
- Template tag identification and parsing
- Context data resolution
- Module orchestration and lifecycle management

Individual modules handle specific features:
- HTML rendering
- Image insertion
- Table generation
- Chart updates
- And more...

## API Reference

### NewTemplaterCore

#### Constructor

```javascript
new NewTemplaterCore(options)
```

**Options:**
- `errorOnMissingData` (boolean): Throw errors for missing variables (default: false)
- `nullGetter` (function): Function to handle null/undefined values (default: returns empty string)
- `debug` (boolean): Enable debug logging (default: false)

#### Methods

##### loadTemplate(template)

Loads a template from a Buffer.

```javascript
await templater.loadTemplate(buffer);
```

**Parameters:**
- `template` (Buffer): The template file as a Buffer

**Returns:** Promise<void>

##### setContext(data)

Sets the data context for template processing.

```javascript
templater.setContext({
  user: { name: 'John', email: 'john@example.com' },
  items: [{ name: 'Item 1' }, { name: 'Item 2' }]
});
```

**Parameters:**
- `data` (Object): The data object for template variables

##### attachModule(module)

Attaches a module to extend functionality.

```javascript
const MyModule = require('@new-templater/my-module');
templater.attachModule(new MyModule());
```

**Parameters:**
- `module` (BaseModule): An instance of a module extending BaseModule

##### render()

Processes the template and returns the generated document.

```javascript
const outputBuffer = await templater.render();
```

**Returns:** Promise<Buffer> - The generated document as a Buffer

##### getErrors()

Returns any errors encountered during processing.

```javascript
const errors = templater.getErrors();
```

**Returns:** Array<Error> - Array of error objects

### BaseModule

Base class for creating custom modules.

#### Constructor

```javascript
new BaseModule(options)
```

#### Properties

- `name` (string): Module name
- `tags` (Array<string>): Tags this module handles
- `supportedFileTypes` (Array<string>): Supported file types
- `priority` (number): Processing priority (lower = higher priority)

#### Methods

##### setCore(coreInstance)

Called by the core to provide access to core utilities.

##### preparse(xmlContent, fileType)

Pre-processing stage for raw XML modification.

```javascript
async preparse(xmlContent, fileType) {
  // Modify raw XML before core parsing
  return xmlContent;
}
```

##### parse(tokens, fileType)

Parsing stage for token transformation.

```javascript
parse(tokens, fileType) {
  // Transform tokens array
  return tokens;
}
```

##### render(content, context, fileType)

Main rendering stage for content processing.

```javascript
async render(content, context, fileType) {
  // Process content and replace tags
  return processedContent;
}
```

##### postrender(finalXml, fileType)

Post-processing stage for final XML modifications.

```javascript
async postrender(finalXml, fileType) {
  // Final XML modifications
  return finalXml;
}
```

## Creating Custom Modules

### Basic Module Structure

```javascript
const { BaseModule } = require('@new-templater/core');

class MyCustomModule extends BaseModule {
  constructor(options = {}) {
    super(options);
    this.name = 'MyCustomModule';
    this.tags = ['mycustom'];
    this.supportedFileTypes = ['docx'];
    this.priority = 100;
  }

  async render(content, context, fileType) {
    // Replace {%mycustom data%} tags with processed content
    return content.replace(/{%mycustom ([^%]+)%}/g, (match, data) => {
      return this.processCustomTag(data, context);
    });
  }

  processCustomTag(data, context) {
    // Your custom processing logic here
    return `Processed: ${data}`;
  }
}

module.exports = MyCustomModule;
```

### Module Lifecycle

1. **Initialization**: Module is instantiated and attached to core
2. **Pre-parse**: Raw XML modification before core parsing
3. **Parse**: Token-level transformations
4. **Render**: Main content processing and tag replacement
5. **Post-render**: Final XML modifications

### Module Best Practices

- **Single Responsibility**: Each module should handle one specific feature
- **Error Handling**: Use `this.core.addError()` to report errors
- **Logging**: Use `this.log(level, message)` for consistent logging
- **Testing**: Include comprehensive tests for all module functionality
- **Documentation**: Provide clear usage examples and API documentation

## Examples

### Basic Placeholder Replacement

Template:
```xml
<w:t>Hello {{name}}, welcome to {{company}}!</w:t>
```

Context:
```javascript
{
  name: 'John Doe',
  company: 'Acme Corp'
}
```

Output:
```xml
<w:t>Hello John Doe, welcome to Acme Corp!</w:t>
```

### Loop Processing

Template:
```xml
{%loop item in items%}
<w:p><w:t>- {{item.name}}: {{item.price}}</w:t></w:p>
{%endloop%}
```

Context:
```javascript
{
  items: [
    { name: 'Product A', price: '$10.99' },
    { name: 'Product B', price: '$25.50' }
  ]
}
```

### Conditional Content

Template:
```xml
{%if user.isPremium%}
<w:t>Premium content here</w:t>
{%endif%}
```

Context:
```javascript
{
  user: { isPremium: true }
}
```

### Raw XML Insertion

Template:
```xml
<w:t>Content: {@customXml}</w:t>
```

Context:
```javascript
{
  customXml: '<w:r><w:rPr><w:b/></w:rPr><w:t>Bold text</w:t></w:r>'
}
```

## Error Handling

The library provides comprehensive error handling:

```javascript
// Enable error throwing for missing data
const templater = new NewTemplaterCore({
  errorOnMissingData: true
});

try {
  const output = await templater.render();
} catch (error) {
  console.error('Template error:', error.message);
}

// Or collect errors without throwing
const templater2 = new NewTemplaterCore({
  errorOnMissingData: false
});

await templater2.render();
const errors = templater2.getErrors();
errors.forEach(error => {
  console.log('Error:', error.message);
});
```

## Testing

Run the test suite:

```bash
npm test
```

The library includes comprehensive tests covering:
- Core functionality
- Tag parsing
- Context resolution
- Module integration
- Error handling
- Edge cases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Related Packages

- `@new-templater/html-module` - HTML content rendering
- `@new-templater/image-module` - Image insertion and replacement
- `@new-templater/table-module` - Dynamic table generation
- `@new-templater/chart-module` - Chart data updates

## Support

- GitHub Issues: [Report bugs and request features](https://github.com/your-org/new-templater-core/issues)
- Documentation: [Full documentation](https://github.com/your-org/new-templater-core/docs)
- Examples: [Example repository](https://github.com/your-org/new-templater-examples)

