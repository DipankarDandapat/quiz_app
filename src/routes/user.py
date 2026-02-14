from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
from functools import wraps

user_bp = Blueprint('user', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function


@user_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json

        # Validate required fields
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Username, email, and password are required'}), 400

        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400

        # Create new user (default is_active=False)
        user = User(
            username=data['username'],
            email=data['email'],
            is_active=False  # Explicitly set to inactive
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        return jsonify({
            'message': 'Please send an email to d.dandapat96@gmail.com or a WhatsApp message to 9800188406 to activate your account.',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json

        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400

        user = User.query.filter_by(username=data['username']).first()

        if user and user.check_password(data['password']):
            if not user.is_active:
                return jsonify({
                    'error': 'Your account is not active',
                    'message': 'Please send an email to <strong>d.dandapat96@gmail.com</strong> or a WhatsApp message to <strong>9800188406</strong> to activate your account.',
                    'contains_html': True  # Optional flag to indicate HTML content
                }), 403

            session['user_id'] = user.id
            session['username'] = user.username
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@user_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'authenticated': True,
                'user': user.to_dict()
            }), 200
    
    return jsonify({'authenticated': False}), 200

@user_bp.route('/users', methods=['GET'])
@login_required
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    # Only allow users to update their own profile
    if session['user_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = User.query.get_or_404(user_id)
    data = request.json
    
    try:
        if 'username' in data:
            # Check if new username is already taken
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Username already exists'}), 400
            user.username = data['username']
            session['username'] = data['username']
        
        if 'email' in data:
            # Check if new email is already taken
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email']
        
        if 'password' in data:
            user.set_password(data['password'])
        
        db.session.commit()
        return jsonify(user.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    # Only allow users to delete their own account
    if session['user_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = User.query.get_or_404(user_id)
    try:
        db.session.delete(user)
        db.session.commit()
        session.clear()  # Clear session after account deletion
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@user_bp.route('/admin/activate-user/<int:user_id>', methods=['POST'])
@login_required
def activate_user(user_id):
    # In a real app, you'd check if current user is admin
    user = User.query.get_or_404(user_id)
    user.is_active = True
    db.session.commit()
    return jsonify({
        'message': 'User activated successfully',
        'user': user.to_dict()
    }), 200