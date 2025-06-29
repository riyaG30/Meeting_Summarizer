// Import core dependencies
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Import custom middleware and route handlers
import { authenticateJWT } from './middleware/auth.js';
import teamRoutes from './routes/teams.js';
import summaryRoutes from './routes/summaries.js';

// Load environment variables from .env file
dotenv.config();

const app = express();

/**
 * Enable CORS to allow requests from frontend (e.g., React at localhost:3000)
 * - `credentials: true` allows cookies and Authorization headers to be sent
 */
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Middleware to parse incoming JSON requests
app.use(express.json());

/**
 * Route Handlers
 * - /api/teams: Handles team registration and login
 * - /api/summaries: Handles summary CRUD operations, protected by JWT
 */
app.use('/api/teams', teamRoutes);
app.use('/api/summaries', authenticateJWT, summaryRoutes);

/**
 * Health check endpoint
 * - Useful for monitoring or container health probes
 */
app.get('/health', (_, res) => res.send('OK'));

/**
 * Global Error Handler
 * - Logs the error and sends a generic 500 response
 */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).send(err.message || 'Server error');
});

/**
 * Connect to MongoDB and start the server
 * - Uses MONGODB_URI and PORT from environment variables
 */
mongoose.connect(process.env.MONGODB_URI)
  .then(() =>
    app.listen(process.env.PORT || 4000, () =>
      console.log('API running on port', process.env.PORT || 4000)
    )
  )
  .catch(err => console.error('MongoDB connection error:', err));
