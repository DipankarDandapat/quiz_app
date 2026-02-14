from flask import Blueprint, jsonify, request, session
from src.models.user import Question, QuizTest, TestResult, UserAnswer, db
from src.routes.user import login_required
from datetime import datetime, timedelta
import random

quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.route('/quiz-tests/<int:quiz_test_id>/start', methods=['POST'])
@login_required
def start_quiz_test(quiz_test_id):
    """Start a quiz test session"""
    try:
        user_id = session['user_id']

        # Get quiz test
        quiz_test = QuizTest.query.get_or_404(quiz_test_id)
        if not quiz_test.is_active:
            return jsonify({'error': 'Quiz test not available'}), 404

        # Default retake_limit to 1 if None
        retake_limit = quiz_test.retake_limit or 1
        # Check how many times the user has completed this test
        completed_tests_count = TestResult.query.filter(
            TestResult.user_id == user_id,
            TestResult.quiz_test_id == quiz_test_id,
            TestResult.completed_at.isnot(None)
        ).count()

        if completed_tests_count >= retake_limit:
            return jsonify({
                'error': f'You have already taken this test {retake_limit} time(s).'
            }), 400

        # Get all questions for this quiz test
        questions = Question.query.filter_by(quiz_test_id=quiz_test_id).all()
        if not questions:
            return jsonify({'error': 'No questions available for this test'}), 404

        # Create test result record
        started_at = datetime.utcnow()
        test_result = TestResult(
            user_id=user_id,
            quiz_test_id=quiz_test_id,
            score=0,  # Will be calculated later
            total_questions=len(questions),
            time_taken_seconds=0,  # Will be calculated later
            started_at=started_at,
            completed_at=None  # Will be set when test is completed
        )

        db.session.add(test_result)
        db.session.commit()

        # Store test session info
        session[f'test_{quiz_test_id}_result_id'] = test_result.id
        session[f'test_{quiz_test_id}_started_at'] = started_at.isoformat()

        return jsonify({
            'message': 'Quiz test started successfully',
            'test_result_id': test_result.id,
            'quiz_test': quiz_test.to_dict(),
            'total_questions': len(questions),
            'time_limit_minutes': quiz_test.time_limit_minutes,
            'started_at': started_at.isoformat()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/quiz-tests/<int:quiz_test_id>/questions', methods=['GET'])
@login_required
def get_quiz_questions(quiz_test_id):
    """Get all questions for a quiz test (without correct answers)"""
    try:
        user_id = session['user_id']

        # Check if user has started this test
        test_result_key = f'test_{quiz_test_id}_result_id'
        if test_result_key not in session:
            return jsonify({'error': 'Test not started. Please start the test first.'}), 400

        # Get quiz test
        quiz_test = QuizTest.query.get_or_404(quiz_test_id)
        if not quiz_test.is_active:
            return jsonify({'error': 'Quiz test not available'}), 404

        # Get questions (without correct answers for security)
        questions = Question.query.filter_by(quiz_test_id=quiz_test_id).all()

        questions_data = []
        for question in questions:
            question_dict = question.to_dict()
            # Remove correct answer from response for security
            question_dict.pop('correct_answer', None)
            questions_data.append(question_dict)

        return jsonify({
            'questions': questions_data,
            'quiz_test': quiz_test.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/quiz-tests/<int:quiz_test_id>/submit-answer', methods=['POST'])
@login_required
def submit_answer(quiz_test_id):
    """Submit an answer for a specific question"""
    try:
        user_id = session['user_id']
        data = request.json

        if not data or 'question_id' not in data or 'selected_answer' not in data:
            return jsonify({'error': 'Question ID and selected answer are required'}), 400

        # Check if user has started this test
        test_result_key = f'test_{quiz_test_id}_result_id'
        if test_result_key not in session:
            return jsonify({'error': 'Test not started. Please start the test first.'}), 400

        test_result_id = session[test_result_key]
        test_result = TestResult.query.get(test_result_id)
        if not test_result:
            return jsonify({'error': 'Test session not found'}), 404

        # Check if test is already completed
        if test_result.completed_at:
            return jsonify({'error': 'Test already completed'}), 400

        # Get question and verify it belongs to this quiz test
        question = Question.query.get(data['question_id'])
        if not question or question.quiz_test_id != quiz_test_id:
            return jsonify({'error': 'Invalid question'}), 404

        # Check if answer already exists for this question
        existing_answer = UserAnswer.query.filter_by(
            test_result_id=test_result_id,
            question_id=data['question_id']
        ).first()

        if existing_answer:
            # Update existing answer
            existing_answer.selected_answer = data['selected_answer']
            existing_answer.is_correct = (data['selected_answer'].upper() == question.correct_answer.upper())
            existing_answer.answered_at = datetime.utcnow()
        else:
            # Create new answer
            user_answer = UserAnswer(
                test_result_id=test_result_id,
                question_id=data['question_id'],
                selected_answer=data['selected_answer'],
                is_correct=(data['selected_answer'].upper() == question.correct_answer.upper())
            )
            db.session.add(user_answer)

        db.session.commit()

        return jsonify({'message': 'Answer submitted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/quiz-tests/<int:quiz_test_id>/submit', methods=['POST'])
@login_required
def submit_quiz_test(quiz_test_id):
    """Submit the entire quiz test and calculate results"""
    try:
        user_id = session['user_id']

        # Check if user has started this test
        test_result_key = f'test_{quiz_test_id}_result_id'
        started_at_key = f'test_{quiz_test_id}_started_at'

        if test_result_key not in session or started_at_key not in session:
            return jsonify({'error': 'Test not started. Please start the test first.'}), 400

        test_result_id = session[test_result_key]
        test_result = TestResult.query.get(test_result_id)
        if not test_result:
            return jsonify({'error': 'Test session not found'}), 404

        # Check if test is already completed
        if test_result.completed_at:
            return jsonify({'error': 'Test already completed'}), 400

        # Calculate time taken
        started_at = datetime.fromisoformat(session[started_at_key])
        completed_at = datetime.utcnow()
        time_taken_seconds = int((completed_at - started_at).total_seconds())

        # Calculate score
        correct_answers = UserAnswer.query.filter_by(
            test_result_id=test_result_id,
            is_correct=True
        ).count()

        # Update test result
        test_result.score = correct_answers
        test_result.time_taken_seconds = time_taken_seconds
        test_result.completed_at = completed_at

        db.session.commit()

        # Clear session data for this test
        session.pop(test_result_key, None)
        session.pop(started_at_key, None)

        return jsonify({
            'message': 'Quiz test submitted successfully',
            'result': test_result.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/quiz-tests/<int:quiz_test_id>/status', methods=['GET'])
@login_required
def get_quiz_test_status(quiz_test_id):
    """Get current status of a quiz test session"""
    try:
        user_id = session['user_id']

        # Check if user has started this test
        test_result_key = f'test_{quiz_test_id}_result_id'
        started_at_key = f'test_{quiz_test_id}_started_at'

        if test_result_key not in session or started_at_key not in session:
            return jsonify({
                'started': False,
                'message': 'Test not started'
            }), 200

        test_result_id = session[test_result_key]
        test_result = TestResult.query.get(test_result_id)
        if not test_result:
            return jsonify({'error': 'Test session not found'}), 404

        # Check if test is completed
        if test_result.completed_at:
            return jsonify({
                'started': True,
                'completed': True,
                'result': test_result.to_dict()
            }), 200

        # Calculate remaining time
        started_at = datetime.fromisoformat(session[started_at_key])
        quiz_test = QuizTest.query.get(quiz_test_id)
        time_limit_seconds = quiz_test.time_limit_minutes * 60
        elapsed_seconds = int((datetime.utcnow() - started_at).total_seconds())
        remaining_seconds = max(0, time_limit_seconds - elapsed_seconds)

        # Get answered questions count
        answered_count = UserAnswer.query.filter_by(test_result_id=test_result_id).count()

        return jsonify({
            'started': True,
            'completed': False,
            'test_result_id': test_result_id,
            'elapsed_seconds': elapsed_seconds,
            'remaining_seconds': remaining_seconds,
            'time_limit_seconds': time_limit_seconds,
            'answered_count': answered_count,
            'total_questions': test_result.total_questions,
            'auto_submit': remaining_seconds <= 0
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/test-results/<int:result_id>', methods=['GET'])
@login_required
def get_test_result(result_id):
    """Get detailed test result with answers"""
    try:
        user_id = session['user_id']

        # Get test result and verify ownership
        test_result = TestResult.query.get_or_404(result_id)
        if test_result.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Get all user answers with question details
        user_answers = db.session.query(UserAnswer, Question).join(
            Question, UserAnswer.question_id == Question.id
        ).filter(UserAnswer.test_result_id == result_id).all()

        answers_data = []
        for user_answer, question in user_answers:
            answer_dict = user_answer.to_dict()
            answer_dict['question'] = question.to_dict()
            answers_data.append(answer_dict)

        # Get quiz test details
        quiz_test = QuizTest.query.get(test_result.quiz_test_id)

        return jsonify({
            'test_result': test_result.to_dict(),
            'quiz_test': quiz_test.to_dict() if quiz_test else None,
            'answers': answers_data
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quiz_bp.route('/my-results', methods=['GET'])
@login_required
def get_my_results():
    """Get all test results for the current user"""
    try:
        user_id = session['user_id']

        # Get all completed test results for the user
        test_results = db.session.query(TestResult, QuizTest).join(
            QuizTest, TestResult.quiz_test_id == QuizTest.id
        ).filter(
            TestResult.user_id == user_id,
            TestResult.completed_at.isnot(None)
        ).order_by(TestResult.completed_at.desc()).all()

        results_data = []
        for test_result, quiz_test in test_results:
            result_dict = test_result.to_dict()
            result_dict['quiz_test'] = quiz_test.to_dict()
            results_data.append(result_dict)

        return jsonify(results_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

