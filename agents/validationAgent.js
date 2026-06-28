export const runValidationAgent = (parsedData) => {
  let score = 100;
  let missing = parsedData.missing_fields || [];
  
  if (!parsedData.product_name) {
    score -= 30;
    if (!missing.includes('product_name')) missing.push('product_name');
  }
  
  if (!parsedData.price || parsedData.price <= 0) {
    score -= 30;
    if (!missing.includes('price')) missing.push('price');
  }
  
  if (!parsedData.stock || parsedData.stock <= 0) {
    score -= 20;
    if (!missing.includes('stock')) missing.push('stock');
  }
  
  if (missing.includes('image')) {
    score -= 30;
  }
  
  return {
    score: Math.max(0, score),
    missing_fields: missing,
    status: score >= 80 ? 'PENDING' : 'REJECTED' // PENDING means pending admin approval
  };
};
