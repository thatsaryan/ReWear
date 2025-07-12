import express from 'express';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Swap from '../models/Swap.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get pending items for approval
router.get('/items/pending', async (req, res) => {
  try {
    const pendingItems = await Item.find({ status: 'pending' })
      .populate('user_id', 'username email full_name')
      .sort({ createdAt: -1 });
    
    res.json(pendingItems);
  } catch (error) {
    console.error('Error fetching pending items:', error);
    res.status(500).json({ error: 'Failed to fetch pending items' });
  }
});

// Approve item
router.put('/items/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.status !== 'pending') {
      return res.status(400).json({ error: 'Item is not pending approval' });
    }
    
    item.status = 'available';
    await item.save();
    
    // Add activity record
    const activity = new Activity({
      user_id: item.user_id,
      type: 'item_approved',
      description: `Item "${item.title}" approved by admin`,
      points: 10
    });
    await activity.save();
    
    res.json({ message: 'Item approved successfully' });
  } catch (error) {
    console.error('Error approving item:', error);
    res.status(500).json({ error: 'Failed to approve item' });
  }
});

// Reject item
router.put('/items/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.status !== 'pending') {
      return res.status(400).json({ error: 'Item is not pending approval' });
    }
    
    item.status = 'rejected';
    item.rejection_reason = reason;
    await item.save();
    
    // Add activity record
    const activity = new Activity({
      user_id: item.user_id,
      type: 'item_rejected',
      description: `Item "${item.title}" rejected by admin: ${reason}`,
      points: -5
    });
    await activity.save();
    
    res.json({ message: 'Item rejected successfully' });
  } catch (error) {
    console.error('Error rejecting item:', error);
    res.status(500).json({ error: 'Failed to reject item' });
  }
});

// Remove item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Add activity record before deletion
    const activity = new Activity({
      user_id: item.user_id,
      type: 'item_removed',
      description: `Item "${item.title}" removed by admin: ${reason}`,
      points: -10
    });
    await activity.save();
    
    await Item.findByIdAndDelete(id);
    
    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password_hash -password_reset_token -password_reset_expires')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Ban user
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.is_banned = true;
    user.ban_reason = reason;
    user.banned_at = new Date();
    await user.save();
    
    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Unban user
router.put('/users/:id/unban', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.is_banned = false;
    user.ban_reason = undefined;
    user.banned_at = undefined;
    await user.save();
    
    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Adjust user points
router.put('/users/:id/points', async (req, res) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const pointsChange = parseInt(points);
    if (isNaN(pointsChange)) {
      return res.status(400).json({ error: 'Invalid points value' });
    }
    
    user.points += pointsChange;
    user.updateLevel();
    await user.save();
    
    // Add activity record
    const activity = new Activity({
      user_id: id,
      type: 'points_adjusted',
      description: `Points adjusted by admin: ${pointsChange > 0 ? '+' : ''}${pointsChange} (${reason})`,
      points: pointsChange
    });
    await activity.save();
    
    res.json({ message: 'User points adjusted successfully' });
  } catch (error) {
    console.error('Error adjusting user points:', error);
    res.status(500).json({ error: 'Failed to adjust user points' });
  }
});

// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const pendingItems = await Item.countDocuments({ status: 'pending' });
    const totalSwaps = await Swap.countDocuments();
    const completedSwaps = await Swap.countDocuments({ status: 'completed' });
    const bannedUsers = await User.countDocuments({ is_banned: true });
    
    const stats = {
      totalUsers,
      totalItems,
      pendingItems,
      totalSwaps,
      completedSwaps,
      bannedUsers,
      swapSuccessRate: totalSwaps > 0 ? (completedSwaps / totalSwaps * 100).toFixed(1) : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

export default router; 