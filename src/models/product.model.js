import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  taxPercent: {
    type: Number,
    default: 0,
    min: [0, 'Tax percent cannot be negative'],
    max: [100, 'Tax percent cannot exceed 100'],
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: function (v) {
        return v >= 0;
      },
      message: 'Stock cannot be negative',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for search
productSchema.index({ name: 'text' });

export default mongoose.model('Product', productSchema);
