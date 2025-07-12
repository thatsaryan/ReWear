import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  images: [{
    type: String,
    required: true
  }],
  image_url: {
    type: String,
    default: '/placeholder.svg?height=300&width=300'
  },
  category: {
    type: String,
    required: true,
    enum: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Bags', 'Jewelry', 'Activewear', 'Formal']
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Shirt', 'T-Shirt', 'Blouse', 'Sweater', 'Hoodie', 'Jacket', 'Coat',
      'Jeans', 'Pants', 'Shorts', 'Skirt', 'Dress', 'Jumpsuit',
      'Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats',
      'Hat', 'Scarf', 'Gloves', 'Sunglasses', 'Watch', 'Necklace', 'Earrings',
      'Backpack', 'Handbag', 'Wallet', 'Tote', 'Crossbody'
    ]
  },
  size: {
    type: String,
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Used']
  },
  points: {
    type: Number,
    required: true,
    min: 0,
    max: 10000
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'available', 'swapped', 'removed']
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  rejection_reason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
itemSchema.index({ user_id: 1, status: 1 });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ status: 1, createdAt: -1 });

// Virtual populate for owner details
itemSchema.virtual('owner', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
itemSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Item', itemSchema); 