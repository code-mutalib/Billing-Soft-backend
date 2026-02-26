const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateProductData = (product) => {
  const errors = [];

  if (!product.name || product.name.trim() === '') {
    errors.push('Product name is required');
  }

  if (product.price === undefined || product.price === null) {
    errors.push('Price is required');
  } else if (product.price < 0) {
    errors.push('Price cannot be negative');
  }

  if (product.stock === undefined || product.stock === null) {
    errors.push('Stock is required');
  } else if (product.stock < 0) {
    errors.push('Stock cannot be negative');
  }

  if (
    product.taxPercent !== undefined &&
    (product.taxPercent < 0 || product.taxPercent > 100)
  ) {
    errors.push('Tax percent must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateInvoiceData = (invoice) => {
  const errors = [];

  if (
    !invoice.items ||
    !Array.isArray(invoice.items) ||
    invoice.items.length === 0
  ) {
    errors.push('At least one item is required');
  }

  if (!invoice.paymentMethod) {
    errors.push('Payment method is required');
  } else if (!['Cash', 'Card', 'UPI'].includes(invoice.paymentMethod)) {
    errors.push('Invalid payment method');
  }

  if (invoice.discount !== undefined && invoice.discount < 0) {
    errors.push('Discount cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export {
  validateEmail,
  validatePassword,
  validateProductData,
  validateInvoiceData,
};
