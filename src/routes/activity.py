from flask import Blueprint, jsonify, request, session
from src.models.user import User, Exam, Subject, QuizTest, TestResult, UserAnswer, db, Question
from src.routes.user import login_required
from sqlalchemy import func, desc
from datetime import datetime, timedelta

activity_bp = Blueprint('activity', __name__)


@activity_bp.route('/my-activity', methods=['GET'])
@login_required
def get_my_activity():
    """Get comprehensive activity summary for the current user with pagination"""
    try:
        user_id = session['user_id']

        # Get pagination parameters from request (default to page 1, 10 items per page)
        page = request.args.get('page', default=1, type=int)
        per_page = request.args.get('per_page', default=10, type=int)

        # Calculate offset
        offset = (page - 1) * per_page

        # Get total tests taken (for pagination info)
        total_tests = TestResult.query.filter_by(
            user_id=user_id
        ).filter(TestResult.completed_at.isnot(None)).count()

        # Get average score
        avg_score_result = db.session.query(
            func.avg(TestResult.score * 100.0 / TestResult.total_questions)
        ).filter_by(user_id=user_id).filter(
            TestResult.completed_at.isnot(None)
        ).scalar()

        avg_score = round(avg_score_result, 2) if avg_score_result else 0

        # Get total correct answers across all tests
        total_correct_answers = db.session.query(
            func.sum(TestResult.score)
        ).filter_by(user_id=user_id).filter(
            TestResult.completed_at.isnot(None)
        ).scalar()

        correct_answers_count = total_correct_answers or 0

        # Get total time spent (in minutes)
        total_time_result = db.session.query(
            func.sum(TestResult.time_taken_seconds)
        ).filter_by(user_id=user_id).filter(
            TestResult.completed_at.isnot(None)
        ).scalar()

        total_time_minutes = round((total_time_result or 0) / 60, 2)

        # Get paginated recent activity
        recent_tests_query = db.session.query(TestResult, QuizTest, Subject, Exam).join(
            QuizTest, TestResult.quiz_test_id == QuizTest.id
        ).join(
            Subject, QuizTest.subject_id == Subject.id
        ).join(
            Exam, Subject.exam_id == Exam.id
        ).filter(
            TestResult.user_id == user_id,
            TestResult.completed_at.isnot(None)
        ).order_by(desc(TestResult.completed_at))

        # Apply pagination
        paginated_tests = recent_tests_query.offset(offset).limit(per_page).all()

        recent_activity = []
        for test_result, quiz_test, subject, exam in paginated_tests:
            activity_item = test_result.to_dict()
            activity_item['quiz_test'] = quiz_test.to_dict()
            activity_item['subject'] = subject.to_dict()
            activity_item['exam'] = exam.to_dict()
            recent_activity.append(activity_item)

        # Get performance by subject (unchanged)
        subject_performance = db.session.query(
            Subject.name,
            Subject.id,
            func.count(TestResult.id).label('tests_taken'),
            func.avg(TestResult.score * 100.0 / TestResult.total_questions).label('avg_percentage'),
            func.sum(TestResult.score).label('correct_answers'),
            func.sum(TestResult.total_questions).label('total_questions')
        ).join(
            QuizTest, Subject.id == QuizTest.subject_id
        ).join(
            TestResult, QuizTest.id == TestResult.quiz_test_id
        ).filter(
            TestResult.user_id == user_id,
            TestResult.completed_at.isnot(None)
        ).group_by(Subject.id, Subject.name).all()

        subject_stats = []
        for subject_name, subject_id, tests_taken, avg_percentage, correct_answers, total_questions in subject_performance:
            subject_stats.append({
                'subject_name': subject_name,
                'subject_id': subject_id,
                'tests_taken': tests_taken,
                'average_percentage': round(avg_percentage, 2) if avg_percentage else 0,
                'correct_answers': correct_answers or 0,
                'total_questions': total_questions or 0
            })

        # Get monthly activity (unchanged)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        monthly_activity = db.session.query(
            func.strftime('%Y-%m', TestResult.completed_at).label('month'),
            func.count(TestResult.id).label('tests_count'),
            func.avg(TestResult.score * 100.0 / TestResult.total_questions).label('avg_score')
        ).filter(
            TestResult.user_id == user_id,
            TestResult.completed_at >= six_months_ago,
            TestResult.completed_at.isnot(None)
        ).group_by(func.strftime('%Y-%m', TestResult.completed_at)).all()

        monthly_stats = []
        for month, tests_count, avg_score in monthly_activity:
            monthly_stats.append({
                'month': month,
                'tests_count': tests_count,
                'average_score': round(avg_score, 2) if avg_score else 0
            })

        return jsonify({
            'summary': {
                'total_tests': total_tests,
                'average_score': avg_score,
                'total_time_minutes': total_time_minutes,
                'correct_answers': correct_answers_count
            },
            'recent_activity': recent_activity,
            'subject_performance': subject_stats,
            'monthly_activity': monthly_stats,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_pages': (total_tests + per_page - 1) // per_page,  # Ceiling division
                'total_items': total_tests
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@activity_bp.route('/leaderboard', methods=['GET'])
@login_required
def get_leaderboard():
    """Get leaderboard showing top performers"""
    try:
        # Get top performers by average score
        top_performers = db.session.query(
            User.username,
            User.id,
            func.count(TestResult.id).label('tests_taken'),
            func.avg(TestResult.score * 100.0 / TestResult.total_questions).label('avg_percentage'),
            func.sum(TestResult.time_taken_seconds).label('total_time')
        ).join(
            TestResult, User.id == TestResult.user_id
        ).filter(
            TestResult.completed_at.isnot(None)
        ).group_by(User.id, User.username).having(
            func.count(TestResult.id) >= 1  # At least 1 test taken
        ).order_by(desc('avg_percentage')).limit(20).all()

        leaderboard = []
        for rank, (username, user_id, tests_taken, avg_percentage, total_time) in enumerate(top_performers, 1):
            leaderboard.append({
                'rank': rank,
                'username': username,
                'user_id': user_id,
                'tests_taken': tests_taken,
                'average_percentage': round(avg_percentage, 2) if avg_percentage else 0,
                'total_time_minutes': round((total_time or 0) / 60, 2)
            })

        return jsonify(leaderboard), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@activity_bp.route('/statistics', methods=['GET'])
@login_required
def get_statistics():
    """Get overall platform statistics"""
    try:
        # Total users
        total_users = User.query.count()

        # Total exams, subjects, quiz tests
        total_exams = Exam.query.filter_by(is_active=True).count()
        total_subjects = Subject.query.filter_by(is_active=True).count()
        total_quiz_tests = QuizTest.query.filter_by(is_active=True).count()

        # Total tests taken
        total_tests_taken = TestResult.query.filter(
            TestResult.completed_at.isnot(None)
        ).count()

        # Most popular subjects
        popular_subjects = db.session.query(
            Subject.name,
            Subject.id,
            func.count(TestResult.id).label('tests_count')
        ).join(
            QuizTest, Subject.id == QuizTest.subject_id
        ).join(
            TestResult, QuizTest.id == TestResult.quiz_test_id
        ).filter(
            TestResult.completed_at.isnot(None)
        ).group_by(Subject.id, Subject.name).order_by(
            desc('tests_count')
        ).limit(10).all()

        popular_subjects_list = []
        for subject_name, subject_id, tests_count in popular_subjects:
            popular_subjects_list.append({
                'subject_name': subject_name,
                'subject_id': subject_id,
                'tests_count': tests_count
            })

        # Recent activity across platform
        recent_platform_activity = db.session.query(
            User.username,
            TestResult.completed_at,
            QuizTest.name.label('quiz_name'),
            Subject.name.label('subject_name'),
            TestResult.score,
            TestResult.total_questions
        ).join(
            User, TestResult.user_id == User.id
        ).join(
            QuizTest, TestResult.quiz_test_id == QuizTest.id
        ).join(
            Subject, QuizTest.subject_id == Subject.id
        ).filter(
            TestResult.completed_at.isnot(None)
        ).order_by(desc(TestResult.completed_at)).limit(20).all()

        recent_activity = []
        for username, completed_at, quiz_name, subject_name, score, total_questions in recent_platform_activity:
            percentage = round((score / total_questions) * 100, 2) if total_questions > 0 else 0
            recent_activity.append({
                'username': username,
                'completed_at': completed_at.isoformat() if completed_at else None,
                'quiz_name': quiz_name,
                'subject_name': subject_name,
                'score': score,
                'total_questions': total_questions,
                'percentage': percentage
            })

        return jsonify({
            'platform_stats': {
                'total_users': total_users,
                'total_exams': total_exams,
                'total_subjects': total_subjects,
                'total_quiz_tests': total_quiz_tests,
                'total_tests_taken': total_tests_taken
            },
            'popular_subjects': popular_subjects_list,
            'recent_activity': recent_activity
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@activity_bp.route('/subject/<int:subject_id>/statistics', methods=['GET'])
@login_required
def get_subject_statistics(subject_id):
    """Get statistics for a specific subject"""
    try:
        user_id = session['user_id']

        # Verify subject exists
        subject = Subject.query.get_or_404(subject_id)

        # Get user's performance in this subject
        user_tests = db.session.query(TestResult, QuizTest).join(
            QuizTest, TestResult.quiz_test_id == QuizTest.id
        ).filter(
            TestResult.user_id == user_id,
            QuizTest.subject_id == subject_id,
            TestResult.completed_at.isnot(None)
        ).order_by(desc(TestResult.completed_at)).all()

        user_performance = []
        total_score = 0
        total_questions = 0

        for test_result, quiz_test in user_tests:
            result_dict = test_result.to_dict()
            result_dict['quiz_test'] = quiz_test.to_dict()
            user_performance.append(result_dict)
            total_score += test_result.score
            total_questions += test_result.total_questions

        user_avg_percentage = round((total_score / total_questions) * 100, 2) if total_questions > 0 else 0

        # Get subject average across all users
        subject_avg = db.session.query(
            func.avg(TestResult.score * 100.0 / TestResult.total_questions)
        ).join(
            QuizTest, TestResult.quiz_test_id == QuizTest.id
        ).filter(
            QuizTest.subject_id == subject_id,
            TestResult.completed_at.isnot(None)
        ).scalar()

        subject_avg_percentage = round(subject_avg, 2) if subject_avg else 0

        # Get quiz tests in this subject
        quiz_tests = QuizTest.query.filter_by(
            subject_id=subject_id,
            is_active=True
        ).all()

        return jsonify({
            'subject': subject.to_dict(),
            'user_performance': {
                'tests_taken': len(user_tests),
                'average_percentage': user_avg_percentage,
                'test_history': user_performance
            },
            'subject_average': subject_avg_percentage,
            'available_quiz_tests': [qt.to_dict() for qt in quiz_tests]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@activity_bp.route('/test-results/<int:test_result_id>/details', methods=['GET'])
@login_required
def get_test_result_details(test_result_id):
    """Get detailed test result with questions and answers"""
    try:
        user_id = session['user_id']

        # Get test result with related data
        test_result = db.session.query(TestResult, QuizTest, Subject, Exam).join(
            QuizTest, TestResult.quiz_test_id == QuizTest.id
        ).join(
            Subject, QuizTest.subject_id == Subject.id
        ).join(
            Exam, Subject.exam_id == Exam.id
        ).filter(
            TestResult.id == test_result_id,
            TestResult.user_id == user_id
        ).first()

        if not test_result:
            return jsonify({'error': 'Test result not found'}), 404

        test_result_obj, quiz_test, subject, exam = test_result

        # Get all user answers for this test with questions
        user_answers = db.session.query(UserAnswer, Question).join(
            Question, UserAnswer.question_id == Question.id
        ).filter(
            UserAnswer.test_result_id == test_result_id
        ).order_by(Question.id).all()

        questions_with_answers = []
        for user_answer, question in user_answers:
            questions_with_answers.append({
                'question': question.to_dict(),
                'selected_answer': user_answer.selected_answer,
                'is_correct': user_answer.is_correct,
                'answered_at': user_answer.answered_at.isoformat() if user_answer.answered_at else None
            })

        # Add correct answer to question data
        for qa in questions_with_answers:
            qa['question']['correct_answer'] = db.session.query(Question.correct_answer).filter_by(
                id=qa['question']['id']
            ).scalar()

        result_data = test_result_obj.to_dict()
        result_data['quiz_test'] = quiz_test.to_dict()
        result_data['subject'] = subject.to_dict()
        result_data['exam'] = exam.to_dict()
        result_data['questions_with_answers'] = questions_with_answers

        return jsonify(result_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

