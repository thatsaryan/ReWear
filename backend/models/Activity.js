import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['item_listed', 'swap_request', 'swap_completed', 'swap_declined', 'item_liked', 'points_earned']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  points: {
    type: Number,
    default: 0
  },
  related_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }
}, {
  timestamps: true
});

// Index for better query performance
activitySchema.index({ user_id: 1, created_at: -1 });
activitySchema.index({ type: 1, created_at: -1 });

// Virtual populate for related item
activitySchema.virtual('related_item', {
  ref: 'Item',
  localField: 'related_item_id',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
activitySchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Activity', activitySchema); 