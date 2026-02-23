# Local Development Setup Guide (PostgreSQL)

Complete guide for local development with PostgreSQL - test everything before committing!

## Quick Setup (5 minutes)

### 1. Environment Setup

```bash
# In packages/platform/server/, create .env file:
cat > .env << 'EOF'
# Database - PostgreSQL local
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/funny_friends_dev"

# Security - Generate these:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="paste-generated-key-here-min-64-chars"
ADMIN_SETUP_KEY="paste-generated-key-here-min-10-chars"

# Application
NODE_ENV="development"
PORT=3000
CLIENT_URL="http://localhost:5173"
EOF
```

### 2. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE funny_friends_dev;"

# Install dependencies
npm install
cd packages/platform/server && npm install
cd ../client && npm install

# Push schema
cd ../server
npx prisma generate
npx prisma db push

# Seed data
node scripts/seed-games.js
```

### 3. Start Development

```bash
# From root directory
npm run dev
```

**Access:**
- App: http://localhost:5173
- API: http://localhost:3000
- DB Studio: http://localhost:5555 (run `npx prisma studio`)

## Detailed Setup

### Prerequisites Check

```bash
# Verify versions
node --version    # Should be 18+
npm --version     # Should be 9+
psql --version    # Should show PostgreSQL
```

### Database Configuration

**Option A: Using postgres user with password**
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/funny_friends_dev"
```

**Option B: Using custom user**
```sql
-- In psql
CREATE USER funnyuser WITH PASSWORD 'yourpassword';
CREATE DATABASE funny_friends_dev OWNER funnyuser;
GRANT ALL PRIVILEGES ON DATABASE funny_friends_dev TO funnyuser;
```

```env
DATABASE_URL="postgresql://funnyuser:yourpassword@localhost:5432/funny_friends_dev"
```

### Generate Security Keys

```bash
# Generate JWT_SECRET (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ADMIN_SETUP_KEY (32+ characters)  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing Workflow

### 1. First Time Setup

1. Open http://localhost:5173
2. You'll see setup page (no admin exists yet)
3. Enter your `ADMIN_SETUP_KEY`
4. Create admin account
5. Login

### 2. Create Test Data

**Create Operator:**
1. Go to Admin Dashboard → User Management
2. Create user with role "OPERATOR"
3. Assign game permissions (Teen Patti + Rummy)

**Create Rummy Session:**
1. Login as Operator
2. Create Session → Select Rummy
3. Add 2-6 players
4. Set target points (e.g., 100)
5. Click "Start Round"

### 3. Test Rummy Game Flow

```
Round 1:
  1. Player A: Click "Initial Drop" on their card (20 pts)
  2. Player B: Enter "35" in Card Points, click Add
  3. Player C: Click "Valid Show" (0 pts) → Round auto-ends
  4. Check leaderboard appears

Round 2:
  1. Click "Next Round" or "Start Round"
  2. Player A: Click "Middle Drop" (40 pts)
  3. Player B: Click "Wrong Show" (80 pts penalty) → Round ends
  
Continue until elimination...
```

### 4. Test Ended Session View

1. Complete or end a session
2. Go back to sessions list
3. Click on the ended session
4. Should show final standings

## Testing Checklist Before Committing

### Teen Patti
- [ ] Create session with 2-6 players
- [ ] Start round deals cards
- [ ] Blind player can bet (half stake)
- [ ] Player can become Seen
- [ ] Side Show works
- [ ] Show/Force Show works
- [ ] Winner gets pot
- [ ] Round ends properly
- [ ] Next round starts

### Rummy
- [ ] Create session with 2-6 players
- [ ] Set target points displays correctly
- [ ] Start round shows player cards with actions
- [ ] Initial Drop records 20 points
- [ ] Middle Drop records 40 points
- [ ] Valid Show records 0 points and ends round
- [ ] Wrong Show records 80 penalty and ends round
- [ ] Card Points input works for all players
- [ ] Leaderboard shows after round end
- [ ] Elimination works at target+1 points
- [ ] Can view ended session with final standings

### General
- [ ] Admin can create operators
- [ ] Operator can create sessions
- [ ] Viewer mode works
- [ ] No console errors
- [ ] No server errors
- [ ] Mobile responsive (check on phone)

## Debugging Commands

### Check Database
```bash
cd packages/platform/server

# Open Prisma Studio (GUI)
npx prisma studio

# Or use psql directly
psql -U postgres -d funny_friends_dev -c "SELECT * FROM \"GameSession\";"
```

### Check Logs
```bash
# Server logs
npm run server 2>&1 | tee server.log

# Search for errors
grep -i "error\|debug" server.log
```

### Reset Everything
```bash
# Kill processes
npx kill-port 3000 5173 5555

# Reset database
npx prisma migrate reset --force

# Re-seed
node scripts/seed-games.js

# Restart
npm run dev
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get sessions (need auth cookie)
curl http://localhost:3000/api/v2/sessions -H "Cookie: token=YOUR_TOKEN"
```

## Common Issues

### "database funny_friends_dev does not exist"
```bash
psql -U postgres -c "CREATE DATABASE funny_friends_dev;"
```

### "connection refused" on port 5432
```bash
# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql  # Mac
```

### "Prisma Client not generated"
```bash
cd packages/platform/server
npx prisma generate
```

### Port already in use
```bash
npx kill-port 3000
npx kill-port 5173
```

### Schema changes not reflecting
```bash
npx prisma db push
npx prisma generate
# Restart server
```

## File Locations

**Important files to edit:**
```
packages/platform/
├── client/src/
│   ├── pages/
│   │   ├── GameSession.jsx      # Main game UI
│   │   ├── SessionSetup.jsx     # Create session
│   │   └── admin/
│   │       └── AdminDashboardOverview.jsx
│   └── context/
│       └── AuthContext.jsx      # Auth logic
└── server/
    ├── server.js                # API routes & socket handlers
    ├── game/
    │   ├── GameManager.js       # Teen Patti logic
    │   └── rummy/
    │       └── GameManager.js   # Rummy logic
    └── scripts/
        └── seed-games.js        # Database seeder
```

## Hot Reload Benefits

✅ **Edit → Save → See changes instantly**  
✅ **No deployment wait**  
✅ **Console shows all errors**  
✅ **Prisma Studio for DB debugging**  
✅ **Test everything before committing**

## Commit Checklist

Before pushing to GitHub:

```bash
# 1. Test all features manually
# 2. Check browser console for errors
# 3. Check server terminal for errors
# 4. Test on mobile viewport (F12 → toggle device)
# 5. Run git status to see changes
git status

# 6. Review your changes
git diff

# 7. Commit with descriptive message
git add .
git commit -m "feat: what you changed and why"

# 8. Push (only when ready)
git push
```

## Need Help?

1. **Check server logs** - Look for `[DEBUG]` and `[ERROR]` messages
2. **Use Prisma Studio** - Verify database has correct data
3. **Test in browser** - Open DevTools (F12) → Console tab
4. **Compare with Render** - Check if issue exists on production too

## Advantages of Local Development

| Task | Local | Render |
|------|-------|--------|
| Test changes | Instant | 2-3 min deploy |
| Debug errors | Full console | Limited logs |
| Database | Direct access | No direct access |
| Experiment | Safe | Risky |
| Commit frequency | When ready | Every test |
