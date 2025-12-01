// utils/slugUtils.js
export const slugUtils = {
  convertNameToUrl: (productName) => {
    return productName
      .toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with hyphens
      .replace(/^-+/, '')          // Remove leading hyphens
  },

  extractProductId: (productSlug) => {
    // OLD: const matches = productSlug.match(/-(\d+)$/); // This only matches numbers
    
    // NEW: Match UUID pattern (letters and numbers with hyphens)
    const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
    const matches = productSlug.match(uuidPattern);
    
    return matches ? matches[1] : productSlug;
  }
};