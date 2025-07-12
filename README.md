# Thread Swap Circle

A modern clothing swap application built with React, TypeScript, and MongoDB. Users can list, browse, and swap clothing items while earning points and contributing to sustainability.

## Features

- 🛍️ **Item Management**: List, browse, and manage clothing items
- 🔄 **Swap System**: Request and manage clothing swaps between users
- 🏆 **Points System**: Earn points for activities and track your impact
- 👤 **User Profiles**: Manage your profile and view statistics
- 🔐 **Authentication**: Secure user registration and login
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Built with shadcn/ui components

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- TanStack Query for data fetching
- shadcn/ui for components
- Tailwind CSS for styling

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd thread-swap-circle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/thread-swap-circle
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # Server Configuration
   PORT=3001
   
   # Environment
   NODE_ENV=development
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system. If using MongoDB Atlas, update the `MONGODB_URI` in your `.env` file.

5. **Seed the database**
   ```bash
   npm run db:seed
   ```

## Running the Application

### Development Mode

Run both frontend and backend simultaneously:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm run dev:backend
   ```

The application will be available at http://localhost:3001

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### Items
- `GET /api/items` - Get all items with filters
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/like` - Toggle like on item

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/items` - Get user's items
- `GET /api/users/:id/activities` - Get user's activities
- `GET /api/users/:id/stats` - Get user statistics
- `PUT /api/users/:id` - Update user profile

### Swaps
- `GET /api/swaps` - Get user's swaps
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/:id/accept` - Accept swap request
- `PUT /api/swaps/:id/decline` - Decline swap request
- `PUT /api/swaps/:id/cancel` - Cancel swap request

## Sample Data

The seed script creates sample users with the following credentials:

- **Sarah Johnson** (sarah_j / password123)
- **Emma Wilson** (emma_w / password123)
- **Mike Chen** (mike_c / password123)

## Project Structure

```
thread-swap-circle/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Item.js             # Item model
│   │   ├── Swap.js             # Swap model
│   │   ├── Activity.js         # Activity model
│   │   └── Like.js             # Like model
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── items.js            # Item routes
│   │   ├── users.js            # User routes
│   │   └── swaps.js            # Swap routes
│   ├── database/
│   │   └── seed.js             # Database seeding
│   └── server.js               # Express server
├── src/
│   ├── components/             # React components
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── pages/                  # Page components
│   ├── services/
│   │   └── api.ts              # API service functions
│   └── App.tsx                 # Main app component
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
