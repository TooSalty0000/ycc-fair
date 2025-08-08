# Local SQLite Backend Setup

## 🎯 Complete Self-Contained Solution

This setup uses Next.js API routes with SQLite for a completely self-contained scavenger hunt application that requires no external services except Gemini AI.

## 🚀 Quick Start

### 1. Environment Setup

Create `.env.local` file:
```bash
# Required: Google Gemini AI API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Required: JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. Start the Application

```bash
npm run dev
```

The SQLite database will be automatically created as `database.sqlite` in your project root on first run.

### 3. Access the Local Version

Navigate to: `http://localhost:3000/local-page`

## 📊 Database Schema

The application creates these tables automatically:

- **users** - User accounts with encrypted passwords
- **words** - Scavenger hunt words with progression tracking  
- **submissions** - Photo submissions with points and AI verification
- **tokens** - Bonus tokens earned by users

## 🎮 Game Flow

1. **Registration/Login** - Simple username/password authentication
2. **Word Display** - Current active word shown to all players
3. **Photo Submission** - Direct AI verification with anti-cheat detection
4. **Points & Tokens** - Automatic scoring with 30% token chance
5. **Word Progression** - New word activated when enough submissions received
6. **Leaderboard** - Real-time rankings with SQL aggregation

## ⚙️ Key Features

### Authentication
- Local SQLite storage with bcrypt password hashing
- JWT tokens for session management
- No external authentication services required

### Word Management  
- 60+ pre-loaded words with random selection
- Automatic progression when threshold reached (default: 5 submissions)
- Prevents duplicate submissions per user per word

### AI Integration
- Direct Gemini API integration for photo verification
- Advanced anti-cheat detection for screen photos
- Confidence-based scoring system

### Leaderboard System
- Real-time SQL aggregation queries
- Points and tokens tracking
- Automatic updates after submissions

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login

### Game Logic
- `GET /api/game/current-word` - Get active word and progress
- `POST /api/game/submit` - Submit photo for AI verification
- `GET /api/game/leaderboard` - Get top players
- `GET /api/game/user-stats` - Get current user statistics

## 📁 File Structure

```
src/app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── register/route.ts
│   └── game/
│       ├── current-word/route.ts
│       ├── submit/route.ts
│       ├── leaderboard/route.ts
│       └── user-stats/route.ts
├── contexts/
│   └── LocalGameContext.tsx
├── components/
│   ├── LocalLoginForm.tsx
│   └── LocalGameInterface.tsx
├── lib/
│   ├── database.ts
│   ├── auth-utils.ts
│   └── local-auth.ts
└── local-page.tsx
```

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with expiration
- SQL injection prevention with parameterized queries
- Unique constraints to prevent duplicate submissions
- Anti-cheat AI detection for screen photos

## 🎛️ Configuration

### Word Requirements
Default: 5 successful submissions per word
To change: Modify `required_completions` in database.ts

### Token Probability  
Default: 30% chance per successful submission
To change: Modify probability in submit route

### JWT Expiration
Default: 24 hours
To change: Modify expiration in auth routes

## 📱 Production Deployment

1. Change `JWT_SECRET` to a strong random value
2. Ensure SQLite database file has proper permissions
3. Consider backing up `database.sqlite` regularly
4. Use HTTPS for camera access in production

## 🔍 Development Tools

- **AI Test Panel** - Available in development mode
- **Database Browser** - Use SQLite browser to inspect `database.sqlite`  
- **API Testing** - All endpoints accept Bearer token authentication

This setup provides a complete, production-ready scavenger hunt application with no dependencies on external services beyond the Gemini AI API!