# YCC Fair - Photo Scavenger Hunt

A self-contained, real-time group photo scavenger hunt web application built for club fairs. Players compete to capture photos matching keywords, with AI-powered verification and real-time leaderboards.

## 🎯 Features

- **Real-time Camera Integration**: Direct camera access (no file uploads)
- **AI-Powered Verification**: Uses Gemini AI to verify photo submissions with anti-cheat detection
- **Local SQLite Backend**: Self-contained system requiring no external services
- **Token Rewards**: 30% chance to earn tokens for booth rewards
- **Word Progression**: New keywords activate when community reaches goals (5 successful submissions)
- **Duplicate Prevention**: Users can only score once per word
- **Responsive Design**: Optimized for mobile devices at club fairs

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Lucide React (icons)

**Backend:**
- Next.js API Routes
- SQLite Database (local storage)
- JWT Authentication with bcrypt
- Google Gemini AI (photo verification)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ycc-fair
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Gemini API key and JWT secret:
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Database Setup

The SQLite database is automatically created on first run with these tables:
- `users` - User accounts with encrypted passwords
- `words` - 60+ pre-loaded scavenger hunt words
- `submissions` - Photo submissions with duplicate prevention
- `tokens` - Bonus tokens earned by users

### Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file
4. The AI handles photo verification and anti-cheat detection

## 📱 Game Flow

1. **Login/Register**: Username and password authentication (no recovery available)
2. **View Current Keyword**: Display the active challenge word
3. **Camera Capture**: Take photos using device camera
4. **AI Verification**: Photo is analyzed by Gemini AI with anti-cheat detection
5. **Scoring**: Successful matches award points and possibly tokens (30% chance)
6. **Word Progression**: New word activated when 5 players successfully submit
7. **Leaderboard**: View real-time rankings with SQL aggregation

## 🎮 Scoring System

- **Points**: Base 1 point + bonus based on AI confidence
- **Tokens**: 30% random chance on successful submissions
- **Leaderboard**: Ranked by total points, then tokens, then words completed
- **Progression**: Words advance automatically when community succeeds

## 📁 Project Structure

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
├── components/
│   ├── LoginForm.tsx
│   ├── GameInterface.tsx
│   ├── CameraCapture.tsx
│   └── Leaderboard.tsx
├── contexts/
│   └── GameContext.tsx
├── lib/
│   ├── database.ts
│   ├── auth.ts
│   ├── auth-utils.ts
│   └── gemini.ts
└── page.tsx
```

## 🚀 Deployment

### Local Deployment
```bash
npm run build
npm start
```

### Production Notes
- Change `JWT_SECRET` to a strong random value
- Use HTTPS for camera access
- Consider Gemini API rate limits
- Backup `database.sqlite` regularly

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: 24-hour expiration
- **SQL Injection Prevention**: Parameterized queries
- **Anti-cheat Detection**: AI-powered screen photo detection
- **Duplicate Prevention**: Database constraints

## 🎯 **Key Features:**

- **Self-contained**: No external services needed except Gemini AI
- **Local Authentication**: Secure username/password system with JWT
- **Anti-cheat AI**: Detects photos taken of screens to prevent cheating
- **Word Progression**: Automatic advancement when community reaches goals
- **Duplicate Prevention**: Users can only score once per word
- **Real-time Updates**: Live leaderboard and progress tracking
- **Mobile Optimized**: Works great on phones for club fair environment

⚠️ **Important**: There is no password recovery system. Choose memorable passwords!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `npm run lint`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built for YCC Club Fair** 🎪

A complete, self-contained scavenger hunt solution with AI-powered verification and real-time competition!