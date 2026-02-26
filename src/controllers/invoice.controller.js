import mongoose from 'mongoose';
import Invoice from '../models/invoice.model.js';
import Product from '../models/Product.model.js';
import generateInvoiceNumber from '../utils/generateInvoiceNumber.js';
import { validateInvoiceData } from '../utils/validators.js';

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private

export const createInvoice = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, discount = 0, paymentMethod } = req.body;

    // Validate input
    const validation = validateInvoiceData({ items, discount, paymentMethod });
    if (!validation.isValid) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
      });
    }

    // Validate all products exist and check stock
    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(
      session,
    );

    if (products.length !== items.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'One or more products not found',
      });
    }

    // Create a map for quick product lookup
    const productMap = {};
    products.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    // Validate stock availability and calculate totals
    const invoiceItems = [];
    let totalAmount = 0;
    let totalTax = 0;

    for (const item of items) {
      const product = productMap[item.productId];

      if (item.quantity > product.stock) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}`,
        });
      }

      // Calculate item totals
      const subtotal = product.price * item.quantity;
      const taxAmount = subtotal * (product.taxPercent / 100);

      invoiceItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        tax: product.taxPercent,
        subtotal: subtotal + taxAmount,
      });

      totalAmount += subtotal;
      totalTax += taxAmount;

      // Reduce stock
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // Calculate grand total
    const grandTotal = totalAmount + totalTax - discount;

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create(
      [
        {
          invoiceNumber,
          items: invoiceItems,
          totalAmount,
          taxAmount: totalTax,
          discount,
          grandTotal,
          paymentMethod,
          createdBy: req.user.id,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    // Populate createdBy and fetch the created invoice
    const createdInvoice = await Invoice.findById(invoice[0]._id).populate(
      'createdBy',
      'name email',
    );

    res.status(201).json({
      success: true,
      data: createdInvoice,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    let query = {};

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const invoices = await Invoice.find(query)
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      'createdBy',
      'name email',
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice by invoice number
// @route   GET /api/invoices/number/:invoiceNumber
// @access  Private
export const getInvoiceByNumber = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      invoiceNumber: req.params.invoiceNumber,
    }).populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};
