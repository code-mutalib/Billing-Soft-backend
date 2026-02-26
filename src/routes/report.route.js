import express from 'express';
import {
  getTodaySales,
  getMonthSales,
  getTopProducts,
} from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/today-sales', protect, getTodaySales);
router.get('/month-sales', protect, getMonthSales);
router.get('/top-products', protect, getTopProducts);

export default router;
