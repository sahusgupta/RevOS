import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
  apiBaseUrl?: string;
}

type AuthMode = 'login' | 'register' | 'register-details' | 'transcript';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  apiBaseUrl = 'http://localhost:5000'
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [extractedGPA, setExtractedGPA] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    major: '',
    school: '',
    gpa: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  // TODO: Validate form data before submission
  const validateForm = () => {
    if (mode === 'login') {
      if (!formData.username || !formData.password) {
        setError('Username and password required');
        return false;
      }
      return true;
    }
    
    if (mode === 'register') {
      if (!formData.username || formData.username.length < 3) {
        setError('Username must be at least 3 characters');
        return false;
      }
      if (!formData.email || !formData.email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      return true;
    }

    if (mode === 'register-details') {
      if (!formData.firstName || !formData.lastName) {
        setError('First and last name are required');
        return false;
      }
      if (!formData.major || !formData.school) {
        setError('Major and school are required');
        return false;
      }
      return true;
    }

    return true;
  };

  // TODO: Implement transcript upload and GPA extraction
  const handleTranscriptUpload = async (file: File) => {
    setTranscriptFile(file);
    setLoading(true);
    try {
      // TODO: Call API to extract GPA from transcript
      // const gpa = await extractGPAFromTranscript(file);
      // setExtractedGPA(gpa);
      console.log('📄 Transcript uploaded:', file.name);
      // Placeholder - in real implementation this would call GPT vision or similar
      setExtractedGPA(3.85);
      setError(null);
    } catch (e) {
      setError('Failed to extract GPA from transcript');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // TODO: Implement Firebase authentication
  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // TODO: Use Firebase Authentication
      // const result = await firebaseSignInWithEmailAndPassword(formData.email, formData.password);
      // const token = await result.user.getIdToken();
      
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // TODO: Implement Firebase registration
  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // TODO: Use Firebase Authentication for signup
      // const result = await firebaseCreateUserWithEmailAndPassword(formData.email, formData.password);
      
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      // Move to details step
      setMode('register-details');
      setError(null);
    } catch (e) {
      setError((e as Error).message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // TODO: Save user profile details to Firestore
  const handleSaveDetails = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // TODO: Save to Firestore database
      // await firebaseUpdateUserProfile({
      //   firstName: formData.firstName,
      //   lastName: formData.lastName,
      //   major: formData.major,
      //   school: formData.school,
      //   gpa: extractedGPA || parseFloat(formData.gpa),
      // });
      
      console.log('📝 Profile details saved:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        major: formData.major,
        school: formData.school,
        gpa: extractedGPA || formData.gpa,
      });

      // Move to transcript step
      setMode('transcript');
      setError(null);
    } catch (e) {
      setError((e as Error).message || 'Failed to save details');
    } finally {
      setLoading(false);
    }
  };

  // TODO: Link transcript to user profile in Firestore
  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      // TODO: Upload transcript to Firebase Storage
      // const transcriptUrl = await uploadTranscriptToFirebaseStorage(transcriptFile);
      // TODO: Link transcript URL to user profile in Firestore
      // await firebaseUpdateUserProfile({
      //   transcriptUrl: transcriptUrl,
      //   setupComplete: true,
      // });

      console.log('✅ Account setup complete');
      // TODO: Get Firebase ID token and call onAuthSuccess
      // const token = await currentFirebaseUser.getIdToken();
      // onAuthSuccess(token, { /* user data from Firestore */ });
      
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'register-details' && 'Tell us about yourself'}
            {mode === 'transcript' && 'Upload Your Transcript'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="bg-red-500/10 border-red-600/30">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username" className="text-foreground">Username or Email</Label>
              <Input
                id="login-username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-foreground">Password</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-[#500000] hover:bg-[#8B0000]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button
                onClick={() => {
                  setMode('register');
                  setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    firstName: '',
                    lastName: '',
                    major: '',
                    school: '',
                    gpa: '',
                  });
                  setError(null);
                }}
                variant="outline"
                className="flex-1 border-secondary text-secondary hover:bg-secondary/10"
              >
                Create Account
              </Button>
            </div>
          </div>
        )}

        {/* REGISTER MODE */}
        {mode === 'register' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-username" className="text-foreground">Username</Label>
              <Input
                id="reg-username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-foreground">Email</Label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-foreground">Password</Label>
              <Input
                id="reg-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 6 characters"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm" className="text-foreground">Confirm Password</Label>
              <Input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 bg-[#500000] hover:bg-[#8B0000]"
              >
                {loading ? 'Creating...' : 'Continue'}
              </Button>
              <Button
                onClick={() => {
                  setMode('login');
                  setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    firstName: '',
                    lastName: '',
                    major: '',
                    school: '',
                    gpa: '',
                  });
                  setError(null);
                }}
                variant="outline"
                className="flex-1 border-secondary text-secondary hover:bg-secondary/10"
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}

        {/* REGISTER DETAILS MODE */}
        {mode === 'register-details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="school" className="text-foreground">School/University</Label>
              <Input
                id="school"
                name="school"
                value={formData.school}
                onChange={handleInputChange}
                placeholder="e.g., Texas A&M University"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major" className="text-foreground">Major</Label>
              <Input
                id="major"
                name="major"
                value={formData.major}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpa" className="text-foreground">Current GPA</Label>
              <Input
                id="gpa"
                name="gpa"
                value={formData.gpa}
                onChange={handleInputChange}
                placeholder="e.g., 3.85"
                className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/40"
              />
              <p className="text-xs text-muted-foreground">You can also upload your transcript to auto-fill this</p>
            </div>
            <Button
              onClick={handleSaveDetails}
              disabled={loading}
              className="w-full bg-[#500000] hover:bg-[#8B0000]"
            >
              {loading ? 'Saving...' : 'Next: Upload Transcript'}
            </Button>
          </div>
        )}

        {/* TRANSCRIPT UPLOAD MODE */}
        {mode === 'transcript' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#CFAF5A]/30 rounded-xl p-8 text-center hover:border-[#CFAF5A]/60 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-3 text-secondary" />
              <p className="text-foreground font-semibold mb-1">Upload Your Transcript</p>
              <p className="text-muted-foreground text-sm mb-4">PDF or image file (optional)</p>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleTranscriptUpload(e.target.files[0]);
                  }
                }}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="transcript-input"
              />
              <label htmlFor="transcript-input" className="cursor-pointer">
                <Button asChild className="bg-[#500000] hover:bg-[#8B0000]">
                  <span>Choose File</span>
                </Button>
              </label>
            </div>

            {transcriptFile && (
              <div className="bg-green-500/10 border border-green-600/30 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground font-semibold">{transcriptFile.name}</p>
                  {extractedGPA && (
                    <p className="text-green-300 text-sm">GPA extracted: <strong>{extractedGPA.toFixed(2)}</strong></p>
                  )}
                </div>
              </div>
            )}

            <Alert className="bg-blue-500/10 border-blue-600/30">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-300 text-sm">
                Transcript upload is optional. Click "Complete Setup" to finish without uploading.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleCompleteSetup}
              disabled={loading}
              className="w-full bg-[#500000] hover:bg-[#8B0000]"
            >
              {loading ? 'Completing...' : 'Complete Setup'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
