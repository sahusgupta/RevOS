from flask import Blueprint, request, jsonify
from functools import wraps
import jwt
import os
from datetime import datetime, timedelta
from models import db, User

# Create auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Configuration
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = 'HS256'
TOKEN_EXPIRATION_HOURS = 24

def generate_token(user_id: int) -> str:
    """Generate a JWT token for the user."""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator to require authentication on routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid authorization header'}), 401
        
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user_id to request context
        request.user_id = payload['user_id']
        return f(*args, **kwargs)
    
    return decorated_function

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    # Validation
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400
    
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Create new user
    try:
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        token = generate_token(user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'token': token
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user and return a JWT token."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username_or_email = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username_or_email or not password:
        return jsonify({'error': 'Username/email and password required'}), 400
    
    # Find user by username or email
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'token': token
    }), 200

@auth_bp.route('/verify', methods=['POST'])
def verify():
    """Verify a token and return user info."""
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({'error': 'Token required'}), 400
    
    token = data['token']
    payload = verify_token(token)
    
    if not payload:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    user = User.query.get(payload['user_id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'valid': True,
        'user': user.to_dict(),
        'token': token
    }), 200
