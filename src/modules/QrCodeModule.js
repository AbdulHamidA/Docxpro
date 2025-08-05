const QRCode = require('qrcode');

/**
 * QR Code Module - Generates QR codes and inserts them as images
 */
class QrCodeModule {
  constructor() {
    this.name = 'qrcode';
    this.priority = 70;
    this.supportedTypes = ['docx', 'pptx'];
    this.qrCounter = 1;
  }

  /**
   * Process content and generate QR codes
   * @param {string} content - Content to process
   * @param {Object} context - Processing context
   * @returns {Promise<string>} - Processed content
   */
  async process(content, context) {
    // Find QR code module tags: {%qrcode variable_name%}
    const qrPattern = /\{%\s*qrcode\s+([^%]+)\s*%\}/g;
    let processedContent = content;
    let match;

    while ((match = qrPattern.exec(content)) !== null) {
      const variableName = match[1].trim();
      const qrData = this._getQrData(variableName, context.context);
      
      if (qrData) {
        const qrImageXml = await this._createQrCodeXml(qrData, context);
        processedContent = processedContent.replace(match[0], qrImageXml);
      } else {
        processedContent = processedContent.replace(match[0], '');
      }
    }

    return processedContent;
  }

  /**
   * Check if content has QR code tags to process
   * @param {string} content - Content to check
   * @returns {boolean} - True if has QR code tags
   */
  hasTagsToProcess(content) {
    return /\{%\s*qrcode\s+[^%]+\s*%\}/.test(content);
  }

  /**
   * Get QR code data from context
   * @private
   */
  _getQrData(variableName, context) {
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
      
      // Handle different QR data formats
      if (typeof value === 'string') {
        // Simple text to encode
        return { text: value };
      } else if (typeof value === 'object' && value.text) {
        // Object with text and optional properties
        return value;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create QR code XML for insertion
   * @private
   */
  async _createQrCodeXml(qrData, context) {
    const { 
      text, 
      size = 200, 
      errorCorrectionLevel = 'M',
      margin = 4,
      color = { dark: '#000000', light: '#FFFFFF' }
    } = qrData;
    
    try {
      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(text, {
        type: 'png',
        width: size,
        margin: margin,
        color: color,
        errorCorrectionLevel: errorCorrectionLevel
      });
      
      const imageName = `qrcode${this.qrCounter}.png`;
      const relationshipId = `rId${2000 + this.qrCounter}`;
      
      // Add QR code image to document
      await this._addQrCodeToDocument(context.zip, imageName, qrBuffer, relationshipId);
      
      // Calculate dimensions
      const dimensions = this._calculateDimensions(size, size);
      
      // Create image XML based on document type
      if (context.documentType === 'docx') {
        return this._createDocxQrCodeXml(relationshipId, dimensions, text);
      } else if (context.documentType === 'pptx') {
        return this._createPptxQrCodeXml(relationshipId, dimensions, text);
      }
      
      this.qrCounter++;
      return '';
    } catch (error) {
      console.warn(`Failed to generate QR code: ${error.message}`);
      return '';
    }
  }

  /**
   * Add QR code image to document zip
   * @private
   */
  async _addQrCodeToDocument(zip, imageName, qrBuffer, relationshipId) {
    // Add QR code to media folder
    const mediaPath = `word/media/${imageName}`;
    zip.file(mediaPath, qrBuffer);
    
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
      
      // Add PNG content type if not exists
      if (!contentTypesContent.includes('Extension="png"')) {
        const defaultElement = '<Default Extension="png" ContentType="image/png"/>';
        contentTypesContent = contentTypesContent.replace(
          '</Types>',
          `${defaultElement}</Types>`
        );
        
        zip.file(contentTypesPath, contentTypesContent);
      }
    }
  }

  /**
   * Calculate QR code dimensions
   * @private
   */
  _calculateDimensions(width, height) {
    // Convert pixels to EMUs (English Metric Units)
    // 1 pixel = 9525 EMUs at 96 DPI
    return {
      width: width * 9525,
      height: height * 9525
    };
  }

  /**
   * Create DOCX QR code XML
   * @private
   */
  _createDocxQrCodeXml(relationshipId, dimensions, altText) {
    const { width, height } = dimensions;
    
    return `<w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="${width}" cy="${height}"/>
          <wp:effectExtent l="0" t="0" r="0" b="0"/>
          <wp:docPr id="${this.qrCounter}" name="QR Code ${this.qrCounter}" descr="QR Code: ${altText}"/>
          <wp:cNvGraphicFramePr>
            <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
          </wp:cNvGraphicFramePr>
          <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:nvPicPr>
                  <pic:cNvPr id="0" name="QR Code ${this.qrCounter}"/>
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
   * Create PPTX QR code XML
   * @private
   */
  _createPptxQrCodeXml(relationshipId, dimensions, altText) {
    const { width, height } = dimensions;
    
    return `<p:pic>
      <p:nvPicPr>
        <p:cNvPr id="${this.qrCounter}" name="QR Code ${this.qrCounter}"/>
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
}

module.exports = QrCodeModule;

