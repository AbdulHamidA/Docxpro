const { DocxTemplaterPro, modules } = require('../index');
const fs = require('fs');
const path = require('path');

async function advancedExample() {
  try {
    console.log('DocxTemplaterPro Advanced Example');
    console.log('=================================');
    
    // Create templater with custom options
    const templater = new DocxTemplaterPro({
      errorOnMissingData: false,
      nullGetter: () => '[NOT PROVIDED]'
    });
    
    // Attach all available modules
    templater.attachModule(new modules.HtmlModule());
    templater.attachModule(new modules.ImageModule());
    templater.attachModule(new modules.TableModule());
    templater.attachModule(new modules.QrCodeModule());
    templater.attachModule(new modules.ErrorLocationModule());
    
    console.log('All modules attached');
    
    // Create a complex template
    const templateContent = createAdvancedTemplate();
    const templatePath = path.join(__dirname, 'advanced-template.docx');
    fs.writeFileSync(templatePath, templateContent);
    
    // Load template
    await templater.loadTemplate(templatePath);
    console.log('Advanced template loaded');
    
    // Set complex context data
    const context = {
      // Document metadata
      document: {
        title: 'Annual Sales Report 2024',
        author: 'Sales Department',
        date: new Date().toLocaleDateString(),
        version: '1.2',
        confidential: true
      },
      
      // Company information
      company: {
        name: 'TechCorp Solutions',
        logo: {
          src: 'https://via.placeholder.com/200x80/0066CC/FFFFFF?text=TechCorp',
          width: 200,
          height: 80,
          alt: 'TechCorp Logo'
        },
        address: {
          street: '123 Business Ave',
          city: 'Tech City',
          state: 'TC',
          zip: '12345'
        },
        website: 'https://techcorp.example.com'
      },
      
      // Executive summary with HTML formatting
      executiveSummary: `
        <p>This report presents a comprehensive analysis of our <strong>2024 sales performance</strong>.</p>
        <p>Key highlights include:</p>
        <ul>
          <li><em>25% increase</em> in total revenue</li>
          <li><strong>15% growth</strong> in customer base</li>
          <li>Successful launch of <u>3 new products</u></li>
        </ul>
        <p>Our strategic initiatives have positioned us for continued growth in 2025.</p>
      `,
      
      // Sales data for tables
      quarterlyResults: {
        headers: ['Quarter', 'Revenue', 'Growth %', 'Customers'],
        rows: [
          ['Q1 2024', '$2,450,000', '12%', '1,250'],
          ['Q2 2024', '$2,780,000', '18%', '1,420'],
          ['Q3 2024', '$3,100,000', '22%', '1,650'],
          ['Q4 2024', '$3,350,000', '25%', '1,890']
        ],
        style: {
          borders: true,
          header: {
            bold: true,
            backgroundColor: '0066CC',
            color: 'FFFFFF'
          },
          row: {
            alignment: 'center'
          }
        }
      },
      
      // Product performance
      products: [
        {
          name: 'CloudSync Pro',
          revenue: '$1,200,000',
          growth: '+35%',
          status: 'Excellent',
          description: 'Enterprise cloud synchronization solution'
        },
        {
          name: 'DataViz Analytics',
          revenue: '$950,000',
          growth: '+28%',
          status: 'Good',
          description: 'Advanced data visualization platform'
        },
        {
          name: 'SecureVault',
          revenue: '$800,000',
          growth: '+15%',
          status: 'Stable',
          description: 'Encrypted data storage solution'
        }
      ],
      
      // Regional performance table
      regionalData: {
        headers: ['Region', 'Sales', 'Target', 'Achievement', 'Top Rep'],
        rows: [
          ['North America', '$4,200,000', '$4,000,000', '105%', 'John Smith'],
          ['Europe', '$3,800,000', '$3,500,000', '109%', 'Marie Dubois'],
          ['Asia Pacific', '$2,680,000', '$2,800,000', '96%', 'Yuki Tanaka'],
          ['Latin America', '$1,520,000', '$1,400,000', '109%', 'Carlos Rodriguez']
        ],
        style: {
          borders: true,
          header: {
            bold: true,
            backgroundColor: 'D9D9D9'
          }
        }
      },
      
      // QR codes for different purposes
      qrCodes: {
        website: {
          text: 'https://techcorp.example.com',
          size: 120,
          errorCorrectionLevel: 'M'
        },
        report: {
          text: 'https://techcorp.example.com/reports/2024-annual',
          size: 100,
          errorCorrectionLevel: 'H'
        }
      },
      
      // Conditional content
      showDetailedAnalysis: true,
      showProjections: true,
      includeAppendix: false,
      
      // Financial projections
      projections: [
        { year: 2025, revenue: '$15,000,000', growth: '20%' },
        { year: 2026, revenue: '$18,500,000', growth: '23%' },
        { year: 2027, revenue: '$22,000,000', growth: '19%' }
      ],
      
      // Team information
      team: {
        salesDirector: 'Sarah Johnson',
        analystTeam: ['Mike Chen', 'Lisa Park', 'David Wilson'],
        reportDate: new Date().toLocaleDateString(),
        nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    };
    
    templater.setContext(context);
    console.log('Complex context data set');
    
    // Render the document
    console.log('Rendering document...');
    const outputBuffer = await templater.render();
    console.log('Document rendered successfully');
    
    // Save the output
    const outputPath = path.join(__dirname, 'advanced-output.docx');
    fs.writeFileSync(outputPath, outputBuffer);
    console.log(`Advanced output saved to: ${outputPath}`);
    
    // Display module statistics
    const moduleStats = templater.moduleManager.getStats();
    console.log('\nModule Statistics:');
    console.log(`Total modules: ${moduleStats.totalModules}`);
    console.log(`Processing order: ${moduleStats.processingOrder.join(', ')}`);
    
    // Check for errors
    const errors = templater.getErrors();
    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.message}`);
        if (error.variable) {
          console.log(`   Variable: ${error.variable}`);
        }
        if (error.position) {
          console.log(`   Position: ${error.position}`);
        }
      });
    } else {
      console.log('\nNo errors found');
    }
    
    console.log('\nAdvanced example completed successfully!');
    console.log('The generated document includes:');
    console.log('- Company branding with logo');
    console.log('- Executive summary with HTML formatting');
    console.log('- Multiple data tables with styling');
    console.log('- Product performance loops');
    console.log('- QR codes for website and report access');
    console.log('- Conditional content sections');
    console.log('- Error location comments (if any issues found)');
    
  } catch (error) {
    console.error('Error in advanced example:', error.message);
    console.error(error.stack);
  }
}

function createAdvancedTemplate() {
  // This creates a more complex template demonstrating various features
  const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Header with logo and title -->
    <w:p>
      <w:r>
        <w:t>{%image company.logo%}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="32"/>
          <w:b/>
        </w:rPr>
        <w:t>{{document.title}}</w:t>
      </w:r>
    </w:p>
    
    <!-- Document metadata -->
    <w:p>
      <w:r>
        <w:t>Prepared by: {{document.author}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Date: {{document.date}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Version: {{document.version}}</w:t>
      </w:r>
    </w:p>
    
    <!-- Conditional confidentiality notice -->
    {%if document.confidential%}
    <w:p>
      <w:r>
        <w:rPr>
          <w:color w:val="FF0000"/>
          <w:b/>
        </w:rPr>
        <w:t>CONFIDENTIAL DOCUMENT</w:t>
      </w:r>
    </w:p>
    {%endif%}
    
    <!-- Executive Summary with HTML -->
    <w:p>
      <w:r>
        <w:rPr>
          <w:sz w:val="24"/>
          <w:b/>
        </w:rPr>
        <w:t>Executive Summary</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{%html executiveSummary%}</w:t>
      </w:r>
    </w:p>
    
    <!-- Quarterly Results Table -->
    <w:p>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:b/>
        </w:rPr>
        <w:t>Quarterly Performance</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{%table quarterlyResults%}</w:t>
      </w:r>
    </w:p>
    
    <!-- Product Performance Loop -->
    <w:p>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:b/>
        </w:rPr>
        <w:t>Product Performance</w:t>
      </w:r>
    </w:p>
    
    {%loop product in products%}
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>{{product.name}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Revenue: {{product.revenue}} ({{product.growth}})</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Status: {{product.status}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{{product.description}}</w:t>
      </w:r>
    </w:p>
    {%endloop%}
    
    <!-- Regional Data Table -->
    <w:p>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:b/>
        </w:rPr>
        <w:t>Regional Performance</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{%table regionalData%}</w:t>
      </w:r>
    </w:p>
    
    <!-- Conditional Detailed Analysis -->
    {%if showDetailedAnalysis%}
    <w:p>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:b/>
        </w:rPr>
        <w:t>Detailed Analysis</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This section provides in-depth analysis of our performance metrics...</w:t>
      </w:r>
    </w:p>
    {%endif%}
    
    <!-- QR Codes -->
    <w:p>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:b/>
        </w:rPr>
        <w:t>Quick Access</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>Company Website: {%qrcode qrCodes.website%}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>Full Report: {%qrcode qrCodes.report%}</w:t>
      </w:r>
    </w:p>
    
    <!-- Footer -->
    <w:p>
      <w:r>
        <w:t>Report prepared by {{team.salesDirector}} on {{team.reportDate}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Next review scheduled for {{team.nextReview}}</w:t>
      </w:r>
    </w:p>
    
  </w:body>
</w:document>`;
  
  return Buffer.from(templateXml);
}

// Run the example if this file is executed directly
if (require.main === module) {
  advancedExample();
}

module.exports = advancedExample;

