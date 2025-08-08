/**
 * Utility class for resolving data paths within a given context object.
 * Supports dot notation for nested properties.
 */
class ContextResolver {
  /**
   * Resolves a data path from the context.
   * @param {Object} context - The data context object.
   * @param {string} path - The dot-separated path to the data (e.g., "user.address.street").
   * @param {any} [defaultValue=undefined] - The value to return if the path is not found.
   * @returns {any} - The resolved value or defaultValue if not found.
   */
  static resolve(context, path, defaultValue = undefined) {
    if (!context || typeof path !== "string" || path.length === 0) {
      return defaultValue;
    }

    const parts = path.split(".");
    let current = context;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (current === null || typeof current !== "object" || !current.hasOwnProperty(part)) {
        return defaultValue;
      }
      current = current[part];
    }

    return current;
  }
}

module.exports = ContextResolver;

