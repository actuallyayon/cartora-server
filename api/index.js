const app = require('../dist/app').default;
const { connectDB } = require('../dist/config/db');

let isConnected = false;

module.exports = async (req, res) => {
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
