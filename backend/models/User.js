import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password_hash: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar_url: {
    type: String,
    default: '/placeholder.svg?height=100&width=100'
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    default: 'Newcomer',
    enum: ['Newcomer', 'Fashion Enthusiast', 'Eco Champion', 'Swap Master']
  },
  join_date: {
    type: Date,
    default: Date.now
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  failed_login_attempts: {
    type: Number,
    default: 0
  },
  lockout_until: {
    type: Date
  },
  password_reset_token: {
    type: String
  },
  password_reset_expires: {
    type: Date
  },
  is_banned: {
    type: Boolean,
    default: false
  },
  ban_reason: {
    type: String
  },
  banned_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for password (not stored in DB)
userSchema.virtual('password')
  .set(function(password) {
    this._password = password;
  })
  .get(function() {
    return this._password;
  });

// Password validation function
userSchema.methods.validatePassword = function(password) {
  // Minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Pre-save middleware to hash password and enforce presence
userSchema.pre('save', async function(next) {
  if (this.isNew && !this._password && !this.password) {
    this.invalidate('password', 'Password is required');
    return next(new Error('Password is required'));
  }
  
  // Handle both virtual password and direct password setting
  const passwordToHash = this._password || this.password;
  
  if (passwordToHash) {
    // Validate password complexity
    if (!this.validatePassword(passwordToHash)) {
      this.invalidate('password', 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
      return next(new Error('Password complexity requirements not met'));
    }
    
    try {
      this.password_hash = await bcrypt.hash(passwordToHash, 12);
      this._password = undefined;
      this.password = undefined; // Clear the direct password field
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to update level based on points
userSchema.methods.updateLevel = function() {
  if (this.points >= 1000) {
    this.level = 'Swap Master';
  } else if (this.points >= 500) {
    this.level = 'Eco Champion';
  } else if (this.points >= 100) {
    this.level = 'Fashion Enthusiast';
  } else {
    this.level = 'Newcomer';
  }
};

// Method to handle failed login attempts
userSchema.methods.handleFailedLogin = function() {
  this.failed_login_attempts += 1;
  if (this.failed_login_attempts >= 5) {
    // Lock account for 15 minutes
    this.lockout_until = new Date(Date.now() + 15 * 60 * 1000);
  }
};

// Method to reset failed login attempts
userSchema.methods.resetFailedLoginAttempts = function() {
  this.failed_login_attempts = 0;
  this.lockout_until = undefined;
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockout_until && this.lockout_until > new Date();
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password_hash;
    delete ret.password_reset_token;
    delete ret.password_reset_expires;
    delete ret.failed_login_attempts;
    delete ret.lockout_until;
    return ret;
  }
});

export default mongoose.model('User', userSchema); 