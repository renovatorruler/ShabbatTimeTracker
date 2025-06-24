import express from 'express';
import { registerRoutes } from '../server/routes.js';

const app = express();

// Configure express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set Vercel environment flag
process.env.VERCEL = 'true';

// Register API routes
await registerRoutes(app);

// For Vercel, we need to export the app as a handler
export default app;