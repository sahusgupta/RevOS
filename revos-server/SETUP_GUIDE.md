# RevOS Setup Guide - Authentication & Database

## 🎯 Overview

The RevOS system now includes:
- ✅ **User Authentication** (JWT-based login/registration)
- ✅ **Persistent Database** (SQLite with SQLAlchemy ORM)
- ✅ **Protected API Endpoints** (Auth middleware)
- ✅ **Syllabus Management** (Per-user syllabi storage & retrieval)
- ✅ **Session Persistence** (Token stored in localStorage)

## 🚀 Quick Start

### 1. Backend Setup

#### Install Dependencies
```bash
cd revos-server
pip install -r requirements.txt
```

#### Environment Variables (.env)
```
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=your-pinecone-environment

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production

# Database (auto-created, no config needed)
# SQLite database will be created at: revos-server/revos.db
```

#### Run the Server
```bash
cd revos-server
python app/app.py
```

The server will:
- Initialize SQLite database
- Create `users` and `syllabi` tables
- Connect to Pinecone vector database
- Start listening on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd revos-client
npm install
npm start
```

The frontend will start on `http://localhost:3000`

## 📋 API Endpoints

### Authentication Routes (`/api/auth`)

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response:
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2025-10-18T..."
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}

Response:
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Verify Token
```bash
POST /api/auth/verify
Content-Type: application/json

{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response:
{
  "valid": true,
  "user": { ... },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Syllabus Routes (Protected - Requires `Authorization: Bearer <token>`)

#### Upload Syllabus (File or Text)
```bash
POST /api/syllabus/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data or application/json

# File upload:
Form data:
  file: <PDF/DOCX/TXT file>

# Text upload:
{
  "raw_text": "Course: CSCE 314..."
}

Response:
{
  "message": "Processed successfully",
  "data": {
    "course": "CSCE 314",
    "instructor": "Dr. Someone",
    "semester": "Fall 2025",
    "keyDates": [...],
    "topics": [...],
    "gradingBreakdown": [...]
  }
}
```

#### List User's Syllabi
```bash
GET /api/syllabus/list
Authorization: Bearer <token>

Response:
{
  "syllabi": [
    {
      "id": 1,
      "course_name": "CSCE 314",
      "instructor": "Dr. Someone",
      "semester": "Fall 2025",
      "keyDates": [...],
      "topics": [...],
      "gradingBreakdown": [...],
      "created_at": "2025-10-18T..."
    }
  ],
  "count": 1
}
```

#### Get Specific Syllabus
```bash
GET /api/syllabus/<syllabus_id>
Authorization: Bearer <token>

Response: { syllabus object }
```

#### Delete Syllabus
```bash
DELETE /api/syllabus/<syllabus_id>
Authorization: Bearer <token>

Response:
{
  "message": "Syllabus deleted successfully"
}
```

#### Ask Rev (Query with Context)
```bash
POST /api/ask-rev
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "When is my CSCE 314 exam?",
  "course_filter": "CSCE 314" (optional)
}

Response:
{
  "response": "Based on your CSCE 314 syllabus...",
  "query": "When is my CSCE 314 exam?"
}
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL
);
```

### Syllabi Table
```sql
CREATE TABLE syllabi (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL FOREIGN KEY,
  course_id VARCHAR(255) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  instructor VARCHAR(255),
  semester VARCHAR(100),
  key_dates JSON,
  topics JSON,
  grading_breakdown JSON,
  vector_ids JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

## 🔐 Authentication Flow

### Frontend → Backend
1. User enters credentials in Auth Modal
2. Frontend sends `POST /api/auth/register` or `POST /api/auth/login`
3. Backend validates and returns JWT token
4. Frontend stores token in `localStorage`
5. Subsequent requests include `Authorization: Bearer <token>` header

### Session Persistence
- Token is saved in `localStorage.authToken`
- User data is saved in `localStorage.user`
- On app reload, session is automatically restored from localStorage
- Token expires after 24 hours

### Protected Routes
- Routes requiring auth check the JWT token in `Authorization` header
- Invalid/expired tokens return `401 Unauthorized`
- Request context includes `request.user_id` for filtering data

## 📊 File Structure

```
revos-server/
├── app/
│   ├── app.py              # Flask app with authentication & routes
│   ├── auth.py             # JWT auth, login/register routes
│   ├── models.py           # User & Syllabus database models
│   └── utils/
│       └── openai.py       # OpenAI/Pinecone integration
├── requirements.txt        # Python dependencies
├── revos.db               # SQLite database (auto-created)
└── .env                   # Environment variables

revos-client/
├── src/
│   ├── components/
│   │   ├── App.tsx                 # Main app with auth state
│   │   ├── AuthModal.tsx           # Login/Register component
│   │   ├── SyllabusManager.tsx     # Syllabus list & management
│   │   ├── SyllabusUpload.tsx      # Upload with auth
│   │   ├── AskRev.tsx             # Query with auth
│   │   └── ...other components
│   ├── App.tsx
│   └── index.tsx
└── package.json
```

## 🧪 Testing the Flow

### 1. Start Backend
```bash
cd revos-server
python app/app.py
```

### 2. Start Frontend
```bash
cd revos-client
npm start
```

### 3. Test Registration
- Click "Sign In" button
- Switch to "Sign up"
- Enter username, email, password
- Click "Create Account"
- Check localStorage: `Application > Storage > Local Storage`

### 4. Test Syllabus Upload
- Upload a syllabus
- Check database: `revos-server/revos.db`
- Query via `GET /api/syllabus/list` with token

### 5. Test Query
- Upload a syllabus with exam dates
- Go to "Ask Rev"
- Ask "When is my exam?"
- Response should reference your uploaded syllabus

## ⚙️ Configuration

### JWT Settings
Edit `revos-server/app/auth.py`:
```python
TOKEN_EXPIRATION_HOURS = 24  # Token expiry time
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-key')  # Change in production!
```

### Database Location
Edit `revos-server/app/app.py`:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{path}/revos.db"
```

### API Base URL
Update in `revos-client/src/App.tsx`:
```typescript
const API_BASE_URL = 'http://localhost:5000';  // Change for production
```

## 🐛 Troubleshooting

### "Invalid authorization header"
- Ensure token is prefixed with "Bearer "
- Check localStorage for valid token
- Verify token hasn't expired (24 hours)

### "User not found"
- User table might not exist
- Run `pip install -r requirements.txt`
- Delete `revos.db` and restart server to reinitialize

### "Cannot import openai"
- Install OpenAI: `pip install 'openai>=1.50.0'`
- Verify OPENAI_API_KEY is set

### "Pinecone connection failed"
- Check PINECONE_API_KEY in .env
- Verify Pinecone index exists
- Check network connectivity

### Frontend shows "Sign in Required"
- Check browser localStorage for `authToken`
- Verify backend is running on port 5000
- Check browser console for API errors

## 📝 Next Steps

- [ ] Deploy to production (change JWT_SECRET_KEY!)
- [ ] Add refresh token logic
- [ ] Implement password reset
- [ ] Add email verification
- [ ] Setup database backups
- [ ] Monitor Pinecone usage
- [ ] Add rate limiting

## 📚 Resources

- [Flask-SQLAlchemy Docs](https://flask-sqlalchemy.palletsprojects.com/)
- [PyJWT Docs](https://pyjwt.readthedocs.io/)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Pinecone Docs](https://docs.pinecone.io/)
