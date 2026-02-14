// Global variables
let currentUser = null;
let currentQuiz = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let quizTimer = null;
let timeRemaining = 0;
let currentExamId = null;
let currentSubjectId = null;

let currentActivityPage = 1;
const ACTIVITY_PER_PAGE = 10;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

// Authentication functions
async function checkAuthentication() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();

        if (data.authenticated) {
            currentUser = data.user;
            showMainContent();
            loadDashboard();
        } else {
            showLandingPage();
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        showLandingPage();
    }
}

function showLandingPage() {
    document.getElementById('landingContent').classList.remove('hidden');
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('navigation').classList.add('hidden');

    // Update header for landing page
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `
        <div style="display: flex; gap: 15px;">
            <button class="btn btn-primary" onclick="showLoginPopup()">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
            <button class="btn btn-secondary" onclick="showRegisterPopup()">
                <i class="fas fa-user-plus"></i> Register
            </button>
        </div>
    `;
}

function showAuthSection() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('navigation').classList.add('hidden');
}

function showMainContent() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('landingContent').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('navigation').classList.remove('hidden');
    updateUserInfo();
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `
        <span>Welcome, <strong>${currentUser.username}</strong></span>
        <button class="btn btn-danger" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
    `;
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    // Clear any existing messages
    document.getElementById('loginMessage').classList.add('hidden');
    document.getElementById('loginMessage').innerHTML = '';
}

function showRegisterForm() {
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    // Clear any existing messages
    document.getElementById('loginMessage').classList.add('hidden');
    document.getElementById('loginMessage').innerHTML = '';
}

async function login(event) {
    event.preventDefault();

    // Check if it's from modal or regular form
    const isModal = event.target.closest('#modalLoginForm');
    const username = isModal ?
        document.getElementById('modalLoginUsername').value :
        document.getElementById('loginUsername').value;
    const password = isModal ?
        document.getElementById('modalLoginPassword').value :
        document.getElementById('loginPassword').value;

    const loginMessage = document.getElementById('loginMessage');
    loginMessage.classList.add('hidden');
    loginMessage.innerHTML = '';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            showAlert('Login successful!', 'success');
            if (isModal) {
                closeAuthModal();
            }
            showMainContent();
            loadDashboard();
        } else {
            if (data.message) {
                // Show the message div only when there's an error
                loginMessage.classList.remove('hidden');

                // Check if the response contains HTML that should be rendered
                if (data.contains_html) {
                    // Create alert div and set its innerHTML to render HTML tags
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-warning';
                    alertDiv.innerHTML = `${data.error}. ${data.message}`;
                    loginMessage.appendChild(alertDiv);
                } else {
                    // Default behavior for plain text messages
                    loginMessage.innerHTML = `
                        <div class="alert alert-warning">
                            ${data.error}. ${data.message}
                        </div>
                    `;
                }
            } else {
                showAlert(data.error || 'Login failed', 'error');
            }
       }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please try again.', 'error');
    }
}

async function register(event) {
    event.preventDefault();

    // Check if it's from modal or regular form
    const isModal = event.target.closest('#modalRegisterForm');
    const username = isModal ?
        document.getElementById('modalRegisterUsername').value :
        document.getElementById('registerUsername').value;
    const email = isModal ?
        document.getElementById('modalRegisterEmail').value :
        document.getElementById('registerEmail').value;
    const password = isModal ?
        document.getElementById('modalRegisterPassword').value :
        document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Registration successful! Please login.', 'success');
            if (isModal) {
                switchToLogin();
                // Clear modal form
                document.getElementById('modalRegisterUsername').value = '';
                document.getElementById('modalRegisterEmail').value = '';
                document.getElementById('modalRegisterPassword').value = '';
            } else {
                showLoginForm();
                // Clear regular form
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerPassword').value = '';
            }
        } else {
            showAlert(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Registration failed. Please try again.', 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        showAlert('Logged out successfully!', 'success');
        showLandingPage();
        location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Logout failed', 'error');
    }
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    const sections = ['dashboardSection', 'examsSection', 'subjectsSection', 'quizTestsSection', 'quizTakingSection', 'resultsSection', 'activitySection', 'leaderboardSection'];
    sections.forEach(section => {
        document.getElementById(section).classList.add('hidden');
    });

    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Show selected section
    switch(sectionName) {
        case 'dashboard':
            document.getElementById('dashboardSection').classList.remove('hidden');
            loadDashboard();
            break;
        case 'exams':
            document.getElementById('examsSection').classList.remove('hidden');
            loadExams();
            break;
        case 'activity':
            document.getElementById('activitySection').classList.remove('hidden');
            currentActivityPage = 1; // Reset to first page
            loadActivity();
            break;
        case 'leaderboard':
            document.getElementById('leaderboardSection').classList.remove('hidden');
            loadLeaderboard();
            break;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        const response = await fetch('/api/my-activity');
        const data = await response.json();

        if (response.ok) {
            displayDashboardStats(data.summary);
            displayRecentActivity(data.recent_activity);
        } else {
            showAlert('Failed to load dashboard data', 'error');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Failed to load dashboard', 'error');
    }
}

function displayDashboardStats(summary) {
    const statsContainer = document.getElementById('dashboardStats');
    statsContainer.innerHTML = `
        <div class="stat-card" style="color: white;">
            <div class="stat-number">${summary.total_tests}</div>
            <div class="stat-label">Tests Taken</div>
            <i class="fas fa-clipboard-list" style="font-size: 24px; margin-top: 10px; color: #1a75c4;"></i>
        </div>
        <div class="stat-card" style="color: white;">
            <div class="stat-number">${summary.average_score.toFixed(2)}%</div>
            <div class="stat-label">Average Score</div>
            <i class="fas fa-chart-line" style="font-size: 24px; margin-top: 10px; color: #1a75c4;"></i>
        </div>
        <div class="stat-card" style="color: white;">
            <div class="stat-number">${summary.total_time_minutes}</div>
            <div class="stat-label">Minutes Studied</div>
            <i class="fas fa-clock" style="font-size: 24px; margin-top: 10px; color: #1a75c4;"></i>
        </div>
        <div class="stat-card" style="color: white;">
            <div class="stat-number">${summary.correct_answers || 0}</div>
            <div class="stat-label">Correct Answers</div>
             <i class="fas fa-check-circle" style="font-size: 24px; margin-top: 10px;color: #1a75c4;"></i>
        </div>
    `;
    updateCardGradients(); // Set initial gradient
}

// Define new gradients for each card position
const statCardGradients = [
    ['#667eea', '#764ba2'],  // Card 1 default
    ['#4facfe', '#00f2fe'],  // Card 2 default
    ['#43e97b', '#38f9d7'],  // Card 3 default
    ['#ff758c', '#ff7eb3'],  // Card 4 default
];

// Optional: use your full set from other project
const extraGradients = [
    ['#f9f5f1', '#f1f8f9'],
    ['#ffeaea', '#fff5f5'],
    ['#eaf3fd', '#f3f9fe'],
    ['#e8fdf5', '#f0fcfa'],
    ['#f4efff', '#fae7fb'],
    ['#fff8e7', '#fff0d9'],
    ['#f6f0ff', '#eaf4ff'],
    ['#f0ffe5', '#f6fff0'],
    ['#f0fffd', '#fff0f6'],
    ['#fafcff', '#f0f4fa']
];

let gradientIndex = 0;

function updateCardGradients() {
    const cards = document.querySelectorAll('.stat-card');

    cards.forEach((card, idx) => {
        const gradientSet = extraGradients[(gradientIndex + idx) % extraGradients.length];
        const [start, end] = gradientSet;
        card.style.background = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    });

    gradientIndex = (gradientIndex + 1) % extraGradients.length;
}

// Change gradient every 10 seconds
setInterval(updateCardGradients, 10000);



function displayRecentActivity(activities) {
    const activityContainer = document.getElementById('recentActivity');

    if (activities.length === 0) {
        activityContainer.innerHTML = '<p style="text-align: center; color: #666;">No recent activity found. Start taking some quizzes!</p>';
        return;
    }

    const activityHTML = activities.slice(0, 5).map(activity => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
            <div>
                <strong>${activity.quiz_test.name}</strong>
                <br>
                <small style="color: #666;">${activity.subject.name} - ${activity.exam.name}</small>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 18px; font-weight: bold; color: ${activity.percentage >= 70 ? '#28a745' : activity.percentage >= 50 ? '#ffc107' : '#dc3545'};">
                    ${activity.percentage}%
                </div>
                <small style="color: #666;">${new Date(activity.completed_at).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');

    activityContainer.innerHTML = activityHTML;
}

// Exam functions
async function loadExams() {
    showLoading('examsList');

    try {
        const response = await fetch('/api/exams');
        const exams = await response.json();

        if (response.ok) {
            displayExams(exams);
        } else {
            showAlert('Failed to load exams', 'error');
        }
    } catch (error) {
        console.error('Error loading exams:', error);
        showAlert('Failed to load exams', 'error');
    }
}

function displayExams(exams) {
    const examsList = document.getElementById('examsList');

    if (exams.length === 0) {
        examsList.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
                <i class="fas fa-book" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <h3 style="color: #667eea; margin-bottom: 10px;">No Exams Available</h3>
                <p style="color: #666; margin-bottom: 20px;">Check back later for new exam content</p>
            </div>
        `;
        return;
    }

    const examsHTML = exams.map(exam => {
        // Ensure we have proper counts
        const subjectsCount = exam.subject_count || 0;
        const questionsCount = exam.questions_count || exam.total_questions || 0;

        // Format date properly
        const updatedDate = exam.updated_at ? new Date(exam.updated_at) : new Date();
        const formattedDate = updatedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="exam-card" onclick="loadSubjects(${exam.id})"
                 style="cursor: pointer; background: white; border-radius: 12px; overflow: hidden;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.08); transition: all 0.3s ease;">
                <div class="stat-card" style="height: 120px; style="color: white;
                            display: flex; align-items: center; justify-content: center;">
                     <i class="fas fa-book" style="font-size: 48px; color: #6d13c2;;"></i>
                </div>
                <div style="padding: 20px;">
                    <h3 style="color: #667eea; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-book"></i> ${exam.name}
                    </h3>
                    <p style="color: #666; margin-bottom: 15px; min-height: 40px;">
                        ${exam.description || 'Comprehensive test series for this examination'}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 5px; color: #666; font-size: 14px;">
                            <i class="fas fa-layer-group"></i> ${subjectsCount} Subjects
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px; color: #666; font-size: 14px;">
                            <i class="fas fa-question-circle"></i> ${questionsCount} Questions
                        </div>
                    </div>
                </div>
                <div style="padding: 15px 20px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                    <small style="color: #999;">Last updated: ${formattedDate}</small>
                    <i class="fas fa-arrow-right" style="color: #667eea;"></i>
                </div>
            </div>
        `;
    }).join('');

    examsList.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">${examsHTML}</div>`;

    // Add hover effects
    document.querySelectorAll('.exam-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'none';
            card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
        });
    });
}

async function loadSubjects(examId) {
    currentExamId = examId;
    showLoading('subjectsList');
    document.getElementById('examsSection').classList.add('hidden');
    document.getElementById('subjectsSection').classList.remove('hidden');

    try {
        const response = await fetch(`/api/exams/${examId}/subjects`);
        const subjects = await response.json();

        if (response.ok) {
            displaySubjects(subjects);
        } else {
            showAlert('Failed to load subjects', 'error');
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        showAlert('Failed to load subjects', 'error');
    }
}

function displaySubjects(subjects) {
    const subjectsList = document.getElementById('subjectsList');

    if (subjects.length === 0) {
        subjectsList.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
                <i class="fas fa-book-open" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <h3 style="color: #667eea; margin-bottom: 10px;">No Subjects Available</h3>
                <p style="color: #666; margin-bottom: 20px;">This exam doesn't have any subjects yet</p>
                <button class="btn btn-secondary" onclick="showSection('exams')">
                    <i class="fas fa-arrow-left"></i> Back to Exams
                </button>
            </div>
        `;
        return;
    }

    const subjectsHTML = subjects.map(subject => {
        // Ensure we have proper test count
        const testCount = subject.quiz_test_count || 0;

        return `
            <div class="subject-card" onclick="loadQuizTests(${subject.id})"
                 style="cursor: pointer; background: white; border-radius: 12px; overflow: hidden;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.08); transition: all 0.3s ease;">
                 <div class="stat-card" style="height: 120px; style="color: white;
                            display: flex; align-items: center; justify-content: center;">
                   <i class="fas fa-book-open" style="font-size: 48px; color:#6d13c2 ;"></i>
                </div>
                <div style="padding: 20px;">
                    <h3 style="color: #667eea; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-book-open"></i> ${subject.name}
                    </h3>
                    <p style="color: #666; margin-bottom: 15px; min-height: 40px;">
                        ${subject.description || 'Comprehensive test series for this subject'}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 5px; color: #666; font-size: 14px;">
                            <i class="fas fa-clipboard-list"></i> ${testCount} Test${testCount !== 1 ? 's' : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px; color: #666; font-size: 14px;">
                             <i class="fas fa-clock"></i> ${subject.total_time_minutes || 'N/A'} mins
                        </div>
                    </div>
                </div>
                <div style="padding: 15px 20px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 5px; color: #666; font-size: 14px;">
                        <i class="fas fa-chart-line"></i>
                        <span>Your best: ${subject.user_best_score ? `${subject.user_best_score}%` : 'Not taken'}</span>
                    </div>
                    <i class="fas fa-arrow-right" style="color: #667eea;"></i>
                </div>
            </div>
        `;
    }).join('');

    subjectsList.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">${subjectsHTML}</div>`;

    // Add hover effects
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'none';
            card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
        });
    });
}

async function loadQuizTests(subjectId) {
    currentSubjectId = subjectId;
    showLoading('quizTestsList');
    document.getElementById('subjectsSection').classList.add('hidden');
    document.getElementById('quizTestsSection').classList.remove('hidden');
    document.getElementById('resultsSection').classList.add('hidden');

    try {
        const response = await fetch(`/api/subjects/${subjectId}/quiz-tests`);
        const quizTests = await response.json();

        if (response.ok) {
            displayQuizTests(quizTests);
        } else {
            showAlert('Failed to load quiz tests', 'error');
        }
    } catch (error) {
        console.error('Error loading quiz tests:', error);
        showAlert('Failed to load quiz tests', 'error');
    }
}

function displayQuizTests(quizTests) {
    const quizTestsList = document.getElementById('quizTestsList');

    if (quizTests.length === 0) {
        quizTestsList.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
                <i class="fas fa-question-circle" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                <h3 style="color: #667eea; margin-bottom: 10px;">No Quiz Tests Available</h3>
                <p style="color: #666; margin-bottom: 20px;">This subject doesn't have any quiz tests yet</p>
                <button class="btn btn-secondary" onclick="goBackToSubjects()">
                    <i class="fas fa-arrow-left"></i> Back to Subjects
                </button>
            </div>
        `;
        return;
    }

    const quizTestsHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            ${quizTests.map(quizTest => `
                <div class="quiz-test-card"
                     style="background: white; border-radius: 12px; overflow: hidden;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.08); transition: all 0.3s ease;">
                    <div class="stat-card" style="height: 120px; style="color: white;
                            display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-laptop-code" style="font-size: 48px; color:#6d13c2 ;"></i>
                    </div>
                    <div style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                            <h3 style="color: #667eea; margin: 0;">
                                <i class="fas fa-question-circle"></i> ${quizTest.name}
                            </h3>
                            ${quizTest.is_premium ? `
                                <span style="background: #ffc107; color: white; padding: 3px 10px; border-radius: 20px;
                                            font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                                    <i class="fas fa-crown"></i> Premium
                                </span>
                            ` : ''}
                        </div>
                        <p style="color: #666; margin-bottom: 20px;">
                            ${quizTest.description || 'Test your knowledge with this quiz'}
                        </p>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Questions</div>
                                <div style="font-weight: bold; color: #667eea;">${quizTest.question_count}</div>
                            </div>
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Time</div>
                                <div style="font-weight: bold; color: #667eea;">${quizTest.time_limit_minutes} min</div>
                            </div>
                        </div>

                        ${quizTest.last_attempt ? `
                            <div style="background: #f0f4ff; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                                <div style="display: flex; justify-content: space-between; font-size: 14px;">
                                    <span>Last attempt:</span>
                                    <span style="font-weight: bold; color: ${quizTest.last_attempt.score >= 70 ? '#28a745' :
                                                                          quizTest.last_attempt.score >= 50 ? '#ffc107' : '#dc3545'}">
                                        ${quizTest.last_attempt.score}%
                                    </span>
                                </div>
                                <div style="height: 4px; background: #e9ecef; border-radius: 2px; margin-top: 5px; overflow: hidden;">
                                    <div style="height: 100%; width: ${quizTest.last_attempt.score}%;
                                              background: ${quizTest.last_attempt.score >= 70 ? '#28a745' :
                                                          quizTest.last_attempt.score >= 50 ? '#ffc107' : '#dc3545'}">
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <button class="btn btn-primary" onclick="startQuiz(${quizTest.id})" style="width: 100%;">
                            <i class="fas fa-play"></i> Start Quiz
                        </button>

                        ${quizTest.is_premium && !quizTest.is_purchased ? `
                            <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;"
                                    onclick="showPurchaseModal(${quizTest.id})">
                                <i class="fas fa-crown"></i> Unlock Premium
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    quizTestsList.innerHTML = quizTestsHTML;

    // Add hover effects
    document.querySelectorAll('.quiz-test-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'none';
            card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
        });
    });
}

function goBackToSubjects() {
    document.getElementById('quizTestsSection').classList.add('hidden');
    document.getElementById('subjectsSection').classList.remove('hidden');
}

// Quiz taking functions
async function startQuiz(quizTestId) {
    try {
        // Start the quiz
        const startResponse = await fetch(`/api/quiz-tests/${quizTestId}/start`, {
            method: 'POST'
        });
        const startData = await startResponse.json();

        if (!startResponse.ok) {
            showAlert(startData.error || 'Failed to start quiz', 'error');
            return;
        }

        // Get questions
        const questionsResponse = await fetch(`/api/quiz-tests/${quizTestId}/questions`);
        const questionsData = await questionsResponse.json();

        if (!questionsResponse.ok) {
            showAlert('Failed to load questions', 'error');
            return;
        }

        currentQuiz = startData;
        currentQuestions = questionsData.questions;
        currentQuestionIndex = 0;
        userAnswers = {};
        timeRemaining = startData.time_limit_minutes * 60;

        // Show quiz taking section
        document.getElementById('quizTestsSection').classList.add('hidden');
        document.getElementById('quizTakingSection').classList.remove('hidden');

        // Start timer
        startTimer();

        // Display first question
        displayQuestion();

        showAlert('Quiz started! Good luck!', 'success');

    } catch (error) {
        console.error('Error starting quiz:', error);
        showAlert('Failed to start quiz', 'error');
    }
}

function startTimer() {
    document.getElementById('timer').classList.remove('hidden');

    quizTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(quizTimer);
            showAlert('Time is up! Submitting quiz automatically.', 'info');
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timeRemaining').textContent = timeString;

    // Change color when time is running low
    const timer = document.getElementById('timer');
    if (timeRemaining <= 300) { // 5 minutes
        timer.style.background = '#dc3545';
    } else if (timeRemaining <= 600) { // 10 minutes
        timer.style.background = '#ffc107';
    }
}

function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;

    document.getElementById('progressFill').style.width = `${progress}%`;

    const questionHTML = `
        <div class="question-card" style="border-left: 5px solid #667eea;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div class="question-number">Question ${currentQuestionIndex + 1} of ${currentQuestions.length}</div>

            </div>
            <div class="question-text">${question.question_text}</div>

            <div class="options">
                <label class="option ${userAnswers[question.id] === 'A' ? 'selected' : ''}" onclick="selectAnswer(${question.id}, 'A')">
                    <span class="option-letter">A : &nbsp;</span>
                    <div class="option-text">${question.option_a}</div>
                </label>
                <label class="option ${userAnswers[question.id] === 'B' ? 'selected' : ''}" onclick="selectAnswer(${question.id}, 'B')">
                    <span class="option-letter">B :&nbsp; </span>
                    <div class="option-text">${question.option_b}</div>
                </label>
                <label class="option ${userAnswers[question.id] === 'C' ? 'selected' : ''}" onclick="selectAnswer(${question.id}, 'C')">
                    <span class="option-letter">C : &nbsp;</span>
                    <div class="option-text">${question.option_c}</div>
                </label>
                <label class="option ${userAnswers[question.id] === 'D' ? 'selected' : ''}" onclick="selectAnswer(${question.id}, 'D')">
                    <span class="option-letter">D :&nbsp; </span>
                    <div class="option-text">${question.option_d}</div>
                </label>
            </div>

            ${question.explanation ? `
            <div class="explanation" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; display: ${userAnswers[question.id] ? 'block' : 'none'};">
                <strong style="color: #667eea;">Explanation:</strong>
                <p style="margin-top: 5px;">${question.explanation}</p>
            </div>
            ` : ''}
        </div>
    `;

    document.getElementById('questionContainer').innerHTML = questionHTML;

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === currentQuestions.length - 1) {
        document.getElementById('nextBtn').classList.add('hidden');
        document.getElementById('submitBtn').classList.remove('hidden');
    } else {
        document.getElementById('nextBtn').classList.remove('hidden');
        document.getElementById('submitBtn').classList.add('hidden');
    }
}

async function selectAnswer(questionId, answer) {
    userAnswers[questionId] = answer;

    // Update UI
    document.querySelectorAll(`input[name="question_${questionId}"]`).forEach(input => {
        input.checked = input.value === answer;
    });

    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Submit answer to server
    try {
        await fetch(`/api/quiz-tests/${currentQuiz.quiz_test.id}/submit-answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question_id: questionId,
                selected_answer: answer
            }),
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

async function submitQuiz() {
    if (quizTimer) {
        clearInterval(quizTimer);
    }

    try {
        const response = await fetch(`/api/quiz-tests/${currentQuiz.quiz_test.id}/submit`, {
            method: 'POST'
        });
        const data = await response.json();

        if (response.ok) {
            showResults(data.result);
        } else {
            showAlert(data.error || 'Failed to submit quiz', 'error');
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        showAlert('Failed to submit quiz', 'error');
    }
}

function showResults(result) {
    document.getElementById('quizTakingSection').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');

    // Calculate performance metrics
    const percentage = result.percentage;
    const correct_percentage = ((result.score / result.total_questions) * 100).toFixed(2);
    let performanceText, performanceColor, performanceIcon;

    if (percentage >= 80) {
        performanceText = "Excellent!";
        performanceColor = "#28a745";
        performanceIcon = "fas fa-trophy";
    } else if (percentage >= 60) {
        performanceText = "Good Job!";
        performanceColor = "#17a2b8";
        performanceIcon = "fas fa-thumbs-up";
    } else if (percentage >= 40) {
        performanceText = "Keep Practicing";
        performanceColor = "#ffc107";
        performanceIcon = "fas fa-book";
    } else {
        performanceText = "Needs Improvement";
        performanceColor = "#dc3545";
        performanceIcon = "fas fa-redo";
    }

    const resultHTML = `
        <div class="result-card" style="background: linear-gradient(135deg, ${performanceColor} 0%, ${shadeColor(performanceColor, -20)} 100%);">
            <div style="font-size: 24px; margin-bottom: 10px;">
                <i class="${performanceIcon}"></i> ${performanceText}
            </div>
            <div class="result-score">${result.score}/${result.total_questions}</div>
            <div class="result-percentage">${percentage}% Score</div>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
                <div>
                    <div style="font-size: 18px; font-weight: bold;">${Math.floor(result.time_taken_seconds / 60)}:${(result.time_taken_seconds % 60).toString().padStart(2, '0')}</div>
                    <small>Time Taken</small>
                </div>
                <div>
                    <div style="font-size: 18px; font-weight: bold;">${correct_percentage}%</div>
                    <small>Correct Answers</small>
                </div>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-chart-pie"></i> Performance Breakdown
            </h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Correct</span>
                        <span style="font-weight: bold; color: #28a745;">${result.score}</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${(result.score / result.total_questions) * 100}%; background: #28a745;"></div>
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Incorrect</span>
                        <span style="font-weight: bold; color: #dc3545;">${result.total_questions - result.score}</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${((result.total_questions - result.score) / result.total_questions) * 100}%; background: #dc3545;"></div>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                <button class="btn btn-primary" onclick="showSection('dashboard')" style="min-width: 200px;">
                    <i class="fas fa-home"></i> Back to Dashboard
                </button>
                <button class="btn btn-secondary" onclick="showSection('activity')" style="min-width: 200px;">
                    <i class="fas fa-chart-line"></i> View Activity
                </button>
                <button class="btn btn-secondary" onclick="loadQuizTests(${currentSubjectId})" style="min-width: 200px;">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        </div>
    `;

    document.getElementById('resultContent').innerHTML = resultHTML;
}

function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

// Activity functions
async function loadActivity(page = 1) {
    showLoading('activityContent');
    currentActivityPage = page;

    try {
        const response = await fetch(`/api/my-activity?page=${page}&per_page=${ACTIVITY_PER_PAGE}`);
        const data = await response.json();

        if (response.ok) {
            displayActivity(data);
        } else {
            showAlert('Failed to load activity data', 'error');
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        showAlert('Failed to load activity', 'error');
    }
}

function displayActivity(data) {
    const activityHTML = `
        <div class="stats-grid" style="margin-bottom: 30px;">
             <div class="stat-card" style="color: white;">
                <div class="stat-number">${data.summary.total_tests}</div>
                <div class="stat-label">Total Tests</div>
                 <i class="fas fa-clipboard-list"; style="font-size: 24px; margin-top: 10px; color: #1a75c4;"></i>
            </div>
            <div class="stat-card" style="color: white;">
                <div class="stat-number">${data.summary.average_score.toFixed(2)}%</div>
                <div class="stat-label">Average Score</div>
                    <i class="fas fa-chart-line"; style="font-size: 24px; margin-top: 10px; color: #1a75c4;"></i>
            </div>
            <div class="stat-card" style="color: white;">
                <div class="stat-number">${data.summary.total_time_minutes}</div>
                <div class="stat-label">Total Time (min)</div>
                <i class="fas fa-clock"; style="font-size: 24px; margin-top: 10px; color: #1a75c4;"></i>
            </div>
            <div class="stat-card" style="color: white;">
                <div class="stat-number">${data.summary.correct_answers || 0}</div>
                <div class="stat-label">Correct Answers</div>
                 <i class="fas fa-check-circle"; style="font-size: 24px; margin-top: 10px; color: #1a75c4;"></i>
            </div>
        </div>

        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">
                    <i class="fas fa-history"></i> Test History
                </h3>

            </div>

            ${data.recent_activity.length === 0 ? `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-clipboard-list" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                    <h4 style="color: #667eea; margin-bottom: 10px;">No Test History Yet</h4>
                    <p style="color: #666; margin-bottom: 20px;">Take your first quiz to start tracking your progress</p>
                    <button class="btn btn-primary" onclick="showSection('exams')">
                        <i class="fas fa-book"></i> Browse Exams
                    </button>
                </div>
            ` : `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 12px 15px; text-align: left;">Test</th>
                                <th style="padding: 12px 15px; text-align: left;">Subject</th>
                                <th style="padding: 12px 15px; text-align: center;">Score</th>
                                <th style="padding: 12px 15px; text-align: center;">Time</th>
                                <th style="padding: 12px 15px; text-align: right;">Date</th>
                                <th style="padding: 12px 15px; text-align: center;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.recent_activity.map(activity => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px 15px;">
                                        <strong>${activity.quiz_test.name}</strong>
                                        <div style="font-size: 12px; color: #666;">${activity.exam.name}</div>
                                    </td>
                                    <td style="padding: 12px 15px;">${activity.subject.name}</td>
                                    <td style="padding: 12px 15px; text-align: center;">
                                        <span style="display: inline-block; padding: 3px 10px; border-radius: 20px;
                                            background: ${activity.percentage >= 70 ? 'rgba(40, 167, 69, 0.1)' :
                                                       activity.percentage >= 50 ? 'rgba(255, 193, 7, 0.1)' : 'rgba(220, 53, 69, 0.1)'};
                                            color: ${activity.percentage >= 70 ? '#28a745' :
                                                    activity.percentage >= 50 ? '#ffc107' : '#dc3545'};">
                                            ${activity.score}/${activity.total_questions} (${activity.percentage}%)
                                        </span>
                                    </td>
                                    <td style="padding: 12px 15px; text-align: center;">
                                        ${Math.floor(activity.time_taken_seconds / 60)}:${(activity.time_taken_seconds % 60).toString().padStart(2, '0')}
                                    </td>
                                    <td style="padding: 12px 15px; text-align: right;">
                                        ${new Date(activity.completed_at).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            timeZone: 'Asia/Kolkata'
                                        }).replace(/ /g, '-')}
                                        <div style="font-size: 12px; color: #666;">
                                            ${new Date(activity.completed_at + 'Z').toLocaleTimeString('en-IN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true,
                                                timeZone: 'Asia/Kolkata'
                                            })}
                                       </div>
                                    </td>
                                    <td style="padding: 12px 15px; text-align: center;">
                                        <button class="btn btn-primary" onclick="viewTestDetails(${activity.id})" style="padding: 5px 10px; font-size: 12px;">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                    <div style="color: #666;">
                        Showing ${Math.min(data.recent_activity.length, ACTIVITY_PER_PAGE)} of ${data.summary.total_tests} tests
                    </div>
                    <div style="display: flex; gap: 10px;">
                         <button class="btn btn-secondary" style="padding: 8px 15px;"

                                onclick="loadActivity(${currentActivityPage - 1})"

                                ${currentActivityPage <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                        <button class="btn btn-secondary" style="padding: 8px 15px;"

                                onclick="loadActivity(${currentActivityPage + 1})"

                                ${(currentActivityPage * ACTIVITY_PER_PAGE) >= data.summary.total_tests ? 'disabled' : ''}>
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `}
        </div>

        ${data.subject_performance.length > 0 ? `
        <div class="card">
            <h3 style="margin-bottom: 20px;">
                <i class="fas fa-chart-bar"></i> Performance by Subject
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                ${data.subject_performance.map(subject => `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <strong>${subject.subject_name}</strong>
                            <span style="font-weight: bold;
                                color: ${subject.average_percentage >= 70 ? '#28a745' :
                                        subject.average_percentage >= 50 ? '#ffc107' : '#dc3545'};">
                                ${subject.average_percentage}%
                            </span>
                        </div>
                        <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${subject.average_percentage}%;
                                background: ${subject.average_percentage >= 70 ? 'linear-gradient(90deg, #28a745, #43e97b)' :
                                            subject.average_percentage >= 50 ? 'linear-gradient(90deg, #ffc107, #ffd700)' :
                                            'linear-gradient(90deg, #dc3545, #ff758c)'};">
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; color: #666;">
                            <span>${subject.tests_taken} tests</span>
                            <span>${subject.correct_answers}/${subject.total_questions} correct</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;

    document.getElementById('activityContent').innerHTML = activityHTML;
}

// Leaderboard functions
async function loadLeaderboard() {
    showLoading('leaderboardContent');

    try {
        const response = await fetch('/api/leaderboard');
        const leaderboard = await response.json();

        if (response.ok) {
            displayLeaderboard(leaderboard);
        } else {
            showAlert('Failed to load leaderboard', 'error');
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showAlert('Failed to load leaderboard', 'error');
    }
}

function displayLeaderboard(leaderboard) {
    if (leaderboard.length === 0) {
        document.getElementById('leaderboardContent').innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px;">
                <i class="fas fa-trophy" style="font-size: 48px; color: #ffd700; margin-bottom: 20px;"></i>
                <h3 style="color: #667eea; margin-bottom: 10px;">No Leaderboard Data Yet</h3>
                <p style="color: #666; margin-bottom: 20px;">Be the first to take a quiz and appear on the leaderboard!</p>
                <button class="btn btn-primary" onclick="showSection('exams')">
                    <i class="fas fa-book"></i> Take a Quiz
                </button>
            </div>
        `;
        return;
    }

    const leaderboardHTML = leaderboard.map((user, index) => `
        <div class="leaderboard-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; background: ${index < 3 ? 'rgba(102, 126, 234, 0.05)' : 'white'};">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 40px; height: 40px; border-radius: 50%;
                    background: ${index === 0 ? 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)' :
                               index === 1 ? 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)' :
                               index === 2 ? 'linear-gradient(135deg, #cd7f32 0%, #b56c28 100%)' : '#667eea'};
                    display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${index + 1}
                </div>
                <div>
                    <strong>${user.username}</strong>
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        <small style="color: #666; display: flex; align-items: center; gap: 3px;">
                            <i class="fas fa-clipboard-list" style="font-size: 10px;"></i> ${user.tests_taken} tests
                        </small>
                        <small style="color: #666; display: flex; align-items: center; gap: 3px;">
                            <i class="fas fa-clock" style="font-size: 10px;"></i> ${user.total_time_minutes} min
                        </small>
                    </div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 18px; font-weight: bold;
                    color: ${user.average_percentage >= 80 ? '#28a745' :
                            user.average_percentage >= 60 ? '#17a2b8' :
                            user.average_percentage >= 40 ? '#ffc107' : '#dc3545'};">
                    ${user.average_percentage}%
                </div>
                <small style="color: #666;">Average</small>
            </div>
        </div>
    `).join('');

    document.getElementById('leaderboardContent').innerHTML = `
        <div class="leaderboard-header" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8f9fa; border-radius: 8px 8px 0 0; margin-bottom: 5px;">
            <div style="font-weight: bold; color: #667eea;">Rank</div>
            <div style="font-weight: bold; color: #667eea;">Average Score</div>
        </div>
        ${leaderboardHTML}
    `;
}

// Utility functions
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert_' + Date.now();

    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type}">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        </div>
    `;

    alertContainer.innerHTML = alertHTML;

    // Auto-remove alert after 5 seconds
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.remove();
        }
    }, 5000);
}

function showLoading(containerId) {
    document.getElementById(containerId).innerHTML = `
        <div class="loading-container" style="text-align: center; padding: 40px;">
            <div class="loading-spinner" style="width: 60px; height: 60px; margin: 0 auto 20px; border: 5px solid #f3f3f3; border-top: 5px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h3 style="color: #667eea; margin-bottom: 10px;">Loading Content</h3>
            <p style="color: #666;">Please wait while we load your content</p>
            <div class="loading-progress" style="width: 100%; height: 4px; background: #f0f0f0; margin-top: 20px; border-radius: 2px; overflow: hidden;">
                <div class="loading-progress-bar" style="height: 100%; width: 30%; background: linear-gradient(90deg, #667eea, #764ba2); animation: progress 2s ease-in-out infinite;"></div>
            </div>
        </div>
    `;
}



// Function to view test details with correct/incorrect answers
async function viewTestDetails(testResultId) {
    try {
        const response = await fetch(`/api/test-results/${testResultId}/details`);
        const data = await response.json();

        if (response.ok) {
            showTestDetailsModal(data);
        } else {
            showAlert('Failed to load test details', 'error');
        }
    } catch (error) {
        console.error('Error loading test details:', error);
        showAlert('Failed to load test details', 'error');
    }
}

function showTestDetailsModal(testData) {
    const modalHTML = `
        <div id="testDetailsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
             background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 12px; max-width: 800px; max-height: 90vh;
                 overflow-y: auto; padding: 20px; margin: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #667eea;">
                        <i class="fas fa-clipboard-list"></i> Test Details: ${testData.quiz_test.name}
                    </h3>
                    <button onclick="closeTestDetailsModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #667eea;">${testData.score}/${testData.total_questions}</div>
                            <div style="font-size: 12px; color: #666;">Score</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: ${testData.percentage >= 70 ? '#28a745' : testData.percentage >= 50 ? '#ffc107' : '#dc3545'};">
                                ${testData.percentage}%
                            </div>
                            <div style="font-size: 12px; color: #666;">Percentage</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #667eea;">
                                ${Math.floor(testData.time_taken_seconds / 60)}:${(testData.time_taken_seconds % 60).toString().padStart(2, '0')}
                            </div>
                            <div style="font-size: 12px; color: #666;">Time Taken</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #667eea;">
                                ${new Date(testData.completed_at).toLocaleDateString()}
                            </div>
                            <div style="font-size: 12px; color: #666;">Date</div>
                        </div>
                    </div>
                </div>

                <h4 style="margin-bottom: 15px; color: #667eea;">
                    <i class="fas fa-question-circle"></i> Question-wise Analysis
                </h4>

                <div style="max-height: 400px; overflow-y: auto;">
                    ${testData.questions_with_answers.map((qa, index) => `
                        <div style="border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px; padding: 15px;
                             border-left: 4px solid ${qa.is_correct ? '#28a745' : '#dc3545'};">
                            <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 10px;">
                                <div style="flex: 1;">
                                    <strong>Q${index + 1}:</strong> ${qa.question.question_text}
                                </div>
                                <div style="margin-left: 15px;">
                                    <span style="padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;
                                          background: ${qa.is_correct ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'};
                                          color: ${qa.is_correct ? '#28a745' : '#dc3545'};">
                                        ${qa.is_correct ? 'Correct' : 'Incorrect'}
                                    </span>
                                </div>
                            </div>

                            <div style="margin-bottom: 10px;">
                                <div style="margin-bottom: 5px;">
                                    <strong>A:</strong> ${qa.question.option_a}
                                    ${qa.question.correct_answer === 'A' ? '<span style="color: #28a745; font-weight: bold;"> ✓ Correct</span>' : ''}
                                    ${qa.selected_answer === 'A' && qa.question.correct_answer !== 'A' ? '<span style="color: #dc3545; font-weight: bold;"> ✗ Your Answer</span>' : ''}
                                    ${qa.selected_answer === 'A' && qa.question.correct_answer === 'A' ? '<span style="color: #28a745; font-weight: bold;"> ✓ Your Answer</span>' : ''}
                                </div>
                                <div style="margin-bottom: 5px;">
                                    <strong>B:</strong> ${qa.question.option_b}
                                    ${qa.question.correct_answer === 'B' ? '<span style="color: #28a745; font-weight: bold;"> ✓ Correct</span>' : ''}
                                    ${qa.selected_answer === 'B' && qa.question.correct_answer !== 'B' ? '<span style="color: #dc3545; font-weight: bold;"> ✗ Your Answer</span>' : ''}
                                    ${qa.selected_answer === 'B' && qa.question.correct_answer === 'B' ? '<span style="color: #28a745; font-weight: bold;"> ✓ Your Answer</span>' : ''}
                                </div>
                                <div style="margin-bottom: 5px;">
                                    <strong>C:</strong> ${qa.question.option_c}
                                    ${qa.question.correct_answer === 'C' ? '<span style="color: #28a745; font-weight: bold;"> ✓ Correct</span>' : ''}
                                    ${qa.selected_answer === 'C' && qa.question.correct_answer !== 'C' ? '<span style="color: #dc3545; font-weight: bold;"> ✗ Your Answer</span>' : ''}
                                    ${qa.selected_answer === 'C' && qa.question.correct_answer === 'C' ? '<span style="color: #28a745; font-weight: bold;"> ✓ Your Answer</span>' : ''}
                                </div>
                                <div style="margin-bottom: 5px;">
                                    <strong>D:</strong> ${qa.question.option_d}
                                    ${qa.question.correct_answer === 'D' ? '<span style="color: #28a745; font-weight: bold;"> ✓ Correct</span>' : ''}
                                    ${qa.selected_answer === 'D' && qa.question.correct_answer !== 'D' ? '<span style="color: #dc3545; font-weight: bold;"> ✗ Your Answer</span>' : ''}
                                    ${qa.selected_answer === 'D' && qa.question.correct_answer === 'D' ? '<span style="color: #28a745; font-weight: bold;"> ✓ Your Answer</span>' : ''}
                                </div>
                            </div>

                            ${!qa.is_correct ? `
                                <div style="background: rgba(220, 53, 69, 0.1); padding: 10px; border-radius: 6px; margin-top: 10px;">
                                    <strong style="color: #dc3545;">Correct Answer:</strong> ${qa.question.correct_answer}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="closeTestDetailsModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeTestDetailsModal() {
    const modal = document.getElementById('testDetailsModal');
    if (modal) {
        modal.remove();
    }
}


// Popup modal functions
function showLoginPopup() {
    document.getElementById('authModal').classList.remove('hidden');
    switchToLogin();
}

function showRegisterPopup() {
    document.getElementById('authModal').classList.remove('hidden');
    switchToRegister();
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

function switchToLogin() {
    // Update tabs
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginTab').style.borderBottomColor = '#667eea';
    document.getElementById('loginTab').style.color = '#667eea';
    document.getElementById('registerTab').style.borderBottomColor = 'transparent';
    document.getElementById('registerTab').style.color = '#666';

    // Update content
    document.getElementById('modalLoginForm').classList.remove('hidden');
    document.getElementById('modalRegisterForm').classList.add('hidden');
    document.getElementById('modalTitle').textContent = 'Welcome Back';
}

function switchToRegister() {
    // Update tabs
    document.getElementById('registerTab').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').style.borderBottomColor = '#667eea';
    document.getElementById('registerTab').style.color = '#667eea';
    document.getElementById('loginTab').style.borderBottomColor = 'transparent';
    document.getElementById('loginTab').style.color = '#666';

    // Update content
    document.getElementById('modalRegisterForm').classList.remove('hidden');
    document.getElementById('modalLoginForm').classList.add('hidden');
    document.getElementById('modalTitle').textContent = 'Join Quiz Portal';
}




// Gradient color sets

const gradientColors = [

    ['#f9f5f1', '#f1f8f9'],  // Soft ivory to light teal

    ['#ffeaea', '#fff5f5'],  // Light blush pink

    ['#eaf3fd', '#f3f9fe'],  // Soft sky blue

    ['#e8fdf5', '#f0fcfa'],  // Minty green to aqua

    ['#f4efff', '#fae7fb'],  // Very light lavender to pink

    ['#fff8e7', '#fff0d9'],  // Cream to pale apricot

    ['#f6f0ff', '#eaf4ff'],  // Lavender haze to soft blue

    ['#f0ffe5', '#f6fff0'],  // Pale lime green

    ['#f0fffd', '#fff0f6'],  // Mint to very light rose

    ['#fafcff', '#f0f4fa'],  // Cool fog gray to soft blue-gray

    ['#f5f7fa', '#c3cfe2'],

    ['#fdfbfb', '#ebedee'],

    ['#cfd9df', '#e2ebf0'],

    ['#fdfcfb', '#e2d1c3'],

    ['#feada6', '#f5efef'],

    ['#93a5cf', '#e4efe9'],

    ['#93a5cf', '#e4efe9']

];

let currentIndex = 0;

function changeGradient() {

    currentIndex = (currentIndex + 1) % gradientColors.length;

    const [color1, color2] = gradientColors[currentIndex];

    document.body.style.background = `linear-gradient(to right, ${color1}, ${color2})`;

}
// Change gradient every 10 seconds

setInterval(changeGradient, 10000);

// Initialize with first gradient

changeGradient();