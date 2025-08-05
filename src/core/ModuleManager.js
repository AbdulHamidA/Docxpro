/**
 * Module manager for registering and processing template modules
 */
class ModuleManager {
  constructor() {
    this.modules = new Map();
    this.processingOrder = [];
  }

  /**
   * Register a module
   * @param {Object} module - Module to register
   */
  register(module) {
    if (!module.name) {
      throw new Error('Module must have a name property');
    }
    
    if (!module.process) {
      throw new Error('Module must have a process method');
    }
    
    this.modules.set(module.name, module);
    
    // Add to processing order if not already present
    if (!this.processingOrder.includes(module.name)) {
      const priority = module.priority || 100;
      
      // Insert in order of priority (lower numbers = higher priority)
      let insertIndex = this.processingOrder.length;
      for (let i = 0; i < this.processingOrder.length; i++) {
        const existingModule = this.modules.get(this.processingOrder[i]);
        if ((existingModule.priority || 100) > priority) {
          insertIndex = i;
          break;
        }
      }
      
      this.processingOrder.splice(insertIndex, 0, module.name);
    }
  }

  /**
   * Unregister a module
   * @param {string} moduleName - Name of module to unregister
   */
  unregister(moduleName) {
    this.modules.delete(moduleName);
    const index = this.processingOrder.indexOf(moduleName);
    if (index > -1) {
      this.processingOrder.splice(index, 1);
    }
  }

  /**
   * Get a registered module
   * @param {string} moduleName - Name of module to get
   * @returns {Object|null} - Module or null if not found
   */
  getModule(moduleName) {
    return this.modules.get(moduleName) || null;
  }

  /**
   * Get all registered modules
   * @returns {Array} - Array of module objects
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }

  /**
   * Process content with all registered modules
   * @param {string} content - Content to process
   * @param {Object} context - Processing context
   * @returns {Promise<string>} - Processed content
   */
  async process(content, context) {
    let processedContent = content;
    
    // Process modules in priority order
    for (const moduleName of this.processingOrder) {
      const module = this.modules.get(moduleName);
      
      if (module && this._shouldProcessModule(module, context)) {
        try {
          processedContent = await module.process(processedContent, context);
        } catch (error) {
          if (context.errorOnMissingData) {
            throw new Error(`Module ${moduleName} failed: ${error.message}`);
          }
          
          // Log error but continue processing
          console.warn(`Module ${moduleName} failed: ${error.message}`);
        }
      }
    }
    
    return processedContent;
  }

  /**
   * Process content with a specific module
   * @param {string} moduleName - Name of module to use
   * @param {string} content - Content to process
   * @param {Object} context - Processing context
   * @returns {Promise<string>} - Processed content
   */
  async processWithModule(moduleName, content, context) {
    const module = this.modules.get(moduleName);
    
    if (!module) {
      throw new Error(`Module ${moduleName} not found`);
    }
    
    return await module.process(content, context);
  }

  /**
   * Check if a module should process the current content
   * @private
   */
  _shouldProcessModule(module, context) {
    // Check if module supports the document type
    if (module.supportedTypes && !module.supportedTypes.includes(context.documentType)) {
      return false;
    }
    
    // Check if module has any tags to process in the content
    if (module.hasTagsToProcess) {
      return module.hasTagsToProcess(context.content || '');
    }
    
    return true;
  }

  /**
   * Get processing statistics
   * @returns {Object} - Statistics about registered modules
   */
  getStats() {
    return {
      totalModules: this.modules.size,
      moduleNames: Array.from(this.modules.keys()),
      processingOrder: [...this.processingOrder]
    };
  }

  /**
   * Clear all registered modules
   */
  clear() {
    this.modules.clear();
    this.processingOrder = [];
  }

  /**
   * Validate module configuration
   * @param {Object} module - Module to validate
   * @returns {Array} - Array of validation errors
   */
  validateModule(module) {
    const errors = [];
    
    if (!module.name || typeof module.name !== 'string') {
      errors.push('Module must have a valid name property');
    }
    
    if (!module.process || typeof module.process !== 'function') {
      errors.push('Module must have a process method');
    }
    
    if (module.priority !== undefined && typeof module.priority !== 'number') {
      errors.push('Module priority must be a number');
    }
    
    if (module.supportedTypes && !Array.isArray(module.supportedTypes)) {
      errors.push('Module supportedTypes must be an array');
    }
    
    return errors;
  }
}

module.exports = ModuleManager;

