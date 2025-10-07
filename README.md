# Construction Management System

An offline-first web application for construction site task management with floor plan visualization.

## Features

### Summary
- **Offline-first architecture** with RxDB for local data storage
- **User authentication** using name-based login (no passwords)
- **Floor plan task management** with drag-and-drop functionality
- **Task board** with comprehensive task tracking
- **Checklist system** with status management
- **Real-time synchronization** when online

### Requirements Implemented
- ✅ Offline-first Web App with RxDB
- ✅ User Authentication (name-based, no passwords)
- ✅ Floor-Plan Task Management
- ✅ Task Details with checklists and status tracking
- ✅ Task Board/List view
- ✅ React with TypeScript and Zustand
- ✅ Tailwind CSS for styling
- ✅ Offline data handling with RxDB
- ✅ Separate frontend and backend architecture

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- RESTful API
- In-memory storage (demo purposes)

### Frontend
- React 18 with TypeScript
- Zustand for state management
- RxDB for offline data storage
- React Router for navigation
- Tailwind CSS for styling
- React Draggable for task positioning

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Setup

1. **Clone and setup environment:**
   ```bash
   # Run the setup script to create .env files
   ./setup-env.sh
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

### Manual Setup

If you prefer to set up manually:

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Setup backend:**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env file if needed
   ```

3. **Setup frontend:**
   ```bash
   cd ../frontend
   npm install
   cp env.example .env
   # Edit .env file if needed
   ```

4. **Start development servers:**
   ```bash
   cd ..
   npm run dev
   ```

### Environment Configuration

The application uses environment variables for configuration:

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
API_VERSION=v1
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:3001
NODE_ENV=development
```

### Development

1. **Start both backend and frontend:**
   ```bash
   npm run dev
   ```

2. **Or start individually:**
   ```bash
   # Backend only
   npm run dev:backend
   
   # Frontend only  
   npm run dev:frontend
   ```

3. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

### Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the backend:**
   ```bash
   npm start
   ```

## Usage

1. **Access the application** at `http://localhost:3000`
2. **Enter your name** to create or access your account
3. **Add tasks** by clicking on the floor plan or using the task board
4. **Manage tasks** with drag-and-drop positioning on the floor plan
5. **Track progress** using checklists and status updates
6. **Work offline** - all data is stored locally and syncs when online

## Architecture

### Data Flow
- **Data Layer**: Handles all data operations (RxDB)
- **Service Layer**: Business logic and API communication
- **Web Layer**: React components and user interface

### Offline Strategy
- All data stored locally using RxDB
- Automatic synchronization when online
- Graceful degradation when offline
- User data isolation per account

## API Endpoints

### Users
- `POST /api/users` - Create or get user
- `GET /api/users/:id` - Get user by ID

### Tasks
- `GET /api/tasks/user/:userId` - Get tasks for user
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/checklist` - Add checklist item
- `PUT /api/tasks/:id/checklist/:itemId` - Update checklist item
- `DELETE /api/tasks/:id/checklist/:itemId` - Delete checklist item

## Development Notes

- Strict TypeScript configuration
- Separation of concerns maintained
- Offline-first design pattern
- Modern React patterns with hooks
- Responsive design with Tailwind CSS
- Environment-based configuration