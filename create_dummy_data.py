#!/usr/bin/env python3
"""
Dummy data seeding script for Quiz Application
This script populates the database with sample data for testing
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User, Exam, Subject, QuizTest, Question, TestResult, UserAnswer
from src.main import app
from datetime import datetime, timedelta
from src.models.user import User, db

import random

def create_dummy_data():
    """Create comprehensive dummy data for the quiz application"""
    
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        db.drop_all()
        db.create_all()
        
        # Create dummy users
        print("Creating dummy users...")
        users = []
        
        # Main test user
        test_user = User(username='testuser', email='test@example.com')
        test_user.set_password('password123')
        users.append(test_user)
        
        # Additional users for leaderboard
        additional_users = [
            ('alice_smith', 'alice@example.com', 'password123'),
            ('bob_jones', 'bob@example.com', 'password123'),
            ('carol_brown', 'carol@example.com', 'password123'),
            ('david_wilson', 'david@example.com', 'password123'),
            ('emma_davis', 'emma@example.com', 'password123'),
        ]
        
        for username, email, password in additional_users:
            user = User(username=username, email=email)
            user.set_password(password)
            users.append(user)
        
        for user in users:
            db.session.add(user)
        
        db.session.commit()
        print(f"Created {len(users)} users")
        
        # Create dummy exams
        print("Creating dummy exams...")
        exams_data = [
            {
                'name': 'Computer Science Fundamentals',
                'description': 'Basic concepts in computer science including programming, algorithms, and data structures'
            },
            {
                'name': 'Mathematics for Engineers',
                'description': 'Essential mathematical concepts for engineering students'
            },
            {
                'name': 'General Knowledge Quiz',
                'description': 'Test your knowledge across various topics including history, geography, and science'
            }
        ]
        
        exams = []
        for exam_data in exams_data:
            exam = Exam(**exam_data)
            exams.append(exam)
            db.session.add(exam)
        
        db.session.commit()
        print(f"Created {len(exams)} exams")
        
        # Create dummy subjects
        print("Creating dummy subjects...")
        subjects_data = [
            # Computer Science Fundamentals subjects
            {'name': 'Python Programming', 'description': 'Learn Python programming basics', 'exam_id': 1},
            {'name': 'Data Structures', 'description': 'Arrays, lists, trees, and graphs', 'exam_id': 1},
            {'name': 'Algorithms', 'description': 'Sorting, searching, and optimization algorithms', 'exam_id': 1},
            
            # Mathematics for Engineers subjects
            {'name': 'Calculus', 'description': 'Differential and integral calculus', 'exam_id': 2},
            {'name': 'Linear Algebra', 'description': 'Matrices, vectors, and linear transformations', 'exam_id': 2},
            {'name': 'Statistics', 'description': 'Probability and statistical analysis', 'exam_id': 2},
            
            # General Knowledge subjects
            {'name': 'World History', 'description': 'Major historical events and civilizations', 'exam_id': 3},
            {'name': 'Geography', 'description': 'Countries, capitals, and physical geography', 'exam_id': 3},
            {'name': 'Science Facts', 'description': 'Basic scientific principles and discoveries', 'exam_id': 3},
        ]
        
        subjects = []
        for subject_data in subjects_data:
            subject = Subject(**subject_data)
            subjects.append(subject)
            db.session.add(subject)
        
        db.session.commit()
        print(f"Created {len(subjects)} subjects")
        
        # Create dummy quiz tests
        print("Creating dummy quiz tests...")
        quiz_tests_data = [
            # Python Programming tests
            {'name': 'Python Basics', 'description': 'Variables, data types, and basic operations', 'subject_id': 1, 'time_limit_minutes': 15},
            {'name': 'Python Functions', 'description': 'Function definition and usage', 'subject_id': 1, 'time_limit_minutes': 20},
            
            # Data Structures tests
            {'name': 'Arrays and Lists', 'description': 'Working with arrays and lists', 'subject_id': 2, 'time_limit_minutes': 25},
            {'name': 'Trees and Graphs', 'description': 'Tree and graph data structures', 'subject_id': 2, 'time_limit_minutes': 30},
            
            # Algorithms tests
            {'name': 'Sorting Algorithms', 'description': 'Bubble sort, merge sort, quick sort', 'subject_id': 3, 'time_limit_minutes': 20},
            
            # Calculus tests
            {'name': 'Derivatives', 'description': 'Basic derivative rules and applications', 'subject_id': 4, 'time_limit_minutes': 25},
            
            # Linear Algebra tests
            {'name': 'Matrix Operations', 'description': 'Matrix multiplication and determinants', 'subject_id': 5, 'time_limit_minutes': 20},
            
            # Statistics tests
            {'name': 'Probability Basics', 'description': 'Basic probability concepts', 'subject_id': 6, 'time_limit_minutes': 15},
            
            # World History tests
            {'name': 'Ancient Civilizations', 'description': 'Egypt, Greece, and Rome', 'subject_id': 7, 'time_limit_minutes': 20},
            
            # Geography tests
            {'name': 'World Capitals', 'description': 'Capital cities of major countries', 'subject_id': 8, 'time_limit_minutes': 15},
            
            # Science Facts tests
            {'name': 'Physics Fundamentals', 'description': 'Basic physics principles', 'subject_id': 9, 'time_limit_minutes': 20},
        ]
        
        quiz_tests = []
        for quiz_test_data in quiz_tests_data:
            quiz_test = QuizTest(**quiz_test_data)
            quiz_tests.append(quiz_test)
            db.session.add(quiz_test)
        
        db.session.commit()
        print(f"Created {len(quiz_tests)} quiz tests")
        
        # Create dummy questions
        print("Creating dummy questions...")
        questions_data = [
            # Python Basics questions (Quiz Test 1)
            {
                'question_text': 'What is the correct way to declare a variable in Python?',
                'option_a': 'var x = 5',
                'option_b': 'x = 5',
                'option_c': 'int x = 5',
                'option_d': 'declare x = 5',
                'correct_answer': 'B',
                'quiz_test_id': 1
            },
            {
                'question_text': 'Which of the following is a mutable data type in Python?',
                'option_a': 'tuple',
                'option_b': 'string',
                'option_c': 'list',
                'option_d': 'integer',
                'correct_answer': 'C',
                'quiz_test_id': 1
            },
            {
                'question_text': 'What does the len() function return?',
                'option_a': 'The length of an object',
                'option_b': 'The type of an object',
                'option_c': 'The value of an object',
                'option_d': 'The memory address',
                'correct_answer': 'A',
                'quiz_test_id': 1
            },
            {
                'question_text': 'Which operator is used for exponentiation in Python?',
                'option_a': '^',
                'option_b': '**',
                'option_c': 'exp()',
                'option_d': 'pow',
                'correct_answer': 'B',
                'quiz_test_id': 1
            },
            {
                'question_text': 'What is the output of print(type([]))?',
                'option_a': '<class \'array\'>',
                'option_b': '<class \'list\'>',
                'option_c': '<class \'tuple\'>',
                'option_d': '<class \'dict\'>',
                'correct_answer': 'B',
                'quiz_test_id': 1
            },
            
            # Python Functions questions (Quiz Test 2)
            {
                'question_text': 'How do you define a function in Python?',
                'option_a': 'function myFunc():',
                'option_b': 'def myFunc():',
                'option_c': 'create myFunc():',
                'option_d': 'func myFunc():',
                'correct_answer': 'B',
                'quiz_test_id': 2
            },
            {
                'question_text': 'What keyword is used to return a value from a function?',
                'option_a': 'return',
                'option_b': 'give',
                'option_c': 'send',
                'option_d': 'output',
                'correct_answer': 'A',
                'quiz_test_id': 2
            },
            {
                'question_text': 'What happens if a function doesn\'t have a return statement?',
                'option_a': 'Error occurs',
                'option_b': 'Returns 0',
                'option_c': 'Returns None',
                'option_d': 'Returns empty string',
                'correct_answer': 'C',
                'quiz_test_id': 2
            },
            
            # Arrays and Lists questions (Quiz Test 3)
            {
                'question_text': 'What is the time complexity of accessing an element in an array by index?',
                'option_a': 'O(n)',
                'option_b': 'O(log n)',
                'option_c': 'O(1)',
                'option_d': 'O(n²)',
                'correct_answer': 'C',
                'quiz_test_id': 3
            },
            {
                'question_text': 'Which operation is most efficient for a linked list?',
                'option_a': 'Random access',
                'option_b': 'Insertion at beginning',
                'option_c': 'Binary search',
                'option_d': 'Sorting',
                'correct_answer': 'B',
                'quiz_test_id': 3
            },
            
            # World Capitals questions (Quiz Test 10)
            {
                'question_text': 'What is the capital of Australia?',
                'option_a': 'Sydney',
                'option_b': 'Melbourne',
                'option_c': 'Canberra',
                'option_d': 'Perth',
                'correct_answer': 'C',
                'quiz_test_id': 10
            },
            {
                'question_text': 'What is the capital of Canada?',
                'option_a': 'Toronto',
                'option_b': 'Vancouver',
                'option_c': 'Montreal',
                'option_d': 'Ottawa',
                'correct_answer': 'D',
                'quiz_test_id': 10
            },
            {
                'question_text': 'What is the capital of Brazil?',
                'option_a': 'São Paulo',
                'option_b': 'Rio de Janeiro',
                'option_c': 'Brasília',
                'option_d': 'Salvador',
                'correct_answer': 'C',
                'quiz_test_id': 10
            },
            {
                'question_text': 'What is the capital of Japan?',
                'option_a': 'Osaka',
                'option_b': 'Tokyo',
                'option_c': 'Kyoto',
                'option_d': 'Hiroshima',
                'correct_answer': 'B',
                'quiz_test_id': 10
            },
            {
                'question_text': 'What is the capital of Egypt?',
                'option_a': 'Alexandria',
                'option_b': 'Cairo',
                'option_c': 'Luxor',
                'option_d': 'Giza',
                'correct_answer': 'B',
                'quiz_test_id': 10
            },
        ]
        
        questions = []
        for question_data in questions_data:
            question = Question(**question_data)
            questions.append(question)
            db.session.add(question)
        
        db.session.commit()
        print(f"Created {len(questions)} questions")
        
        # Create dummy test results for demonstration
        print("Creating dummy test results...")
        
        # Create test results for the main test user
        test_user_id = users[0].id
        
        # Test result 1: Python Basics (completed)
        result1 = TestResult(
            user_id=test_user_id,
            quiz_test_id=1,  # Python Basics
            score=4,
            total_questions=5,
            time_taken_seconds=720,  # 12 minutes
            started_at=datetime.utcnow() - timedelta(days=2),
            completed_at=datetime.utcnow() - timedelta(days=2) + timedelta(minutes=12)
        )
        db.session.add(result1)
        db.session.commit()
        
        # Add user answers for result1
        python_basic_questions = [q for q in questions if q.quiz_test_id == 1]
        answers1 = ['B', 'C', 'A', 'B', 'B']  # 4 correct out of 5
        for i, (question, answer) in enumerate(zip(python_basic_questions, answers1)):
            user_answer = UserAnswer(
                test_result_id=result1.id,
                question_id=question.id,
                selected_answer=answer,
                is_correct=(answer == question.correct_answer)
            )
            db.session.add(user_answer)
        
        # Test result 2: World Capitals (completed)
        result2 = TestResult(
            user_id=test_user_id,
            quiz_test_id=10,  # World Capitals
            score=5,
            total_questions=5,
            time_taken_seconds=480,  # 8 minutes
            started_at=datetime.utcnow() - timedelta(days=1),
            completed_at=datetime.utcnow() - timedelta(days=1) + timedelta(minutes=8)
        )
        db.session.add(result2)
        db.session.commit()
        
        # Add user answers for result2 (all correct)
        capitals_questions = [q for q in questions if q.quiz_test_id == 10]
        for question in capitals_questions:
            user_answer = UserAnswer(
                test_result_id=result2.id,
                question_id=question.id,
                selected_answer=question.correct_answer,
                is_correct=True
            )
            db.session.add(user_answer)
        
        # Create test results for other users (for leaderboard)
        for i, user in enumerate(users[1:], 1):
            # Each user takes a few random tests
            num_tests = random.randint(2, 5)
            for _ in range(num_tests):
                quiz_test_id = random.randint(1, min(len(quiz_tests), 11))
                total_questions = len([q for q in questions if q.quiz_test_id == quiz_test_id])
                if total_questions == 0:
                    total_questions = 5  # Default
                
                score = random.randint(int(total_questions * 0.3), total_questions)
                time_taken = random.randint(300, 1200)  # 5-20 minutes
                
                result = TestResult(
                    user_id=user.id,
                    quiz_test_id=quiz_test_id,
                    score=score,
                    total_questions=total_questions,
                    time_taken_seconds=time_taken,
                    started_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                    completed_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)) + timedelta(seconds=time_taken)
                )
                db.session.add(result)
        
        db.session.commit()
        print("Created dummy test results")
        
        print("\n" + "="*50)
        print("DUMMY DATA CREATION COMPLETED!")
        print("="*50)
        print("\nTest User Credentials:")
        print("Username: testuser")
        print("Password: password123")
        print("Email: test@example.com")
        print("\nOther Users:")
        for username, email, _ in additional_users:
            print(f"Username: {username}, Email: {email}, Password: password123")
        
        print(f"\nDatabase populated with:")
        print(f"- {len(users)} users")
        print(f"- {len(exams)} exams")
        print(f"- {len(subjects)} subjects")
        print(f"- {len(quiz_tests)} quiz tests")
        print(f"- {len(questions)} questions")
        print(f"- Multiple test results for demonstration")
        
        print("\nYou can now:")
        print("1. Login with testuser/password123")
        print("2. Browse exams and subjects")
        print("3. Take quiz tests (especially 'Python Basics' and 'World Capitals')")
        print("4. View activity and leaderboard")
        print("5. See existing test results in activity section")

if __name__ == '__main__':
    create_dummy_data()

