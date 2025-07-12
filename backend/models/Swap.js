import mongoose from 'mongoose';

const swapSchema = new mongoose.Schema({
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  offered_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: false // Optional for point-based swaps
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed']
  },
  points_offered: {
    type: Number,
    default: 0,
    min: 0
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for better query performance
swapSchema.index({ requester_id: 1, status: 1 });
swapSchema.index({ item_id: 1, status: 1 });
swapSchema.index({ offered_item_id: 1, status: 1 });

// Virtual populate for requester details
swapSchema.virtual('requester', {
  ref: 'User',
  localField: 'requester_id',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for item details
swapSchema.virtual('item', {
  ref: 'Item',
  localField: 'item_id',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for offered item details
swapSchema.virtual('offered_item', {
  ref: 'Item',
  localField: 'offered_item_id',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
swapSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Swap', swapSchema); 