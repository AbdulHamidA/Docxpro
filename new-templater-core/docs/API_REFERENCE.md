# API Reference

## Core Library (@new-templater/core)

### NewTemplaterCore

The main class for document templating operations.

#### Constructor

```javascript
new NewTemplaterCore(options)
```

**Parameters:**
- `options` (Object, optional): Configuration options
  - `errorOnMissingData` (boolean, default: false): Whether to throw errors for missing template data
  - `nullGetter` (function, default: () => ""): Function to handle null/undefined values
  - `debug` (boolean, default: false): Enable debug logging

**Example:**
```javascript
const templater = new NewTemplaterCore({
  errorOnMissingData: true,
  debug: true,
  nullGetter: () => "[MISSING]"
});
```

#### Methods

##### loadTemplate(template)

Loads a document template from a buffer.

**Parameters:**
- `template` (Buffer): The document file as a buffer

**Returns:** Promise<void>

**Throws:** Error if template is invalid or unsupported format

**Example:**
```javascript
const fs = require('fs');
const templateBuffer = fs.readFileSync('template.docx');
await templater.loadTemplate(templateBuffer);
```

##### setContext(data)

Sets the data context for template processing.

**Parameters:**
- `data` (Object): The data object containing template variables

**Example:**
```javascript
templater.setContext({
  user: {
    name: "John Doe",
    email: "john@example.com"
  },
  items: [
    { name: "Item 1", price: 100 },
    { name: "Item 2", price: 200 }
  ]
});
```

##### attachModule(moduleInstance)

Attaches a module to extend templating functionality.

**Parameters:**
- `moduleInstance` (BaseModule): An instance of a module extending BaseModule

**Throws:** Error if module is invalid

**Example:**
```javascript
const HtmlModule = require('@new-templater/html-module');
templater.attachModule(new HtmlModule());
```

##### render()

Renders the template with the current context and attached modules.

**Returns:** Promise<Buffer> - The generated document as a buffer

**Throws:** Error if no template is loaded or rendering fails

**Example:**
```javascript
const outputBuffer = await templater.render();
fs.writeFileSync('output.docx', outputBuffer);
```

##### getErrors()

Returns any errors encountered during processing.

**Returns:** Array<Error> - Array of error objects

**Example:**
```javascript
const errors = templater.getErrors();
if (errors.length > 0) {
  console.log('Errors encountered:', errors);
}
```

##### addError(error)

Adds an error to the error collection.

**Parameters:**
- `error` (Error): The error to add

**Example:**
```javascript
templater.addError(new Error('Custom error message'));
```

##### getZipInstance()

Returns the internal JSZip instance for advanced operations.

**Returns:** JSZip - The JSZip instance

**Example:**
```javascript
const zip = templater.getZipInstance();
const files = Object.keys(zip.files);
```

#### Properties

##### options

The configuration options passed to the constructor.

**Type:** Object

##### context

The current data context.

**Type:** Object

##### modules

Array of attached modules.

**Type:** Array<BaseModule>

##### errors

Array of errors encountered during processing.

**Type:** Array<Error>

##### fileType

The detected file type of the loaded template.

**Type:** string ("docx" | "pptx" | "xlsx")

### BaseModule

Base class for all modules. All custom modules must extend this class.

#### Constructor

```javascript
new BaseModule(options)
```

**Parameters:**
- `options` (Object, optional): Module-specific configuration options

#### Properties

##### name

The module name (should match class name).

**Type:** string

##### tags

Array of template tags this module handles.

**Type:** Array<string>

##### supportedFileTypes

Array of file types this module supports.

**Type:** Array<string>

##### priority

Processing priority (lower numbers = higher priority).

**Type:** number

##### core

Reference to the core templater instance (set automatically).

**Type:** NewTemplaterCore

#### Methods

##### setCore(coreInstance)

Called by the core to set the core instance reference.

**Parameters:**
- `coreInstance` (NewTemplaterCore): The core templater instance

##### preparse(xmlContent, fileType)

Pre-processing phase - modify raw XML before core parsing.

**Parameters:**
- `xmlContent` (string): Raw XML content
- `fileType` (string): File type being processed

**Returns:** Promise<string> - Modified XML content

##### render(content, context, fileType)

Main processing phase - transform module-specific tags.

**Parameters:**
- `content` (string): Current content
- `context` (Object): Template data context
- `fileType` (string): File type being processed

**Returns:** Promise<string> - Processed content

##### postrender(finalXml, fileType)

Post-processing phase - final modifications.

**Parameters:**
- `finalXml` (string): Final XML content
- `fileType` (string): File type being processed

**Returns:** Promise<string> - Final modified content

##### shouldProcess(content, fileType)

Determines if this module should process the given content.

**Parameters:**
- `content` (string): Content to check
- `fileType` (string): File type

**Returns:** boolean - True if module should process

##### validate(templateContent)

Validates module-specific syntax in templates.

**Parameters:**
- `templateContent` (string): Template content to validate

**Returns:** Array<Error> - Array of validation errors

##### log(level, message)

Logs a message using the core's logging system.

**Parameters:**
- `level` (string): Log level ("info", "warn", "error", "debug")
- `message` (string): Message to log

##### getConfig()

Returns the module's configuration.

**Returns:** Object - Module configuration

### ContextResolver

Utility class for resolving data paths in template contexts.

#### Methods

##### resolve(context, path, defaultValue)

Resolves a data path from the context using dot notation.

**Parameters:**
- `context` (Object): The data context
- `path` (string): Dot-separated path (e.g., "user.profile.name")
- `defaultValue` (any, optional): Value to return if path not found

**Returns:** any - The resolved value or defaultValue

**Example:**
```javascript
const ContextResolver = require('@new-templater/core').ContextResolver;

const context = {
  user: {
    profile: {
      name: "John Doe"
    }
  }
};

const name = ContextResolver.resolve(context, "user.profile.name", "Unknown");
// Returns: "John Doe"

const missing = ContextResolver.resolve(context, "user.age", 0);
// Returns: 0
```

## HTML Module (@new-templater/html-module)

### HtmlModule

Module for converting HTML content to WordML for DOCX documents.

#### Constructor

```javascript
new HtmlModule(options)
```

**Parameters:**
- `options` (Object, optional): Module configuration options

#### Supported Tags

- `{%html variableName%}` - Converts HTML content to WordML

#### Supported HTML Elements

- `<p>` - Paragraphs
- `<b>`, `<strong>` - Bold text
- `<i>`, `<em>` - Italic text
- `<ul>`, `<ol>` - Lists
- `<li>` - List items
- `<h1>` to `<h6>` - Headings
- `<div>`, `<span>` - Generic containers

#### Example Usage

```javascript
const HtmlModule = require('@new-templater/html-module');
const templater = new NewTemplaterCore();

templater.attachModule(new HtmlModule());
templater.setContext({
  richContent: "<p>This is <strong>bold</strong> and <em>italic</em> text.</p>"
});

// Template contains: {%html richContent%}
const result = await templater.render();
```

#### Properties

- `name`: "HtmlModule"
- `tags`: ["html"]
- `supportedFileTypes`: ["docx"]
- `priority`: 20

## Image Module (@new-templater/image-module)

### ImageModule

Module for inserting images from URLs into DOCX documents.

#### Constructor

```javascript
new ImageModule(options)
```

**Parameters:**
- `options` (Object, optional): Module configuration options

#### Supported Tags

- `{%image variableName%}` - Inserts image from URL

#### Example Usage

```javascript
const ImageModule = require('@new-templater/image-module');
const templater = new NewTemplaterCore();

templater.attachModule(new ImageModule());
templater.setContext({
  logoUrl: "https://example.com/logo.png"
});

// Template contains: {%image logoUrl%}
const result = await templater.render();
```

#### Properties

- `name`: "ImageModule"
- `tags`: ["image"]
- `supportedFileTypes`: ["docx"]
- `priority`: 30

#### Notes

- Images are fetched from URLs and embedded into the document
- Supports common image formats (PNG, JPEG, GIF)
- Generates proper WordML for image display
- Handles network errors gracefully

## Error Handling

### Error Types

#### TemplateError

Thrown when template loading or parsing fails.

```javascript
try {
  await templater.loadTemplate(invalidBuffer);
} catch (error) {
  if (error instanceof TemplateError) {
    console.log('Template error:', error.message);
  }
}
```

#### ModuleError

Thrown when module processing fails.

```javascript
const errors = templater.getErrors();
errors.forEach(error => {
  if (error instanceof ModuleError) {
    console.log('Module error:', error.message);
  }
});
```

#### ValidationError

Thrown when template validation fails.

```javascript
const validationErrors = module.validate(templateContent);
validationErrors.forEach(error => {
  console.log('Validation error:', error.message);
});
```

### Error Recovery

The library is designed to handle errors gracefully:

- Non-fatal errors are collected and can be retrieved with `getErrors()`
- Modules can provide fallback content when processing fails
- The `errorOnMissingData` option controls whether missing data throws errors

## Template Syntax

### Basic Placeholders

```
{{variableName}}
```

Replaced with the value from the context.

### Nested Properties

```
{{user.profile.name}}
```

Access nested object properties using dot notation.

### Module Tags

```
{%moduleName parameters%}
```

Processed by specific modules based on the module name.

### Raw XML

```
{@rawXmlContent}
```

Inserts raw XML content directly into the document.

### Conditionals (Future)

```
{%if condition%}
  Content when true
{%endif%}
```

### Loops (Future)

```
{%loop item in items%}
  {{item.name}}: {{item.value}}
{%endloop%}
```

## File Format Support

### DOCX (Microsoft Word)

- Full support for document content, headers, and footers
- WordML generation for rich content
- Image embedding and relationship management
- Style and formatting preservation

### PPTX (Microsoft PowerPoint)

- Slide content processing
- Master slide support
- Shape and text box manipulation
- Animation preservation

### XLSX (Microsoft Excel)

- Worksheet content processing
- Formula preservation
- Chart integration
- Cell formatting support

## Performance Considerations

### Memory Usage

- Large documents are processed incrementally
- Modules should clean up resources after processing
- Use streaming for very large files

### Network Operations

- Image module implements timeouts for URL fetching
- Failed network requests are handled gracefully
- Consider caching for frequently accessed resources

### Processing Speed

- Modules are processed in priority order
- Only necessary modules are executed
- Parallel processing where possible

## Security

### Input Validation

- All template content is validated before processing
- User data is sanitized to prevent injection attacks
- URL validation prevents SSRF attacks

### Resource Limits

- Network timeouts prevent hanging requests
- Memory limits prevent excessive resource usage
- File size limits prevent denial of service

### Safe Defaults

- Error handling prevents crashes
- Fallback content for failed operations
- Secure default configurations

This API reference provides comprehensive documentation for all public interfaces and functionality in the New Templater library ecosystem.

