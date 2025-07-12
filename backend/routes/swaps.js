import express from 'express';
import Swap from '../models/Swap.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all swaps for a user (both sent and received)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get swaps where user is the requester
    const sentSwaps = await Swap.find({ requester_id: userId })
      .populate('item_id', 'title image_url')
      .populate('offered_item_id', 'title image_url')
      .populate({
        path: 'item_id',
        populate: { path: 'user_id', select: 'username' }
      })
      .sort({ createdAt: -1 });
    
    // Get swaps where user is the item owner
    const userItems = await Item.find({ user_id: userId }).distinct('_id');
    const receivedSwaps = await Swap.find({ item_id: { $in: userItems } })
      .populate('item_id', 'title image_url status')
      .populate('offered_item_id', 'title image_url')
      .populate('requester_id', 'username')
      .sort({ createdAt: -1 });
    
    res.json({
      sent: sentSwaps,
      received: receivedSwaps
    });
  } catch (error) {
    console.error('Error fetching swaps:', error);
    res.status(500).json({ error: 'Failed to fetch swaps' });
  }
});

// Create a new swap request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { item_id, offered_item_id, points_offered, message } = req.body;
    const requester_id = req.user.userId;
    
    if (!item_id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    // Check if item exists and is available
    const item = await Item.findById(item_id)
      .populate('user_id', 'username');
    
    if (!item || item.status !== 'available') {
      return res.status(404).json({ error: 'Item not found or not available' });
    }
    
    // Check if user is trying to swap their own item
    if (item.user_id._id.toString() === requester_id) {
      return res.status(400).json({ error: 'Cannot swap your own item' });
    }
    
    // Check if user already has a pending swap for this item
    const existingSwap = await Swap.findOne({
      requester_id,
      item_id,
      status: 'pending'
    });
    
    if (existingSwap) {
      return res.status(400).json({ error: 'You already have a pending swap request for this item' });
    }
    
    // Validate offered item if provided (for direct swaps)
    if (offered_item_id) {
      const offeredItem = await Item.findById(offered_item_id);
      if (!offeredItem) {
        return res.status(404).json({ error: 'Offered item not found' });
      }
      if (offeredItem.user_id.toString() !== requester_id) {
        return res.status(403).json({ error: 'You can only offer your own items' });
      }
      if (offeredItem.status !== 'available') {
        return res.status(400).json({ error: 'Offered item must be available' });
      }
    }
    
    // For point-based redemptions, check if user has enough points
    if (points_offered >= item.points) {
      const user = await User.findById(requester_id);
      if (!user || user.points < item.points) {
        return res.status(400).json({ 
          error: 'Insufficient points', 
          message: `You need ${item.points} points to redeem this item. You have ${user?.points || 0} points.` 
        });
      }
      
      // For point redemptions, immediately mark item as swapped
      await Item.findByIdAndUpdate(item_id, { status: 'swapped' });
      
      // Deduct points from user
      await User.findByIdAndUpdate(requester_id, { $inc: { points: -item.points } });
      
      // Add points to item owner
      await User.findByIdAndUpdate(item.user_id._id, { $inc: { points: item.points } });
    }
    
    // Create swap request
    const swap = new Swap({
      requester_id,
      item_id,
      offered_item_id: offered_item_id || undefined,
      points_offered: points_offered || 0,
      message: message || ''
    });
    
    await swap.save();
    
    // Add activity record
    const activity = new Activity({
      user_id: requester_id,
      type: points_offered >= item.points ? 'point_redemption' : 'swap_request',
      description: points_offered >= item.points 
        ? `Redeemed ${item.title} with ${item.points} points`
        : `Requested swap for ${item.title}`,
      points: points_offered >= item.points ? -item.points : 0,
      related_item_id: item_id
    });
    await activity.save();
    
    res.status(201).json({
      id: swap._id,
      message: points_offered >= item.points 
        ? 'Item redeemed successfully' 
        : 'Swap request created successfully'
    });
  } catch (error) {
    console.error('Error creating swap request:', error);
    res.status(500).json({ error: 'Failed to create swap request' });
  }
});

// Accept a swap request
router.put('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Get swap with item details
    const swap = await Swap.findById(id)
      .populate('item_id');
    
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found' });
    }
    
    // Check if user is the item owner
    if (swap.item_id.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Only the item owner can accept swap requests' });
    }
    
    // Check if swap is still pending
    if (swap.status !== 'pending') {
      return res.status(400).json({ error: 'Swap request is no longer pending' });
    }
    
    // Update swap status to completed
    swap.status = 'completed';
    await swap.save();
    
    // Update item status to swapped
    await Item.findByIdAndUpdate(swap.item_id._id, { status: 'swapped' });
    
    // Award points to both users
    const pointsToAward = Math.floor(swap.item_id.points * 0.1); // 10% of item points
    
    await User.findByIdAndUpdate(swap.requester_id, { $inc: { points: pointsToAward } });
    await User.findByIdAndUpdate(userId, { $inc: { points: pointsToAward } });
    
    // Add activity records
    const requesterActivity = new Activity({
      user_id: swap.requester_id,
      type: 'swap_completed',
      description: `Successfully swapped ${swap.item_id.title}`,
      points: pointsToAward,
      related_item_id: swap.item_id._id
    });
    await requesterActivity.save();
    
    const ownerActivity = new Activity({
      user_id: userId,
      type: 'swap_completed',
      description: `Accepted swap for ${swap.item_id.title}`,
      points: pointsToAward,
      related_item_id: swap.item_id._id
    });
    await ownerActivity.save();
    
    res.json({ message: 'Swap request accepted successfully' });
  } catch (error) {
    console.error('Error accepting swap:', error);
    res.status(500).json({ error: 'Failed to accept swap request' });
  }
});

// Decline a swap request
router.put('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Get swap with item details
    const swap = await Swap.findById(id)
      .populate('item_id');
    
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found' });
    }
    
    // Check if user is the item owner
    if (swap.item_id.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Only the item owner can decline swap requests' });
    }
    
    // Check if swap is still pending
    if (swap.status !== 'pending') {
      return res.status(400).json({ error: 'Swap request is no longer pending' });
    }
    
    // Update swap status to declined
    swap.status = 'declined';
    await swap.save();
    
    // Add activity record
    const activity = new Activity({
      user_id: swap.requester_id,
      type: 'swap_declined',
      description: `Swap request for ${swap.item_id.title} was declined`,
      points: 0,
      related_item_id: swap.item_id._id
    });
    await activity.save();
    
    res.json({ message: 'Swap request declined successfully' });
  } catch (error) {
    console.error('Error declining swap:', error);
    res.status(500).json({ error: 'Failed to decline swap request' });
  }
});

// Cancel a swap request (by requester)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Get swap details
    const swap = await Swap.findById(id)
      .populate('item_id', 'title');
    
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found' });
    }
    
    // Check if user is the requester
    if (swap.requester_id.toString() !== userId) {
      return res.status(403).json({ error: 'Only the requester can cancel swap requests' });
    }
    
    // Check if swap is still pending
    if (swap.status !== 'pending') {
      return res.status(400).json({ error: 'Swap request is no longer pending' });
    }
    
    // Update swap status to cancelled
    swap.status = 'cancelled';
    await swap.save();
    
    res.json({ message: 'Swap request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling swap:', error);
    res.status(500).json({ error: 'Failed to cancel swap request' });
  }
});

// Get swap by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const swap = await Swap.findById(id)
      .populate('item_id', 'title image_url')
      .populate('requester_id', 'username');
    
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found' });
    }
    
    // Check if user is authorized to view this swap
    const userItems = await Item.find({ user_id: userId }).distinct('_id');
    if (swap.requester_id._id.toString() !== userId && !userItems.includes(swap.item_id._id)) {
      return res.status(403).json({ error: 'Not authorized to view this swap' });
    }
    
    res.json(swap);
  } catch (error) {
    console.error('Error fetching swap:', error);
    res.status(500).json({ error: 'Failed to fetch swap' });
  }
});

export default router; 