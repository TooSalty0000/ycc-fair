# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **YCC Fair Photo Scavenger Hunt** web application - a real-time group photo challenge game built for club fairs. Players compete to capture photos matching keywords, verified by AI, with live leaderboards and coupon rewards.

**Key Features:**
- Real-time camera capture (no file uploads)
- AI-powered photo verification via Gemini
- Live leaderboards with Firebase
- Socket.IO for real-time updates
- Coupon reward system for booth prizes
- Dynamic keyword changes based on player progress

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (must pass before commits)

### Docker Commands
- `docker-compose up --build` - Build and run production container on port 16181
- `docker-compose down` - Stop and remove containers

## Architecture & Key Components

### App Structure
- **GameProvider** (`contexts/GameContext.tsx`) - Main state management with Socket.IO integration
- **LoginForm** (`components/LoginForm.tsx`) - Simple username/password authentication
- **GameInterface** (`components/GameInterface.tsx`) - Main game screen with keyword display, camera, and stats
- **CameraCapture** (`components/CameraCapture.tsx`) - Direct camera access with photo capture
- **Leaderboard** (`components/Leaderboard.tsx`) - Real-time player rankings

### State Management
- React Context API for global game state (`contexts/GameContext.tsx`)
- No external real-time services - purely Next.js API routes
- SQLite database for all persistent data (no Firebase)

### External Integrations
- **SQLite Database**: Local storage for users, words, submissions, and leaderboard data
- **Google Gemini AI**: Advanced multimodal AI for photo verification and anti-cheat detection
- **JWT Authentication**: Secure token-based authentication with bcrypt password hashing

### Styling System
- Tailwind CSS v4 with indigo/blue theme
- Responsive design optimized for mobile devices
- Lucide React icons throughout UI
- Custom gradient backgrounds and card layouts

## Environment Setup

Required environment variables in `.env.local`:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Key Development Notes

- **Camera requires HTTPS** in production for security
- **Gemini API Key** required for AI verification functionality
- **JWT Secret** must be changed in production for security
- **SQLite Database** automatically created on first run as `database.sqlite`
- **Linting must pass** before any commits - run `npm run lint`
- **TypeScript strict mode** - all types must be properly defined
- **Mobile-first design** - optimized for club fair environment
- **No password recovery** - Users cannot recover forgotten passwords
- **Rate limiting** - Consider Gemini API quotas for production use
- **Self-contained** - No external services except Gemini AI required
- **Korean Localization** - All user-facing error/success messages are in Korean
- **Docker Production** - Uses Node.js 20 Alpine with better-sqlite3 support
- **Database Path** - Production uses `/app/data/database.sqlite`, development uses `./database.sqlite`

## Game Flow Logic

1. User logs in with username/password (local authentication)
2. Current keyword displayed from SQLite database
3. User captures photo with camera
4. Photo sent directly to Gemini AI for verification
5. AI analyzes image for keyword match AND screen detection (anti-cheat)
6. Success: points awarded based on confidence, possible coupon reward (30% chance)
7. Results stored in SQLite database, leaderboard updates automatically
8. Word progression occurs when enough users successfully submit (default: 5 submissions)

## AI Verification System

**Gemini Integration:**
- Direct client-side integration with Google Gemini 1.5 Flash model
- Advanced prompt engineering for accurate keyword detection
- Built-in anti-cheat system that detects screen photos
- Confidence-based scoring system (bonus points for high confidence)
- Comprehensive error handling and fallback systems

**Anti-Cheat Features:**
- Detects photos taken of screens (phones, computers, tablets)
- Looks for screen glare, pixelation, bezels, and digital artifacts
- Prevents users from searching images online instead of finding real objects
- Moiré pattern and screen door effect detection

## Local Backend System

**Next.js API Routes:**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - Account creation  
- `POST /api/auth/change-password` - Change user password (requires current password)
- `GET /api/game/current-word` - Get active word and progress
- `POST /api/game/submit` - Submit photo for AI verification
- `GET /api/game/leaderboard` - Get top players
- `GET /api/game/user-stats` - Get current user statistics

**SQLite Database Schema:**
- `users` - User accounts with encrypted passwords
- `words` - Scavenger hunt words with progression tracking
- `submissions` - Photo submissions with points (prevents duplicates per user/word)
- `tokens` - Bonus coupons earned by users
- `settings` - Configuration values (e.g., coupon drop rates)

## Development Features

**AI Testing Panel** (Development Mode Only):
- Test Gemini API connection
- Upload and verify test images
- Debug AI responses and confidence levels
- Validate anti-cheat detection
- Access via "AI Test" button in development build