import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import router from './routes/Router.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/', router);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ecommerce API is running!',
    version: '1.0.0'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Self-ping to keep Render free-tier alive
setInterval(() => {
  fetch(`https://sensokart.onrender.com/health`)
    .then(res => console.log('Self-ping success:', res.status))
    .catch(err => console.error('Self-ping failed:', err));
}, 30 * 1000); // every 30 seconds

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
