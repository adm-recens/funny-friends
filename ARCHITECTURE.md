# Teen Patti Application Architecture

## Overview
This is a real-time multiplayer Teen Patti (Indian Poker) game application with a client-server architecture supporting live gameplay, user management, and session persistence.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side   │    │   Database      │
│                 │    │                 │    │                 │
│ React App       │◄──►│ Node.js/Express │◄──►│ PostgreSQL      │
│ (Vite)          │    │ Socket.io       │    │ (Prisma ORM)    │
│                 │    │ GameManager     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend (Client)
- **Framework**: React 19.2.0 with Vite
- **Routing**: React Router DOM 7.9.6
- **Styling**: Tailwind CSS 4.1.17
- **Real-time Communication**: Socket.io Client 4.8.1
- **Icons**: Lucide React
- **State Management**: React Context (AuthContext)

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **CORS**: Configured for multiple origins
- **Logging**: Morgan middleware

### Database Schema
- **Users**: Authentication and role management
- **GameSessions**: Game session metadata
- **Players**: Player information and balances
- **GameHands**: Hand history and results

## Core Components

### Frontend Architecture

#### 1. Application Structure
```
client/src/
├── components/
│   └── DebugFooter.jsx
├── context/
│   └── AuthContext.jsx
├── pages/
│   ├── Welcome.jsx
│   ├── Login.jsx
│   ├── SessionSetup.jsx
│   ├── GameRoom.jsx
│   └── AdminDashboard.jsx
├── App.jsx
└── main.jsx
```

#### 2. Key Components

**AuthContext**: Centralized authentication state management
- User session persistence
- Socket.io connection management
- JWT token handling

**GameRoom**: Main gameplay interface
- Real-time game state synchronization
- Player actions (bet, fold, show, side show)
- Spectator mode support
- Round and session summaries

**SessionSetup**: Game session creation
- Session configuration
- Player management

### Backend Architecture

#### 1. Server Structure
```
server/
├── server.js (Main application)
└── game/
    └── GameManager.js (Game logic)
```

#### 2. Core Modules

**Express Server** (`server.js`):
- REST API endpoints
- Authentication middleware
- Socket.io integration
- CORS configuration
- Database operations

**GameManager** (`game/GameManager.js`):
- Game state management
- Turn-based logic
- Action validation
- Event emission
- Round progression

## Data Flow

### 1. Authentication Flow
```
Client Login → JWT Token → Cookie/LocalStorage → Socket Auth → Protected Routes
```

### 2. Game Session Flow
```
Create Session → Initialize GameManager → Players Join → Real-time Gameplay → Persist Results
```

### 3. Real-time Communication
```
Client Action → Socket Emit → GameManager Process → State Update → Broadcast to All Clients
```

## Key Features

### 1. User Management
- Role-based access control (ADMIN, OPERATOR, PLAYER, GUEST)
- JWT authentication
- Session persistence

### 2. Game Mechanics
- Multiplayer Teen Patti gameplay
- Turn-based actions (Bet, Fold, Show, Side Show)
- Blind/Seen player states
- Pot management and stake calculation

### 3. Real-time Features
- Live game state synchronization
- Spectator mode with access control
- Player connection management
- Game event broadcasting

### 4. Session Management
- Configurable round limits
- Player balance tracking
- Hand history logging
- Session persistence

## Security Considerations

### 1. Authentication
- JWT token validation
- Role-based authorization
- Secure cookie handling

### 2. CORS Configuration
- Whitelisted origins
- Credential support
- Environment-based settings

### 3. Input Validation
- Server-side action validation
- Turn verification
- State consistency checks

## Deployment Architecture

### Current Setup
- **Client**: Deployed on Render (teen-patti-client.onrender.com)
- **Server**: Deployed on Render (teen-patti-app.onrender.com)
- **Database**: PostgreSQL (Render-managed)

### Environment Variables
- `VITE_BACKEND_URL`: Client backend URL
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Authentication secret
- `NODE_ENV`: Environment configuration

## Scalability Considerations

### 1. Current Limitations
- Single server instance
- In-memory game state
- No load balancing

### 2. Potential Improvements
- Redis for session state
- Horizontal scaling
- Database connection pooling
- CDN for static assets

## Game Logic Architecture

### 1. State Management
- Centralized GameManager per session
- Event-driven state updates
- Public/private state separation

### 2. Action Processing
- Turn validation
- Action execution
- State consistency
- Event broadcasting

### 3. Round Lifecycle
- Setup → Active → Showdown → Complete
- Player elimination tracking
- Balance calculations
- Session progression

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Session validation
- `POST /api/auth/logout` - User logout

### Game Management
- `POST /api/games/hand` - Save game hand results
- `GET /api/sessions/active` - Get active sessions
- `POST /api/sessions` - Create new session

### Admin Operations
- `GET /api/admin/sessions` - List all sessions
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/sessions/:name/end` - End session

## Socket Events

### Client to Server
- `join_session` - Join a game session
- `game_action` - Execute game action
- `end_session` - End current session
- `request_access` - Request viewer access
- `resolve_access` - Resolve viewer request

### Server to Client
- `game_update` - Game state update
- `viewer_requested` - Viewer access request
- `access_granted` - Access approved
- `access_denied` - Access denied
- `session_ended` - Session terminated
- `error_message` - Error notification

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'GUEST',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### GameSessions Table
```sql
CREATE TABLE game_sessions (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  total_rounds INTEGER NOT NULL,
  current_round INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Players Table
```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  session_balance INTEGER DEFAULT 0,
  seat_position INTEGER,
  user_id INTEGER UNIQUE REFERENCES users(id),
  session_id INTEGER REFERENCES game_sessions(id)
);
```

### GameHands Table
```sql
CREATE TABLE game_hands (
  id SERIAL PRIMARY KEY,
  winner VARCHAR NOT NULL,
  pot_size INTEGER NOT NULL,
  logs JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  session_id INTEGER REFERENCES game_sessions(id)
);
```

## Frontend Routing

### Public Routes
- `/` - Welcome page
- `/login` - User authentication

### Protected Routes
- `/setup` - Session creation (Requires authentication)
- `/game/:sessionName` - Game room (Requires authentication)
- `/admin` - Admin dashboard (Requires ADMIN/OPERATOR role)

## State Management

### AuthContext State
```javascript
{
  user: { id, username, role } | null,
  login: (username, password) => Promise,
  loginAsGuest: () => void,
  logout: () => Promise,
  socket: Socket,
  loading: boolean
}
```

### Game State
```javascript
{
  players: Array,
  gamePlayers: Array,
  pot: number,
  currentStake: number,
  activePlayerIndex: number,
  currentLogs: Array,
  phase: 'SETUP' | 'ACTIVE' | 'SHOWDOWN',
  sideShowRequest: Object | null,
  currentRound: number,
  totalRounds: number
}
```

## Error Handling

### Client-side
- Connection error detection
- Reconnection attempts
- User feedback for invalid actions
- Graceful degradation for network issues

### Server-side
- Authentication error handling
- Game state validation
- Socket error management
- Database error logging

## Performance Optimizations

### Frontend
- Component lazy loading
- Socket connection pooling
- State update batching
- Efficient re-renders

### Backend
- In-memory game state
- Optimized database queries
- Connection pooling
- Event-driven architecture

## Testing Strategy

### Frontend Tests
- Component unit tests
- Integration tests for game flow
- Socket connection testing
- User interaction testing

### Backend Tests
- API endpoint testing
- Game logic validation
- Database operation testing
- Socket event testing

## Future Enhancements

### Game Features
- Multiple game variants
- Tournament mode
- Player statistics
- Replay system

### Technical Improvements
- Microservices architecture
- Real-time analytics
- Mobile application
- Advanced security features

This architecture provides a solid foundation for a real-time multiplayer card game with proper separation of concerns, security measures, and scalability potential.