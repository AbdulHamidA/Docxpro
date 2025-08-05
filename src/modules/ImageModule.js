const fs = require('fs');
const path = require('path');

/**
 * Image Module - Allows dynamic insertion and replacement of images
 */
class ImageModule {
  constructor() {
    this.name = 'image';
    this.priority = 60;
    this.supportedTypes = ['docx', 'pptx'];
    this.imageCounter = 1;
  }

  /**
   * Process content and handle image insertions
   * @param {string} content - Content to process
   * @param {Object} context - Processing context
   * @returns {Promise<string>} - Processed content
   */
  async process(content, context) {
    // Find image module tags: {%image variable_name%}
    const imagePattern = /\{%\s*image\s+([^%]+)\s*%\}/g;
    let processedContent = content;
    let match;

    while ((match = imagePattern.exec(content)) !== null) {
      const variableName = match[1].trim();
      const imageData = this._getImageData(variableName, context.context);
      
      if (imageData) {
        const imageXml = await this._createImageXml(imageData, context);
        processedContent = processedContent.replace(match[0], imageXml);
      } else {
        processedContent = processedContent.replace(match[0], '');
      }
    }

    return processedContent;
  }

  /**
   * Check if content has image tags to process
   * @param {string} content - Content to check
   * @returns {boolean} - True if has image tags
   */
  hasTagsToProcess(content) {
    return /\{%\s*image\s+[^%]+\s*%\}/.test(content);
  }

  /**
   * Get image data from context
   * @private
   */
  _getImageData(variableName, context) {
    try {
      const keys = variableName.split('.');
      let value = context;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return null;
        }
      }
      
      // Handle different image data formats
      if (typeof value === 'string') {
        // Simple path or URL
        return { src: value };
      } else if (typeof value === 'object' && value.src) {
        // Object with src and optional properties
        return value;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create image XML for insertion
   * @private
   */
  async _createImageXml(imageData, context) {
    const { src, width, height, alt = '' } = imageData;
    
    try {
      // Get image buffer
      const imageBuffer = await this._getImageBuffer(src);
      const imageExtension = this._getImageExtension(src);
      const imageName = `image${this.imageCounter}.${imageExtension}`;
      const relationshipId = `rId${1000 + this.imageCounter}`;
      
      // Add image to document
      await this._addImageToDocument(context.zip, imageName, imageBuffer, relationshipId);
      
      // Calculate dimensions
      const dimensions = this._calculateDimensions(width, height, imageBuffer);
      
      // Create image XML based on document type
      if (context.documentType === 'docx') {
        return this._createDocxImageXml(relationshipId, dimensions, alt);
      } else if (context.documentType === 'pptx') {
        return this._createPptxImageXml(relationshipId, dimensions, alt);
      }
      
      this.imageCounter++;
      return '';
    } catch (error) {
      console.warn(`Failed to process image: ${error.message}`);
      return '';
    }
  }

  /**
   * Get image buffer from path or URL
   * @private
   */
  async _getImageBuffer(src) {
    if (src.startsWith('http://') || src.startsWith('https://')) {
      // Download from URL
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } else {
      // Read from file system
      if (!fs.existsSync(src)) {
        throw new Error(`Image file not found: ${src}`);
      }
      return fs.readFileSync(src);
    }
  }

  /**
   * Get image file extension
   * @private
   */
  _getImageExtension(src) {
    const ext = path.extname(src).toLowerCase().substring(1);
    return ext || 'png';
  }

  /**
   * Add image to document zip
   * @private
   */
  async _addImageToDocument(zip, imageName, imageBuffer, relationshipId) {
    // Add image to media folder
    const mediaPath = `word/media/${imageName}`;
    zip.file(mediaPath, imageBuffer);
    
    // Update relationships
    const relsPath = 'word/_rels/document.xml.rels';
    const relsFile = zip.file(relsPath);
    
    if (relsFile) {
      let relsContent = await relsFile.async('text');
      
      // Add new relationship
      const newRelationship = `<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageName}"/>`;
      
      // Insert before closing tag
      relsContent = relsContent.replace(
        '</Relationships>',
        `${newRelationship}</Relationships>`
      );
      
      zip.file(relsPath, relsContent);
    }
    
    // Update content types
    const contentTypesPath = '[Content_Types].xml';
    const contentTypesFile = zip.file(contentTypesPath);
    
    if (contentTypesFile) {
      let contentTypesContent = await contentTypesFile.async('text');
      const extension = this._getImageExtension(imageName);
      const contentType = this._getImageContentType(extension);
      
      // Add content type if not exists
      if (!contentTypesContent.includes(`Extension="${extension}"`)) {
        const defaultElement = `<Default Extension="${extension}" ContentType="${contentType}"/>`;
        contentTypesContent = contentTypesContent.replace(
          '</Types>',
          `${defaultElement}</Types>`
        );
        
        zip.file(contentTypesPath, contentTypesContent);
      }
    }
  }

  /**
   * Calculate image dimensions
   * @private
   */
  _calculateDimensions(width, height, imageBuffer) {
    // Default dimensions in EMUs (English Metric Units)
    const defaultWidth = 2000000; // ~2 inches
    const defaultHeight = 1500000; // ~1.5 inches
    
    let finalWidth = defaultWidth;
    let finalHeight = defaultHeight;
    
    if (width && height) {
      // Convert pixels to EMUs (1 pixel = 9525 EMUs at 96 DPI)
      finalWidth = width * 9525;
      finalHeight = height * 9525;
    } else if (width) {
      finalWidth = width * 9525;
      // Maintain aspect ratio
      finalHeight = finalWidth * 0.75; // Assume 4:3 ratio
    } else if (height) {
      finalHeight = height * 9525;
      // Maintain aspect ratio
      finalWidth = finalHeight * 1.33; // Assume 4:3 ratio
    }
    
    return { width: finalWidth, height: finalHeight };
  }

  /**
   * Create DOCX image XML
   * @private
   */
  _createDocxImageXml(relationshipId, dimensions, alt) {
    const { width, height } = dimensions;
    
    return `<w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="${width}" cy="${height}"/>
          <wp:effectExtent l="0" t="0" r="0" b="0"/>
          <wp:docPr id="${this.imageCounter}" name="Picture ${this.imageCounter}" descr="${alt}"/>
          <wp:cNvGraphicFramePr>
            <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
          </wp:cNvGraphicFramePr>
          <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:nvPicPr>
                  <pic:cNvPr id="0" name="Picture ${this.imageCounter}"/>
                  <pic:cNvPicPr/>
                </pic:nvPicPr>
                <pic:blipFill>
                  <a:blip r:embed="${relationshipId}"/>
                  <a:stretch>
                    <a:fillRect/>
                  </a:stretch>
                </pic:blipFill>
                <pic:spPr>
                  <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="${width}" cy="${height}"/>
                  </a:xfrm>
                  <a:prstGeom prst="rect">
                    <a:avLst/>
                  </a:prstGeom>
                </pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>`;
  }

  /**
   * Create PPTX image XML
   * @private
   */
  _createPptxImageXml(relationshipId, dimensions, alt) {
    const { width, height } = dimensions;
    
    return `<p:pic>
      <p:nvPicPr>
        <p:cNvPr id="${this.imageCounter}" name="Picture ${this.imageCounter}"/>
        <p:cNvPicPr/>
        <p:nvPr/>
      </p:nvPicPr>
      <p:blipFill>
        <a:blip r:embed="${relationshipId}"/>
        <a:stretch>
          <a:fillRect/>
        </a:stretch>
      </p:blipFill>
      <p:spPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="${width}" cy="${height}"/>
        </a:xfrm>
        <a:prstGeom prst="rect">
          <a:avLst/>
        </a:prstGeom>
      </p:spPr>
    </p:pic>`;
  }

  /**
   * Get content type for image extension
   * @private
   */
  _getImageContentType(extension) {
    const contentTypes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'svg': 'image/svg+xml'
    };
    
    return contentTypes[extension] || 'image/png';
  }
}

module.exports = ImageModule;

