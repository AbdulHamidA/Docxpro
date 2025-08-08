const { BaseModule } = require("@new-templater/core");

/**
 * Image Module for @new-templater/core.
 * Enables dynamic image insertion into DOCX documents.
 */
class ImageModule extends BaseModule {
  constructor(options = {}) {
    super(options);
    this.name = "ImageModule";
    this.tags = ["image"];
    this.supportedFileTypes = ["docx"]; // Image module primarily works with DOCX
    this.priority = 30; // Process after HTML module
    this.imageIdCounter = 1; // Counter for unique image IDs
  }

  /**
   * Processes the content, replacing image tags with their DOCX equivalent.
   * This module operates in the render phase.
   * @param {string} content - The XML content of the document part.
   * @param {Object} context - The data context.
   * @param {string} fileType - The type of the file (e.g., \'docx\').
   * @returns {Promise<string>} - The processed XML content.
   */
  async render(content, context, fileType) {
    if (fileType !== "docx") {
      this.log("warn", `ImageModule only supports DOCX files. Skipping for ${fileType}.`);
      return content;
    }

    // Regex to find {%image variableName%} tags
    const imageTagRegex = new RegExp(`\\{%\\s*image\\s+([^%]+)%\\}`, "g");

    let processedContent = content;
    let match;

    const replacements = [];

    // Reset regex lastIndex before starting
    imageTagRegex.lastIndex = 0;

    while ((match = imageTagRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const variablePath = match[1].trim();

      const imageUrl = this.core.contextResolver.resolve(context, variablePath, this.core.options.nullGetter());

      if (typeof imageUrl !== "string" || !imageUrl) {
        this.core.addError(new Error(`ImageModule: Expected image URL for variable \'${variablePath}\' to be a non-empty string, but got ${typeof imageUrl}.`));
        replacements.push({ fullMatch, replacement: "" }); // Remove the tag if content is invalid
        continue;
      }

      try {
        // Fetch the image using the global fetch API
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}: ${response.statusText}`);
        }
        const imageArrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        // Generate a unique ID for the image
        const imageId = `rId${this.imageIdCounter++}`;
        const imageName = `image${this.imageIdCounter}.png`; // Assuming PNG for simplicity

        // Add image to the zip file (word/media/imageX.png)
        // This requires access to the core's JSZip instance
        if (this.core && this.core.getZipInstance()) {
          this.core.getZipInstance().file(`word/media/${imageName}`, imageBuffer);

          // Generate WordML for the image
          // This is a simplified representation. Real WordML for images is complex.
          const imageWordML = `
            <w:drawing>
              <wp:inline distT="0" distB="0" distL="0" distR="0">
                <wp:extent cx="3657600" cy="2743200"/>
                <wp:effectExtent l="0" t="0" r="0" b="0"/>
                <wp:docPr id="${this.imageIdCounter}" name="${imageName}"/>
                <wp:cNvGraphicFramePr>
                  <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
                </wp:cNvGraphicFramePr>
                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                      <pic:nvPicPr>
                        <pic:cNvPr id="0" name="${imageName}"/>
                        <pic:cNvPicPr/>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="${imageId}" cstate="print"/>
                        <a:stretch>
                          <a:fillRect/>
                        </a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm>
                          <a:off x="0" y="0"/>
                          <a:ext cx="3657600" cy="2743200"/>
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
          `;

          // Add relationship to document.xml.rels
          // This is a placeholder. Proper relationship management is complex.
          // It would involve modifying word/_rels/document.xml.rels
          // For now, we'll assume the core handles relationships or we'll add a simplified one.
          const relationshipXml = `<Relationship Id="${imageId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageName}"/>`;
          this.log("info", `ImageModule: Added relationship for ${imageName}: ${relationshipXml}`);

          replacements.push({ fullMatch, replacement: imageWordML });
          this.log("info", `Processed image for variable: ${variablePath}`);
        } else {
          this.core.addError(new Error("ImageModule: Core JSZip instance not available."));
          replacements.push({ fullMatch, replacement: "" });
        }
      } catch (error) {
        this.core.addError(new Error(`ImageModule: Failed to process image for variable \'${variablePath}\': ${error.message}`));
        replacements.push({ fullMatch, replacement: "" });
      }
    }

    // Apply replacements from last to first to avoid issues with index changes
    for (let i = replacements.length - 1; i >= 0; i--) {
      const rep = replacements[i];
      processedContent = processedContent.replace(rep.fullMatch, rep.replacement);
    }

    return processedContent;
  }
}

module.exports = ImageModule;

