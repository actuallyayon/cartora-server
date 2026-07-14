import app from '../dist/app.js';
import { connectDB } from '../dist/config/db.js';

let isConnected = false;

export default async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (e) {
      console.error('Failed to connect to DB', e);
    }
  }
  return app(req, res);
};
