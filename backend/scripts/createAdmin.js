import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thread-swap-circle');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@rewear.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: admin@rewear.com');
      console.log('Password: Admin123!');
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@rewear.com',
      full_name: 'System Administrator',
      role: 'admin',
      points: 1000,
      level: 'Swap Master',
      is_verified: true
    });

    // Set password - this will trigger the pre-save middleware to hash it
    adminUser.password = 'Admin123!';

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@rewear.com');
    console.log('Password: Admin123!');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser(); 