# Funny Friends - Game Ledger Platform

**IMPORTANT: This is a GAME LEDGER APPLICATION, not an online gaming platform.**

Funny Friends is a digital ledger system designed to record and track physical card games played in person. Players use this application to replace traditional pen-and-paper or Excel-based scorekeeping methods. The actual card games are played physically with real cards - this app only records the scores, rounds, and financial settlements.

**Key Concept**: Friends gather physically → Play with real cards → Use this app to record scores → Track who owes whom

## 🎯 Purpose

This application solves the problem of manual score tracking in physical card games by providing:
- Digital record-keeping instead of paper/Excel
- Real-time score updates as the physical game progresses
- Automatic calculation of wins/losses and settlements
- Historical tracking of all game sessions
- Multi-game support (Teen Patti, Rummy, etc.)

**The games are NOT played online - they are played in person with real cards!**

[![Security Rating](https://img.shields.io/badge/security-A+-brightgreen)](SECURITY_AUDIT.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎮 Live Application

**Production URL**: [https://funny-friends.onrender.com](https://funny-friends.onrender.com)

## ✨ Key Features

### 📊 Ledger & Recording Features
- **Digital Score Tracking**: Replace pen-and-paper or Excel with real-time digital recording
- **Multi-Game Support**: Track Teen Patti, Rummy, and other card games
- **Session Management**: Create game sessions for physical gatherings
- **Real-time Updates**: All players see scores update as the physical game progresses
- **Complete History**: Persistent record of all hands, rounds, and settlements
- **Financial Tracking**: Automatic calculation of who owes whom at session end

### 🃏 Game Recording Features
- **Teen Patti Recording**: Track Boot, Chaal, Blind, Seen, Side Show, Show outcomes
- **Rummy Recording**: Track sequences, sets, declarations, and deadwood points
- **Hand Rankings**: Automatic validation of hand rankings (Trail, Pure Sequence, etc.)
- **Round-by-Round Tracking**: Record each hand/round as it happens in the physical game
- **Pot Management**: Track bets and winnings for accurate settlement
- **Operator Control**: One person (operator) records while others play physically

### 👥 Multiplayer & Roles
- **4 User Roles**: Admin, Operator, Player, Viewer
- **2-17 Players per Game**: Flexible session sizes
- **Viewer Mode**: Spectate games with operator approval
- **Session Management**: Create, manage, and end game sessions

### 🔐 Enterprise Security
- **Role-Based Access Control (RBAC)**: Granular permissions per role
- **JWT Authentication**: Secure tokens with 8-hour expiration
- **HTTP-only Cookies**: XSS-resistant session management
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Zod schemas for all inputs
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options)
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **Account Lockout**: Automatic lockout after 5 failed attempts

### 🎨 Professional UX
- **Toast Notifications**: Beautiful, non-intrusive feedback system
- **Real-time Turn Indicator**: Clear visual indicators for active player
- **Invite Links**: Easy session sharing with one-click copy
- **Comprehensive Help**: Detailed game rules with visual examples
- **Responsive Design**: Works perfectly on desktop and mobile
- **Loading States**: Professional spinners and disabled states
- **Error Handling**: Graceful error messages throughout

### 📊 Admin & Operator Features
- **User Management**: Create and manage operators with game permissions
- **Game Assignment**: Assign specific games to operators
- **Session Monitoring**: View active and ended sessions
- **Player Requests**: Approve/decline player join requests
- **System Reset**: Full database reset capability

## 📋 How It Works (Ledger Workflow)

### Physical Game Flow

1. **Gather Physically**: Friends meet in person with a real deck of cards
2. **Create Session**: Operator creates a game session in the app
3. **Add Players**: All physical players are added to the digital session
4. **Play with Real Cards**: The actual game happens with physical cards on a table
5. **Record in App**: After each hand/round, the operator records the results
6. **Track Scores**: App automatically calculates running totals and settlements
7. **Session End**: Final settlements show who pays whom

### Roles in the Ledger System

- **Operator**: The person holding the device and recording the game while others play
- **Players**: People physically playing cards (their scores are tracked)
- **Viewers**: People watching the game (can see scores but don't play)
- **Admin**: Manages the platform and creates operator accounts

### Why Use This Instead of Excel/Paper?

- **Real-time**: All players see scores update instantly on their phones
- **Accurate**: Automatic calculations prevent math errors
- **Historical**: Complete record of all past game sessions
- **Multi-device**: Players can check scores on their own devices
- **Professional**: Clean UI instead of messy spreadsheets
- **Secure**: User authentication prevents score tampering

**Remember**: The cards are real, the table is real, the players are real - only the scorekeeping is digital!

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone and Install

```bash
git clone https://github.com/adm-recens/teen-patti-app.git
cd teen-patti-app
npm run install-all
```

### 2. Configure Environment

```bash
# Server environment
cd server
cp .env.example .env
# Edit .env with your settings

# Client environment
cd ../client
cp .env.example .env.local
```

**Minimum server/.env:**
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-min-32-characters-long"
ADMIN_SETUP_KEY="your-setup-key-min-10-characters"
CLIENT_URL="http://localhost:5173"
PORT=3000
NODE_ENV=development
```

### 3. Initialize Database

```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Start Development

```bash
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📖 Game Rules Documentation

### Hand Rankings (High to Low)

1. **Trail (Three of a Kind)** - Three cards of same rank (AAA highest)
2. **Pure Sequence** - Three consecutive cards of same suit (A-K-Q of spades)
3. **Sequence** - Three consecutive cards, mixed suits (A-K-Q)
4. **Color (Flush)** - Three cards of same suit, not in sequence
5. **Pair** - Two cards of same rank (A-A-K beats K-K-Q)
6. **High Card** - None of the above, compare highest cards

### Special Rules

**A-2-3 Sequence:**
- A-2-3 is the LOWEST straight, not the highest
- Ranking: A-K-Q > K-Q-J > ... > 4-3-2 > A-2-3

**Side Show:**
- Only SEEN players can request
- Target must be previous active SEEN player
- Cost: Equal to current stake
- Loser folds, stake stays same

**Force Show:**
- SEEN player vs BLIND player (when 1-2 blinds remain)
- If SEEN wins: Normal win
- If BLIND wins: SEEN player pays 2× penalty AND folds

### Betting Structure

- **Boot**: 5 chips (collected from all at start)
- **Initial Stake**: 20 chips
- **BLIND bet**: ½ of current stake
- **SEEN bet (Chaal)**: Full current stake
- **Raise**: Double the current stake

## 🏗️ Architecture

```
funny-friends/
├── client/                 # React Frontend (Vite + React 19)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts (Auth, Toast)
│   │   └── config.js      # API configuration
│   └── package.json
├── server/                 # Express Backend
│   ├── server.js          # Entry point & API routes
│   ├── game/
│   │   └── GameManager.js # Game logic & state management
│   ├── prisma/            # Database schema & migrations
│   └── package.json
├── package.json           # Root configuration & scripts
└── render.yaml            # Render deployment config
```

### Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Socket.io-client
- **Backend**: Express.js 5, Socket.io, JWT
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma with connection pooling
- **Security**: Helmet.js, express-rate-limit, bcrypt
- **Validation**: Zod schemas

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Start both client and server
npm run server           # Backend only
npm run client           # Frontend only
npm run install-all      # Install all dependencies
```

### Production
```bash
npm run build            # Build client for production
npm start                # Start production server
npm run render-build     # Build for Render deployment
```

### Database
```bash
cd server
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed sample data
```

## 🚀 Deployment

### Render (Recommended)

1. **Push to GitHub**
2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your repository
3. **Set Environment Variables**:
   ```
   JWT_SECRET=<64-character-random>
   ADMIN_SETUP_KEY=<32-character-random>
   CLIENT_URL=https://your-app.onrender.com
   ```
4. **Deploy** - Render handles the rest!

See [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md) for detailed instructions.

## 🔐 Security Features

### Authentication & Authorization
- ✅ HTTP-only cookies for JWT storage
- ✅ 8-hour token expiration
- ✅ Role-based access control (RBAC)
- ✅ Account lockout after 5 failed attempts
- ✅ Secure password hashing (bcrypt, 12 rounds)

### API Security
- ✅ Rate limiting on all auth endpoints
- ✅ Input validation with Zod schemas
- ✅ CORS whitelist validation
- ✅ Helmet.js security headers
- ✅ SQL injection protection via Prisma

### Game Security
- ✅ Server-side game state validation
- ✅ Anti-cheating measures
- ✅ Secure WebSocket authentication
- ✅ Action authorization checks

## 📱 User Guide

### For Players

1. **Join a Game**:
   - Get invite link from operator
   - Enter your name
   - Wait for operator approval
   - Watch the game live!

2. **During Game**:
   - View current turn indicator
   - See all players and their bets
   - Watch hand history in game log
   - Real-time updates of pot and stakes

### For Operators

1. **Create Session**:
   - Login as Operator
   - Go to Operator Dashboard
   - Click "Create New Session"
   - Add players (2-17)
   - Share invite link with viewers

2. **Manage Game**:
   - Start rounds
   - Handle Side Show requests
   - Resolve Show/Force Show
   - Manage viewer access requests
   - End session when done

3. **Player Actions**:
   - SEEN: View your cards (pay current stake)
   - BLIND: Play without seeing cards (pay ½ stake)
   - CHAAL: Match current stake
   - RAISE: Double the stake
   - FOLD: Pack your cards
   - SIDE SHOW: Compare with previous player
   - SHOW: Final showdown

### For Admins

1. **Manage Operators**:
   - Go to Admin Dashboard
   - Create operator accounts
   - Assign game permissions
   - Monitor all sessions

2. **System Management**:
   - View system statistics
   - Manage user accounts
   - Reset database if needed

## 🛠️ Troubleshooting

### Port Already in Use
```bash
npx kill-port 3000  # or 5173
```

### Database Issues
```bash
cd server
rm prisma/dev.db prisma/dev.db-journal
npx prisma db push
```

### CORS Errors
- Check `CLIENT_URL` matches your actual URL
- Include protocol (http:// or https://)

### Build Errors
```bash
rm -rf node_modules client/node_modules server/node_modules
rm -rf client/dist
npm run install-all
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:name` - Get session details
- `POST /api/sessions/:name/end` - End session

### Game Actions (WebSocket)
- `game_action` - Send game action
- `game_update` - Receive game state updates
- `viewer_requested` - Handle viewer requests

### Admin APIs
- `GET /api/admin/sessions` - List all sessions
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/player-requests/:id/resolve` - Approve/decline player

## 🗺️ Roadmap

### Completed ✅
- [x] Teen Patti with complete rules
- [x] Real-time multiplayer gameplay
- [x] Role-based access control
- [x] Security hardening
- [x] Toast notification system
- [x] Session invite links
- [x] Comprehensive help documentation
- [x] Turn indicators
- [x] Viewer mode with approval

### Coming Soon 📅
- [ ] Rummy game mode
- [ ] Poker (Texas Hold'em)
- [ ] User avatars
- [ ] Game statistics & analytics
- [ ] Tournament mode
- [ ] Mobile app (React Native)
- [ ] Sound effects & animations
- [ ] Chat system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Security Guidelines](SECURITY_AUDIT.md) before contributing.

## 📄 License

MIT License - feel free to use this project for your own games!

## 🙏 Acknowledgments

- Built with ❤️ for friends who love playing games together
- Security-first architecture inspired by enterprise standards
- Real-time gameplay powered by Socket.io
- Beautiful UI with Tailwind CSS

## 📞 Support

- 🐛 **Bug Reports**: Open an issue on GitHub
- 📖 **Documentation**: Check the guides linked above
- 🔐 **Security**: Review the [Security Audit](SECURITY_AUDIT.md)
- 💬 **Questions**: Start a discussion on GitHub

---

**Made with ❤️ | Security First | Production Ready | Open Source**

[Live Demo](https://funny-friends.onrender.com) • [Documentation](LOCAL_DEVELOPMENT.md) • [Report Bug](../../issues) • [Request Feature](../../issues)
