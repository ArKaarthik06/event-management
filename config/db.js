const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS — campus/ISP DNS servers often fail to resolve
// MongoDB Atlas SRV records (_mongodb._tcp.*). This ensures connectivity
// regardless of the local network's DNS configuration.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50,                    // Max concurrent connections to MongoDB
      minPoolSize: 10,                    // Keep 10 connections warm
      serverSelectionTimeoutMS: 5000,     // Fail fast if DB is unreachable
      socketTimeoutMS: 45000,             // Kill slow queries after 45s
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
