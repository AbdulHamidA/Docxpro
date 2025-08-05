/**
 * Table Module - Creates dynamic tables from structured data
 */
class TableModule {
  constructor() {
    this.name = 'table';
    this.priority = 80;
    this.supportedTypes = ['docx'];
  }

  /**
   * Process content and create tables
   * @param {string} content - Content to process
   * @param {Object} context - Processing context
   * @returns {Promise<string>} - Processed content
   */
  async process(content, context) {
    // Find table module tags: {%table variable_name%}
    const tablePattern = /\{%\s*table\s+([^%]+)\s*%\}/g;
    let processedContent = content;
    let match;

    while ((match = tablePattern.exec(content)) !== null) {
      const variableName = match[1].trim();
      const tableData = this._getTableData(variableName, context.context);
      
      if (tableData) {
        const tableXml = this._createTableXml(tableData);
        processedContent = processedContent.replace(match[0], tableXml);
      } else {
        processedContent = processedContent.replace(match[0], '');
      }
    }

    return processedContent;
  }

  /**
   * Check if content has table tags to process
   * @param {string} content - Content to check
   * @returns {boolean} - True if has table tags
   */
  hasTagsToProcess(content) {
    return /\{%\s*table\s+[^%]+\s*%\}/.test(content);
  }

  /**
   * Get table data from context
   * @private
   */
  _getTableData(variableName, context) {
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
      
      // Validate table data structure
      if (this._isValidTableData(value)) {
        return value;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate table data structure
   * @private
   */
  _isValidTableData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Check for required properties
    if (!data.headers && !data.rows) {
      return false;
    }
    
    // If headers exist, they should be an array
    if (data.headers && !Array.isArray(data.headers)) {
      return false;
    }
    
    // Rows should be an array
    if (data.rows && !Array.isArray(data.rows)) {
      return false;
    }
    
    return true;
  }

  /**
   * Create table XML
   * @private
   */
  _createTableXml(tableData) {
    const {
      headers = [],
      rows = [],
      subheaders = [],
      footers = [],
      style = {},
      width = 'auto'
    } = tableData;
    
    let tableXml = '<w:tbl>';
    
    // Table properties
    tableXml += this._createTableProperties(style, width);
    
    // Table grid (column definitions)
    const columnCount = this._getColumnCount(headers, rows);
    tableXml += this._createTableGrid(columnCount);
    
    // Headers
    if (headers.length > 0) {
      tableXml += this._createHeaderRow(headers, style.header);
    }
    
    // Subheaders
    if (subheaders.length > 0) {
      tableXml += this._createSubheaderRow(subheaders, style.subheader);
    }
    
    // Data rows
    for (const row of rows) {
      tableXml += this._createDataRow(row, style.row);
    }
    
    // Footers
    if (footers.length > 0) {
      tableXml += this._createFooterRow(footers, style.footer);
    }
    
    tableXml += '</w:tbl>';
    
    return tableXml;
  }

  /**
   * Create table properties
   * @private
   */
  _createTableProperties(style, width) {
    let tblPr = '<w:tblPr>';
    
    // Table width
    if (width === 'auto') {
      tblPr += '<w:tblW w:w="0" w:type="auto"/>';
    } else if (typeof width === 'number') {
      tblPr += `<w:tblW w:w="${width}" w:type="dxa"/>`;
    } else {
      tblPr += '<w:tblW w:w="5000" w:type="pct"/>';
    }
    
    // Table borders
    if (style.borders !== false) {
      tblPr += this._createTableBorders(style.borderStyle);
    }
    
    // Table alignment
    if (style.alignment) {
      tblPr += `<w:jc w:val="${style.alignment}"/>`;
    }
    
    // Table margins
    if (style.margins) {
      tblPr += this._createTableMargins(style.margins);
    }
    
    tblPr += '</w:tblPr>';
    
    return tblPr;
  }

  /**
   * Create table borders
   * @private
   */
  _createTableBorders(borderStyle = {}) {
    const {
      style = 'single',
      size = 4,
      color = '000000'
    } = borderStyle;
    
    return `<w:tblBorders>
      <w:top w:val="${style}" w:sz="${size}" w:space="0" w:color="${color}"/>
      <w:left w:val="${style}" w:sz="${size}" w:space="0" w:color="${color}"/>
      <w:bottom w:val="${style}" w:sz="${size}" w:space="0" w:color="${color}"/>
      <w:right w:val="${style}" w:sz="${size}" w:space="0" w:color="${color}"/>
      <w:insideH w:val="${style}" w:sz="${size}" w:space="0" w:color="${color}"/>
      <w:insideV w:val="${style}" w:sz="${size}" w:space="0" w:color="${color}"/>
    </w:tblBorders>`;
  }

  /**
   * Create table margins
   * @private
   */
  _createTableMargins(margins) {
    const {
      top = 0,
      right = 108,
      bottom = 0,
      left = 108
    } = margins;
    
    return `<w:tblCellMar>
      <w:top w:w="${top}" w:type="dxa"/>
      <w:left w:w="${left}" w:type="dxa"/>
      <w:bottom w:w="${bottom}" w:type="dxa"/>
      <w:right w:w="${right}" w:type="dxa"/>
    </w:tblCellMar>`;
  }

  /**
   * Create table grid
   * @private
   */
  _createTableGrid(columnCount) {
    let tblGrid = '<w:tblGrid>';
    
    for (let i = 0; i < columnCount; i++) {
      tblGrid += '<w:gridCol w:w="2000"/>';
    }
    
    tblGrid += '</w:tblGrid>';
    
    return tblGrid;
  }

  /**
   * Get column count from headers and rows
   * @private
   */
  _getColumnCount(headers, rows) {
    let maxColumns = headers.length;
    
    for (const row of rows) {
      if (Array.isArray(row)) {
        maxColumns = Math.max(maxColumns, row.length);
      } else if (typeof row === 'object') {
        maxColumns = Math.max(maxColumns, Object.keys(row).length);
      }
    }
    
    return maxColumns || 1;
  }

  /**
   * Create header row
   * @private
   */
  _createHeaderRow(headers, headerStyle = {}) {
    let tr = '<w:tr>';
    
    // Row properties for header
    tr += '<w:trPr><w:tblHeader/></w:trPr>';
    
    for (const header of headers) {
      tr += this._createCell(header, {
        bold: true,
        backgroundColor: 'D9D9D9',
        ...headerStyle
      });
    }
    
    tr += '</w:tr>';
    
    return tr;
  }

  /**
   * Create subheader row
   * @private
   */
  _createSubheaderRow(subheaders, subheaderStyle = {}) {
    let tr = '<w:tr>';
    
    for (const subheader of subheaders) {
      tr += this._createCell(subheader, {
        italic: true,
        backgroundColor: 'F2F2F2',
        ...subheaderStyle
      });
    }
    
    tr += '</w:tr>';
    
    return tr;
  }

  /**
   * Create data row
   * @private
   */
  _createDataRow(row, rowStyle = {}) {
    let tr = '<w:tr>';
    
    if (Array.isArray(row)) {
      for (const cell of row) {
        tr += this._createCell(cell, rowStyle);
      }
    } else if (typeof row === 'object') {
      for (const value of Object.values(row)) {
        tr += this._createCell(value, rowStyle);
      }
    }
    
    tr += '</w:tr>';
    
    return tr;
  }

  /**
   * Create footer row
   * @private
   */
  _createFooterRow(footers, footerStyle = {}) {
    let tr = '<w:tr>';
    
    for (const footer of footers) {
      tr += this._createCell(footer, {
        bold: true,
        backgroundColor: 'E6E6E6',
        ...footerStyle
      });
    }
    
    tr += '</w:tr>';
    
    return tr;
  }

  /**
   * Create table cell
   * @private
   */
  _createCell(content, cellStyle = {}) {
    let tc = '<w:tc>';
    
    // Cell properties
    tc += this._createCellProperties(cellStyle);
    
    // Cell content
    tc += '<w:p>';
    tc += this._createParagraphProperties(cellStyle);
    tc += '<w:r>';
    tc += this._createRunProperties(cellStyle);
    tc += `<w:t>${this._escapeXml(String(content || ''))}</w:t>`;
    tc += '</w:r>';
    tc += '</w:p>';
    
    tc += '</w:tc>';
    
    return tc;
  }

  /**
   * Create cell properties
   * @private
   */
  _createCellProperties(style) {
    let tcPr = '<w:tcPr>';
    
    // Background color
    if (style.backgroundColor) {
      tcPr += `<w:shd w:val="clear" w:color="auto" w:fill="${style.backgroundColor}"/>`;
    }
    
    // Cell width
    if (style.width) {
      tcPr += `<w:tcW w:w="${style.width}" w:type="dxa"/>`;
    }
    
    // Vertical alignment
    if (style.verticalAlignment) {
      tcPr += `<w:vAlign w:val="${style.verticalAlignment}"/>`;
    }
    
    tcPr += '</w:tcPr>';
    
    return tcPr;
  }

  /**
   * Create paragraph properties
   * @private
   */
  _createParagraphProperties(style) {
    let pPr = '<w:pPr>';
    
    // Text alignment
    if (style.alignment) {
      pPr += `<w:jc w:val="${style.alignment}"/>`;
    }
    
    pPr += '</w:pPr>';
    
    return pPr;
  }

  /**
   * Create run properties
   * @private
   */
  _createRunProperties(style) {
    let rPr = '<w:rPr>';
    
    if (style.bold) {
      rPr += '<w:b/>';
    }
    
    if (style.italic) {
      rPr += '<w:i/>';
    }
    
    if (style.underline) {
      rPr += '<w:u w:val="single"/>';
    }
    
    if (style.color) {
      rPr += `<w:color w:val="${style.color}"/>`;
    }
    
    if (style.fontSize) {
      rPr += `<w:sz w:val="${style.fontSize * 2}"/>`;
    }
    
    rPr += '</w:rPr>';
    
    return rPr;
  }

  /**
   * Escape XML special characters
   * @private
   */
  _escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = TableModule;

