import Invoice from '../models/invoice.model.js';

const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const datePrefix = `${year}${month}${day}`;

  // Find the last invoice created today
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: new RegExp(`^INV-${datePrefix}`),
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;

  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  const invoiceNumber = `INV-${datePrefix}-${String(sequence).padStart(4, '0')}`;

  return invoiceNumber;
};

export default generateInvoiceNumber;
