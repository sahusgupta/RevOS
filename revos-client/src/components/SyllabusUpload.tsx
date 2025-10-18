import { GlassPanel } from './GlassPanel';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Upload, FileText, CheckCircle, Calendar, BookOpen, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

type UploadStage = 'upload' | 'processing' | 'complete';

export function SyllabusUpload() {
  const [stage, setStage] = useState<UploadStage>('upload');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = () => {
    setStage('processing');
    setProgress(0);

    // Simulate processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStage('complete'), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const parsedData = {
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
    handleFileUpload();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-white mb-2">Syllabus Parser</h1>
        <p className="text-white/60">Upload your syllabus and let Rev extract key dates, assignments, and create a personalized study plan</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {stage === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassPanel glow="maroon" className="min-h-[500px] flex flex-col items-center justify-center">
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
                  <Upload className="w-10 h-10 text-[#CFAF5A]" />
                </motion.div>
                
                <h2 className="text-white text-center mb-2">Drop your syllabus here</h2>
                <p className="text-white/60 text-center mb-6">or click to browse files</p>
                
                <div className="flex justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleFileUpload}
                      className="gradient-maroon glow-maroon hover:opacity-90"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload PDF
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleFileUpload}
                      variant="outline"
                      className="border-[#CFAF5A] text-[#CFAF5A] hover:bg-[#CFAF5A]/10"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Upload DOCX
                    </Button>
                  </motion.div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-white/40 text-center">Supported formats: PDF, DOCX, TXT</p>
                  <p className="text-white/40 text-center mt-2">Max file size: 10MB</p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
                <div className="glass-card p-4 rounded-xl text-center">
                  <Calendar className="w-8 h-8 text-[#CFAF5A] mx-auto mb-2" />
                  <p className="text-white">Auto-extract key dates</p>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <Target className="w-8 h-8 text-[#CFAF5A] mx-auto mb-2" />
                  <p className="text-white">Identify assignments</p>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <BookOpen className="w-8 h-8 text-[#CFAF5A] mx-auto mb-2" />
                  <p className="text-white">Generate study plan</p>
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
                <FileText className="w-10 h-10 text-[#CFAF5A]" />
              </motion.div>

              <h2 className="text-white mb-2">Processing your syllabus...</h2>
              <p className="text-white/60 mb-8">Rev is analyzing the document</p>

              <div className="w-full max-w-md">
                <Progress value={progress} className="h-3 bg-white/10 mb-4" />
                <p className="text-[#CFAF5A] text-center">{progress}%</p>
              </div>

              <div className="mt-8 space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: progress > 20 ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className={`w-5 h-5 ${progress > 20 ? 'text-[#CFAF5A]' : 'text-white/30'}`} />
                  <span className="text-white/80">Extracting course information</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: progress > 40 ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className={`w-5 h-5 ${progress > 40 ? 'text-[#CFAF5A]' : 'text-white/30'}`} />
                  <span className="text-white/80">Identifying key dates</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: progress > 60 ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className={`w-5 h-5 ${progress > 60 ? 'text-[#CFAF5A]' : 'text-white/30'}`} />
                  <span className="text-white/80">Parsing assignments</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: progress > 80 ? 1 : 0.3, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className={`w-5 h-5 ${progress > 80 ? 'text-[#CFAF5A]' : 'text-white/30'}`} />
                  <span className="text-white/80">Generating study plan</span>
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
                    <CheckCircle className="w-10 h-10 text-[#CFAF5A]" />
                  </motion.div>
                  <h2 className="text-white mb-2">Syllabus Parsed Successfully!</h2>
                  <p className="text-white/60">Rev has extracted all the key information</p>
                </GlassPanel>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassPanel>
                  <h3 className="text-white mb-4">Course Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-white/60">Course</span>
                      <span className="text-white text-right">{parsedData.course}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-white/60">Instructor</span>
                      <span className="text-white">{parsedData.instructor}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-white/60">Semester</span>
                      <span className="text-white">{parsedData.semester}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-3 rounded-lg glass-card">
                      <p className="text-[#CFAF5A]">{parsedData.assignments}</p>
                      <p className="text-white/60">Assignments</p>
                    </div>
                    <div className="text-center p-3 rounded-lg glass-card">
                      <p className="text-[#CFAF5A]">{parsedData.exams}</p>
                      <p className="text-white/60">Exams</p>
                    </div>
                    <div className="text-center p-3 rounded-lg glass-card">
                      <p className="text-[#CFAF5A]">{parsedData.projects}</p>
                      <p className="text-white/60">Projects</p>
                    </div>
                  </div>
                </GlassPanel>

                <GlassPanel>
                  <h3 className="text-white mb-4">Key Dates</h3>
                  <div className="space-y-3">
                    {parsedData.keyDates.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg glass-card"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-[#CFAF5A]" />
                          <div>
                            <p className="text-white">{item.event}</p>
                            <p className="text-white/60">{item.date}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            item.type === 'exam'
                              ? 'bg-red-500/20 text-red-400'
                              : item.type === 'project'
                              ? 'bg-[#CFAF5A]/20 text-[#CFAF5A]'
                              : 'bg-blue-500/20 text-blue-400'
                          }
                        >
                          {item.type}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </GlassPanel>

                <GlassPanel>
                  <h3 className="text-white mb-4">Course Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.topics.map((topic, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Badge className="bg-[#500000]/50 text-[#CFAF5A] border-[#CFAF5A]/30">
                          {topic}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </GlassPanel>

                <GlassPanel>
                  <h3 className="text-white mb-4">Grading Breakdown</h3>
                  <div className="space-y-3">
                    {parsedData.gradingBreakdown.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="text-white/80">{item.category}</span>
                          <span className="text-[#CFAF5A]">{item.weight}%</span>
                        </div>
                        <Progress value={item.weight} className="h-2 bg-white/10" />
                      </motion.div>
                    ))}
                  </div>
                </GlassPanel>
              </div>

              <div className="flex gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="gradient-maroon glow-maroon hover:opacity-90">
                    Add to Dashboard
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setStage('upload')}
                    variant="outline"
                    className="border-[#CFAF5A] text-[#CFAF5A] hover:bg-[#CFAF5A]/10"
                  >
                    Upload Another
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
