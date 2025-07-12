import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'Admin privileges required' 
    });
  }
  next();
};

// Middleware to check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== resourceUserId)) {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'You can only access your own resources' 
    });
  }
  next();
};

// Generate JWT token
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Generate password reset token
export const generatePasswordResetToken = () => {
  return jwt.sign(
    { type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' } // Reset token expires in 1 hour
  );
}; 