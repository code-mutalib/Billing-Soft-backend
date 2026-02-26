import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from cors
import errorHandler from './middleware/errorHandler.js';

// Route files
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import invoiceRoutes from './routes/invoice.route.js';
import reportRoutes from './routes/report.route.js';

// Load env vars
dotenv.config();

const app = express();
app.use(cors())

// Body parser
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Billing API is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handler middleware
app.use(errorHandler);

// Handle unhandled routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

// Start server only after DB connection
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Call the function
startServer();
