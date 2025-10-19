// Firebase Configuration and Initialization
// TODO: Replace with your actual Firebase project config from Firebase Console

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// TODO: Fill in your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence);

// Types for Firestore user profile
export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  school: string;
  major: string;
  gpa: number;
  transcriptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// TODO: Implement user registration with email and password
export async function registerWithEmailPassword(email: string, password: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ User registered:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
}

// TODO: Implement user login with email and password
export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ User logged in:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

// TODO: Save user profile to Firestore
export async function saveUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      uid: userId,
      updatedAt: new Date(),
    }, { merge: true });
    console.log('📝 Profile saved for user:', userId);
  } catch (error) {
    console.error('❌ Error saving profile:', error);
    throw error;
  }
}

// TODO: Update user profile in Firestore
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });
    console.log('✏️ Profile updated for user:', userId);
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
}

// TODO: Fetch user profile from Firestore
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      console.log('📖 Profile fetched for user:', userId);
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    throw error;
  }
}

// TODO: Upload transcript to Firebase Storage
export async function uploadTranscriptFile(userId: string, file: File): Promise<string> {
  try {
    const fileRef = ref(storage, `transcripts/${userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    console.log('📄 Transcript uploaded:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error('❌ Error uploading transcript:', error);
    throw error;
  }
}

// TODO: Extract GPA from transcript using GPT Vision API
export async function extractGPAFromTranscript(file: File): Promise<number | null> {
  try {
    // TODO: Implement GPT Vision API call to extract GPA
    // This would involve:
    // 1. Converting the image/PDF to base64
    // 2. Calling OpenAI Vision API with the image
    // 3. Parsing the response for GPA information
    
    console.log('🤖 Extracting GPA from transcript:', file.name);
    // Placeholder return
    return 3.85;
  } catch (error) {
    console.error('❌ Error extracting GPA:', error);
    throw error;
  }
}

// TODO: Get user by username (for registration validation)
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return querySnapshot.docs[0].data() as UserProfile;
  } catch (error) {
    console.error('❌ Error fetching user by username:', error);
    throw error;
  }
}

// TODO: Logout user
export async function logout(): Promise<void> {
  try {
    await auth.signOut();
    console.log('👋 User logged out');
  } catch (error) {
    console.error('❌ Error logging out:', error);
    throw error;
  }
}

// TODO: Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// TODO: Get current user's ID token
export async function getCurrentUserToken(): Promise<string | null> {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  return null;
}
