const { DocxTemplaterPro, modules } = require('../index');
const assert = require('assert');

async function runTests() {
  console.log('Running DocxTemplaterPro Tests');
  console.log('==============================');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Basic instantiation
  try {
    const templater = new DocxTemplaterPro();
    assert(templater instanceof DocxTemplaterPro, 'Should create DocxTemplaterPro instance');
    console.log('✓ Test 1: Basic instantiation passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 1: Basic instantiation failed:', error.message);
    testsFailed++;
  }
  
  // Test 2: Module attachment
  try {
    const templater = new DocxTemplaterPro();
    const htmlModule = new modules.HtmlModule();
    templater.attachModule(htmlModule);
    
    const stats = templater.moduleManager.getStats();
    assert(stats.totalModules === 1, 'Should have 1 module attached');
    assert(stats.moduleNames.includes('html'), 'Should include html module');
    console.log('✓ Test 2: Module attachment passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 2: Module attachment failed:', error.message);
    testsFailed++;
  }
  
  // Test 3: Context setting
  try {
    const templater = new DocxTemplaterPro();
    const context = { name: 'Test', value: 123 };
    templater.setContext(context);
    
    assert(templater.context.name === 'Test', 'Should set context name');
    assert(templater.context.value === 123, 'Should set context value');
    console.log('✓ Test 3: Context setting passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 3: Context setting failed:', error.message);
    testsFailed++;
  }
  
  // Test 4: Template parser
  try {
    const templater = new DocxTemplaterPro();
    const parser = templater.templateParser;
    const content = 'Hello {{name}}, your score is {{score}}.';
    const parsed = parser.parse(content);
    
    assert(parsed.tokens.length > 0, 'Should parse tokens');
    console.log('✓ Test 4: Template parser passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 4: Template parser failed:', error.message);
    testsFailed++;
  }
  
  // Test 5: Context processor
  try {
    const templater = new DocxTemplaterPro();
    const processor = templater.contextProcessor;
    const parsed = {
      tokens: [
        { type: 'text', content: 'Hello ' },
        { type: 'placeholder', variable: 'name', fullMatch: '{{name}}' },
        { type: 'text', content: '!' }
      ]
    };
    const context = { name: 'World' };
    const result = processor.process(parsed, context);
    
    assert(result === 'Hello World!', 'Should process placeholders correctly');
    console.log('✓ Test 5: Context processor passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 5: Context processor failed:', error.message);
    testsFailed++;
  }
  
  // Test 6: HTML Module
  try {
    const htmlModule = new modules.HtmlModule();
    const content = 'Test {%html content%} content';
    const context = { context: { content: '<b>bold text</b>' } };
    const result = await htmlModule.process(content, context);
    
    assert(result.includes('bold text'), 'Should process HTML content');
    console.log('✓ Test 6: HTML Module passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 6: HTML Module failed:', error.message);
    testsFailed++;
  }
  
  // Test 7: QR Code Module
  try {
    const qrModule = new modules.QrCodeModule();
    assert(qrModule.name === 'qrcode', 'Should have correct module name');
    assert(qrModule.hasTagsToProcess('{%qrcode data%}'), 'Should detect QR code tags');
    console.log('✓ Test 7: QR Code Module passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 7: QR Code Module failed:', error.message);
    testsFailed++;
  }
  
  // Test 8: Table Module
  try {
    const tableModule = new modules.TableModule();
    assert(tableModule.name === 'table', 'Should have correct module name');
    assert(tableModule.hasTagsToProcess('{%table data%}'), 'Should detect table tags');
    console.log('✓ Test 8: Table Module passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 8: Table Module failed:', error.message);
    testsFailed++;
  }
  
  // Test 9: Error Location Module
  try {
    const errorModule = new modules.ErrorLocationModule();
    assert(errorModule.name === 'errorLocation', 'Should have correct module name');
    assert(errorModule.priority === 10, 'Should have high priority');
    console.log('✓ Test 9: Error Location Module passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 9: Error Location Module failed:', error.message);
    testsFailed++;
  }
  
  // Test 10: Module validation
  try {
    const templater = new DocxTemplaterPro();
    const moduleManager = templater.moduleManager;
    const invalidModule = { name: 'test' }; // Missing process method
    const errors = moduleManager.validateModule(invalidModule);
    
    assert(errors.length > 0, 'Should detect invalid module');
    console.log('✓ Test 10: Module validation passed');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test 10: Module validation failed:', error.message);
    testsFailed++;
  }
  
  // Summary
  console.log('\nTest Summary:');
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = runTests;

