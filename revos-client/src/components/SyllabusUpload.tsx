import { GlassPanel } from './GlassPanel';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, FileText, CheckCircle, Calendar, BookOpen, Target, Type, File, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';

type UploadStage = 'upload' | 'processing' | 'complete' | 'error';

interface SyllabusData {
  course: string;
  instructor: string;
  semester: string;
  assignments?: number;
  exams?: number;
  projects?: number;
  keyDates: Array<{
    date: string;
    event: string;
    type: 'exam' | 'assignment' | 'project' | 'other';
  }>;
  topics: string[];
  gradingBreakdown: Array<{
    category: string;
    weight: number;
  }>;
  raw_text?: string;
}

interface SyllabusUploadProps {
  authToken?: string;
  apiBaseUrl?: string;
}

export function SyllabusUpload({ authToken, apiBaseUrl = 'http://localhost:5000' }: SyllabusUploadProps) {
  const [stage, setStage] = useState<UploadStage>('upload');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [syllabusText, setSyllabusText] = useState('');
  const [parsedData, setParsedData] = useState<SyllabusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [topicDescriptions, setTopicDescriptions] = useState<{ [key: string]: string }>({});
  const [loadingTopics, setLoadingTopics] = useState<string[]>([]);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  // API utility functions
  const uploadTextToAPI = async (rawText: string): Promise<SyllabusData> => {
    console.log('🚀 Sending text to API:', { raw_text: rawText.substring(0, 100) + '...' });
    
    const response = await fetch(`${apiBaseUrl}/api/syllabus/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ raw_text: rawText }),
    });

    console.log('📡 API Response Status:', response.status, response.statusText);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 Raw API Response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Failed to parse error response as JSON:', e);
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.error || 'Failed to upload syllabus text');
    }

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('✅ Parsed API Response:', result);
    } catch (e) {
      console.error('❌ Failed to parse success response as JSON:', e);
      throw new Error('Invalid JSON response from server');
    }

    return result.data;
  };

  const uploadFileToAPI = async (file: File): Promise<SyllabusData> => {
    console.log('🚀 Sending file to API:', { name: file.name, size: file.size, type: file.type });
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiBaseUrl}/api/syllabus/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
    });

    console.log('📡 File API Response Status:', response.status, response.statusText);
    console.log('📡 File API Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 Raw File API Response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Failed to parse file error response as JSON:', e);
        throw new Error(`File API Error ${response.status}: ${responseText}`);
      }
      console.error('❌ File API Error:', errorData);
      throw new Error(errorData.error || 'Failed to upload file');
    }

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('✅ Parsed File API Response:', result);
    } catch (e) {
      console.error('❌ Failed to parse file success response as JSON:', e);
      throw new Error('Invalid JSON response from server');
    }

    return result.data || result;
  };

  const fetchTopicDescription = async (topic: string) => {
    // Check if we already have this description cached
    if (topicDescriptions[topic]) {
      return topicDescriptions[topic];
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/ask-rev`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          query: `Provide a brief, educational definition of "${topic}" in the context of computer science/engineering education. Keep it to 2-3 sentences, clear and concise.`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch description');
      }

      const data = await response.json();
      console.log('📝 Topic description response:', data);
      
      // Extract description from various possible response formats
      const description = data.response || data.message || data.data || JSON.stringify(data).substring(0, 200) || 'Description unavailable';
      
      console.log('✅ Extracted description:', description);
      
      // Cache the description
      setTopicDescriptions(prev => ({
        ...prev,
        [topic]: description
      }));

      return description;
    } catch (e) {
      console.error('Error fetching topic description:', e);
      return 'Unable to load description';
    }
  };

  const parseSyllabusText = (text: string): Partial<SyllabusData> => {
    // Basic parsing logic - this could be enhanced with more sophisticated parsing
    
    let course = '';
    let instructor = '';
    let semester = '';
    const keyDates: Array<{ date: string; event: string; type: 'exam' | 'assignment' | 'project' | 'other' }> = [];
    const topics: string[] = [];
    const gradingBreakdown: Array<{ category: string; weight: number }> = [];

    // Extract course information
    const courseMatch = text.match(/(?:course|class):\s*(.+)/i) || text.match(/^([A-Z]{2,4}\s*\d{3}[A-Z]?:?\s*.+)/im);
    if (courseMatch) {
      course = courseMatch[1].trim();
    }

    // Extract instructor
    const instructorMatch = text.match(/(?:instructor|professor|teacher):\s*(.+)/i);
    if (instructorMatch) {
      instructor = instructorMatch[1].trim();
    }

    // Extract semester
    const semesterMatch = text.match(/(?:semester|term):\s*(.+)/i) || text.match(/(fall|spring|summer)\s*\d{4}/i);
    if (semesterMatch) {
      semester = semesterMatch[1] || semesterMatch[0];
    }

    // Extract dates (basic patterns)
    const datePatterns = [
      /(?:exam|test|quiz).*?(\w+\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{4})?)/gi,
      /(?:assignment|homework|hw).*?(?:due|deadline).*?(\w+\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{4})?)/gi,
      /(?:project).*?(?:due|deadline).*?(\w+\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{4})?)/gi,
    ];

    datePatterns.forEach((pattern, index) => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const fullMatch = match[0];
        const date = match[1];
        const type = index === 0 ? 'exam' : index === 1 ? 'assignment' : 'project';
        
        keyDates.push({
          date: date,
          event: fullMatch.split(date)[0].trim(),
          type: type as 'exam' | 'assignment' | 'project'
        });
      });
    });

    // Extract grading breakdown
    const gradingMatches = Array.from(text.matchAll(/([^:\n]+):\s*(\d+)%/g));
    gradingMatches.forEach(match => {
      const category = match[1].trim();
      const weight = parseInt(match[2]);
      if (weight > 0 && weight <= 100) {
        gradingBreakdown.push({ category, weight });
      }
    });

    return {
      course: course || 'Unknown Course',
      instructor: instructor || 'Unknown Instructor',
      semester: semester || 'Unknown Semester',
      keyDates,
      topics,
      gradingBreakdown,
      raw_text: text
    };
  };

  const handleFileUpload = async (file?: File) => {
    try {
      setStage('processing');
      setProgress(0);
      setError(null);

      const fileToProcess = file || uploadedFile;
      if (!fileToProcess) {
        // Trigger file input
        fileInputRef.current?.click();
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
      const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
      const fileExtension = fileToProcess.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileToProcess.type) && !allowedExtensions.includes(fileExtension || '')) {
        throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload file directly to API (server will handle parsing)
      const result = await uploadFileToAPI(fileToProcess);

      clearInterval(progressInterval);
      setProgress(100);
      setParsedData(result);
      setUploadedFile(null);
      setSyllabusText('');
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => setStage('complete'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
      setStage('error');
    }
  };

  const handleTextUpload = async () => {
    if (!syllabusText.trim()) {
      return;
    }

    try {
      setStage('processing');
      setProgress(0);
      setError(null);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadTextToAPI(syllabusText);

      clearInterval(progressInterval);
      setProgress(100);
      setParsedData(result);
      setUploadedFile(null);
      setSyllabusText('');
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => setStage('complete'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the text');
      setStage('error');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      handleFileUpload(file);
    }
  };

  // Default data for display when no real data is available
  const defaultParsedData: SyllabusData = {
    course: 'CSCE 314: Programming Languages',
    instructor: 'Dr. Hyunyoung Lee',
    semester: 'Fall 2025',
    assignments: 8,
    exams: 3,
    projects: 2,
    keyDates: [
      { date: 'Oct 25', event: 'Midterm Exam', type: 'exam' },
      { date: 'Nov 1', event: 'Project 1 Due', type: 'project' },
      { date: 'Nov 15', event: 'Assignment 5', type: 'assignment' },
      { date: 'Dec 10', event: 'Final Exam', type: 'exam' },
    ],
    topics: [
      'Functional Programming',
      'Type Systems',
      'Lambda Calculus',
      'Haskell',
      'Programming Paradigms',
    ],
    gradingBreakdown: [
      { category: 'Assignments', weight: 40 },
      { category: 'Exams', weight: 40 },
      { category: 'Projects', weight: 15 },
      { category: 'Participation', weight: 5 },
    ]
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setUploadedFile(files[0]);
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.docx,.txt"
        style={{ display: 'none' }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-foreground mb-2">Syllabus Parser</h1>
        <p className="text-foreground/60">Upload your syllabus and let Rev extract key dates, assignments, and create a personalized study plan</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {stage === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassPanel className="min-h-[300px] flex flex-col items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center"
              >
                <AlertCircle className="w-10 h-10 text-red-400" />
              </motion.div>
              <h2 className="text-foreground mb-2">Upload Failed</h2>
              <p className="text-foreground/60 text-center mb-6 max-w-md">
                {error || 'An error occurred while processing your syllabus'}
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setStage('upload');
                    setError(null);
                    setSyllabusText('');
                    setUploadedFile(null);
                  }}
                  className="gradient-maroon glow-maroon hover:opacity-90"
                >
                  Try Again
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {stage === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassPanel glow="maroon" className="min-h-[500px]">
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <File className="w-4 h-4" />
                    File Upload
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Text Input
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-0">
                  <div className="flex flex-col items-center justify-center">
                    <motion.div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      animate={{
                        scale: dragActive ? 1.05 : 1,
                        borderColor: dragActive ? '#CFAF5A' : 'rgba(207, 175, 90, 0.2)'
                      }}
                      className={`w-full max-w-2xl p-12 rounded-2xl border-2 border-dashed transition-all ${
                        dragActive ? 'glass-card glow-gold' : 'glass-card'
                      }`}
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-maroon glow-maroon flex items-center justify-center"
                      >
                        <Upload className="w-10 h-10 text-secondary" />
                      </motion.div>
                      
                      <h2 className="text-foreground text-center mb-2">Drop your syllabus here</h2>
                      <p className="text-foreground/60 text-center mb-6">or click to browse files</p>
                      
                      <div className="flex justify-center gap-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handleFileUpload()}
                            className="gradient-maroon glow-maroon hover:opacity-90"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload PDF
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handleFileUpload()}
                            variant="outline"
                            className="border-secondary text-secondary hover:bg-secondary/10"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Upload DOCX
                          </Button>
                        </motion.div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-white/10">
                        <p className="text-muted-foreground text-center">Supported formats: PDF, DOCX, TXT</p>
                        <p className="text-muted-foreground text-center mt-2">Max file size: 10MB</p>
                      </div>
                    </motion.div>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-0">
                  <div className="space-y-6">
                    <div className="text-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-16 h-16 mx-auto rounded-2xl gradient-maroon glow-maroon flex items-center justify-center mb-4"
                      >
                        <Type className="w-8 h-8 text-secondary" />
                      </motion.div>
                      <h3 className="text-foreground mb-2">Paste Your Syllabus Text</h3>
                      <p className="text-muted-foreground">
                        Copy and paste your syllabus content directly into the text area below
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Textarea
                        placeholder="Paste your syllabus content here...

Example:
CSCE 314: Programming Languages
Fall 2025
Instructor: Dr. Hyunyoung Lee

Course Description:
This course covers functional programming concepts...

Important Dates:
- Midterm Exam: October 25, 2025
- Project 1 Due: November 1, 2025
- Final Exam: December 10, 2025

Grading:
- Assignments: 40%
- Exams: 40%
- Projects: 15%
- Participation: 5%"
                        value={syllabusText}
                        onChange={(e) => setSyllabusText(e.target.value)}
                        className="min-h-[300px] bg-card/50 border-border text-foreground placeholder:text-muted-foreground/40 resize-none"
                      />
                      
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                          {syllabusText.length} characters
                        </p>
                        <Button
                          onClick={handleTextUpload}
                          disabled={!syllabusText.trim()}
                          className="gradient-maroon glow-maroon hover:opacity-90 px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Process Text
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="glass-card p-4 rounded-xl text-center">
                  <Calendar className="w-8 h-8 text-secondary mx-auto mb-2" />
                  <p className="text-foreground">Auto-extract key dates</p>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <Target className="w-8 h-8 text-secondary mx-auto mb-2" />
                  <p className="text-foreground">Identify assignments</p>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <BookOpen className="w-8 h-8 text-secondary mx-auto mb-2" />
                  <p className="text-foreground">Generate study plan</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {stage === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassPanel glow="gold" className="min-h-[500px] flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 mb-6 rounded-2xl gradient-maroon glow-maroon flex items-center justify-center"
              >
                <FileText className="w-10 h-10 text-secondary" />
              </motion.div>

              <h2 className="text-foreground mb-2">Processing your syllabus...</h2>
              <p className="text-foreground/60 mb-8">Rev is analyzing the document</p>

              <div className="w-full max-w-md">
                <Progress value={progress} className="h-3 bg-white/10 mb-4" />
                <p className="text-secondary text-center">{progress}%</p>
              </div>

              <div className="mt-8 space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: progress > 20 ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className={`w-5 h-5 ${progress > 20 ? 'text-secondary' : 'text-foreground/30'}`} />
                  <span className="text-foreground/80">Extracting course information</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: progress > 40 ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className={`w-5 h-5 ${progress > 40 ? 'text-secondary' : 'text-foreground/30'}`} />
                  <span className="text-foreground/80">Identifying key dates</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: progress > 60 ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className={`w-5 h-5 ${progress > 60 ? 'text-secondary' : 'text-foreground/30'}`} />
                  <span className="text-foreground/80">Parsing assignments</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: progress > 80 ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className={`w-5 h-5 ${progress > 80 ? 'text-secondary' : 'text-foreground/30'}`} />
                  <span className="text-foreground/80">Generating study plan</span>
                </motion.div>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {stage === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="space-y-6">
              {(() => {
                const displayData = parsedData || defaultParsedData;
                return (
                  <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                <GlassPanel glow="gold" className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-maroon glow-maroon flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-secondary" />
                  </motion.div>
                  <h2 className="text-foreground mb-2">Syllabus Parsed Successfully!</h2>
                  <p className="text-foreground/60">Rev has extracted all the key information</p>
                </GlassPanel>
              </motion.div>

              {/* Course Header */}
              <GlassPanel className="bg-gradient-to-r from-[#500000]/20 to-[#CFAF5A]/10 border border-[#CFAF5A]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-secondary mb-2">{displayData.course}</h1>
                    <p className="text-foreground/80">{displayData.semester}</p>
                    <p className="text-foreground/60">Instructor: {displayData.instructor}</p>
                  </div>
                  <div className="text-right">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-secondary">{displayData.exams || 0}</p>
                        <p className="text-foreground/60 text-sm">Exams</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-secondary">{displayData.assignments || 0}</p>
                        <p className="text-foreground/60 text-sm">Assignments</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-secondary">{displayData.projects || 0}</p>
                        <p className="text-foreground/60 text-sm">Projects</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Timeline - Key Dates */}
              <GlassPanel>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-secondary" />
                  Important Dates
                </h2>
                <div className="space-y-4">
                  {displayData.keyDates.length > 0 ? (
                    <div className="relative">
                      {displayData.keyDates.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-4 mb-6"
                        >
                          {/* Timeline Dot */}
                          <div className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              item.type === 'exam' ? 'bg-red-500/50 border-red-400' :
                              item.type === 'project' ? 'bg-[#CFAF5A]/50 border-secondary' :
                              'bg-blue-500/50 border-blue-400'
                            }`} />
                            {index !== displayData.keyDates.length - 1 && (
                              <div className="w-0.5 h-12 bg-gradient-to-b from-white/20 to-transparent mt-2" />
                            )}
                          </div>

                          {/* Event Content */}
                          <div className="flex-1 pb-4">
                            <div className={`p-4 rounded-xl glass-card border-l-4 ${
                              item.type === 'exam' ? 'border-red-500' :
                              item.type === 'project' ? 'border-secondary' :
                              'border-blue-500'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-foreground font-semibold">{item.event}</h3>
                                  <p className="text-foreground/60 text-sm mt-1">{item.date}</p>
                                </div>
                                <Badge className={
                                  item.type === 'exam' ? 'bg-red-500/20 text-red-300' :
                                  item.type === 'project' ? 'bg-[#CFAF5A]/20 text-secondary' :
                                  'bg-blue-500/20 text-blue-300'
                                }>
                                  {item.type === 'exam' ? '📝 Exam' :
                                   item.type === 'project' ? '🎯 Project' :
                                   item.type === 'assignment' ? '✍️ Assignment' :
                                   '📅 Event'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-foreground/60 text-center py-8">No key dates found in syllabus</p>
                  )}
                </div>
              </GlassPanel>

              {/* Topics - Concept Map */}
              <GlassPanel>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-secondary" />
                  Course Concepts
                </h2>
                {displayData.topics.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {displayData.topics.map((topic, index) => {
                      const isLoading = loadingTopics.includes(topic);
                      const hasDescription = topicDescriptions[topic];
                      const isHovered = hoveredTopic === topic;

                      return (
                        <div key={index} className="relative group">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.08, y: -5 }}
                            className="cursor-pointer"
                            onMouseEnter={() => {
                              setHoveredTopic(topic);
                              if (!topicDescriptions[topic]) {
                                setLoadingTopics(prev => [...prev, topic]);
                                fetchTopicDescription(topic).then(() => {
                                  setLoadingTopics(prev => prev.filter(t => t !== topic));
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredTopic(null)}
                          >
                            <div className="p-4 rounded-xl bg-gradient-to-br from-[#CFAF5A]/20 to-[#CFAF5A]/5 border border-[#CFAF5A]/30 hover:border-[#CFAF5A]/60 transition-all text-center group-hover:shadow-lg group-hover:shadow-[#CFAF5A]/20">
                              <p className="text-foreground text-sm font-medium">{topic}</p>
                            </div>
                          </motion.div>

                          {/* Tooltip with Description */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="absolute z-50 left-1/2 transform -translate-x-1/2 top-full mt-3 w-64 bg-[#500000]/80 backdrop-blur border border-[#CFAF5A]/60 rounded-xl p-5 shadow-2xl shadow-black/70 pointer-events-none"
                              >
                                <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-[#CFAF5A] rounded-full" />
                                {isLoading ? (
                                  <div className="flex items-center gap-3">
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-4 h-4 border-2 border-[#CFAF5A] border-t-transparent rounded-full flex-shrink-0"
                                    />
                                    <p className="text-[#CFAF5A] text-sm font-medium">Loading description...</p>
                                  </div>
                                ) : hasDescription ? (
                                  <div>
                                    <p className="text-[#CFAF5A] text-sm font-bold mb-3 break-words">{topic}</p>
                                    <p className="text-white text-sm leading-relaxed break-words whitespace-normal">{hasDescription}</p>
                                  </div>
                                ) : (
                                  <p className="text-[#CFAF5A]/70 text-sm">Unable to load description</p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-center py-8">No topics found in syllabus</p>
                )}
              </GlassPanel>

              {/* Grading Breakdown - Visual Bars */}
              <GlassPanel>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-secondary" />
                  Grading Breakdown
                </h2>
                {displayData.gradingBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {displayData.gradingBreakdown.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-foreground font-medium">{item.category}</span>
                          <span className="text-secondary font-bold text-lg">{item.weight}%</span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden bg-white/5 border border-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.weight}%` }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#CFAF5A] to-red-500/50 rounded-full"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-center py-8">No grading information found</p>
                )}
              </GlassPanel>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setStage('upload');
                    setParsedData(null);
                    setSyllabusText('');
                    setUploadedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-8 py-3 rounded-lg gradient-maroon glow-maroon hover:opacity-90 text-foreground font-semibold"
                >
                  Upload Another Syllabus
                </motion.button>
              </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
