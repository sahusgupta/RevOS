# RevOS Server

This is the backend server for RevOS that integrates OpenAI and Pinecone for intelligent syllabus content management.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
Create a `.env` file with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
```

3. Run the server:
```bash
python app/app.py
```

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns the status of OpenAI and Pinecone services

### Upload Syllabus
- **POST** `/api/syllabus/upload`
- Upload syllabus data to be stored in the vector database
- Body: JSON object with syllabus information

Example request:
```json
{
  "course": "MATH 251: Calculus I",
  "instructor": "Dr. Smith",
  "semester": "Fall 2025",
  "keyDates": [
    {
      "date": "Oct 25",
      "event": "Midterm Exam",
      "type": "exam"
    },
    {
      "date": "Dec 10",
      "event": "Final Exam", 
      "type": "exam"
    }
  ],
  "topics": ["Limits", "Derivatives", "Integrals"],
  "gradingBreakdown": [
    {"category": "Exams", "weight": 60},
    {"category": "Homework", "weight": 30},
    {"category": "Participation", "weight": 10}
  ]
}
```

### Ask Rev
- **POST** `/api/ask-rev`
- Ask Rev questions about syllabus content
- Body: JSON with query and optional course filter

Example request:
```json
{
  "query": "When is my next math 251 exam?",
  "course_filter": "math_251_fall_2025"
}
```

### Get Deadlines
- **GET** `/api/deadlines?days=30`
- Get upcoming deadlines within specified days
- Query parameter: `days` (default: 30)

## Features

- **Vector Search**: Uses Pinecone to find relevant syllabus content based on semantic similarity
- **Smart Query Processing**: Extracts course context from natural language queries
- **Content Chunking**: Breaks down syllabus content into searchable chunks
- **Rev Personality**: Responds as Queen Reveille X, the Texas A&M mascot
- **Deadline Detection**: Finds upcoming exams, assignments, and project due dates

## Example Queries Rev Can Handle

- "When is my next math 251 test?"
- "What topics are covered in computer science?"
- "How much are exams worth in my physics class?"
- "What assignments are due this week?"
- "Tell me about the grading policy for CSCE 314"
