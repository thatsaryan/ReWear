import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Activity from '../models/Activity.js';
import Swap from '../models/Swap.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user dashboard data (profile info and points balance) - MUST come before /:id route
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user stats
    const stats = await getUserStats(userId);
    
    res.json({
      user,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get user's items (for dashboard) - MUST come before /:id route
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const items = await Item.find({ user_id: userId })
      .sort({ createdAt: -1 });
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ error: 'Failed to fetch user items' });
  }
});

// Get incoming swap requests (for user's items) - MUST come before /:id route
router.get('/swaps/incoming', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's items
    const userItems = await Item.find({ user_id: userId }).select('_id');
    const itemIds = userItems.map(item => item._id);
    
    // Get incoming swap requests for user's items
    const incomingSwaps = await Swap.find({
      item_id: { $in: itemIds },
      status: 'pending'
    })
    .populate('item_id', 'title image_url')
    .populate('requester_id', 'username avatar_url')
    .populate('offered_item_id', 'title image_url')
    .sort({ createdAt: -1 });
    
    res.json(incomingSwaps);
  } catch (error) {
    console.error('Error fetching incoming swaps:', error);
    res.status(500).json({ error: 'Failed to fetch incoming swaps' });
  }
});

// Get outgoing swap requests (user's requests) - MUST come before /:id route
router.get('/swaps/outgoing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const outgoingSwaps = await Swap.find({
      requester_id: userId,
      status: 'pending'
    })
    .populate('item_id', 'title image_url')
    .populate('offered_item_id', 'title image_url')
    .sort({ createdAt: -1 });
    
    res.json(outgoingSwaps);
  } catch (error) {
    console.error('Error fetching outgoing swaps:', error);
    res.status(500).json({ error: 'Failed to fetch outgoing swaps' });
  }
});

// Get completed swaps - MUST come before /:id route
router.get('/swaps/completed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's items
    const userItems = await Item.find({ user_id: userId }).select('_id');
    const itemIds = userItems.map(item => item._id);
    
    // Get completed swaps (either as requester or item owner)
    const completedSwaps = await Swap.find({
      $or: [
        { requester_id: userId },
        { item_id: { $in: itemIds } }
      ],
      status: 'completed'
    })
    .populate('item_id', 'title image_url')
    .populate('requester_id', 'username avatar_url')
    .populate('offered_item_id', 'title image_url')
    .sort({ createdAt: -1 });
    
    res.json(completedSwaps);
  } catch (error) {
    console.error('Error fetching completed swaps:', error);
    res.status(500).json({ error: 'Failed to fetch completed swaps' });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.toJSON());
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user's items
router.get('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    
    const items = await Item.find({ user_id: id })
      .sort({ createdAt: -1 });
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ error: 'Failed to fetch user items' });
  }
});

// Get user's activities
router.get('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    
    const activities = await Activity.find({ user_id: id })
      .populate('related_item_id', 'title')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
});

// Get user's swap requests
router.get('/:id/swaps', async (req, res) => {
  try {
    const { id } = req.params;
    
    const swaps = await Swap.find({ item_id: { $in: await Item.find({ user_id: id }).distinct('_id') } })
      .populate('item_id', 'title image_url')
      .populate('requester_id', 'username')
      .sort({ createdAt: -1 });
    
    res.json(swaps);
  } catch (error) {
    console.error('Error fetching user swaps:', error);
    res.status(500).json({ error: 'Failed to fetch user swaps' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, avatar_url } = req.body;
    
    const user = await User.findByIdAndUpdate(id, { full_name, avatar_url }, { new: true });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user's items count
    const itemsResult = await Item.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          total_items: { $sum: 1 },
          available_items: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          swapped_items: {
            $sum: { $cond: [{ $eq: ['$status', 'swapped'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get user's successful swaps
    const swapsResult = await Swap.aggregate([
      {
        $lookup: {
          from: 'items',
          localField: 'item_id',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      { $match: { 'item.user_id': new mongoose.Types.ObjectId(id), status: 'completed' } },
      { $count: 'successful_swaps' }
    ]);
    
    // Get total points earned from activities
    const pointsResult = await Activity.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, total_points_earned: { $sum: '$points' } } }
    ]);
    
    const stats = {
      itemsListed: itemsResult[0]?.total_items || 0,
      availableItems: itemsResult[0]?.available_items || 0,
      swappedItems: itemsResult[0]?.swapped_items || 0,
      successfulSwaps: swapsResult[0]?.successful_swaps || 0,
      totalPointsEarned: pointsResult[0]?.total_points_earned || 0,
      co2Saved: (swapsResult[0]?.successful_swaps || 0) * 5
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Helper function to get user stats
const getUserStats = async (userId) => {
  // Get user's items count
  const itemsResult = await Item.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total_items: { $sum: 1 },
        available_items: {
          $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
        },
        swapped_items: {
          $sum: { $cond: [{ $eq: ['$status', 'swapped'] }, 1, 0] }
        },
        pending_items: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Get user's successful swaps
  const swapsResult = await Swap.aggregate([
    {
      $lookup: {
        from: 'items',
        localField: 'item_id',
        foreignField: '_id',
        as: 'item'
      }
    },
    { $unwind: '$item' },
    { $match: { 'item.user_id': new mongoose.Types.ObjectId(userId), status: 'completed' } },
    { $count: 'successful_swaps' }
  ]);
  
  // Get total points earned from activities
  const pointsResult = await Activity.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total_points_earned: { $sum: '$points' } } }
  ]);
  
  return {
    itemsListed: itemsResult[0]?.total_items || 0,
    availableItems: itemsResult[0]?.available_items || 0,
    swappedItems: itemsResult[0]?.swapped_items || 0,
    pendingItems: itemsResult[0]?.pending_items || 0,
    successfulSwaps: swapsResult[0]?.successful_swaps || 0,
    totalPointsEarned: pointsResult[0]?.total_points_earned || 0,
    co2Saved: (swapsResult[0]?.successful_swaps || 0) * 5
  };
};

export default router; 