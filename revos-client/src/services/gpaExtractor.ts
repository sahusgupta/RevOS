// GPA Extraction Service using GPT Vision API
// TODO: Implement actual GPT Vision API integration

import * as pdfjsLib from 'pdfjs-dist';

// TODO: Set the worker path for PDF.js
// pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js';

export interface TranscriptData {
  gpa?: number;
  school?: string;
  name?: string;
  major?: string;
  courses?: Array<{
    name: string;
    grade: string;
    credits: number;
  }>;
}

/**
 * TODO: Implement transcript image to base64 conversion
 * Converts a File (image or PDF) to base64 string for GPT Vision API
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data:image/...; prefix if present
        const base64 = reader.result.split(',')[1] || reader.result;
        resolve(base64);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * TODO: Implement GPT Vision API call
 * Sends transcript image to GPT Vision API and extracts GPA and other info
 */
export async function extractTranscriptDataWithGPT(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<TranscriptData> {
  try {
    // TODO: Replace with actual OpenAI API call
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4-vision-preview',
    //     messages: [
    //       {
    //         role: 'user',
    //         content: [
    //           {
    //             type: 'text',
    //             text: 'Extract the GPA, student name, school, major, and list of courses with grades from this transcript. Return as JSON.'
    //           },
    //           {
    //             type: 'image_url',
    //             image_url: {
    //               url: `data:${mimeType};base64,${base64Image}`
    //             }
    //           }
    //         ]
    //       }
    //     ],
    //     max_tokens: 1024,
    //   }),
    // });

    console.log('🤖 Sending transcript to GPT Vision API...');

    // Placeholder response structure
    const mockResponse: TranscriptData = {
      gpa: 3.85,
      school: 'Texas A&M University',
      name: 'John Doe',
      major: 'Computer Science',
      courses: [
        { name: 'CSCE 121: Introduction to Programming', grade: 'A', credits: 3 },
        { name: 'MATH 151: Engineering Mathematics I', grade: 'A-', credits: 4 },
        { name: 'CHEM 117: Chemistry for Engineers', grade: 'B+', credits: 3 },
      ]
    };

    console.log('✅ Transcript data extracted:', mockResponse);
    return mockResponse;
  } catch (error) {
    console.error('❌ Error extracting transcript data:', error);
    throw error;
  }
}

/**
 * TODO: Implement PDF to image conversion
 * Converts first page of PDF to image for GPT Vision API
 */
export async function pdfToImage(file: File): Promise<Blob> {
  try {
    // TODO: Implement PDF.js conversion
    // const arrayBuffer = await file.arrayBuffer();
    // const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    // const page = await pdf.getPage(1);
    // const canvas = document.createElement('canvas');
    // const context = canvas.getContext('2d');
    // await page.render({ canvasContext: context, scale: 2 }).promise;
    // return new Promise((resolve) => {
    //   canvas.toBlob((blob) => {
    //     if (blob) resolve(blob);
    //   }, 'image/jpeg');
    // });

    console.log('📄 Converting PDF to image:', file.name);
    // Placeholder - return the original file
    return file;
  } catch (error) {
    console.error('❌ Error converting PDF to image:', error);
    throw error;
  }
}

/**
 * TODO: Implement main extraction function
 * Main function to extract GPA from any transcript format
 */
export async function extractGPAFromTranscript(file: File): Promise<number | null> {
  try {
    console.log('📋 Starting GPA extraction from:', file.name);

    let imageBlob: Blob;
    
    // Check if file is PDF or image
    if (file.type === 'application/pdf') {
      imageBlob = await pdfToImage(file);
    } else if (file.type.startsWith('image/')) {
      imageBlob = file;
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or image.');
    }

    // Convert to base64
    const base64 = await fileToBase64(new File([imageBlob], 'transcript', { type: imageBlob.type }));

    // Extract data using GPT Vision
    const transcriptData = await extractTranscriptDataWithGPT(base64, imageBlob.type);

    return transcriptData.gpa || null;
  } catch (error) {
    console.error('❌ Error in GPA extraction pipeline:', error);
    throw error;
  }
}

/**
 * TODO: Implement grade to GPA conversion
 * Converts letter grades to GPA points (standard 4.0 scale)
 */
export function gradeTGPA(grade: string): number {
  const gradeMap: { [key: string]: number } = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'F': 0.0,
  };

  return gradeMap[grade.toUpperCase()] || 0.0;
}

/**
 * TODO: Implement GPA calculator
 * Calculates overall GPA from course list
 */
export function calculateGPA(courses: Array<{ grade: string; credits: number }>): number {
  if (courses.length === 0) return 0;

  const totalPoints = courses.reduce((sum, course) => {
    return sum + (gradeTGPA(course.grade) * course.credits);
  }, 0);

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}
