from dotenv import load_dotenv
import os
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

from utils.openai import (
    query_syllabus_content, 
    process_uploaded_file,
    initialize_openai_service,
    get_service_status
)
from models import db, User, Syllabus
from auth import auth_bp, require_auth

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure session support for OAuth
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
# Set database path to project root (one level up from revos-server)
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'revos.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()
    initialize_openai_service()

# Register authentication blueprint
app.register_blueprint(auth_bp)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify service status."""
    status = get_service_status()
    return jsonify(status), 200 if status['openai'] and status['pinecone'] else 500

@app.route('/api/syllabus/upload', methods=['POST'])
@require_auth
def upload_syllabus():
    """Upload and store syllabus data in vector database."""
    print(f"🔥 UPLOAD REQUEST - User: {request.user_id}")
    print(f"🔥 UPLOAD REQUEST - Method: {request.method}")
    print(f"🔥 UPLOAD REQUEST - Content-Type: {request.content_type}")
    print(f"🔥 UPLOAD REQUEST - Files: {list(request.files.keys())}")
    
    try:
        # Check if it's a file upload or JSON data
        if 'file' in request.files:
            # Handle file upload
            file = request.files['file']
            print(f"🔥 FILE UPLOAD - Filename: {file.filename}")
            print(f"🔥 FILE UPLOAD - Content-Type: {file.content_type}")
            
            if file.filename == '':
                print("❌ ERROR: No file selected")
                return jsonify({'error': 'No file selected'}), 400
            
            # Validate file type
            allowed_extensions = {'pdf', 'docx', 'doc', 'txt'}
            file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
            
            if file_extension not in allowed_extensions:
                error_msg = f'Unsupported file type: {file_extension}. Allowed: {", ".join(allowed_extensions)}'
                print(f"❌ ERROR: {error_msg}")
                return jsonify({'error': error_msg}), 400
            
            # Read file content
            file_content = file.read()
            filename = secure_filename(file.filename)
            print(f"🔥 FILE UPLOAD - Size: {len(file_content)} bytes")
            
            # Process the file
            result = process_uploaded_file(file_content, filename, request.user_id)
            print(f"🔥 FILE UPLOAD - Result: {result}")
            
            if result['success']:
                return jsonify({
                    'message': result['message'],
                    'data': result['data']
                }), 200
            else:
                print(f"❌ ERROR: {result['error']}")
                return jsonify({'error': result['error']}), 500
        
        else:
            # Handle JSON data (text input)
            data = request.get_json()
            print(f"🔥 JSON DATA: {data}")
            
            if not data:
                print("❌ ERROR: No data provided")
                return jsonify({'error': 'No data provided'}), 400
            
            # Check if it's raw text
            if 'raw_text' in data:
                # Process raw text like a file
                raw_text = data['raw_text']
                if not raw_text.strip():
                    print("❌ ERROR: No text content provided")
                    return jsonify({'error': 'No text content provided'}), 400
                
                print(f"🔥 TEXT UPLOAD - Size: {len(raw_text)} chars")
                
                # Process the text using the same function as file uploads
                result = process_uploaded_file(raw_text.encode('utf-8'), 'text_input.txt', request.user_id)
                print(f"🔥 TEXT UPLOAD - Result: {result}")
                
                if result['success']:
                    return jsonify({
                        'message': result['message'],
                        'data': result['data']
                    }), 200
                else:
                    print(f"❌ ERROR: {result['error']}")
                    return jsonify({'error': result['error']}), 500
            
            else:
                print("❌ ERROR: No file or raw_text provided")
                return jsonify({'error': 'No file or raw_text provided'}), 400
            
    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/syllabus/list', methods=['GET'])
@require_auth
def list_syllabi():
    """Get all syllabi for the authenticated user."""
    try:
        syllabi = Syllabus.query.filter_by(user_id=request.user_id).all()
        return jsonify({
            'syllabi': [s.to_dict() for s in syllabi],
            'count': len(syllabi)
        }), 200
    except Exception as e:
        print(f"❌ ERROR in list_syllabi: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/syllabus/<int:syllabus_id>', methods=['GET'])
@require_auth
def get_syllabus(syllabus_id):
    """Get a specific syllabus for the authenticated user."""
    try:
        syllabus = Syllabus.query.filter_by(id=syllabus_id, user_id=request.user_id).first()
        
        if not syllabus:
            return jsonify({'error': 'Syllabus not found'}), 404
        
        return jsonify(syllabus.to_dict()), 200
    except Exception as e:
        print(f"❌ ERROR in get_syllabus: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/syllabus/<int:syllabus_id>', methods=['DELETE'])
@require_auth
def delete_syllabus(syllabus_id):
    """Delete a syllabus for the authenticated user."""
    try:
        syllabus = Syllabus.query.filter_by(id=syllabus_id, user_id=request.user_id).first()
        
        if not syllabus:
            return jsonify({'error': 'Syllabus not found'}), 404
        
        db.session.delete(syllabus)
        db.session.commit()
        
        return jsonify({'message': 'Syllabus deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ ERROR in delete_syllabus: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/syllabus/<int:syllabus_id>/grading', methods=['PUT'])
@require_auth
def update_syllabus_grading(syllabus_id):
    """Update grading breakdown for a syllabus"""
    try:
        from models import Syllabus, db, User
        
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        syllabus = Syllabus.query.filter_by(id=syllabus_id, user_id=request.user_id).first()
        if not syllabus:
            return jsonify({'error': 'Syllabus not found'}), 404
        
        data = request.get_json()
        grading_breakdown = data.get('gradingBreakdown', [])
        
        # Validate grading breakdown
        if not isinstance(grading_breakdown, list):
            return jsonify({'error': 'gradingBreakdown must be an array'}), 400
        
        total_weight = 0
        for item in grading_breakdown:
            if not isinstance(item, dict) or 'category' not in item or 'weight' not in item:
                return jsonify({'error': 'Invalid grading breakdown format'}), 400
            
            try:
                weight = float(item['weight'])
                if weight < 0 or weight > 100:
                    return jsonify({'error': f"Weight must be between 0 and 100, got {weight}"}), 400
                total_weight += weight
            except (ValueError, TypeError):
                return jsonify({'error': f"Invalid weight value: {item['weight']}"}), 400
        
        # Update syllabus
        syllabus.grading_breakdown = grading_breakdown
        db.session.commit()
        
        logger.info(f"✅ Updated grading breakdown for syllabus {syllabus_id}")
        logger.info(f"   Total weight: {total_weight}% across {len(grading_breakdown)} categories")
        
        return jsonify({
            'message': 'Grading breakdown updated',
            'syllabus': syllabus.to_dict(),
            'totalWeight': total_weight
        }), 200
        
    except Exception as e:
        logger.error(f'Error updating grading breakdown: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask-rev', methods=['POST'])
@require_auth
def ask_rev():
    """Main endpoint for asking Rev questions about syllabus content."""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400
        
        user_query = data['query']
        course_filter = data.get('course_filter')
        
        # Get response from Rev (filtered by user)
        response = query_syllabus_content(user_query, course_filter, request.user_id)
        
        return jsonify({
            'response': response,
            'query': user_query
        }), 200
        
    except Exception as e:
        print(f"❌ ERROR in ask_rev: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask-rev/generate-worksheet', methods=['POST'])
@require_auth
def generate_worksheet():
    """Generate a practice worksheet using OpenAI"""
    try:
        from utils.openai import query_syllabus_content
        from models import User, Syllabus
        
        data = request.get_json()
        topic = data.get('topic', 'General Review')
        difficulty = data.get('difficulty', 'medium')
        num_questions = data.get('numQuestions', 5)
        course_id = data.get('courseId')
        
        user_id = request.user_id
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get relevant syllabus content for context
        syllabus_context = ""
        if course_id:
            syllabus = Syllabus.query.filter_by(user_id=user_id, id=course_id).first()
            if syllabus:
                syllabus_context = f"\nCourse: {syllabus.course_name}\nTopics covered: {', '.join(syllabus.topics or [])}"
        else:
            # Get all user syllabi for context
            syllabi = Syllabus.query.filter_by(user_id=user_id).all()
            if syllabi:
                courses = [f"{s.course_name} - Topics: {', '.join(s.topics or [])}" for s in syllabi]
                syllabus_context = "\nAvailable courses:\n" + "\n".join(courses[:3])
        
        # Use OpenAI to generate worksheet
        from utils.openai import client
        
        prompt = f"""Generate a {difficulty} difficulty practice worksheet with {num_questions} questions on the topic: "{topic}"
        
{syllabus_context}

Please provide the worksheet in this exact JSON format:
{{
  "title": "Worksheet title",
  "subject": "{topic}",
  "difficulty": "{difficulty}",
  "instructions": "Clear instructions for the worksheet",
  "questions": [
    {{
      "id": "q1",
      "question": "The question text",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct answer",
      "points": 1
    }}
  ]
}}

Make sure questions are:
- Specific to the topic mentioned
- Appropriate for the difficulty level
- Based on concepts from the syllabi when available
- Clear and well-structured"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert educator creating practice worksheets."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        try:
            worksheet_text = response.choices[0].message.content
            # Extract JSON from response
            import json
            import re
            json_match = re.search(r'\{.*\}', worksheet_text, re.DOTALL)
            if json_match:
                worksheet = json.loads(json_match.group())
            else:
                worksheet = json.loads(worksheet_text)
        except:
            worksheet = {
                "title": f"{topic} Practice Worksheet",
                "subject": topic,
                "difficulty": difficulty,
                "instructions": "Practice problems based on course material",
                "questions": [{"id": "q1", "question": worksheet_text, "type": "essay", "points": num_questions}]
            }
        
        return jsonify({'worksheet': worksheet}), 200
    except Exception as e:
        logger.error(f'Error generating worksheet: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask-rev/generate-study-plan', methods=['POST'])
@require_auth
def generate_study_plan():
    """Generate a personalized study plan using OpenAI"""
    try:
        from utils.openai import client
        from models import User, Syllabus
        
        data = request.get_json()
        course_id = data.get('courseId')
        course_name = data.get('courseName', 'the course')
        exam_date = data.get('examDate')
        current_topics = data.get('currentTopics', [])
        
        user_id = request.user_id
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get syllabus for this course
        syllabus_context = ""
        if course_id:
            syllabus = Syllabus.query.filter_by(user_id=user_id, id=course_id).first()
            if syllabus:
                syllabus_context = f"""
Course Information:
- Name: {syllabus.course_name}
- Instructor: {syllabus.instructor}
- Topics: {', '.join(syllabus.topics or [])}
- Key Dates: {', '.join([str(d) for d in syllabus.key_dates or []])}
- Grading: {syllabus.grading_breakdown}
"""
        
        prompt = f"""Create a detailed, personalized study plan for a student preparing for {course_name}.
Exam Date: {exam_date}
Current Topics: {', '.join(current_topics)}

{syllabus_context}

Please provide a comprehensive study plan in JSON format:
{{
  "courseName": "{course_name}",
  "examDate": "{exam_date}",
  "overallStrategy": "Brief overview of the study strategy",
  "priorityTopics": [
    {{
      "name": "Topic name",
      "priority": "high/medium/low",
      "estimatedHours": 3,
      "keyPoints": ["point 1", "point 2"],
      "resources": ["resource 1", "resource 2"],
      "practiceProblems": "Suggested practice problems"
    }}
  ],
  "weeklySchedule": [
    {{
      "week": 1,
      "focus": "What to focus on this week",
      "dailyGoals": ["Mon goal", "Tue goal", "Wed goal", "Thu goal", "Fri goal"],
      "reviewTopics": ["topic 1", "topic 2"],
      "estimatedHours": 15
    }}
  ],
  "studyTips": [
    "Personalized study tip 1",
    "Personalized study tip 2"
  ],
  "recommendations": [
    "Study with practice exams",
    "Form study groups"
  ]
}}"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert academic advisor creating personalized study plans."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        try:
            plan_text = response.choices[0].message.content
            import json
            import re
            json_match = re.search(r'\{.*\}', plan_text, re.DOTALL)
            if json_match:
                study_plan = json.loads(json_match.group())
            else:
                study_plan = json.loads(plan_text)
        except:
            study_plan = {
                "courseName": course_name,
                "examDate": exam_date,
                "overallStrategy": plan_text,
                "priorityTopics": [],
                "weeklySchedule": [],
                "studyTips": []
            }
        
        return jsonify({'studyPlan': study_plan}), 200
    except Exception as e:
        logger.error(f'Error generating study plan: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask-rev/campus-recommendations', methods=['GET'])
@require_auth
def get_campus_recommendations():
    """Get Texas A&M campus recommendations using OpenAI"""
    try:
        from utils.openai import client
        
        category = request.args.get('category', 'explore')
        preferences = request.args.get('preferences', '')
        
        prompt = f"""Provide recommendations for the best places at Texas A&M University for {category} as though you are a student who has explored all over campus and College Station in general.
Additional preferences: {preferences if preferences else 'None'}

Please provide realistic, accurate recommendations based on actual Texas A&M locations in this JSON format:
{{
  "recommendations": [
    {{
      "name": "Location name",
      "category": "{category}",
      "description": "What it is and why it's great",
      "location": "Where on campus",
      "distance": "Distance from center",
      "rating": 4.5,
      "hours": "Operating hours if applicable",
      "website": "Website if applicable",
      "whyRecommended": "Why this is recommended for {category}",
      "features": ["Feature 1", "Feature 2"]
    }}
  ]
}}"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a knowledgeable Texas A&M student guide providing accurate campus recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        try:
            rec_text = response.choices[0].message.content
            import json
            import re
            json_match = re.search(r'\{.*\}', rec_text, re.DOTALL)
            if json_match:
                recommendations_data = json.loads(json_match.group())
                recommendations = recommendations_data.get('recommendations', [])
            else:
                recommendations_data = json.loads(rec_text)
                recommendations = recommendations_data.get('recommendations', [])
        except:
            recommendations = []
        
        return jsonify({'recommendations': recommendations}), 200
    except Exception as e:
        logger.error(f'Error getting campus recommendations: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask-rev/ask-question', methods=['POST'])
@require_auth
def ask_question():
    """Answer any question using OpenAI, with context from syllabi and Google Calendar for schedule questions"""
    try:
        from utils.openai import client, query_syllabus_content
        from utils.google_calendar import GoogleCalendarManager
        from models import User, Syllabus
        from datetime import datetime, timedelta
        import pytz
        
        data = request.get_json()
        question = data.get('question', '')
        
        if not question:
            return jsonify({'error': 'Question required'}), 400
        
        user_id = request.user_id
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Detect if this is a calendar/schedule question
        calendar_keywords = ['calendar', 'schedule', 'when', 'date', 'time', 'exam', 'quiz', 
                           'assignment', 'due', 'deadline', 'meeting', 'class', 'week', 
                           'today', 'tomorrow', 'next', 'busy', 'free', 'available']
        is_calendar_question = any(keyword in question.lower() for keyword in calendar_keywords)
        
        # Get all syllabi for the user
        syllabi = Syllabus.query.filter_by(user_id=user_id).all()
        
        # Build comprehensive syllabus context with course names
        syllabi_content = ""
        if syllabi:
            syllabi_context = "\n📚 COURSE INFORMATION:\n"
            syllabi_context += "="*50 + "\n"
            
            for syllabus in syllabi:
                syllabi_context += f"\n📖 {syllabus.course_name}"
                if syllabus.instructor:
                    syllabi_context += f" (Instructor: {syllabus.instructor})"
                syllabi_context += "\n"
                
                if syllabus.topics:
                    syllabi_context += f"  Topics: {', '.join(syllabus.topics)}\n"
                
                # Include key dates with FULL course context
                if syllabus.key_dates and is_calendar_question:
                    syllabi_context += f"  📅 Key Dates:\n"
                    for date_entry in syllabus.key_dates:
                        if isinstance(date_entry, dict):
                            date_str = date_entry.get('date', '')
                            event = date_entry.get('event', date_entry.get('title', 'Event'))
                            event_type = date_entry.get('type', 'assignment')
                            # IMPORTANT: Always include course name with event
                            syllabi_context += f"    - [{syllabus.course_name}] {event} ({event_type}): {date_str}\n"
                        else:
                            syllabi_context += f"    - [{syllabus.course_name}] {str(date_entry)}\n"
                
                if syllabus.grading_breakdown:
                    if isinstance(syllabus.grading_breakdown, list) and syllabus.grading_breakdown:
                        grading_items = []
                        for item in syllabus.grading_breakdown:
                            cat = item.get('category', 'Unknown')
                            weight = item.get('weight', 0)
                            grading_items.append(f"{cat}: {weight}%")
                        syllabi_context += f"  📊 Grading: {', '.join(grading_items)}\n"
            syllabi_content = syllabi_context
        
        # For calendar/schedule questions, fetch Google Calendar events
        google_calendar_context = ""
        if is_calendar_question and hasattr(user, 'google_calendar_token') and user.google_calendar_token:
            try:
                central = pytz.timezone('America/Chicago')
                today = datetime.now(central)
                week_start = today - timedelta(days=today.weekday())
                week_end = week_start + timedelta(days=7)
                
                logger.info(f"🗓️ Fetching Google Calendar events for week: {week_start.date()} to {week_end.date()}")
                
                # Use selected calendar or default to 'primary'
                calendar_id = user.selected_calendar_id or 'primary'
                calendar_events = GoogleCalendarManager.get_week_events_from_calendar(
                    user.google_calendar_token,
                    calendar_id,
                    week_start,
                    week_end
                )
                
                if calendar_events:
                    google_calendar_context = "\n🗓️ YOUR GOOGLE CALENDAR THIS WEEK:\n"
                    google_calendar_context += "="*50 + "\n"
                    for event in calendar_events:
                        title = event.get('title', 'Event')
                        start = event.get('start', 'No time specified')
                        location = event.get('location', '')
                        
                        google_calendar_context += f"\n  📌 {title}\n"
                        google_calendar_context += f"     Time: {start}\n"
                        if location:
                            google_calendar_context += f"     Location: {location}\n"
                    
                    logger.info(f"✅ Found {len(calendar_events)} calendar events")
                else:
                    google_calendar_context = "\n(No Google Calendar events found for this week)\n"
            except Exception as e:
                logger.debug(f"Could not fetch Google Calendar events: {e}")
                google_calendar_context = f"\n(Could not fetch Google Calendar: {str(e)})\n"
        
        # Try to get more specific content using semantic search
        semantic_context = ""
        try:
            search_results = query_syllabus_content(question, None, user_id)
            if search_results:
                semantic_context = f"\n\n📋 RELEVANT COURSE CONTENT:\n"
                semantic_context += "="*50 + "\n"
                semantic_context += f"{search_results}"
        except Exception as e:
            logger.debug(f"Semantic search error: {e}")
        
        # Build the comprehensive prompt
        prompt = f"""You are Rev, an AI study assistant at Texas A&M University.

IMPORTANT RULES:
1. When mentioning ANY assignment, exam, quiz, homework, or deadline - ALWAYS specify which course/class it belongs to
2. Use the course information provided below as context
3. For schedule questions, use BOTH the Google Calendar events AND the syllabus key dates
4. Provide accurate dates and times
5. Be specific and actionable

Question: {question}

{google_calendar_context}

{syllabi_content}

{semantic_context}

Provide a clear, helpful answer that:
1. Directly addresses the question
2. When mentioning assignments/exams/quizzes, ALWAYS include the course name (e.g., "CSCE 314 Midterm")
3. Uses calendar and syllabus information when relevant
4. For schedule questions, reference specific dates from calendar or syllabi
5. Provides actionable advice
6. Suggests follow-up actions when appropriate"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system", 
                    "content": """You are Rev, a knowledgeable and detailed AI study assistant at Texas A&M University.
                    
CRITICAL: When discussing ANY assignment, exam, quiz, homework, or deadline:
- ALWAYS mention which course/class it belongs to
- ALWAYS include the course code if available (e.g., CSCE 314, MATH 251)
- Format as: "[COURSE NAME] Assignment Name"

Be specific, helpful, and organized. Use the student's calendar and syllabus data extensively."""
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        answer = response.choices[0].message.content
        
        logger.info(f"✅ Answered question: {question[:60]}...")
        return jsonify({'answer': answer}), 200
    except Exception as e:
        logger.error(f'Error answering question: {e}')
        return jsonify({'error': str(e)}), 500

# TODO: Plaid API Endpoints
@app.route('/api/plaid/create-link-token', methods=['POST'])
@require_auth
def create_plaid_link_token():
    """Create a Plaid Link token for account connection"""
    try:
        from utils.plaid import PlaidManager
        
        user_id = request.user_id
        result = PlaidManager.create_link_token(user_id)
        
        return jsonify({
            'link_token': result['link_token'],
            'expiration': result['expiration']
        }), 200
    except Exception as e:
        logger.error(f'Error creating Plaid link token: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/plaid/exchange-token', methods=['POST'])
@require_auth
def exchange_plaid_token():
    """Exchange public token for access token and save to user profile"""
    try:
        from utils.plaid import PlaidManager
        from models import db, User
        
        user_id = request.user_id
        data = request.get_json()
        public_token = data.get('public_token')
        metadata = data.get('metadata', {})
        
        if not public_token:
            return jsonify({'error': 'public_token required'}), 400
        
        # Exchange token
        result = PlaidManager.exchange_public_token(public_token, metadata)
        
        # TODO: Save access_token to user profile or separate table
        # This should be encrypted and stored securely
        user = User.query.get(user_id)
        if user:
            # Store plaid_access_token (should be encrypted in production)
            user.plaid_access_token = result['access_token']
            user.plaid_item_id = result['item_id']
            db.session.commit()
        
        return jsonify({
            'success': True,
            'item_id': result['item_id'],
            'accounts': result['accounts']
        }), 200
    except Exception as e:
        logger.error(f'Error exchanging Plaid token: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/plaid/accounts', methods=['GET'])
@require_auth
def get_plaid_accounts():
    """Get list of linked bank accounts"""
    try:
        from utils.plaid import PlaidManager
        from models import User
        
        user_id = request.user_id
        user = User.query.get(user_id)
        
        if not user or not hasattr(user, 'plaid_access_token') or not user.plaid_access_token:
            return jsonify({'error': 'No Plaid account linked'}), 404
        
        # TODO: Decrypt access token in production
        accounts = PlaidManager.get_accounts(user.plaid_access_token)
        
        return jsonify({
            'accounts': accounts
        }), 200
    except Exception as e:
        logger.error(f'Error getting Plaid accounts: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/plaid/transactions', methods=['GET'])
@require_auth
def get_plaid_transactions():
    """Get transactions for linked bank accounts"""
    try:
        from utils.plaid import PlaidManager
        from models import User
        
        user_id = request.user_id
        
        # Get access_token from query parameters or request body
        access_token = request.args.get('access_token')
        if not access_token:
            data = request.get_json() or {}
            access_token = data.get('access_token')
        
        if not access_token:
            return jsonify({'error': 'access_token required'}), 400
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 100, type=int)
        
        # Get transactions using the provided access token
        transactions = PlaidManager.get_transactions(
            access_token,
            start_date,
            end_date,
            limit
        )
        
        return jsonify({
            'transactions': transactions,
            'count': len(transactions)
        }), 200
    except Exception as e:
        logger.error(f'Error getting Plaid transactions: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/plaid/spending-insights', methods=['GET'])
@require_auth
def get_spending_insights():
    """Get spending analysis and insights"""
    try:
        from utils.plaid import PlaidManager
        from models import User
        
        user_id = request.user_id
        user = User.query.get(user_id)
        
        if not user or not hasattr(user, 'plaid_access_token') or not user.plaid_access_token:
            return jsonify({'error': 'No Plaid account linked'}), 404
        
        # TODO: Decrypt access token in production
        insights = PlaidManager.get_insights(user.plaid_access_token)
        
        return jsonify(insights), 200
    except Exception as e:
        logger.error(f'Error getting spending insights: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/plaid/recurring-transactions', methods=['GET'])
@require_auth
def get_recurring_transactions():
    """Get recurring transactions (subscriptions, etc.)"""
    try:
        from utils.plaid import PlaidManager
        from models import User
        
        user_id = request.user_id
        user = User.query.get(user_id)
        
        if not user or not hasattr(user, 'plaid_access_token') or not user.plaid_access_token:
            return jsonify({'error': 'No Plaid account linked'}), 404
        
        # TODO: Decrypt access token in production
        recurring = PlaidManager.get_recurring_transactions(user.plaid_access_token)
        
        return jsonify({
            'recurring_transactions': recurring,
            'count': len(recurring)
        }), 200
    except Exception as e:
        logger.error(f'Error getting recurring transactions: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/weekly-advisor', methods=['GET'])
@require_auth
def weekly_advisor():
    """Get weekly advisor review with calendar events and assignments"""
    try:
        from utils.openai import client
        from models import User, Syllabus
        from datetime import datetime, timedelta
        import pytz
        
        user_id = request.user_id
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get current week dates in Central Time (Texas A&M timezone)
        central = pytz.timezone('America/Chicago')
        today = datetime.now(central).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Week starts on Monday (weekday 0)
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=7)
        
        logger.info(f"📅 Weekly Advisor for week: {week_start.date()} to {week_end.date()}")
        
        # Collect all assignments from syllabi
        syllabi = Syllabus.query.filter_by(user_id=user_id).all()
        assignments = []
        
        # Keywords to identify different types of assignments
        assignment_keywords = {
            'exam': ['exam', 'midterm', 'final', 'quiz', 'test'],
            'homework': ['hw', 'homework', 'assignment', 'problem set', 'ps', 'pset', 'worksheet'],
            'lab': ['lab', 'laboratory', 'practical', 'experiment'],
            'project': ['project', 'capstone', 'presentation', 'milestone', 'proposal'],
            'activity': ['activity', 'activities', 'exercise', 'exercises', 'discussion', 'workshop', 'seminar'],
            'reading': ['reading', 'readings', 'chapter', 'ch ', 'ch.', 'part ', 'textbook', 'section'],
            'submission': ['submit', 'submission', 'deliverable', 'artifact', 'report']
        }
        
        def classify_assignment_type(title: str, event_type: str) -> str:
            """Classify assignment based on title and type - looks for specific keywords"""
            title_lower = title.lower()
            type_lower = event_type.lower() if event_type else ''
            
            # First check explicit type if it's a known type
            if type_lower in assignment_keywords:
                return type_lower
            
            # Check for chapter/reading patterns (e.g., "Ch 5", "Chapter 3.2", "Ch 5 Part 1")
            if any(pattern in title_lower for pattern in ['ch ', 'ch.', 'chapter ', 'reading']):
                return 'reading'
            
            # Check title keywords - prioritize more specific matches first
            for assign_type, keywords in assignment_keywords.items():
                if any(keyword in title_lower for keyword in keywords):
                    return assign_type
            
            # If it contains 'due' or assignment-like language, treat as assignment
            if any(keyword in title_lower for keyword in ['due', 'submit', 'deadline', 'due date']):
                return 'submission'
            
            # Default to 'homework' if we think it's an assignment
            return 'homework'
        
        def calculate_priority(event_type: str, days_until: int) -> str:
            """Calculate priority based on assignment type and how soon it's due"""
            # High priority for exams
            if event_type in ['exam']:
                return 'high'
            # High priority for things due soon
            if days_until <= 1:
                return 'high'
            if days_until <= 3:
                return 'high'
            if days_until <= 7:
                return 'medium'
            return 'low'
        
        for syllabus in syllabi:
            if syllabus.key_dates:
                for date_entry in syllabus.key_dates:
                    try:
                        if isinstance(date_entry, dict):
                            date_str = date_entry.get('date', '')
                        else:
                            date_str = str(date_entry)
                        
                        # Parse date - handle both ISO format and date-only format
                        try:
                            event_date = datetime.fromisoformat(date_str)
                        except:
                            event_date = datetime.strptime(date_str, '%Y-%m-%d')
                        
                        # Convert to Central Time if it's naive or UTC
                        if event_date.tzinfo is None:
                            event_date = central.localize(event_date)
                        elif event_date.tzinfo.tzname(event_date) == 'UTC':
                            event_date = event_date.astimezone(central)
                        
                        # Check if event is from today onwards (not just this week)
                        event_date_only = event_date.replace(hour=0, minute=0, second=0, microsecond=0)
                        if event_date_only >= today:
                            raw_type = date_entry.get('type', 'assignment') if isinstance(date_entry, dict) else 'assignment'
                            title = date_entry.get('event', date_entry.get('title', 'Assignment')) if isinstance(date_entry, dict) else str(date_entry)
                            
                            # Classify the assignment type with comprehensive keyword matching
                            classified_type = classify_assignment_type(title, raw_type)
                            
                            # Calculate priority based on type and days until due
                            days_until = (event_date_only - today).days
                            priority = calculate_priority(classified_type, days_until)
                            
                            assignments.append({
                                'course': syllabus.course_name,
                                'title': title,
                                'date': event_date.isoformat(),
                                'type': classified_type,
                                'priority': priority
                            })
                            logger.info(f"  ✓ Found [{classified_type}]: {title} on {event_date.date()} (priority: {priority})")
                    except (ValueError, AttributeError, TypeError) as e:
                        logger.debug(f"  ⚠ Skipped entry: {str(e)}")
                        continue
        
        # Get Google Calendar events if available (from today onwards)
        calendar_events = []
        if hasattr(user, 'google_calendar_token') and user.google_calendar_token:
            try:
                from utils.google_calendar import GoogleCalendarManager
                # Use selected calendar or default to 'primary'
                calendar_id = user.selected_calendar_id or 'primary'
                # Fetch from today until far future (e.g., 90 days)
                calendar_end = today + timedelta(days=90)
                calendar_events = GoogleCalendarManager.get_week_events_from_calendar(
                    user.google_calendar_token,
                    calendar_id,
                    today,
                    calendar_end
                )
                logger.info(f"📅 Retrieved {len(calendar_events)} calendar events from {today.date()} onwards")
            except Exception as e:
                logger.warning(f"Could not fetch Google Calendar events: {e}")
        
        # If no calendar events, create synthetic ones from assignments
        if not calendar_events:
            calendar_events = [
                {
                    'title': a['title'],
                    'start': a['date'],
                    'end': a['date'],
                    'description': f"For {a['course']}",
                    'busy': True
                }
                for a in assignments
            ]
        
        # Use OpenAI to generate weekly review
        tasks_summary = "\n".join([
            f"- {a['title']} ({a['course']}) - {a['date']} [{a['priority'].upper()}]"
            for a in assignments
        ])
        
        calendar_summary = "\n".join([
            f"- {e['title']} - {e['start']}"
            for e in calendar_events[:10]
        ])
        
        prompt = f"""You are Rev, an academic advisor at Texas A&M University. Provide a comprehensive, well-formatted weekly review of this student's tasks and calendar.

THIS WEEK: {week_start.strftime('%A, %B %d')} to {week_end.strftime('%A, %B %d, %Y')}

ASSIGNMENTS DUE THIS WEEK:
{tasks_summary if tasks_summary else '(No assignments scheduled this week)'}

CALENDAR EVENTS:
{calendar_summary if calendar_summary else '(No calendar events this week)'}

ENROLLED COURSES:
{', '.join([s.course_name for s in syllabi]) if syllabi else '(No courses uploaded yet)'}

Please provide a well-organized weekly review with the following sections. Use clear markdown formatting with headers, bullet points, and emphasis where appropriate:

## 📊 Weekly Overview
- Brief summary of workload intensity
- Key deadlines and important dates
- Overall assessment of the week

## 🎯 Priority Tasks
List the top 3-5 urgent items with:
- Task name and course
- Due date
- Estimated time to complete (in hours)
- Priority level (HIGH/MEDIUM/LOW)

## ⏰ Time Management
- Suggested daily schedule/breakdown
- When to tackle each priority task
- Recommended study hours
- Breaks and rest time

## 📚 Study Tips
- Course-specific study strategies
- Recommended resources or approaches
- Tips for staying focused

## ⚠️ Risk Assessment
- Potential bottlenecks or conflicts
- Courses that might need extra attention
- Strategies to mitigate challenges

## 💪 Weekly Motivation
- Encouraging message for the week
- Positive affirmations about their abilities
- Quick tip for success

Format clearly with headers, bullet points, and emojis for visual appeal. Keep the tone supportive and motivational."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Rev, a supportive and organized academic advisor. Always format responses clearly with markdown, headers, and bullet points. Be specific, actionable, and motivational."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        weekly_review = response.choices[0].message.content
        
        return jsonify({
            'today': today.isoformat(),
            'weekStart': week_start.isoformat(),
            'weekEnd': week_end.isoformat(),
            'assignments': sorted(assignments, key=lambda a: a['date']),
            'calendarEvents': sorted(calendar_events, key=lambda e: e.get('start', '')),
            'weeklyReview': weekly_review,
            'courseCount': len(syllabi),
            'assignmentCount': len(assignments),
            'eventCount': len(calendar_events)
        }), 200
        
    except Exception as e:
        logger.error(f'Error in weekly advisor: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/google-calendar/auth-url', methods=['GET'])
@require_auth
def get_google_calendar_auth_url():
    """Get Google OAuth authorization URL"""
    try:
        from google_auth_oauthlib.flow import Flow
        import os
        
        # Create OAuth flow
        flow = Flow.from_client_secrets_file(
            os.path.join(os.path.dirname(__file__), 'google_calendar_credentials.json'),
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        # Redirect URI
        flow.redirect_uri = 'http://localhost:3000/calendar-auth-callback'
        
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        # Return both auth URL and state (frontend will use state for verification if needed)
        logger.info("✅ Generated Google OAuth URL")
        return jsonify({
            'auth_url': auth_url,
            'state': state  # Frontend can use this for state verification
        }), 200
        
    except FileNotFoundError:
        logger.error('Google credentials file not found')
        return jsonify({'error': 'Google credentials not configured. Please set up GOOGLE_CREDENTIALS_JSON'}), 500
    except Exception as e:
        logger.error(f'Error generating Google auth URL: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/status', methods=['GET'])
@require_auth
def get_user_status():
    """Get user status and integrations"""
    try:
        from models import User
        
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'google_calendar_connected': bool(user.google_calendar_token)
            }
        }), 200
        
    except Exception as e:
        logger.error(f'Error getting user status: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/google-calendar/callback', methods=['POST'])
@require_auth
def google_calendar_callback():
    """Handle Google OAuth callback and store tokens"""
    try:
        from google_auth_oauthlib.flow import Flow
        from google.auth.transport.requests import Request
        import os
        from models import User, db
        
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return jsonify({'error': 'Authorization code required'}), 400
        
        # Create OAuth flow
        flow = Flow.from_client_secrets_file(
            os.path.join(os.path.dirname(__file__), 'google_calendar_credentials.json'),
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        flow.redirect_uri = 'http://localhost:3000/calendar-auth-callback'
        
        # Exchange code for tokens
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Store tokens in database
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.google_calendar_token = credentials.token
        user.google_calendar_refresh_token = credentials.refresh_token
        user.google_calendar_token_expiry = credentials.expiry
        
        db.session.commit()
        
        logger.info(f"✅ Google Calendar connected for user {request.user_id}")
        
        return jsonify({
            'message': 'Google Calendar connected successfully',
            'google_calendar_connected': True
        }), 200
        
    except Exception as e:
        logger.error(f'Error in Google Calendar callback: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/google-calendar/disconnect', methods=['POST'])
@require_auth
def disconnect_google_calendar():
    """Disconnect Google Calendar"""
    try:
        from models import User, db
        
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.google_calendar_token = None
        user.google_calendar_refresh_token = None
        user.google_calendar_token_expiry = None
        user.selected_calendar_id = 'primary'
        
        db.session.commit()
        
        logger.info(f"✅ Google Calendar disconnected for user {request.user_id}")
        
        return jsonify({'message': 'Google Calendar disconnected'}), 200
        
    except Exception as e:
        logger.error(f'Error disconnecting Google Calendar: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/google-calendar/list-calendars', methods=['GET'])
@require_auth
def list_calendars():
    """List all available calendars for the user"""
    try:
        from models import User
        from utils.google_calendar import GoogleCalendarManager
        
        user = User.query.get(request.user_id)
        if not user or not user.google_calendar_token:
            return jsonify({'error': 'Google Calendar not connected'}), 400
        
        calendars = GoogleCalendarManager.list_calendars(user.google_calendar_token)
        
        return jsonify({
            'calendars': calendars,
            'selected_calendar_id': user.selected_calendar_id or 'primary'
        }), 200
        
    except Exception as e:
        logger.error(f'Error listing calendars: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/google-calendar/select-calendar', methods=['POST'])
@require_auth
def select_calendar():
    """Set the selected calendar for the user"""
    try:
        from models import User, db
        
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        calendar_id = data.get('calendar_id')
        
        if not calendar_id:
            return jsonify({'error': 'Calendar ID required'}), 400
        
        user.selected_calendar_id = calendar_id
        db.session.commit()
        
        logger.info(f"✅ Calendar selected for user {request.user_id}: {calendar_id}")
        
        return jsonify({
            'message': 'Calendar selected',
            'selected_calendar_id': calendar_id
        }), 200
        
    except Exception as e:
        logger.error(f'Error selecting calendar: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/google-calendar/create-event', methods=['POST'])
@require_auth
def create_calendar_event():
    """Create an event on user's Google Calendar"""
    try:
        from models import User
        from utils.google_calendar import GoogleCalendarManager
        from datetime import datetime, timedelta
        
        user = User.query.get(request.user_id)
        if not user or not user.google_calendar_token:
            return jsonify({'error': 'Google Calendar not connected'}), 400
        
        data = request.get_json()
        title = data.get('title')
        start_time = data.get('startTime')
        end_time = data.get('endTime')
        description = data.get('description', '')
        
        if not all([title, start_time, end_time]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Convert ISO strings to datetime
        try:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid date format'}), 400
        
        event = GoogleCalendarManager.create_event(
            access_token=user.google_calendar_token,
            title=title,
            start_time=start_dt,
            end_time=end_dt,
            description=description
        )
        
        if event:
            logger.info(f"✅ Created calendar event: {title}")
            return jsonify({'event': event, 'message': 'Event created successfully'}), 200
        else:
            return jsonify({'error': 'Failed to create event'}), 500
            
    except Exception as e:
        logger.error(f'Error creating calendar event: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask-rev/calendar/add-event', methods=['POST'])
@require_auth
def add_rev_suggested_event():
    """Add a Rev-suggested study event to calendar"""
    try:
        from models import User
        from utils.google_calendar import GoogleCalendarManager
        from datetime import datetime
        
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        title = data.get('title')
        description = data.get('description', '')
        start_time = data.get('startTime')
        end_time = data.get('endTime')
        
        if not all([title, start_time, end_time]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # If no calendar connected, still create in response but notify user
        if user.google_calendar_token:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            event = GoogleCalendarManager.create_event(
                access_token=user.google_calendar_token,
                title=title,
                start_time=start_dt,
                end_time=end_dt,
                description=description
            )
            
            logger.info(f"✅ Added event to calendar: {title}")
            return jsonify({
                'event': event,
                'message': 'Event added to calendar',
                'added_to_calendar': True
            }), 200
        else:
            logger.info(f"Event suggested (calendar not connected): {title}")
            return jsonify({
                'message': 'Event created but not added to calendar (connect Google Calendar first)',
                'added_to_calendar': False,
                'suggestion': {
                    'title': title,
                    'description': description,
                    'start_time': start_time,
                    'end_time': end_time
                }
            }), 200
            
    except Exception as e:
        logger.error(f'Error adding Rev event: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask-rev/calendar/block-time', methods=['POST'])
@require_auth
def block_calendar_time():
    """Block out time on user's calendar for study/work"""
    try:
        from models import User
        from utils.google_calendar import GoogleCalendarManager
        from datetime import datetime
        
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        title = data.get('title', 'Study Time')
        start_time = data.get('startTime')
        end_time = data.get('endTime')
        reason = data.get('reason', '')
        
        if not all([start_time, end_time]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        full_title = f"{title}" + (f" - {reason}" if reason else "")
        
        if user.google_calendar_token:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            event = GoogleCalendarManager.create_event(
                access_token=user.google_calendar_token,
                title=full_title,
                start_time=start_dt,
                end_time=end_dt,
                description=f"Study block scheduled by Rev\nReason: {reason}" if reason else "Study block scheduled by Rev"
            )
            
            logger.info(f"✅ Blocked calendar time: {title}")
            return jsonify({
                'event': event,
                'message': 'Time blocked on calendar',
                'blocked': True
            }), 200
        else:
            return jsonify({
                'message': 'Calendar not connected. Connect Google Calendar to block time.',
                'blocked': False
            }), 400
            
    except Exception as e:
        logger.error(f'Error blocking calendar time: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/canvas/import-calendar', methods=['POST'])
@require_auth
def import_canvas_calendar():
    """Import assignments and events from Canvas calendar feed"""
    try:
        from utils.canvas import CanvasCalendarManager
        from models import User, Syllabus, db
        
        data = request.get_json()
        canvas_url = data.get('canvas_url')
        
        if not canvas_url:
            return jsonify({'error': 'Canvas calendar URL required'}), 400
        
        # Validate URL
        if not CanvasCalendarManager.validate_canvas_url(canvas_url):
            return jsonify({'error': 'Invalid Canvas calendar URL'}), 400
        
        # Fetch and parse calendar
        calendar = CanvasCalendarManager.fetch_canvas_calendar(canvas_url)
        if not calendar:
            return jsonify({'error': 'Failed to fetch Canvas calendar'}), 500
        
        # Extract events
        events = CanvasCalendarManager.extract_events(calendar)
        if not events:
            return jsonify({'error': 'No events found in Canvas calendar'}), 400
        
        # Format for syllabus
        formatted = CanvasCalendarManager.format_for_syllabus(events)
        
        logger.info(f"✅ Canvas import: {len(formatted['keyDates'])} key dates, {len(events)} total events")
        
        return jsonify({
            'message': 'Canvas calendar imported successfully',
            'events_count': len(events),
            'key_dates_count': len(formatted['keyDates']),
            'data': formatted
        }), 200
        
    except Exception as e:
        logger.error(f'Error importing Canvas calendar: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/canvas/import-and-create-syllabus', methods=['POST'])
@require_auth
def import_canvas_and_create():
    """Import Canvas calendar and create syllabus entries"""
    try:
        from utils.canvas import CanvasCalendarManager
        from utils.openai import store_syllabus
        from models import User, db
        
        data = request.get_json()
        canvas_url = data.get('canvas_url')
        course_name = data.get('course_name', 'Canvas Imported Course')
        
        if not canvas_url:
            return jsonify({'error': 'Canvas calendar URL required'}), 400
        
        # Fetch and parse calendar
        calendar = CanvasCalendarManager.fetch_canvas_calendar(canvas_url)
        if not calendar:
            return jsonify({'error': 'Failed to fetch Canvas calendar'}), 500
        
        # Extract and format events
        events = CanvasCalendarManager.extract_events(calendar)
        formatted = CanvasCalendarManager.format_for_syllabus(events)
        
        # Create syllabus entry
        syllabus_data = {
            'course': course_name,
            'instructor': 'Canvas Imported',
            'semester': 'Unknown',
            'keyDates': formatted['keyDates'],
            'topics': formatted['topics'],
            'gradingBreakdown': []
        }
        
        # Store in database
        result = store_syllabus(syllabus_data, request.user_id)
        
        if result['success']:
            logger.info(f"✅ Created syllabus from Canvas for user {request.user_id}")
            return jsonify({
                'message': 'Canvas calendar imported and syllabus created',
                'syllabus_id': result['id'],
                'events_count': len(events),
                'key_dates_count': len(formatted['keyDates'])
            }), 200
        else:
            return jsonify({'error': 'Failed to create syllabus'}), 500
            
    except Exception as e:
        logger.error(f'Error importing Canvas and creating syllabus: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting RevOS Server...")
    print(f"🚀 OpenAI API Key: {'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET'}")
    print(f"🚀 Pinecone API Key: {'SET' if os.getenv('PINECONE_API_KEY') else 'NOT SET'}")
    print(f"🚀 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    app.run(debug=True, host='0.0.0.0', port=5000)