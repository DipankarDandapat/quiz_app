from flask import Blueprint, jsonify, request, session
from src.models.user import Exam, Subject, QuizTest, db
from src.routes.user import login_required

exam_bp = Blueprint('exam', __name__)


@exam_bp.route('/exams', methods=['GET'])
@login_required
def get_exams():
    """Get all active exams"""
    try:
        exams = Exam.query.filter_by(is_active=True).all()
        return jsonify([exam.to_dict() for exam in exams]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/exams/<int:exam_id>', methods=['GET'])
@login_required
def get_exam(exam_id):
    """Get a specific exam by ID"""
    try:
        exam = Exam.query.get_or_404(exam_id)
        if not exam.is_active:
            return jsonify({'error': 'Exam not available'}), 404
        return jsonify(exam.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/exams/<int:exam_id>/subjects', methods=['GET'])
@login_required
def get_exam_subjects(exam_id):
    """Get all subjects for a specific exam"""
    try:
        exam = Exam.query.get_or_404(exam_id)
        if not exam.is_active:
            return jsonify({'error': 'Exam not available'}), 404

        subjects = Subject.query.filter_by(exam_id=exam_id, is_active=True).all()
        return jsonify([subject.to_dict() for subject in subjects]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/subjects/<int:subject_id>', methods=['GET'])
@login_required
def get_subject(subject_id):
    """Get a specific subject by ID"""
    try:
        subject = Subject.query.get_or_404(subject_id)
        if not subject.is_active:
            return jsonify({'error': 'Subject not available'}), 404
        return jsonify(subject.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/subjects/<int:subject_id>/quiz-tests', methods=['GET'])
@login_required
def get_subject_quiz_tests(subject_id):
    """Get all quiz tests for a specific subject"""
    try:
        subject = Subject.query.get_or_404(subject_id)
        if not subject.is_active:
            return jsonify({'error': 'Subject not available'}), 404

        quiz_tests = QuizTest.query.filter_by(subject_id=subject_id, is_active=True).all()
        return jsonify([quiz_test.to_dict() for quiz_test in quiz_tests]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/quiz-tests/<int:quiz_test_id>', methods=['GET'])
@login_required
def get_quiz_test(quiz_test_id):
    """Get a specific quiz test by ID"""
    try:
        quiz_test = QuizTest.query.get_or_404(quiz_test_id)
        if not quiz_test.is_active:
            return jsonify({'error': 'Quiz test not available'}), 404
        return jsonify(quiz_test.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Admin routes for managing exams, subjects, and quiz tests
@exam_bp.route('/admin/exams', methods=['POST'])
@login_required
def create_exam():
    """Create a new exam (admin functionality)"""
    try:
        data = request.json

        if not data or not data.get('name'):
            return jsonify({'error': 'Exam name is required'}), 400

        exam = Exam(
            name=data['name'],
            description=data.get('description', ''),
            is_active=data.get('is_active', True)
        )

        db.session.add(exam)
        db.session.commit()

        return jsonify({
            'message': 'Exam created successfully',
            'exam': exam.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/admin/exams/<int:exam_id>', methods=['PUT'])
@login_required
def update_exam(exam_id):
    """Update an existing exam (admin functionality)"""
    try:
        exam = Exam.query.get_or_404(exam_id)
        data = request.json

        if 'name' in data:
            exam.name = data['name']
        if 'description' in data:
            exam.description = data['description']
        if 'is_active' in data:
            exam.is_active = data['is_active']

        db.session.commit()
        return jsonify(exam.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/admin/subjects', methods=['POST'])
@login_required
def create_subject():
    """Create a new subject (admin functionality)"""
    try:
        data = request.json

        if not data or not data.get('name') or not data.get('exam_id'):
            return jsonify({'error': 'Subject name and exam_id are required'}), 400

        # Verify exam exists
        exam = Exam.query.get(data['exam_id'])
        if not exam:
            return jsonify({'error': 'Exam not found'}), 404

        subject = Subject(
            name=data['name'],
            description=data.get('description', ''),
            exam_id=data['exam_id'],
            is_active=data.get('is_active', True)
        )

        db.session.add(subject)
        db.session.commit()

        return jsonify({
            'message': 'Subject created successfully',
            'subject': subject.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/admin/subjects/<int:subject_id>', methods=['PUT'])
@login_required
def update_subject(subject_id):
    """Update an existing subject (admin functionality)"""
    try:
        subject = Subject.query.get_or_404(subject_id)
        data = request.json

        if 'name' in data:
            subject.name = data['name']
        if 'description' in data:
            subject.description = data['description']
        if 'is_active' in data:
            subject.is_active = data['is_active']

        db.session.commit()
        return jsonify(subject.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/admin/quiz-tests', methods=['POST'])
@login_required
def create_quiz_test():
    """Create a new quiz test (admin functionality)"""
    try:
        data = request.json

        if not data or not data.get('name') or not data.get('subject_id'):
            return jsonify({'error': 'Quiz test name and subject_id are required'}), 400

        # Verify subject exists
        subject = Subject.query.get(data['subject_id'])
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404

        quiz_test = QuizTest(
            name=data['name'],
            description=data.get('description', ''),
            subject_id=data['subject_id'],
            time_limit_minutes=data.get('time_limit_minutes', 20),
            is_active=data.get('is_active', True)
        )

        db.session.add(quiz_test)
        db.session.commit()

        return jsonify({
            'message': 'Quiz test created successfully',
            'quiz_test': quiz_test.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@exam_bp.route('/admin/quiz-tests/<int:quiz_test_id>', methods=['PUT'])
@login_required
def update_quiz_test(quiz_test_id):
    """Update an existing quiz test (admin functionality)"""
    try:
        quiz_test = QuizTest.query.get_or_404(quiz_test_id)
        data = request.json

        if 'name' in data:
            quiz_test.name = data['name']
        if 'description' in data:
            quiz_test.description = data['description']
        if 'time_limit_minutes' in data:
            quiz_test.time_limit_minutes = data['time_limit_minutes']
        if 'is_active' in data:
            quiz_test.is_active = data['is_active']

        db.session.commit()
        return jsonify(quiz_test.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500