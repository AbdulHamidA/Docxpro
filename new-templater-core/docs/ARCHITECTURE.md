# New Templater Architecture Documentation

## Overview

The New Templater is a modular document templating library designed for Node.js applications. It provides a flexible architecture where the core library handles basic templating functionality, while additional features are implemented as separate, independently publishable npm modules. This design is inspired by the successful modular approach of docxtemplater, allowing developers to install only the features they need while maintaining a lightweight core.

## Core Design Principles

### Modularity
The library follows a strict modular architecture where each feature is implemented as a separate module. This approach provides several benefits:

- **Reduced Bundle Size**: Applications only include the modules they actually use
- **Independent Development**: Modules can be developed, tested, and released independently
- **Extensibility**: Third-party developers can create custom modules without modifying the core
- **Maintainability**: Each module has a focused responsibility and can be maintained separately

### Compatibility
The library maintains compatibility with docxtemplater's template syntax, ensuring that existing templates can be migrated with minimal changes. This includes support for:

- Simple placeholders: `{{variable}}`
- Conditional statements: `{%if condition%}...{%endif%}`
- Loops: `{%loop item in items%}...{%endloop%}`
- Raw XML insertion: `{@rawXml}`
- Module-specific tags: `{%moduleName data%}`

### Extensibility
The architecture is designed to support easy extension through a well-defined module interface. New modules can be created by extending the `BaseModule` class and implementing the required methods for different processing phases.

## Core Components

### NewTemplaterCore

The `NewTemplaterCore` class serves as the central orchestrator for the entire templating process. It manages document loading, module coordination, and the rendering pipeline.

#### Key Responsibilities

**Document Management**: The core handles loading and parsing of various document formats including DOCX, PPTX, and XLSX files. It uses JSZip to extract and manipulate the internal XML structure of these OpenXML-based formats.

**Module Orchestration**: The core maintains a registry of attached modules and coordinates their execution during the rendering process. Modules are sorted by priority to ensure proper processing order.

**Context Management**: The core manages the data context that provides values for template variables. It includes a sophisticated context resolver that supports nested object access using dot notation.

**Error Handling**: The core provides centralized error collection and reporting, allowing modules to report errors without interrupting the entire rendering process.

#### Processing Pipeline

The core implements a multi-phase processing pipeline that allows modules to participate at different stages:

1. **Pre-parse Phase**: Modules can modify raw XML content before core parsing
2. **Parse Phase**: Core and modules identify and tokenize template tags
3. **Render Phase**: Modules transform their specific tags into final content
4. **Post-render Phase**: Modules can make final XML modifications

### BaseModule

The `BaseModule` class provides the foundation for all modules in the ecosystem. It defines the interface that modules must implement and provides common functionality.

#### Module Lifecycle

**Initialization**: Modules are instantiated with optional configuration parameters and register their supported tags and file types.

**Attachment**: When a module is attached to the core, it receives a reference to the core instance, allowing access to shared utilities like the context resolver and error reporting.

**Processing**: During rendering, modules participate in the processing pipeline according to their priority and the presence of their tags in the content.

#### Module Interface

Modules implement several key methods:

- `preparse()`: Modify raw XML before core processing
- `render()`: Transform module-specific tags into final content
- `postrender()`: Make final modifications after all rendering
- `shouldProcess()`: Determine if the module should process given content

### ContextResolver

The `ContextResolver` utility provides sophisticated data path resolution within the template context. It supports nested object access using dot notation, allowing templates to reference complex data structures.

#### Features

**Dot Notation Support**: Access nested properties using paths like `user.profile.name`

**Safe Navigation**: Gracefully handles missing properties without throwing errors

**Default Values**: Supports fallback values when requested data is not available

**Type Safety**: Validates data types and provides appropriate error messages

## Module Architecture

### Module Types

The library supports different types of modules based on their functionality:

**Content Transformation Modules**: These modules transform specific content types, such as the HTML Module that converts HTML snippets to WordML.

**Media Insertion Modules**: These modules handle insertion of external media, such as the Image Module that fetches and embeds images from URLs.

**Data Processing Modules**: These modules manipulate data before rendering, such as modules that format dates or perform calculations.

**Layout Modules**: These modules handle document structure and layout, such as modules that create tables or manage page breaks.

### Module Communication

Modules communicate with the core and each other through well-defined interfaces:

**Core Services**: Modules access core services like context resolution, error reporting, and document manipulation through the core instance.

**Shared State**: The core maintains shared state that modules can access, including the current context, document structure, and processing phase.

**Event System**: While not currently implemented, the architecture supports future addition of an event system for module communication.

### Module Priority System

Modules are processed according to their priority values, with lower numbers indicating higher priority. This ensures that modules that need to process content before others can do so reliably.

**Priority Guidelines**:
- 1-10: Critical infrastructure modules
- 11-20: Content transformation modules (like HTML)
- 21-30: Media insertion modules (like Image)
- 31-40: Formatting and styling modules
- 41-50: Layout and structure modules
- 51+: Post-processing and cleanup modules

## File Format Support

### DOCX (Word Documents)

The library provides comprehensive support for DOCX files, which are the primary target format. DOCX files are processed by:

**Document Structure**: The core understands the DOCX file structure and processes the main document content as well as headers and footers.

**WordML Generation**: Modules can generate proper WordML (Word Markup Language) to ensure compatibility with Microsoft Word and other DOCX processors.

**Relationship Management**: The core handles the complex relationship structure required for embedded media and cross-references.

### PPTX (PowerPoint Presentations)

PPTX support is designed for presentation templates:

**Slide Processing**: Each slide is processed independently, allowing for slide-specific content and formatting.

**Master Slide Support**: The architecture supports processing of master slides and slide layouts.

**Animation Preservation**: The core preserves existing animations and transitions while processing template content.

### XLSX (Excel Spreadsheets)

XLSX support enables spreadsheet templating:

**Worksheet Processing**: Each worksheet is processed independently with support for formulas and formatting.

**Chart Integration**: The architecture supports integration with Excel charts and data visualization.

**Formula Preservation**: Existing formulas are preserved while template variables are resolved.

## Security Considerations

### Input Validation

The library implements comprehensive input validation to prevent security vulnerabilities:

**Template Validation**: Templates are validated to ensure they contain only safe content and valid XML structure.

**Context Sanitization**: User-provided context data is sanitized to prevent XML injection attacks.

**URL Validation**: Modules that fetch external resources validate URLs to prevent SSRF attacks.

### Sandboxing

While the library runs in the Node.js environment, it implements several sandboxing measures:

**Limited File Access**: The library only accesses files through controlled interfaces and does not provide arbitrary file system access.

**Network Restrictions**: Modules that make network requests implement appropriate timeouts and validation.

**Resource Limits**: The library implements limits on memory usage and processing time to prevent denial-of-service attacks.

## Performance Optimization

### Lazy Loading

The modular architecture enables lazy loading of modules, reducing initial load time and memory usage:

**On-Demand Loading**: Modules are only loaded when they are actually needed for processing.

**Dependency Management**: The core manages module dependencies and loads them in the correct order.

**Caching**: Frequently used modules and their resources are cached to improve performance.

### Streaming Processing

For large documents, the library supports streaming processing:

**Incremental Parsing**: Large XML files are parsed incrementally to reduce memory usage.

**Chunk Processing**: Content is processed in chunks to maintain responsive performance.

**Memory Management**: The library actively manages memory usage and garbage collection.

### Parallel Processing

Where possible, the library enables parallel processing:

**Independent Modules**: Modules that don't depend on each other can process content in parallel.

**Async Operations**: All I/O operations are asynchronous to prevent blocking.

**Worker Threads**: Future versions may support worker threads for CPU-intensive operations.

## Error Handling and Debugging

### Error Collection

The library implements comprehensive error collection and reporting:

**Non-Fatal Errors**: Errors that don't prevent document generation are collected and reported without stopping processing.

**Error Context**: Errors include detailed context information to help with debugging.

**Error Categories**: Different types of errors are categorized for easier handling and filtering.

### Debugging Support

The library provides extensive debugging capabilities:

**Debug Logging**: Detailed logging can be enabled to trace the processing pipeline.

**Module Inspection**: The state of modules and their processing can be inspected at runtime.

**Template Analysis**: Tools are provided to analyze templates and identify potential issues.

### Validation and Testing

The architecture supports comprehensive validation and testing:

**Template Validation**: Templates can be validated before processing to catch errors early.

**Module Testing**: Each module includes comprehensive test suites to ensure reliability.

**Integration Testing**: The core includes integration tests that verify module interaction.

## Future Enhancements

### Planned Features

**Advanced Templating**: Support for more complex templating features like nested loops and advanced conditionals.

**Performance Improvements**: Continued optimization of the processing pipeline and memory usage.

**Additional Formats**: Support for additional document formats like ODT and RTF.

**Cloud Integration**: Integration with cloud storage and processing services.

### Extension Points

The architecture is designed to support future extensions:

**Plugin System**: A more sophisticated plugin system for third-party extensions.

**Template Language**: Support for alternative template languages and syntaxes.

**Processing Backends**: Support for alternative processing backends and engines.

**Integration APIs**: APIs for integration with external systems and services.

This architecture provides a solid foundation for a powerful, flexible, and extensible document templating system that can grow and adapt to meet evolving requirements while maintaining compatibility and performance.

