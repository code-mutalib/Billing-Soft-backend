import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  getInvoiceByNumber,
} from '../controllers/invoice.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(protect, createInvoice).get(protect, getInvoices);

router.get('/number/:invoiceNumber', protect, getInvoiceByNumber);

router.route('/:id').get(protect, getInvoice);

export default router;
