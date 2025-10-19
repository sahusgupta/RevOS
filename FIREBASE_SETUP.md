# Firebase Integration Setup Guide

This guide explains how to set up Firebase for the RevOS application with the skeleton code that has been created.

## Overview

The Firebase integration includes:
- **Authentication**: Email/password authentication for user accounts
- **Firestore Database**: User profiles, course data, and preferences
- **Cloud Storage**: Transcript file uploads
- **GPT Vision API**: Automatic GPA extraction from transcripts

## Files Created

### 1. `revos-client/src/services/firebase.ts`
Main Firebase configuration and service layer with skeleton functions:
- `registerWithEmailPassword()` - User registration
- `loginWithEmailPassword()` - User login
- `saveUserProfile()` - Save user profile to Firestore
- `updateUserProfile()` - Update user profile
- `getUserProfile()` - Fetch user profile
- `uploadTranscriptFile()` - Upload transcript to Cloud Storage
- `extractGPAFromTranscript()` - Extract GPA from transcript (placeholder)
- `logout()` - Logout user
- `getCurrentUser()` - Get current authenticated user
- `getCurrentUserToken()` - Get user's ID token

### 2. `revos-client/src/services/gpaExtractor.ts`
GPA extraction service with skeleton functions:
- `fileToBase64()` - Convert file to base64 for API
- `extractTranscriptDataWithGPT()` - Call GPT Vision API (commented out)
- `pdfToImage()` - Convert PDF first page to image (uses PDF.js)
- `extractGPAFromTranscript()` - Main extraction pipeline
- `gradeTGPA()` - Convert letter grades to GPA points
- `calculateGPA()` - Calculate GPA from course list

### 3. Enhanced `revos-client/src/components/AuthModal.tsx`
Updated auth flow with additional steps:
- **Login Mode** - Sign in with username/password
- **Register Mode** - Create account with email/password
- **Register Details Mode** - Add first name, last name, school, major, GPA
- **Transcript Upload Mode** - Optional transcript upload with GPA extraction

## Setup Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "RevOS"
4. Enable Google Analytics if desired
5. Create the project

### Step 2: Add Web App

1. In Firebase Console, click the web icon (</> )
2. Register app as "revos-web"
3. Copy the Firebase config object
4. You'll need these values:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### Step 3: Configure Environment Variables

Create a `.env.local` file in the `revos-client/` directory:

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

### Step 4: Enable Authentication

1. In Firebase Console, go to Authentication
2. Click "Sign-in method"
3. Enable "Email/Password"
4. Allow password-less sign-in (optional)

### Step 5: Create Firestore Database

1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose production mode
4. Select your region (closest to your users)
5. Create database

### Step 6: Set Firestore Security Rules

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /syllabi/{syllabusId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### Step 7: Create Cloud Storage Bucket

1. In Firebase Console, go to Storage
2. Click "Get Started"
3. Start in production mode
4. Choose your region

### Step 8: Set Storage Security Rules

```storage rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /transcripts/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Step 9: Install Firebase Dependencies

```bash
cd revos-client
npm install firebase pdfjs-dist
```

### Step 10: Update Firebase Config

Edit `revos-client/src/services/firebase.ts`:
- Replace `firebaseConfig` object with your credentials from Step 2
- Or use environment variables (already set up)

## Implementation TODOs

### In `revos-client/src/services/firebase.ts`:
- [ ] Uncomment and implement `registerWithEmailPassword()`
- [ ] Uncomment and implement `loginWithEmailPassword()`
- [ ] Implement `saveUserProfile()` with your profile structure
- [ ] Implement `uploadTranscriptFile()` to Firebase Storage
- [ ] Implement `extractGPAFromTranscript()` - add API call logic

### In `revos-client/src/services/gpaExtractor.ts`:
- [ ] Uncomment and implement `pdfToImage()` using PDF.js
- [ ] Implement `extractTranscriptDataWithGPT()` with actual OpenAI Vision API call
- [ ] Handle different transcript formats
- [ ] Test with various transcript PDFs/images

### In `revos-client/src/components/AuthModal.tsx`:
- [ ] Connect `handleRegister()` to Firebase registration
- [ ] Connect `handleLogin()` to Firebase login
- [ ] Implement `handleSaveDetails()` to save profile to Firestore
- [ ] Implement `handleTranscriptUpload()` to call GPA extraction
- [ ] Connect `handleCompleteSetup()` to create user profile

## Database Schema

### Users Collection (`/users/{userId}`)
```typescript
{
  uid: string,                 // Firebase Auth UID
  email: string,              // User email
  username: string,           // Username (unique)
  firstName: string,          // First name
  lastName: string,           // Last name
  school: string,             // University/School
  major: string,              // Major/Field of Study
  gpa: number,                // Current GPA (0-4.0)
  transcriptUrl?: string,     // URL to uploaded transcript in Storage
  createdAt: timestamp,       // Account creation date
  updatedAt: timestamp,       // Last profile update
}
```

### Syllabi Collection (`/syllabi/{syllabusId}`)
```typescript
{
  userId: string,             // Owner's UID
  courseId: string,           // Course identifier
  courseName: string,         // Course name
  instructor: string,         // Instructor name
  semester: string,           // Semester (Fall 2025, etc.)
  keyDates: array,            // Important dates
  topics: array,              // Course topics
  gradingBreakdown: array,    // Grading structure
  vectorIds: array,           // Pinecone vector IDs
  createdAt: timestamp,       // Upload date
  updatedAt: timestamp,       // Last update
}
```

## Testing the Integration

### 1. Test Firebase Connection
```javascript
import { getCurrentUser } from './services/firebase';
const user = getCurrentUser();
console.log('Current user:', user);
```

### 2. Test GPA Extraction
```javascript
import { extractGPAFromTranscript } from './services/gpaExtractor';
const gpa = await extractGPAFromTranscript(transcriptFile);
console.log('Extracted GPA:', gpa);
```

### 3. Test User Profile Save
```javascript
import { saveUserProfile } from './services/firebase';
await saveUserProfile(userId, {
  firstName: 'John',
  lastName: 'Doe',
  school: 'Texas A&M',
  major: 'CS',
  gpa: 3.85
});
```

## Next Steps

1. **Complete Firebase setup** using steps above
2. **Implement the skeleton functions** in each service file
3. **Test each function** individually
4. **Integrate with AuthModal** component
5. **Add error handling** for production
6. **Test full registration flow** end-to-end
7. **Add transcript processing** backend support
8. **Deploy to production** with proper environment variables

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that Firebase config values are correct
- Verify environment variables are loaded
- Check Firebase Console for active API keys

### "Firestore: Missing or insufficient permissions"
- Review Firestore security rules
- Ensure user is authenticated before reads/writes
- Check that rule paths match your collection structure

### "GPA extraction not working"
- Verify OpenAI API key is set
- Check that transcript is a valid PDF or image
- Test with clear, high-quality transcript images

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Database](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
