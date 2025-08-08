# Module Development Guide

## Introduction

This guide provides comprehensive instructions for developing modules for the New Templater library. Modules extend the core functionality by adding support for specific content types, media formats, or processing capabilities.

## Getting Started

### Prerequisites

Before developing a module, ensure you have:

- Node.js 14.0.0 or higher
- npm or yarn package manager
- Basic understanding of JavaScript ES6+ features
- Familiarity with the OpenXML format (for DOCX/PPTX/XLSX support)
- Understanding of the New Templater core architecture

### Development Environment Setup

1. **Clone the Core Repository**:
   ```bash
   git clone https://github.com/your-org/new-templater-core.git
   cd new-templater-core
   npm install
   ```

2. **Create Module Directory**:
   ```bash
   mkdir my-custom-module
   cd my-custom-module
   npm init -y
   ```

3. **Install Dependencies**:
   ```bash
   npm install @new-templater/core
   npm install --save-dev mocha chai
   ```

## Module Structure

### Basic Module Template

Every module must extend the `BaseModule` class and implement the required interface:

```javascript
const { BaseModule } = require("@new-templater/core");

class MyCustomModule extends BaseModule {
  constructor(options = {}) {
    super(options);
    this.name = "MyCustomModule";
    this.tags = ["mycustom"]; // Tags this module handles
    this.supportedFileTypes = ["docx", "pptx", "xlsx"];
    this.priority = 50; // Processing priority (lower = higher priority)
  }

  async render(content, context, fileType) {
    // Main processing logic goes here
    return content;
  }
}

module.exports = MyCustomModule;
```

### Module Properties

#### Required Properties

**name**: A unique identifier for your module. Should match the class name.

**tags**: An array of template tags that your module handles. For example, if your module processes `{%mycustom data%}` tags, include "mycustom" in this array.

**supportedFileTypes**: An array of file types your module can process. Valid values are "docx", "pptx", and "xlsx".

**priority**: A numeric value determining processing order. Lower numbers are processed first.

#### Optional Properties

**version**: Module version string for compatibility checking.

**dependencies**: Array of other modules this module depends on.

**configuration**: Default configuration object for the module.

### Module Methods

#### Core Methods

**render(content, context, fileType)**: The primary method where your module processes content. This method receives the current XML content, the data context, and the file type being processed.

**preparse(xmlContent, fileType)**: Called before core parsing. Use this to modify raw XML content before the core processes it.

**postrender(finalXml, fileType)**: Called after all rendering is complete. Use this for final cleanup or modifications.

**shouldProcess(content, fileType)**: Determines if your module should process the given content. The default implementation checks for your module's tags in the content.

#### Utility Methods

**log(level, message)**: Logs messages using the core's logging system. Levels include "info", "warn", "error", and "debug".

**validate(templateContent)**: Validates module-specific syntax in templates. Return an array of validation errors.

**getConfig()**: Returns the module's configuration object.

## Processing Pipeline

### Understanding the Pipeline

The New Templater core processes documents through several phases:

1. **Document Loading**: The core loads and parses the document structure
2. **Pre-parsing**: Modules can modify raw XML before core processing
3. **Parsing**: The core and modules identify and tokenize template tags
4. **Rendering**: Modules transform their tags into final content
5. **Post-rendering**: Final modifications and cleanup
6. **Document Generation**: The core assembles the final document

### Module Participation

Your module can participate in multiple phases of the pipeline:

**Pre-parse Phase**: Modify the raw XML content before any processing occurs. This is useful for modules that need to restructure the document or prepare it for processing.

**Render Phase**: The main processing phase where your module transforms its specific tags into final content. This is where most module logic resides.

**Post-render Phase**: Make final modifications after all other processing is complete. This is useful for cleanup operations or final formatting.

## Tag Processing

### Tag Syntax

Modules typically process tags in the format `{%tagName parameters%}`. The core provides utilities for parsing these tags, but modules are responsible for implementing their own parsing logic.

### Tag Parsing Example

```javascript
async render(content, context, fileType) {
  // Define regex for your tag format
  const tagRegex = new RegExp(`\\{%\\s*${this.tags[0]}\\s+([^%]+)%\\}`, "g");
  
  let processedContent = content;
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const parameters = match[1].trim();
    
    // Process the tag
    const replacement = await this.processTag(parameters, context, fileType);
    processedContent = processedContent.replace(fullMatch, replacement);
  }
  
  return processedContent;
}
```

### Context Resolution

Use the core's context resolver to access data from the template context:

```javascript
const value = this.core.contextResolver.resolve(context, "user.name", "Default Name");
```

The context resolver supports:
- Dot notation for nested properties
- Default values for missing data
- Type validation and error handling

## Content Generation

### WordML Generation

For DOCX files, modules often need to generate WordML (Word Markup Language). Here are common patterns:

**Text with Formatting**:
```javascript
const boldText = `<w:r><w:rPr><w:b/></w:rPr><w:t>Bold Text</w:t></w:r>`;
const italicText = `<w:r><w:rPr><w:i/></w:rPr><w:t>Italic Text</w:t></w:r>`;
```

**Paragraphs**:
```javascript
const paragraph = `<w:p><w:r><w:t>Paragraph content</w:t></w:r></w:p>`;
```

**Lists**:
```javascript
const listItem = `<w:p><w:r><w:t>• List item</w:t></w:r></w:p>`;
```

### PresentationML Generation

For PPTX files, generate PresentationML:

**Text Boxes**:
```javascript
const textBox = `<a:p><a:r><a:t>Slide content</a:t></a:r></a:p>`;
```

**Shapes**:
```javascript
const shape = `<p:sp><!-- Shape definition --></p:sp>`;
```

### SpreadsheetML Generation

For XLSX files, generate SpreadsheetML:

**Cells**:
```javascript
const cell = `<c r="A1"><v>Cell value</v></c>`;
```

**Formulas**:
```javascript
const formula = `<c r="B1"><f>SUM(A1:A10)</f></c>`;
```

## Error Handling

### Error Reporting

Always report errors through the core's error handling system:

```javascript
try {
  // Processing logic
} catch (error) {
  this.core.addError(new Error(`MyCustomModule: ${error.message}`));
  return ""; // Return safe fallback content
}
```

### Error Types

**Validation Errors**: Report when template syntax is invalid
**Processing Errors**: Report when content cannot be processed
**Resource Errors**: Report when external resources cannot be accessed
**Configuration Errors**: Report when module configuration is invalid

### Graceful Degradation

Design your module to degrade gracefully when errors occur:

```javascript
if (typeof data !== "string") {
  this.core.addError(new Error("Expected string data"));
  return originalContent; // Return unchanged content
}
```

## Testing

### Test Structure

Create comprehensive tests for your module:

```javascript
const assert = require("assert");
const MyCustomModule = require("../index");
const { NewTemplaterCore } = require("@new-templater/core");

describe("MyCustomModule", () => {
  let module;
  let mockCore;

  beforeEach(() => {
    module = new MyCustomModule();
    mockCore = {
      contextResolver: { resolve: (ctx, path, def) => def },
      options: { nullGetter: () => "" },
      addError: () => {},
      errors: []
    };
    module.setCore(mockCore);
  });

  it("should process basic tags", async () => {
    const content = "Before {%mycustom test%} After";
    const result = await module.render(content, {}, "docx");
    assert.ok(!result.includes("{%mycustom test%}"));
  });
});
```

### Test Categories

**Unit Tests**: Test individual methods and functionality
**Integration Tests**: Test module interaction with the core
**Content Tests**: Test various content types and edge cases
**Error Tests**: Test error handling and edge cases

### Test Data

Create realistic test data that represents actual use cases:

```javascript
const testContext = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    profile: {
      bio: "Software developer"
    }
  },
  items: [
    { name: "Item 1", value: 100 },
    { name: "Item 2", value: 200 }
  ]
};
```

## Performance Considerations

### Optimization Strategies

**Lazy Processing**: Only process content when your tags are present
**Caching**: Cache expensive operations like network requests or complex calculations
**Streaming**: For large content, consider streaming processing
**Memory Management**: Clean up resources and avoid memory leaks

### Performance Monitoring

```javascript
async render(content, context, fileType) {
  const startTime = Date.now();
  
  try {
    // Processing logic
    const result = await this.processContent(content, context);
    return result;
  } finally {
    const duration = Date.now() - startTime;
    this.log("debug", `Processing took ${duration}ms`);
  }
}
```

### Resource Management

**Network Requests**: Implement timeouts and retry logic
**File Operations**: Use streams for large files
**Memory Usage**: Monitor and limit memory consumption
**CPU Usage**: Avoid blocking operations in the main thread

## Publishing and Distribution

### Package Configuration

Configure your package.json for npm publication:

```json
{
  "name": "@your-org/new-templater-mycustom-module",
  "version": "1.0.0",
  "description": "Custom module for New Templater",
  "main": "index.js",
  "keywords": ["templating", "docx", "new-templater"],
  "peerDependencies": {
    "@new-templater/core": "^1.0.0"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### Documentation

Include comprehensive documentation:

**README.md**: Installation, usage, and API documentation
**CHANGELOG.md**: Version history and changes
**LICENSE**: License information
**examples/**: Usage examples and sample code

### Versioning

Follow semantic versioning (semver):
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

## Advanced Topics

### Module Dependencies

If your module depends on other modules:

```javascript
constructor(options = {}) {
  super(options);
  this.dependencies = ["@new-templater/html-module"];
}
```

### Configuration Management

Support module configuration:

```javascript
constructor(options = {}) {
  super(options);
  this.config = {
    timeout: 5000,
    retries: 3,
    ...options
  };
}
```

### Async Operations

Handle asynchronous operations properly:

```javascript
async render(content, context, fileType) {
  const promises = [];
  
  // Process multiple items concurrently
  for (const item of items) {
    promises.push(this.processItem(item));
  }
  
  const results = await Promise.all(promises);
  return this.combineResults(results);
}
```

### Custom Tag Syntax

Implement custom tag syntax if needed:

```javascript
parseCustomTag(tagContent) {
  // Parse: {%mycustom src="url" width="100" height="200"%}
  const attributes = {};
  const attrRegex = /(\w+)="([^"]+)"/g;
  let match;
  
  while ((match = attrRegex.exec(tagContent)) !== null) {
    attributes[match[1]] = match[2];
  }
  
  return attributes;
}
```

## Best Practices

### Code Quality

**Consistent Naming**: Use clear, descriptive names for methods and variables
**Error Messages**: Provide helpful error messages with context
**Documentation**: Document complex logic and public APIs
**Type Checking**: Use JSDoc or TypeScript for better type safety

### Security

**Input Validation**: Validate all user inputs and template content
**Sanitization**: Sanitize data to prevent injection attacks
**Resource Limits**: Implement limits on resource usage
**Access Control**: Limit access to sensitive operations

### Compatibility

**Version Compatibility**: Test with multiple versions of the core
**File Format Support**: Ensure compatibility with different document formats
**Platform Support**: Test on different operating systems and Node.js versions
**Backward Compatibility**: Maintain backward compatibility when possible

### User Experience

**Clear Documentation**: Provide clear, comprehensive documentation
**Good Examples**: Include practical, real-world examples
**Error Handling**: Provide helpful error messages and recovery suggestions
**Performance**: Optimize for common use cases

This guide provides the foundation for developing high-quality modules for the New Templater library. Following these guidelines will ensure your module integrates well with the core system and provides a great experience for users.

