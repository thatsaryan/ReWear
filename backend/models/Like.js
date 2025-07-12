import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique likes per user per item
likeSchema.index({ user_id: 1, item_id: 1 }, { unique: true });

// Index for better query performance
likeSchema.index({ item_id: 1 });

export default mongoose.model('Like', likeSchema); 