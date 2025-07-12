import express from 'express';
import User from '../models/User.js';
import { generateToken, generatePasswordResetToken, authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Rate limiting for login attempts
const loginAttempts = new Map();

const isRateLimited = (email) => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  
  const now = Date.now();
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000); // 15 minutes
  
  if (recentAttempts.length >= 5) {
    return true;
  }
  
  loginAttempts.set(email, recentAttempts);
  return false;
};

const recordLoginAttempt = (email) => {
  const attempts = loginAttempts.get(email) || [];
  attempts.push(Date.now());
  loginAttempts.set(email, attempts);
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, username, full_name } = req.body;

    // Validate required fields
    if (!email || !password || !confirmPassword || !username || !full_name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All fields are required'
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Password mismatch',
        message: 'Passwords do not match'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'This email address is already registered. Did you want to log in?'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'This username is already taken. Please choose another one.'
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      username,
      full_name,
      password // This will be hashed by the pre-save middleware
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        points: user.points,
        level: user.level
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Check rate limiting
    if (isRateLimited(email.toLowerCase())) {
      return res.status(429).json({
        error: 'Too many attempts',
        message: 'Too many login attempts. Please try again in 15 minutes.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      recordLoginAttempt(email.toLowerCase());
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        error: 'Account locked',
        message: 'Your account has been temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      user.handleFailedLogin();
      await user.save();
      recordLoginAttempt(email.toLowerCase());
      
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Reset failed login attempts on successful login
    user.resetFailedLoginAttempts();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        points: user.points,
        level: user.level
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login. Please try again.'
    });
  }
});

// Logout user (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Logout successful'
  });
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.password_reset_token = resetToken;
    user.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // In a real application, you would send an email here
    // For now, we'll just return the token (in production, this should be sent via email)
    res.json({
      message: 'Password reset link sent to your email',
      resetToken: resetToken // Remove this in production
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'An error occurred. Please try again.'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Token, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Password mismatch',
        message: 'Passwords do not match'
      });
    }

    const user = await User.findOne({
      password_reset_token: token,
      password_reset_expires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Set new password
    user.password = newPassword;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    user.resetFailedLoginAttempts();
    await user.save();

    res.json({
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'An error occurred. Please try again.'
    });
  }
});

// Change password (authenticated user)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Current password, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Password mismatch',
        message: 'New passwords do not match'
      });
    }

    const user = await User.findById(req.user._id);
    const isValidPassword = await user.comparePassword(currentPassword);

    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'An error occurred. Please try again.'
    });
  }
});

export default router; 