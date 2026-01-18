# YouTube Video Management Dashboard

A full-stack application for managing YouTube videos, comments, and notes with AI-powered title suggestions.

## 🚀 Features

- **Google OAuth 2.0 Authentication** with YouTube Data API v3 scopes
- **Video Dashboard** - View video details (title, description, thumbnail, stats)
- **Comment Management** - Fetch, add, reply, and delete comments
- **Video Metadata Editing** - Update title and description
- **Notes System** - CRUD operations with tags, search, and filtering
- **AI Title Suggestions** - Generate 3 improved title suggestions using OpenAI
- **Event Logging** - Comprehensive logging of all user actions

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Vite
- Zustand (state management)
- Axios
- Lucide React (icons)

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Google APIs (YouTube Data API v3)
- OpenAI API
- JWT Authentication

## 📦 Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth & error handling
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── index.ts           # Entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── lib/               # API client
│   │   ├── pages/             # Page components
│   │   ├── store/             # Zustand stores
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/youtube_dashboard

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Encryption (32 bytes hex for AES-256)
ENCRYPTION_KEY=your_64_character_hex_string
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

## 🗄 Database Schema

### User
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| googleId | String | Google OAuth user ID (unique) |
| email | String | User email (unique) |
| name | String? | Display name |
| avatarUrl | String? | Profile picture URL |
| channelId | String? | YouTube channel ID |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### OAuthToken
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| userId | String | Foreign key to User (unique) |
| accessToken | String | Encrypted access token |
| refreshToken | String | Encrypted refresh token |
| accessTokenExpiresAt | DateTime | Token expiration |
| scope | String | Granted OAuth scopes |

### Video
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| youtubeVideoId | String | YouTube video ID |
| userId | String | Foreign key to User |
| title | String | Video title |
| description | String? | Video description |
| thumbnailUrl | String? | Thumbnail URL |
| viewCount | Int | View count |
| likeCount | Int | Like count |
| commentCount | Int | Comment count |
| publishedAt | DateTime? | Publish date |
| privacyStatus | String | public/private/unlisted |
| lastSyncedAt | DateTime | Last sync with YouTube |

### Note
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| content | String | Note content |
| tags | String[] | Array of tags |
| videoId | String | Foreign key to Video |
| userId | String | Foreign key to User |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### EventLog
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| eventType | String | Event type identifier |
| metadata | JSON? | Additional event data |
| userId | String? | Foreign key to User |
| timestamp | DateTime | Event timestamp |

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/url` | Get Google OAuth URL |
| GET | `/api/auth/login` | Redirect to Google OAuth |
| GET | `/api/auth/callback` | OAuth callback handler |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/verify` | Verify token validity |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos/:videoId` | Get video details |
| PUT | `/api/videos/:videoId` | Update video metadata |
| GET | `/api/videos/user/list` | Get user's uploaded videos |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/:videoId` | Get video comments |
| POST | `/api/comments/:videoId` | Add new comment |
| POST | `/api/comments/:commentId/reply` | Reply to comment |
| DELETE | `/api/comments/:commentId` | Delete own comment |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all user notes |
| GET | `/api/notes/:noteId` | Get single note |
| GET | `/api/notes/video/:videoId` | Get notes for video |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/:noteId` | Update note |
| DELETE | `/api/notes/:noteId` | Delete note |
| GET | `/api/notes/tags/all` | Get all user tags |
| GET | `/api/notes/search?q=keyword` | Search notes |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/suggest-titles` | Generate title suggestions |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get user event logs |
| GET | `/api/events/stats` | Get event statistics |

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Cloud Console project with YouTube Data API v3 enabled
- OpenAI API key

### 1. Clone the repository
```bash
git clone <repository-url>
cd youtube-dashboard
```

### 2. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen
6. Add authorized redirect URI: `http://localhost:3001/api/auth/callback`
7. Copy Client ID and Client Secret

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your credentials
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Start development server
npm run dev
```

### 5. Access the application
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🌐 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add environment variables:
   - `VITE_API_URL`: Your backend URL

### Backend (Render)

1. Push code to GitHub
2. Create new Web Service in Render
3. Set root directory to `backend`
4. Build command: `npm install && npm run prisma:generate && npm run build`
5. Start command: `npm start`
6. Add all environment variables

### Database (Render/Supabase/Neon)

1. Create PostgreSQL database
2. Get connection string
3. Update `DATABASE_URL` in backend environment

## 📝 Event Types

All actions are logged to the database:

| Event Type | Description |
|------------|-------------|
| `login` | User logged in |
| `logout` | User logged out |
| `fetch_video` | Video details fetched |
| `update_video_metadata` | Video title/description updated |
| `comment_added` | New comment posted |
| `comment_deleted` | Comment deleted |
| `reply_added` | Reply posted |
| `note_created` | Note created |
| `note_updated` | Note updated |
| `note_deleted` | Note deleted |
| `ai_title_suggestion` | AI titles requested |

## 🔒 Security Features

- JWT-based authentication with HTTP-only cookies
- OAuth tokens encrypted with AES-256-GCM
- Input validation on all endpoints
- CORS configured for frontend origin
- Rate limiting consideration for YouTube API quotas

## 📄 License

MIT License

