import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../api'
import Loading from '../components/Loading'

export default function Quiz({ quizTestId, subjectId, subjectTests = [], showAlert, onFinish, onPhaseChange, onBack }) {
  const [activeTestId, setActiveTestId] = useState(quizTestId)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flagged, setFlagged] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [resultDetails, setResultDetails] = useState(null)
  const [showReview, setShowReview] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const timerRef = useRef(null)

  async function startTest(testId) {
    clearInterval(timerRef.current)
    setActiveTestId(testId)
    setQuestions([])
    setIdx(0)
    setAnswers({})
    setFlagged({})
    setResult(null)
    setResultDetails(null)
    setShowReview(false)
    setLoading(true)
    const testName = subjectTests.find(t => t.id === testId)?.name || ''
    onPhaseChange?.({ phase: 'quiz', testName })
    try {
      const start = await api.post(`/quiz-tests/${testId}/start`)
      const qRes = await api.get(`/quiz-tests/${testId}/questions`)
      setQuestions(qRes.data.questions)
      setTimeRemaining(start.data.time_limit_minutes * 60)
      setLoading(false)
      showAlert('Quiz started! Good luck!', 'success')
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to start quiz', 'error')
      onBack()
    }
  }

  useEffect(() => {
    startTest(quizTestId)
    return () => clearInterval(timerRef.current)
  }, [quizTestId])

  useEffect(() => {
    if (loading || result) return
    timerRef.current = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [loading, result])

  const handleSubmit = useCallback(async (auto = false) => {
    clearInterval(timerRef.current)
    if (auto) showAlert('Time is up! Submitting automatically.', 'info')
    try {
      const res = await api.post(`/quiz-tests/${activeTestId}/submit`)
      const r = res.data.result
      setResult(r)
      onPhaseChange?.({ phase: 'result', testName: subjectTests.find(t => t.id === activeTestId)?.name || '' })
      api.get(`/test-results/${r.id}/details`).then(d => setResultDetails(d.data)).catch(() => {})
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to submit quiz', 'error')
    }
  }, [activeTestId])

  function toggleFlag(qId) {
    const newVal = !flagged[qId]
    setFlagged(prev => ({ ...prev, [qId]: newVal }))
    api.post(`/quiz-tests/${activeTestId}/flag-question`, { question_id: qId, is_flagged: newVal }).catch(() => {})
  }

  async function selectAnswer(questionId, answer) {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    try { await api.post(`/quiz-tests/${activeTestId}/submit-answer`, { question_id: questionId, selected_answer: answer }) } catch {}
  }

  if (loading) return <Loading />

  if (result) {
    const pct = result.percentage
    const wrong = result.total_questions - result.score
    const timeMins = Math.floor(result.time_taken_seconds / 60)
    const timeSecs = String(result.time_taken_seconds % 60).padStart(2, '0')
    const unanswered = result.total_questions - Object.keys(answers).length
    const qt = resultDetails?.quiz_test
    const hasNegative = qt && (qt.marks_negative > 0)
    const marksCorrect = qt?.marks_correct ?? 1
    const marksNegative = qt?.marks_negative ?? 0
    const incorrect = wrong - unanswered
    const finalScore = result.final_score ?? (hasNegative ? +(result.score * marksCorrect - incorrect * marksNegative).toFixed(2) : null)

    const [perf, accentColor, bgGradient, perfIcon] =
      pct >= 80 ? ['Excellent!', '#059669', 'linear-gradient(135deg,#ecfdf5,#d1fae5)', 'fa-trophy'] :
      pct >= 60 ? ['Good Job!', '#0284c7', 'linear-gradient(135deg,#eff6ff,#dbeafe)', 'fa-thumbs-up'] :
      pct >= 40 ? ['Keep Practicing', '#d97706', 'linear-gradient(135deg,#fffbeb,#fef3c7)', 'fa-book-open'] :
      ['Needs Improvement', '#dc2626', 'linear-gradient(135deg,#fff1f2,#fee2e2)', 'fa-rotate-right']

    const currentIdx = subjectTests.findIndex(t => t.id === activeTestId)
    const nextTest = currentIdx >= 0 && currentIdx < subjectTests.length - 1
      ? subjectTests.slice(currentIdx + 1).find(t => t.retake_limit == null || (t.retake_limit - (t.user_attempts || 0)) > 0)
      : null
    const canRetry = subjectTests.find(t => t.id === activeTestId)
    const retakeAllowed = !canRetry || canRetry.retake_limit == null || (canRetry.retake_limit - (canRetry.user_attempts || 0) - 1) > 0
    const activeTestName = canRetry?.name || ''

    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Hero result banner */}
        <div style={{ background: bgGradient, border: `1px solid ${accentColor}30`, borderRadius: 16, padding: '32px 24px', textAlign: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: `${accentColor}15` }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: '50%', background: `${accentColor}10` }} />
          <div style={{ position: 'relative' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${accentColor}20`, border: `2px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26, color: accentColor }}>
              <i className={`fas ${perfIcon}`}></i>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{perf}</div>
            {activeTestName && (
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                <i className="fas fa-clipboard-list" style={{ marginRight: 6, color: accentColor, opacity: 0.7 }}></i>{activeTestName}
              </div>
            )}
            <div style={{ fontSize: 56, fontWeight: 900, color: accentColor, lineHeight: 1, marginBottom: 4 }}>
              {pct}<span style={{ fontSize: 24, fontWeight: 600, opacity: 0.7 }}>%</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {result.score} out of {result.total_questions} correct
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accentColor}15`, border: `1px solid ${accentColor}30`, borderRadius: 20, padding: '6px 16px', fontSize: 13, color: accentColor, fontWeight: 600 }}>
              <i className="fas fa-clock"></i> {timeMins}m {timeSecs}s
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[['fa-circle-check', result.score, 'Correct', '#10b981', '#d1fae5'],
            ['fa-circle-xmark', wrong - unanswered, 'Incorrect', '#ef4444', '#fee2e2'],
            ['fa-circle-minus', unanswered, 'Skipped', '#6b7280', '#f3f4f6']
          ].map(([ic, val, lbl, color, bg]) => (
            <div key={lbl} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
              <i className={`fas ${ic}`} style={{ fontSize: 20, color, marginBottom: 8, display: 'block' }}></i>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Marking scheme breakdown — only shown when negative marking is active */}
        {hasNegative && (
          <div className="card" style={{ marginBottom: 20, padding: '16px 20px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="fas fa-scale-balanced" style={{ color: '#8b5cf6', fontSize: 14 }}></i>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Marking Scheme</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>+{marksCorrect} correct · −{marksNegative} wrong</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {[
                [`+${(result.score * marksCorrect).toFixed(2)}`, `${result.score} × ${marksCorrect}`, 'Correct marks', '#10b981', '#d1fae5'],
                [`−${(incorrect * marksNegative).toFixed(2)}`, `${incorrect} × ${marksNegative}`, 'Negative marks', '#ef4444', '#fee2e2'],
                [finalScore != null ? (finalScore >= 0 ? `+${finalScore}` : `${finalScore}`) : '—', 'Final Score', 'Net marks', '#8b5cf6', '#ede9fe'],
              ].map(([val, sub, lbl, color, bg]) => (
                <div key={lbl} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>{lbl}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score progress bar */}
        <div className="card" style={{ marginBottom: 20, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Score Breakdown</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>{result.score}/{result.total_questions}</span>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(result.score / result.total_questions) * 100}%`, background: '#10b981', transition: 'width 0.8s ease' }} />
            <div style={{ width: `${(wrong / result.total_questions) * 100}%`, background: '#ef4444' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#10b981', marginRight: 5 }}></span>Correct {Math.round((result.score / result.total_questions) * 100)}%</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#ef4444', marginRight: 5 }}></span>Incorrect {Math.round((wrong / result.total_questions) * 100)}%</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="card" style={{ marginBottom: 20, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>What's Next?</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {retakeAllowed && (
              <button className="btn btn-primary" style={{ flex: '1 1 160px' }}
                onClick={() => startTest(activeTestId)}>
                <i className="fas fa-rotate-right"></i> Try Again
              </button>
            )}
            {nextTest && (
              <button className="btn" style={{ flex: '1 1 160px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none' }}
                onClick={() => startTest(nextTest.id)}>
                <i className="fas fa-forward"></i> Next Test
              </button>
            )}
            <button className="btn btn-secondary" style={{ flex: '1 1 130px' }} onClick={() => onFinish('activity')}>
              <i className="fas fa-chart-line"></i> Activity
            </button>
            <button className="btn btn-secondary" style={{ flex: '1 1 130px' }} onClick={() => onFinish('dashboard')}>
              <i className="fas fa-house"></i> Dashboard
            </button>
          </div>
        </div>

        {/* Answer review */}
        {resultDetails && (
          <div className="card" style={{ padding: '20px 22px' }}>
            <button
              className="btn btn-secondary btn-block"
              onClick={() => setShowReview(r => !r)}
              style={{ marginBottom: showReview ? 16 : 0 }}
            >
              <i className={`fas ${showReview ? 'fa-chevron-up' : 'fa-eye'}`}></i>
              {showReview ? ' Hide Review' : ' Review Answers'}
            </button>
            {showReview && (
              <ReviewSection resultDetails={resultDetails} flagged={flagged} />
            )}
          </div>
        )}
      </div>
    )
  }

  const question = questions[idx]
  const progress = ((idx + 1) / questions.length) * 100
  const mins = Math.floor(timeRemaining / 60)
  const secs = timeRemaining % 60
  const timerClass = timeRemaining <= 300 ? 'danger' : timeRemaining <= 600 ? 'warning' : ''
  const answered = Object.keys(answers).length
  const activeTestName = subjectTests.find(t => t.id === activeTestId)?.name || ''

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title"><i className="fas fa-triangle-exclamation" style={{ color: '#f59e0b', marginRight: 8 }}></i>Submit Quiz?</div>
              <button className="modal-close" onClick={() => setShowSubmitConfirm(false)}><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              {questions.length - answered > 0 && (
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400e' }}>
                  <i className="fas fa-circle-exclamation" style={{ marginRight: 6 }}></i>
                  <strong>{questions.length - answered}</strong> question{questions.length - answered !== 1 ? 's' : ''} unanswered.
                </div>
              )}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Are you sure you want to submit? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSubmitConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { setShowSubmitConfirm(false); handleSubmit(false) }}>
                <i className="fas fa-check"></i> Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
        <span className="badge badge-secondary" style={{ fontSize: 12 }}>{answered}/{questions.length} answered</span>
        <div className={`timer ${timerClass}`} style={{ fontSize: 14, padding: '8px 14px' }}>
          <i className="fas fa-clock"></i>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </div>
      {activeTestName && (
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-clipboard-list" style={{ color: 'var(--primary)', fontSize: 13 }}></i>
          {activeTestName}
        </div>
      )}

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="question-card">
        <div className="question-number" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><i className="fas fa-circle-question"></i> Question {idx + 1} of {questions.length}</span>
          <button
            onClick={() => toggleFlag(question.id)}
            style={{ background: flagged[question.id] ? '#fef3c7' : 'var(--surface2)', border: `1px solid ${flagged[question.id] ? '#f59e0b' : 'var(--border)'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: flagged[question.id] ? '#92400e' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <i className={`fas fa-flag`}></i> {flagged[question.id] ? 'Flagged' : 'Flag'}
          </button>
        </div>
        <div className="question-text">{question.question_text}</div>
        <div className="options">
          {['A', 'B', 'C', 'D'].filter(opt => (question[`option_${opt.toLowerCase()}`] || '').trim()).map(opt => (
            <div key={opt} className={`option ${answers[question.id] === question[`option_${opt.toLowerCase()}`] ? 'selected' : ''}`}
              onClick={() => selectAnswer(question.id, question[`option_${opt.toLowerCase()}`])}>
              <span className="option-letter">{opt}</span>
              <div className="option-text">{question[`option_${opt.toLowerCase()}`]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Question dot navigator — hidden on mobile via CSS class */}
      <div className="quiz-nav-dots" style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 }}>
        {questions.map((q, i) => (
          <button key={q.id} onClick={() => setIdx(i)} style={{
            width: 30, height: 30, borderRadius: 6, border: '1px solid',
            borderColor: i === idx ? 'var(--primary)' : flagged[q.id] ? '#f59e0b' : answers[q.id] ? 'var(--success)' : 'var(--border)',
            background: i === idx ? 'var(--primary)' : flagged[q.id] ? '#fef3c7' : answers[q.id] ? '#d1fae5' : 'var(--surface)',
            color: i === idx ? '#fff' : flagged[q.id] ? '#92400e' : answers[q.id] ? '#065f46' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
          }}>{i + 1}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button className="btn btn-secondary" onClick={() => setIdx(i => i - 1)} disabled={idx === 0}>
          <i className="fas fa-arrow-left"></i> <span style={{ display: 'inline' }}>Prev</span>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {idx < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setIdx(i => i + 1)}>
              Next <i className="fas fa-arrow-right"></i>
            </button>
          ) : (
            <button className="btn btn-danger" onClick={() => setShowSubmitConfirm(true)}>
              <i className="fas fa-check"></i> Submit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewSection({ resultDetails, flagged }) {
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [openExpl, setOpenExpl] = useState({})
  const all = resultDetails.questions_with_answers
  const flaggedCount = all.filter((_, i) => flagged[all[i].question.id] || all[i].is_flagged).length
  const list = onlyFlagged ? all.filter(qa => flagged[qa.question.id] || qa.is_flagged) : all

  function toggleExpl(id) { setOpenExpl(prev => ({ ...prev, [id]: !prev[id] })) }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{all.length} questions total</span>
        {flaggedCount > 0 && (
          <button
            onClick={() => setOnlyFlagged(v => !v)}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, border: `1px solid ${onlyFlagged ? '#f59e0b' : 'var(--border)'}`, background: onlyFlagged ? '#fef3c7' : 'var(--surface)', color: onlyFlagged ? '#92400e' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <i className="fas fa-flag"></i> {onlyFlagged ? 'Show All' : `Flagged (${flaggedCount})`}
          </button>
        )}
      </div>
      {list.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'var(--text-muted)' }}>No flagged questions.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((qa, i) => {
          const qIdx = all.indexOf(qa)
          const isFlagged = flagged[qa.question.id] || qa.is_flagged
          return (
            <div key={i} style={{ border: `1px solid ${isFlagged ? '#f59e0b' : 'var(--border)'}`, borderRadius: 10, padding: '14px 16px', borderLeft: `4px solid ${qa.is_correct ? '#10b981' : '#ef4444'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  Q{qIdx + 1}: {qa.question.question_text}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {isFlagged && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
                      <i className="fas fa-flag" style={{ marginRight: 3 }}></i>Flagged
                    </span>
                  )}
                  <span className={`badge ${qa.is_correct ? 'badge-success' : 'badge-danger'}`}>{qa.is_correct ? '✓ Correct' : '✗ Wrong'}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {['A', 'B', 'C', 'D'].filter(opt => (qa.question[`option_${opt.toLowerCase()}`] || '').trim()).map(opt => {
                  const optText = qa.question[`option_${opt.toLowerCase()}`]
                  const isCorrect = qa.question.correct_answer?.trim().toLowerCase() === optText?.trim().toLowerCase()
                  const isSelected = qa.selected_answer?.trim().toLowerCase() === optText?.trim().toLowerCase()
                  return (
                    <div key={opt} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: isCorrect ? '#d1fae5' : isSelected && !isCorrect ? '#fee2e2' : 'var(--surface2)', color: isCorrect ? '#065f46' : isSelected && !isCorrect ? '#991b1b' : 'var(--text-secondary)', fontWeight: isCorrect || isSelected ? 600 : 400 }}>
                      <strong>{opt}:</strong> {optText}
                      {isCorrect && <span style={{ marginLeft: 6 }}>✓</span>}
                      {isSelected && !isCorrect && <span style={{ marginLeft: 6 }}>← Your answer</span>}
                    </div>
                  )
                })}
              </div>
              {qa.question.explanation && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => toggleExpl(qa.question.id)}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid #0ea5e9', background: openExpl[qa.question.id] ? '#e0f2fe' : 'var(--surface)', color: '#0284c7', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <i className="fas fa-circle-info"></i> {openExpl[qa.question.id] ? 'Hide Explanation' : 'Explanation'}
                  </button>
                  {openExpl[qa.question.id] && (
                    <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 8, background: '#e0f2fe', border: '1px solid #0ea5e944', fontSize: 12, color: '#0c4a6e', lineHeight: 1.6 }}>
                      <i className="fas fa-lightbulb" style={{ marginRight: 6, color: '#0284c7' }}></i>{qa.question.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
