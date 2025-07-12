import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Activity from '../models/Activity.js';
import Like from '../models/Like.js';

async function seedDatabase() {
  try {
    await connectDB();
    
    console.log('🌱 Seeding database with sample data...');
    
    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    await Activity.deleteMany({});
    await Like.deleteMany({});
    
    // Create sample users
    const users = [
      {
        username: 'sarah_j',
        email: 'sarah@example.com',
        password: 'password123',
        full_name: 'Sarah Johnson',
        avatar_url: '/placeholder.svg?height=100&width=100',
        points: 450,
        level: 'Eco Champion'
      },
      {
        username: 'emma_w',
        email: 'emma@example.com',
        password: 'password123',
        full_name: 'Emma Wilson',
        avatar_url: '/placeholder.svg?height=100&width=100',
        points: 320,
        level: 'Fashion Enthusiast'
      },
      {
        username: 'mike_c',
        email: 'mike@example.com',
        password: 'password123',
        full_name: 'Mike Chen',
        avatar_url: '/placeholder.svg?height=100&width=100',
        points: 180,
        level: 'Newcomer'
      }
    ];
    
    const createdUsers = [];
    for (const userData of users) {
      const { password, ...rest } = userData;
      const user = new User(rest);
      user.set('password', password);
      await user.save();
      createdUsers.push(user);
    }
    
    const [sarah, emma, mike] = createdUsers;
    
    // Create sample items
    const items = [
      {
        user_id: sarah._id,
        title: 'Vintage Denim Jacket',
        description: 'Classic 90s denim jacket in excellent condition with unique patches',
        image_url: '/placeholder.svg?height=300&width=300',
        category: 'Jackets',
        size: 'M',
        condition: 'Excellent',
        points: 150,
        status: 'available',
        views: 45,
        likes: 12,
        tags: ['vintage', 'denim', '90s']
      },
      {
        user_id: sarah._id,
        title: 'Summer Floral Dress',
        description: 'Beautiful floral print dress perfect for summer occasions',
        image_url: '/placeholder.svg?height=300&width=300',
        category: 'Dresses',
        size: 'S',
        condition: 'Like New',
        points: 180,
        status: 'swapped',
        views: 32,
        likes: 8,
        tags: ['floral', 'summer', 'elegant']
      },
      {
        user_id: emma._id,
        title: 'Cozy Wool Sweater',
        description: 'Hand-knitted wool sweater, perfect for winter days',
        image_url: '/placeholder.svg?height=300&width=300',
        category: 'Sweaters',
        size: 'L',
        condition: 'Good',
        points: 120,
        status: 'available',
        views: 28,
        likes: 15,
        tags: ['wool', 'handmade', 'winter']
      },
      {
        user_id: emma._id,
        title: 'Designer Sneakers',
        description: 'Limited edition sneakers in pristine condition',
        image_url: '/placeholder.svg?height=300&width=300',
        category: 'Shoes',
        size: '9',
        condition: 'Like New',
        points: 250,
        status: 'available',
        views: 67,
        likes: 23,
        tags: ['designer', 'limited', 'sneakers']
      },
      {
        user_id: mike._id,
        title: 'Classic White Shirt',
        description: 'Timeless white button-down shirt for any occasion',
        image_url: '/placeholder.svg?height=300&width=300',
        category: 'Shirts',
        size: 'M',
        condition: 'Excellent',
        points: 80,
        status: 'available',
        views: 12,
        likes: 3,
        tags: ['classic', 'formal', 'white']
      }
    ];
    
    const createdItems = [];
    for (const itemData of items) {
      const item = new Item(itemData);
      await item.save();
      createdItems.push(item);
    }
    
    const [jacket, dress, sweater, sneakers, shirt] = createdItems;
    
    // Create sample activities
    const activities = [
      {
        user_id: sarah._id,
        type: 'swap_completed',
        description: 'Swapped vintage denim jacket with Emma',
        points: 50,
        related_item_id: jacket._id
      },
      {
        user_id: sarah._id,
        type: 'item_listed',
        description: 'Listed summer floral dress',
        points: 10,
        related_item_id: dress._id
      },
      {
        user_id: emma._id,
        type: 'swap_request',
        description: 'Received swap request for wool sweater',
        points: 0,
        related_item_id: sweater._id
      }
    ];
    
    for (const activityData of activities) {
      const activity = new Activity(activityData);
      await activity.save();
    }
    
    // Create sample likes
    const likes = [
      { user_id: emma._id, item_id: jacket._id },
      { user_id: mike._id, item_id: jacket._id },
      { user_id: sarah._id, item_id: sweater._id },
      { user_id: mike._id, item_id: sneakers._id }
    ];
    
    for (const likeData of likes) {
      const like = new Like(likeData);
      await like.save();
    }
    
    console.log('✅ Database seeded successfully!');
    console.log('👥 Sample users created');
    console.log('👕 Sample items created');
    console.log('📊 Sample activities created');
    console.log('❤️  Sample likes created');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 