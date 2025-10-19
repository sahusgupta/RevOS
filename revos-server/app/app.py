from dotenv import load_dotenv
import os
import sys
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

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.dirname(os.path.dirname(__file__))}/revos.db"
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

if __name__ == '__main__':
    print("🚀 Starting RevOS Server...")
    print(f"🚀 OpenAI API Key: {'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET'}")
    print(f"🚀 Pinecone API Key: {'SET' if os.getenv('PINECONE_API_KEY') else 'NOT SET'}")
    print(f"🚀 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    app.run(debug=True, host='0.0.0.0', port=5000)