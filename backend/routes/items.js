import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Like from '../models/Like.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
});

// Get all items with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, type, size, condition, search, sort = 'newest' } = req.query;
    
    // Build filter object
    const filter = { status: 'available' };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (size && size !== 'all') {
      filter.size = size;
    }
    
    if (condition && condition !== 'all') {
      filter.condition = condition;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'points_high':
        sortObj = { points: -1 };
        break;
      case 'points_low':
        sortObj = { points: 1 };
        break;
      case 'popular':
        sortObj = { likes: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }
    
    const items = await Item.find(filter)
      .populate('user_id', 'username avatar_url full_name')
      .sort(sortObj);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Featured items endpoint
router.get('/featured', async (req, res) => {
  try {
    // Get up to 8 most recent available items
    const items = await Item.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user_id', 'username avatar_url full_name');
    res.json(items);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).json({ error: 'Failed to fetch featured items' });
  }
});

// Create new item with multipart/form-data support
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, category, type, size, condition, points, tags } = req.body;
    
    // Validation
    if (!title || !category || !type || !size || !condition || !points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }
    
    // Validate title length
    if (title.length < 3 || title.length > 100) {
      return res.status(400).json({ error: 'Title must be between 3 and 100 characters' });
    }
    
    // Validate description length
    if (description && description.length > 1000) {
      return res.status(400).json({ error: 'Description must be less than 1000 characters' });
    }
    
    // Validate points
    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum < 0 || pointsNum > 10000) {
      return res.status(400).json({ error: 'Points must be between 0 and 10,000' });
    }
    
    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
        if (!Array.isArray(parsedTags)) {
          parsedTags = [];
        }
        // Limit tags to 10
        parsedTags = parsedTags.slice(0, 10);
      } catch (error) {
        parsedTags = [];
      }
    }
    
    // Process uploaded images
    const imageUrls = req.files.map(file => {
      // In a production environment, you would upload to cloud storage here
      // For now, we'll use local file paths
      return `/uploads/${file.filename}`;
    });
    
    // Create item with pending status
    const item = new Item({
      user_id: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      images: imageUrls,
      image_url: imageUrls[0], // Keep for backward compatibility
      category,
      type,
      size,
      condition,
      points: pointsNum,
      tags: parsedTags,
      status: 'pending' // FR5.4 - Items start with Pending Approval status
    });
    
    await item.save();
    
    // Add activity record
    const activity = new Activity({
      user_id: userId,
      type: 'item_listed',
      description: `Listed ${title}`,
      points: 10,
      related_item_id: item._id
    });
    await activity.save();
    
    // Update user points
    await User.findByIdAndUpdate(userId, { $inc: { points: 10 } });
    
    res.status(201).json({ 
      id: item._id,
      message: 'Item created successfully and is pending approval'
    });
  } catch (error) {
    console.error('Error creating item:', error);
    
    // Clean up uploaded files if item creation fails
    if (req.files) {
      req.files.forEach(file => {
        // In production, you would delete from cloud storage
        // For now, we'll leave the files as they might be cleaned up by a separate process
      });
    }
    
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Like/unlike item
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Check if already liked
    const existingLike = await Like.findOne({ user_id: userId, item_id: id });
    
    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      await Item.findByIdAndUpdate(id, { $inc: { likes: -1 } });
      res.json({ liked: false, message: 'Item unliked' });
    } else {
      // Like
      const like = new Like({ user_id: userId, item_id: id });
      await like.save();
      await Item.findByIdAndUpdate(id, { $inc: { likes: 1 } });
      res.json({ liked: true, message: 'Item liked' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Unlike item (separate endpoint for clarity)
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const existingLike = await Like.findOne({ user_id: userId, item_id: id });
    
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      await Item.findByIdAndUpdate(id, { $inc: { likes: -1 } });
      res.json({ message: 'Item unliked' });
    } else {
      res.json({ message: 'Item was not liked' });
    }
  } catch (error) {
    console.error('Error unliking item:', error);
    res.status(500).json({ error: 'Failed to unlike item' });
  }
});

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Increment view count
    await Item.findByIdAndUpdate(id, { $inc: { views: 1 } });
    
    const item = await Item.findById(id)
      .populate('user_id', 'username avatar_url points full_name');
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Update item (owner only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;
    
    // Check if user owns the item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'You can only edit your own items' });
    }
    
    const updatedItem = await Item.findByIdAndUpdate(id, updateData, { new: true });
    
    res.json({ message: 'Item updated successfully', item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item (owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Check if user owns the item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own items' });
    }
    
    await Item.findByIdAndDelete(id);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Admin: Approve item
router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const item = await Item.findByIdAndUpdate(id, { status: 'available' }, { new: true });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item approved successfully', item });
  } catch (error) {
    console.error('Error approving item:', error);
    res.status(500).json({ error: 'Failed to approve item' });
  }
});

// Admin: Reject item
router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const item = await Item.findByIdAndUpdate(id, { status: 'removed' }, { new: true });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item rejected successfully', item });
  } catch (error) {
    console.error('Error rejecting item:', error);
    res.status(500).json({ error: 'Failed to reject item' });
  }
});

export default router; 