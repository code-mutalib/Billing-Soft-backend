import Invoice from '../models/invoice.model.js';
import Product from '../models/Product.model.js';

// @desc    Get today's sales
// @route   GET /api/reports/today-sales
// @access  Private
export const getTodaySales = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await Invoice.aggregate([
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalTax: { $sum: '$taxAmount' },
          totalDiscount: { $sum: '$discount' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          totalTax: 1,
          totalDiscount: 1,
          invoiceCount: 1,
        },
      },
    ]);

    // Get sales by payment method
    const paymentMethodBreakdown = await Invoice.aggregate([
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: result[0] || {
        totalSales: 0,
        totalTax: 0,
        totalDiscount: 0,
        invoiceCount: 0,
      },
      paymentMethodBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly sales
// @route   GET /api/reports/month-sales
// @access  Private
export const getMonthSales = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const now = new Date();
    const selectedMonth = month ? parseInt(month) - 1 : now.getMonth();
    const selectedYear = year ? parseInt(year) : now.getFullYear();

    const startOfMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

    const result = await Invoice.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalTax: { $sum: '$taxAmount' },
          totalDiscount: { $sum: '$discount' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          totalTax: 1,
          totalDiscount: 1,
          invoiceCount: 1,
        },
      },
    ]);

    // Get daily breakdown
    const dailySales = await Invoice.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' },
          totalSales: { $sum: '$grandTotal' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          day: '$_id',
          totalSales: 1,
          invoiceCount: 1,
          _id: 0,
        },
      },
    ]);

    // Get sales by payment method
    const paymentMethodBreakdown = await Invoice.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: result[0] || {
        totalSales: 0,
        totalTax: 0,
        totalDiscount: 0,
        invoiceCount: 0,
      },
      dailySales,
      paymentMethodBreakdown,
      month: selectedMonth + 1,
      year: selectedYear,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top products
// @route   GET /api/reports/top-products
// @access  Private
export const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate, month, year } = req.query;
    const limitNum = parseInt(limit);

    let matchStage = {};

    // Date range filter
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (month || year) {
      const now = new Date();
      const selectedMonth = month ? parseInt(month) - 1 : now.getMonth();
      const selectedYear = year ? parseInt(year) : now.getFullYear();

      matchStage.createdAt = {
        $gte: new Date(selectedYear, selectedMonth, 1),
        $lte: new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59),
      };
    } else {
      // Default: current month
      const now = new Date();
      matchStage.createdAt = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    }

    const topProducts = await Invoice.aggregate([
      {
        $match: matchStage,
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
      {
        $limit: limitNum,
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: 1,
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: topProducts,
      count: topProducts.length,
    });
  } catch (error) {
    next(error);
  }
};
