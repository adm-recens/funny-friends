# Funny Friends - Fresh Database Deployment Guide

## Pre-Deployment Checklist

Before deploying to production with a fresh database, ensure:

### 1. Environment Variables Set
```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secure-jwt-secret-min-32-characters

# Optional but recommended
SETUP_KEY=your-secure-setup-key-min-10-characters
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.onrender.com
```

### 2. Render.com Configuration
- **Database**: Create new PostgreSQL database
- **Web Service**: Deploy with the start command: `npm start`
- **Build Command**: None needed (dependencies installed automatically)

### 3. What Happens on First Deploy

When you deploy with a fresh database:

1. **Automatic Database Setup**:
   - `prisma db push` creates all tables from schema
   - `prisma generate` creates the Prisma client
   - `seed-games.js` seeds game types (Teen Patti, Rummy)

2. **First Admin Setup**:
   - Visit `https://your-app.onrender.com/setup`
   - Enter your SETUP_KEY
   - Create the first admin username and password
   - This admin can then create operator accounts

3. **Game Ready**:
   - Admin can create operators via Admin Dashboard
   - Operators can create game sessions
   - Players can join sessions
   - Viewers can watch games

## Post-Deployment Verification

### Verify Database Tables Created
Check Render dashboard → PostgreSQL → Tables should show:
- User
- GameType  
- GameSession
- Player
- GameHand
- LoginAttempt
- UserSession
- PlayerAddRequest
- UserGamePermission

### Verify Game Types Seeded
Visit `https://your-app.onrender.com/api/gametypes` - should return:
```json
[
  {
    "code": "teen-patti",
    "name": "Teen Patti",
    "status": "active"
  },
  {
    "code": "rummy", 
    "name": "Rummy",
    "status": "coming-soon"
  }
]
```

### Verify Setup Flow
1. Visit `/setup` - should show setup form
2. Without SETUP_KEY, should show error
3. With valid SETUP_KEY, can create admin
4. After admin created, `/setup` redirects to login

## Common Issues & Solutions

### Issue: "Setup key not configured"
**Cause**: SETUP_KEY environment variable not set  
**Solution**: Add SETUP_KEY in Render environment variables

### Issue: "Database connection failed"  
**Cause**: DATABASE_URL not set or incorrect  
**Solution**: Copy Internal Database URL from Render PostgreSQL dashboard

### Issue: Tables not created
**Cause**: Prisma migrations failed  
**Solution**: Check Render logs for errors, manually run:
```bash
npx prisma db push
```

### Issue: "No game types found"
**Cause**: Seed script didn't run  
**Solution**: Manually run seed:
```bash
npm run db:seed
```

## Production-Ready Features (Already Enabled)

✅ **Security**:
- HTTP-only cookies for JWT
- Rate limiting on login attempts
- Account lockout after 5 failed attempts
- CSRF protection
- Helmet security headers
- Input validation with Zod

✅ **Authentication**:
- Secure password hashing (bcrypt, 12 rounds)
- Session management with expiration
- Device fingerprinting
- Login attempt logging

✅ **Game Features**:
- Real-time multiplayer via WebSocket
- Role-based access (Admin, Operator, Player, Viewer)
- Session-based games with ledger tracking
- Hand history persistence
- Player balance tracking

## Next Steps After Deployment

1. **Create Admin**: Visit `/setup` and create first admin
2. **Create Operators**: Admin dashboard → Add User → Operator
3. **Create Game**: Operator dashboard → New Game
4. **Add Players**: During session setup
5. **Start Playing**: Physical cards + digital ledger!

## Support

If issues persist:
1. Check Render logs (Dashboard → Service → Logs)
2. Verify all environment variables are set
3. Ensure database is connected and accessible
4. Check that `npm start` runs without errors locally

---
**Note**: This deployment guide assumes you're using Render.com. For other platforms, adjust the environment variable setup accordingly.
