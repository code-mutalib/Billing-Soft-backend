import Product from '../models/Product.model.js';
import { validateProductData } from '../utils/validators.js';

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private (Admin only)
 */

export const createProduct = async (req, res, next) => {
  try {
    const { name, barcode, price, taxPercent, stock } = req.body;

    // Validate input
    const validation = validateProductData({ name, price, taxPercent, stock });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
      });
    }

    // Check if product with barcode already exists
    if (barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this barcode already exists',
        });
      }
    }

    const product = await Product.create({
      name,
      barcode,
      price,
      taxPercent: taxPercent || 0,
      stock,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    // Build query
    let query = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by stock
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
export const updateProduct = async (req, res, next) => {
  try {
    const { name, barcode, price, taxPercent, stock } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if barcode is being changed and if it already exists
    if (barcode && barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this barcode already exists',
        });
      }
    }

    // Validate input
    const validation = validateProductData({ name, price, taxPercent, stock });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, barcode, price, taxPercent, stock },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search products by name
 * @route   GET /api/products/search
 * @access  Public
 */

export const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const products = await Product.find({
      name: { $regex: q, $options: 'i' },
      stock: { $gt: 0 },
    }).limit(20);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};
