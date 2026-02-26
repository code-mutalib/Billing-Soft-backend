import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: {
    type: [invoiceItemSchema],
    required: true,
    validate: [(arr) => arr.length > 0, 'Invoice must have at least one item'],
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Card', 'UPI'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for reporting
invoiceSchema.index({ createdAt: 1 });
invoiceSchema.index({ 'items.productId': 1 });

export default mongoose.model('Invoice', invoiceSchema);
