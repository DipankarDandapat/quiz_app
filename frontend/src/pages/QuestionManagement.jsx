import { useEffect, useState } from 'react'
import api from '../api'
import Loading from '../components/Loading'
import { ExamModal, SubjectModal, TestModal, QuestionModal, UploadModal, ConfirmModal, UserLimitModal, FlagDetailsModal } from './QMModals'

function PracticeQuestionsPanel({ subjectId, setModal, questionsMap, reload, showAlert }) {
  const [practiceTestId, setPracticeTestId] = useState(null)
  const [loadingPt, setLoadingPt] = useState(true)
  const [markingInfo, setMarkingInfo] = useState(null)

  useState(() => {
    api.get(`/subjects/${subjectId}/practice-test`).then(r => {
      setPracticeTestId(r.data.id)
      setMarkingInfo({ marks_correct: r.data.marks_correct, marks_negative: r.data.marks_negative })
      setLoadingPt(false)
      if (!questionsMap[r.data.id]) {
        api.get(`/admin/quiz-tests/${r.data.id}/questions`).then(qr => {
          reload.questions(r.data.id, qr.data)
        })
      }
    }).catch(() => setLoadingPt(false))
  })

  if (loadingPt) return <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>Loading...</div>
  if (!practiceTestId) return <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>Practice test not found.</div>

  const questions = questionsMap[practiceTestId] || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            <i className="fas fa-circle-question" style={{ marginRight: 5 }}></i>Questions ({questions.length})
          </span>
          {markingInfo && markingInfo.marks_negative > 0 && (
            <span style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
              <i className="fas fa-scale-balanced" style={{ marginRight: 4 }}></i>+{markingInfo.marks_correct} / −{markingInfo.marks_negative}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'uploadModal', testId: practiceTestId })}>
            <i className="fas fa-file-csv"></i> CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'questionModal', testId: practiceTestId })}>
            <i className="fas fa-plus"></i> Add Q
          </button>
        </div>
      </div>
      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'var(--text-muted)' }}>No questions yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>{['#', 'Question', 'A', 'B', 'C', 'D', 'Ans', 'Flags', ''].map(h => (
                <th key={h} style={{ textAlign: h === 'Ans' || h === 'Flags' || h === '' ? 'center' : 'left' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ maxWidth: 220 }}>{q.question_text}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 100 }}>{q.option_a}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 100 }}>{q.option_b}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 100 }}>{q.option_c}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 100 }}>{q.option_d}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-primary" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }} title={q.correct_answer}>{q.correct_answer}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {q.flag_count > 0
                      ? <button onClick={() => setModal({ type: 'flagDetailsModal', questionId: q.id })} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontWeight: 700, border: '1px solid #f59e0b66', cursor: 'pointer' }}>
                          <i className="fas fa-flag"></i>{q.flag_count}
                        </button>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setModal({ type: 'questionModal', testId: practiceTestId, question: q })} style={{ background: 'var(--primary)', border: 'none', color: 'white', width: 26, height: 26, borderRadius: 5, cursor: 'pointer', marginRight: 4, fontSize: 11 }}>
                      <i className="fas fa-pen"></i>
                    </button>
                    <button
                      title={q.is_active !== false ? 'Set Inactive' : 'Set Active'}
                      onClick={() => setModal({ type: 'confirm', itemType: 'question', id: q.id, name: `Q${i + 1}`, toggleStatus: true, currentStatus: q.is_active !== false, testId: practiceTestId })}
                      style={{ background: q.is_active !== false ? '#f59e0b' : '#10b981', border: 'none', color: 'white', width: 26, height: 26, borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                      <i className={`fas ${q.is_active !== false ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function QuestionManagement({ showAlert }) {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedExams, setExpandedExams] = useState(new Set())
  const [expandedSubjects, setExpandedSubjects] = useState(new Set())
  const [expandedTests, setExpandedTests] = useState(new Set())
  const [subjectsMap, setSubjectsMap] = useState({})
  const [testsMap, setTestsMap] = useState({})
  const [questionsMap, setQuestionsMap] = useState({})
  const [modal, setModal] = useState(null)

  async function loadExams() {
    setLoading(true)
    try { const r = await api.get('/admin/exams'); setExams(r.data) }
    catch { showAlert('Failed to load exams', 'error') }
    setLoading(false)
  }

  useEffect(() => { loadExams() }, [])

  async function toggleExam(examId) {
    const next = new Set(expandedExams)
    if (next.has(examId)) { next.delete(examId); setExpandedExams(next); return }
    next.add(examId); setExpandedExams(next)
    const r = await api.get(`/admin/exams/${examId}/subjects`)
    setSubjectsMap(m => ({ ...m, [examId]: r.data }))
  }

  async function toggleSubject(subjectId) {
    const next = new Set(expandedSubjects)
    if (next.has(subjectId)) { next.delete(subjectId); setExpandedSubjects(next); return }
    next.add(subjectId); setExpandedSubjects(next)
    const r = await api.get(`/admin/subjects/${subjectId}/quiz-tests`)
    setTestsMap(m => ({ ...m, [subjectId]: r.data }))
  }

  async function toggleTest(testId) {
    const next = new Set(expandedTests)
    if (next.has(testId)) { next.delete(testId); setExpandedTests(next); return }
    next.add(testId); setExpandedTests(next)
    const r = await api.get(`/admin/quiz-tests/${testId}/questions`)
    setQuestionsMap(m => ({ ...m, [testId]: r.data }))
  }

  const reload = {
    subjects: async (examId) => { const r = await api.get(`/admin/exams/${examId}/subjects`); setSubjectsMap(m => ({ ...m, [examId]: r.data })) },
    tests: async (subjectId) => { const r = await api.get(`/admin/subjects/${subjectId}/quiz-tests`); setTestsMap(m => ({ ...m, [subjectId]: r.data })) },
    questions: async (testId, preloaded) => {
      if (preloaded) { setQuestionsMap(m => ({ ...m, [testId]: preloaded })); return }
      const r = await api.get(`/admin/quiz-tests/${testId}/questions`); setQuestionsMap(m => ({ ...m, [testId]: r.data }))
    },
  }

  async function deleteItem(type, id) {
    const urlMap = { exam: `/admin/exams/${id}`, subject: `/admin/subjects/${id}`, test: `/admin/quiz-tests/${id}`, question: `/admin/questions/${id}` }
    try {
      await api.delete(urlMap[type])
      showAlert('Deleted successfully', 'success')
      setModal(null)
      if (type === 'exam') loadExams()
    } catch (err) { showAlert(err.response?.data?.error || 'Delete failed', 'error') }
  }

  async function toggleQuestionStatus(id, currentStatus, testId) {
    try {
      await api.put(`/admin/questions/${id}`, { is_active: !currentStatus })
      showAlert(`Question set to ${!currentStatus ? 'Active' : 'Inactive'}`, 'success')
      setModal(null)
      reload.questions(testId)
    } catch (err) { showAlert(err.response?.data?.error || 'Update failed', 'error') }
  }

  async function toggleTestStatus(id, currentStatus, subjectId) {
    try {
      await api.put(`/admin/quiz-tests/${id}`, { is_active: !currentStatus })
      showAlert(`Test set to ${!currentStatus ? 'Active' : 'Inactive'}`, 'success')
      setModal(null)
      reload.tests(subjectId)
    } catch (err) { showAlert(err.response?.data?.error || 'Update failed', 'error') }
  }

  async function toggleSubjectStatus(id, currentStatus, examId) {
    try {
      await api.put(`/admin/subjects/${id}`, { is_active: !currentStatus })
      showAlert(`Subject set to ${!currentStatus ? 'Active' : 'Inactive'}`, 'success')
      setModal(null)
      reload.subjects(examId)
    } catch (err) { showAlert(err.response?.data?.error || 'Update failed', 'error') }
  }

  async function toggleExamStatus(id, currentStatus) {
    try {
      await api.put(`/admin/exams/${id}`, { is_active: !currentStatus })
      showAlert(`Exam set to ${!currentStatus ? 'Active' : 'Inactive'}`, 'success')
      setModal(null)
      loadExams()
    } catch (err) { showAlert(err.response?.data?.error || 'Update failed', 'error') }
  }

  if (loading) return <Loading />

  const actionBtn = (onClick, icon, danger = false) => (
    <button onClick={onClick} style={{ background: danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.18)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
      <i className={`fas ${icon}`}></i>
    </button>
  )

  return (
    <div>
      {modal?.type === 'examModal' && <ExamModal exam={modal.exam} onClose={() => setModal(null)} onSaved={loadExams} showAlert={showAlert} />}
      {modal?.type === 'subjectModal' && <SubjectModal examId={modal.examId} subject={modal.subject} onClose={() => setModal(null)} onSaved={() => reload.subjects(modal.examId)} showAlert={showAlert} />}
      {modal?.type === 'testModal' && <TestModal subjectId={modal.subjectId} testId={modal.testId} onClose={() => setModal(null)} onSaved={() => reload.tests(modal.subjectId)} showAlert={showAlert} />}
      {modal?.type === 'questionModal' && <QuestionModal testId={modal.testId} question={modal.question} onClose={() => setModal(null)} onSaved={() => reload.questions(modal.testId)} showAlert={showAlert} />}
      {modal?.type === 'uploadModal' && <UploadModal testId={modal.testId} onClose={() => setModal(null)} onSaved={() => reload.questions(modal.testId)} showAlert={showAlert} />}
      {modal?.type === 'userLimitModal' && <UserLimitModal testId={modal.testId} testName={modal.testName} retakeLimit={modal.retakeLimit} onClose={() => setModal(null)} showAlert={showAlert} />}
      {modal?.type === 'flagDetailsModal' && <FlagDetailsModal questionId={modal.questionId} onClose={() => setModal(null)} />}
      {modal?.type === 'confirm' && !modal.toggleStatus && <ConfirmModal title={`Delete ${modal.itemType}?`} message={`Are you sure you want to delete <strong>${modal.name}</strong>?<br><span style="color:var(--danger);font-size:12px;">This cannot be undone.</span>`} onConfirm={() => deleteItem(modal.itemType, modal.id)} onClose={() => setModal(null)} />}
      {modal?.type === 'confirm' && modal.toggleStatus && modal.itemType === 'question' && <ConfirmModal title={modal.currentStatus ? 'Set Question Inactive?' : 'Set Question Active?'} message={`This will ${modal.currentStatus ? 'hide' : 'show'} <strong>${modal.name}</strong> from quizzes.`} onConfirm={() => toggleQuestionStatus(modal.id, modal.currentStatus, modal.testId)} onClose={() => setModal(null)} confirmLabel={modal.currentStatus ? 'Set Inactive' : 'Set Active'} confirmColor={modal.currentStatus ? '#f59e0b' : '#10b981'} />}
      {modal?.type === 'confirm' && modal.toggleStatus && modal.itemType === 'test' && <ConfirmModal title={modal.currentStatus ? 'Set Test Inactive?' : 'Set Test Active?'} message={`This will ${modal.currentStatus ? 'hide this test from users' : 'make this test available to users'}. Past results are unaffected.`} onConfirm={() => toggleTestStatus(modal.id, modal.currentStatus, modal.subjectId)} onClose={() => setModal(null)} confirmLabel={modal.currentStatus ? 'Set Inactive' : 'Set Active'} confirmColor={modal.currentStatus ? '#f59e0b' : '#10b981'} />}
      {modal?.type === 'confirm' && modal.toggleStatus && modal.itemType === 'subject' && <ConfirmModal title={modal.currentStatus ? 'Set Subject Inactive?' : 'Set Subject Active?'} message={`This will ${modal.currentStatus ? 'hide all tests under this subject' : 'make this subject visible to users'}.`} onConfirm={() => toggleSubjectStatus(modal.id, modal.currentStatus, modal.examId)} onClose={() => setModal(null)} confirmLabel={modal.currentStatus ? 'Set Inactive' : 'Set Active'} confirmColor={modal.currentStatus ? '#f59e0b' : '#10b981'} />}
      {modal?.type === 'confirm' && modal.toggleStatus && modal.itemType === 'exam' && <ConfirmModal title={modal.currentStatus ? 'Set Exam Inactive?' : 'Set Exam Active?'} message={`This will ${modal.currentStatus ? 'hide this entire exam from users' : 'make this exam visible to users'}.`} onConfirm={() => toggleExamStatus(modal.id, modal.currentStatus)} onClose={() => setModal(null)} confirmLabel={modal.currentStatus ? 'Set Inactive' : 'Set Active'} confirmColor={modal.currentStatus ? '#f59e0b' : '#10b981'} />}

      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="fas fa-book-open"></i> Question Management</div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'examModal' })}>
            <i className="fas fa-plus"></i> Add Exam
          </button>
        </div>

        {exams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <i className="fas fa-book" style={{ fontSize: 40, display: 'block', marginBottom: 12, color: 'var(--text-muted)' }}></i>
            No exams yet. Click "Add Exam" to get started.
          </div>
        ) : exams.map(exam => {
          const examExpanded = expandedExams.has(exam.id)
          const examActive = exam.is_active !== false
          return (
            <div key={exam.id} className="tree-item" style={{ opacity: examActive ? 1 : 0.65, marginBottom: 10 }}>
              <div className="tree-header" style={{ background: examActive ? 'linear-gradient(135deg,#4f46e5,#6366f1)' : 'linear-gradient(135deg,#64748b,#94a3b8)' }}
                onClick={() => toggleExam(exam.id)}>
                <i className={`fas fa-chevron-${examExpanded ? 'down' : 'right'}`} style={{ fontSize: 11, width: 12 }}></i>
                <i className="fas fa-graduation-cap"></i>
                <span style={{ flex: 1 }}>{exam.name}</span>
                <span style={{ fontSize: 11, opacity: 0.8, marginRight: 10 }}>{exam.subject_count || 0} subjects · {exam.total_questions || 0} Qs</span>
                <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                  {actionBtn(() => setModal({ type: 'examModal', exam }), 'fa-pen')}
                  {actionBtn(() => setModal({ type: 'confirm', itemType: 'exam', id: exam.id, name: exam.name, toggleStatus: true, currentStatus: examActive }), examActive ? 'fa-eye-slash' : 'fa-eye')}
                </div>
              </div>

              {examExpanded && (
                <div style={{ padding: '12px 14px', background: 'var(--surface2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <i className="fas fa-layer-group" style={{ marginRight: 5 }}></i>Subjects
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'subjectModal', examId: exam.id })}>
                      <i className="fas fa-plus"></i> Add Subject
                    </button>
                  </div>
                  {(subjectsMap[exam.id] || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--text-muted)' }}>No subjects yet.</div>
                  ) : (subjectsMap[exam.id] || []).map(sub => {
                    const subExpanded = expandedSubjects.has(sub.id)
                    const subActive = sub.is_active !== false
                    return (
                      <div key={sub.id} className="tree-item" style={{ opacity: subActive ? 1 : 0.65, marginBottom: 8 }}>
                        <div className="tree-header" style={{ background: subActive ? 'linear-gradient(135deg,#0284c7,#0ea5e9)' : 'linear-gradient(135deg,#64748b,#94a3b8)', padding: '10px 14px' }}
                          onClick={() => toggleSubject(sub.id)}>
                          <i className={`fas fa-chevron-${subExpanded ? 'down' : 'right'}`} style={{ fontSize: 11, width: 12 }}></i>
                          <i className="fas fa-book-open"></i>
                          <span style={{ flex: 1 }}>{sub.name}</span>
                          {sub.subject_type === 'practice' && (
                            <span style={{ fontSize: 10, background: 'rgba(139,92,246,0.25)', borderRadius: 4, padding: '1px 6px', marginRight: 6, color: '#e9d5ff' }}>
                              <i className="fas fa-dumbbell" style={{ marginRight: 3 }}></i>Practice
                            </span>
                          )}
                          {sub.subject_type === 'live' && (
                            <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.25)', borderRadius: 4, padding: '1px 6px', marginRight: 6, color: '#fecaca' }}>
                              <i className="fas fa-circle-dot" style={{ marginRight: 3 }}></i>Live
                            </span>
                          )}
                          <span style={{ fontSize: 11, opacity: 0.8, marginRight: 10 }}>{sub.quiz_test_count || 0} tests</span>
                          <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                            {actionBtn(() => setModal({ type: 'subjectModal', examId: exam.id, subject: sub }), 'fa-pen')}
                            {actionBtn(() => setModal({ type: 'confirm', itemType: 'subject', id: sub.id, name: sub.name, toggleStatus: true, currentStatus: subActive, examId: exam.id }), subActive ? 'fa-eye-slash' : 'fa-eye')}
                          </div>
                        </div>

                        {subExpanded && (
                          <div style={{ padding: '12px 14px', background: 'var(--surface)' }}>
                            {sub.subject_type === 'practice' ? (
                              <PracticeQuestionsPanel
                                subjectId={sub.id}
                                setModal={setModal}
                                questionsMap={questionsMap}
                                reload={reload}
                                showAlert={showAlert}
                              />
                            ) : (
                              <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <i className="fas fa-clipboard-list" style={{ marginRight: 5 }}></i>Tests
                              </span>
                              <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'testModal', subjectId: sub.id })}>
                                <i className="fas fa-plus"></i> Add Test
                              </button>
                            </div>
                            {(testsMap[sub.id] || []).length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'var(--text-muted)' }}>No tests yet.</div>
                            ) : (testsMap[sub.id] || []).map(t => {
                              const testExpanded = expandedTests.has(t.id)
                              const tActive = t.is_active !== false
                              return (
                                <div key={t.id} className="tree-item" style={{ opacity: tActive ? 1 : 0.65, marginBottom: 6 }}>
                                  <div className="tree-header" style={{ background: tActive ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#64748b,#94a3b8)', padding: '9px 12px' }}
                                    onClick={() => toggleTest(t.id)}>
                                    <i className={`fas fa-chevron-${testExpanded ? 'down' : 'right'}`} style={{ fontSize: 11, width: 12 }}></i>
                                    <i className="fas fa-clipboard-list"></i>
                                    <span style={{ flex: 1 }}>{t.name}</span>
                                    <span style={{ fontSize: 11, opacity: 0.85, marginRight: 8 }}>{t.question_count || 0} Qs · {t.time_limit_minutes || 0} min</span>
                                    {t.shuffle_questions && <span title="Shuffle Questions" style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 5px', marginRight: 4 }}><i className="fas fa-shuffle"></i> Q</span>}
                                    {t.shuffle_answers && <span title="Shuffle Answers" style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 5px', marginRight: 4 }}><i className="fas fa-shuffle"></i> A</span>}
                                    <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                                      {actionBtn(() => setModal({ type: 'testModal', subjectId: sub.id, testId: t.id }), 'fa-pen')}
                                      {actionBtn(() => setModal({ type: 'userLimitModal', testId: t.id, testName: t.name, retakeLimit: t.retake_limit || 1 }), 'fa-users')}
                                      {actionBtn(() => setModal({ type: 'confirm', itemType: 'test', id: t.id, name: t.name, toggleStatus: true, currentStatus: t.is_active !== false, subjectId: sub.id }), tActive ? 'fa-eye-slash' : 'fa-eye')}
                                    </div>
                                  </div>

                                  {testExpanded && (
                                    <div style={{ padding: '12px 14px', background: 'var(--surface2)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                          <i className="fas fa-circle-question" style={{ marginRight: 5 }}></i>Questions
                                        </span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                          <button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'uploadModal', testId: t.id })}>
                                            <i className="fas fa-file-csv"></i> CSV
                                          </button>
                                          <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'questionModal', testId: t.id })}>
                                            <i className="fas fa-plus"></i> Add Q
                                          </button>
                                        </div>
                                      </div>
                                      {(questionsMap[t.id] || []).length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'var(--text-muted)' }}>No questions yet.</div>
                                      ) : (
                                        <div className="table-wrap">
                                          <table className="data-table" style={{ fontSize: 12 }}>
                                            <thead>
                                              <tr>
                                                {['#', 'Question', 'A', 'B', 'C', 'D', 'Ans', 'Flags', ''].map(h => (
                                                  <th key={h} style={{ textAlign: h === 'Ans' || h === 'Flags' || h === '' ? 'center' : 'left' }}>{h}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {(questionsMap[t.id] || []).map((q, i) => (
                                                <tr key={q.id}>
                                                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                                  <td style={{ maxWidth: 220 }}>{q.question_text}</td>
                                                  <td style={{ color: 'var(--text-secondary)', maxWidth: 100 }}>{q.option_a}</td>
                                                  <td style={{ color: 'var(--text-secondary)', maxWidth: 100 }}>{q.option_b}</td>
                                                  <td style={{ color: 'var(--text-secondary)', maxWidth: 100 }}>{q.option_c}</td>
                                                  <td style={{ color: 'var(--text-secondary)', maxWidth: 100 }}>{q.option_d}</td>
                                                  <td style={{ textAlign: 'center' }}>
                                                    <span className="badge badge-primary" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }} title={q.correct_answer}>{q.correct_answer}</span>
                                                  </td>
                                                  <td style={{ textAlign: 'center' }}>
                                                    {q.flag_count > 0
                                                      ? <button
                                                          onClick={() => setModal({ type: 'flagDetailsModal', questionId: q.id })}
                                                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontWeight: 700, border: '1px solid #f59e0b66', cursor: 'pointer' }}>
                                                          <i className="fas fa-flag"></i>{q.flag_count}
                                                        </button>
                                                      : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                                                    }
                                                  </td>
                                                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <button onClick={() => setModal({ type: 'questionModal', testId: t.id, question: q })} style={{ background: 'var(--primary)', border: 'none', color: 'white', width: 26, height: 26, borderRadius: 5, cursor: 'pointer', marginRight: 4, fontSize: 11 }}>
                                                      <i className="fas fa-pen"></i>
                                                    </button>
                                                    <button
                                                      title={q.is_active !== false ? 'Set Inactive' : 'Set Active'}
                                                      onClick={() => setModal({ type: 'confirm', itemType: 'question', id: q.id, name: `Q${i + 1}`, toggleStatus: true, currentStatus: q.is_active !== false, testId: t.id })}
                                                      style={{ background: q.is_active !== false ? '#f59e0b' : '#10b981', border: 'none', color: 'white', width: 26, height: 26, borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                                                      <i className={`fas ${q.is_active !== false ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </>
                          )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
