import { useState } from 'react'
import api from '../api'

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}><i className="fas fa-xmark"></i></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function ExamModal({ exam, onClose, onSaved, showAlert }) {
  const [name, setName] = useState(exam?.name || '')
  const [desc, setDesc] = useState(exam?.description || '')
  const [active, setActive] = useState(exam ? exam.is_active : true)

  async function save() {
    if (!name.trim()) { showAlert('Exam name is required', 'error'); return }
    try {
      const url = exam ? `/admin/exams/${exam.id}` : '/admin/exams'
      await api[exam ? 'put' : 'post'](url, { name, description: desc, is_active: active })
      showAlert(exam ? 'Exam updated' : 'Exam created', 'success')
      onSaved(); onClose()
    } catch (err) { showAlert(err.response?.data?.error || 'Save failed', 'error') }
  }

  return (
    <Modal title={<><i className="fas fa-graduation-cap" style={{ color: 'var(--primary)', marginRight: 8 }}></i>{exam ? 'Edit Exam' : 'Add Exam'}</>} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><i className="fas fa-floppy-disk"></i> Save</button></>}>
      <div className="form-group">
        <label className="form-label">Exam Name *</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Computer Science Fundamentals" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Status</label>
        <select className="form-input" value={active ? 'true' : 'false'} onChange={e => setActive(e.target.value === 'true')}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </Modal>
  )
}

export function SubjectModal({ examId, subject, onClose, onSaved, showAlert }) {
  const [name, setName] = useState(subject?.name || '')
  const [desc, setDesc] = useState(subject?.description || '')
  const [active, setActive] = useState(subject ? subject.is_active : true)
  const [subjectType, setSubjectType] = useState(subject?.subject_type || 'subject')
  const [timeLimit, setTimeLimit] = useState(subject?.practice_time_limit || 30)
  const [retakeLimit, setRetakeLimit] = useState(subject?.practice_retake_limit || 1)
  const [marksCorrect, setMarksCorrect] = useState(subject?.practice_marks_correct ?? 1)
  const [marksNegative, setMarksNegative] = useState(subject?.practice_marks_negative ?? 0)

  async function save() {
    if (!name.trim()) { showAlert('Subject name is required', 'error'); return }
    try {
      const url = subject ? `/admin/subjects/${subject.id}` : '/admin/subjects'
      const body = subject
        ? { name, description: desc, is_active: active, subject_type: subjectType }
        : {
            name, description: desc, exam_id: examId, is_active: active, subject_type: subjectType,
            ...(subjectType === 'practice' ? { time_limit_minutes: timeLimit, retake_limit: retakeLimit, marks_correct: marksCorrect, marks_negative: marksNegative } : {})
          }
      await api[subject ? 'put' : 'post'](url, body)
      // If editing a practice subject, also update its quiz test settings
      if (subject && subject.subject_type === 'practice') {
        const qtRes = await api.get(`/subjects/${subject.id}/practice-test`).catch(() => null)
        if (qtRes?.data?.id) {
          await api.put(`/admin/quiz-tests/${qtRes.data.id}`, {
            name, description: desc,
            time_limit_minutes: timeLimit, retake_limit: retakeLimit,
            marks_correct: marksCorrect, marks_negative: marksNegative
          }).catch(() => {})
        }
      }
      showAlert(subject ? 'Subject updated' : 'Subject created', 'success')
      onSaved(); onClose()
    } catch (err) { showAlert(err.response?.data?.error || 'Save failed', 'error') }
  }

  // Load practice test settings when editing
  useState(() => {
    if (subject && subject.subject_type === 'practice') {
      api.get(`/subjects/${subject.id}/practice-test`).then(r => {
        setTimeLimit(r.data.time_limit_minutes || 30)
        setRetakeLimit(r.data.retake_limit || 1)
        setMarksCorrect(r.data.marks_correct ?? 1)
        setMarksNegative(r.data.marks_negative ?? 0)
      }).catch(() => {})
    }
  })

  const typeInfo = {
    subject: { icon: 'fa-book-open', color: '#0ea5e9', label: 'Subject' },
    practice: { icon: 'fa-dumbbell', color: '#8b5cf6', label: 'Practice Test' },
    live: { icon: 'fa-circle-dot', color: '#ef4444', label: 'Live Test' },
  }

  return (
    <Modal title={<><i className="fas fa-book-open" style={{ color: '#0ea5e9', marginRight: 8 }}></i>{subject ? 'Edit Subject' : 'Add Subject'}</>} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><i className="fas fa-floppy-disk"></i> Save</button></>}>
      <div className="form-group">
        <label className="form-label">Subject Name *</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Python Programming" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" />
      </div>
      <div className="form-group">
        <label className="form-label">Type</label>
        <select className="form-input" value={subjectType} onChange={e => setSubjectType(e.target.value)} disabled={!!subject}>
          <option value="subject">Subject</option>
          <option value="practice">Practice Test</option>
          <option value="live">Live Test</option>
        </select>
        {subject && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Type cannot be changed after creation.</div>}
        {!subject && subjectType !== 'subject' && (
          <div style={{ marginTop: 6, fontSize: 12, color: typeInfo[subjectType].color, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className={`fas ${typeInfo[subjectType].icon}`}></i>
            {subjectType === 'practice' ? 'Acts as a single test — add questions directly.' : 'Will appear with a Live badge. Scheduling coming soon.'}
          </div>
        )}
      </div>
      {subjectType === 'practice' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Time Limit (min)</label>
              <input className="form-input" type="number" min={1} max={300} value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value) || 30)} />
            </div>
            <div className="form-group">
              <label className="form-label">Retake Limit</label>
              <input className="form-input" type="number" min={1} max={99} value={retakeLimit} onChange={e => setRetakeLimit(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <div style={{ background: '#ede9fe', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5b21b6', marginBottom: 10 }}>
              <i className="fas fa-scale-balanced" style={{ marginRight: 6 }}></i>Marking Scheme
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Marks per Correct</label>
                <input className="form-input" type="number" min={0} step={0.25} value={marksCorrect} onChange={e => setMarksCorrect(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Negative Marks (per wrong)</label>
                <input className="form-input" type="number" min={0} step={0.25} value={marksNegative} onChange={e => setMarksNegative(parseFloat(e.target.value) || 0)} placeholder="0 = no negative" />
              </div>
            </div>
            {marksNegative > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#7c3aed' }}>
                <i className="fas fa-circle-info" style={{ marginRight: 4 }}></i>
                +{marksCorrect} per correct, −{marksNegative} per wrong answer
              </div>
            )}
          </div>
        </>
      )}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Status</label>
        <select className="form-input" value={active ? 'true' : 'false'} onChange={e => setActive(e.target.value === 'true')}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </Modal>
  )
}

export function TestModal({ subjectId, testId, onClose, onSaved, showAlert }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [time, setTime] = useState(30)
  const [retake, setRetake] = useState(1)
  const [active, setActive] = useState(true)
  const [shuffleQ, setShuffleQ] = useState(false)
  const [shuffleA, setShuffleA] = useState(false)
  const [loaded, setLoaded] = useState(!testId)

  useState(() => {
    if (testId) {
      api.get(`/quiz-tests/${testId}`).then(r => {
        const t = r.data
        setName(t.name); setDesc(t.description || ''); setTime(t.time_limit_minutes)
        setRetake(t.retake_limit || 1); setActive(t.is_active)
        setShuffleQ(!!t.shuffle_questions); setShuffleA(!!t.shuffle_answers)
        setLoaded(true)
      })
    }
  })

  async function save() {
    if (!name.trim()) { showAlert('Test name is required', 'error'); return }
    try {
      const url = testId ? `/admin/quiz-tests/${testId}` : '/admin/quiz-tests'
      const body = testId
        ? { name, description: desc, time_limit_minutes: time, retake_limit: retake, is_active: active, shuffle_questions: shuffleQ, shuffle_answers: shuffleA }
        : { name, description: desc, subject_id: subjectId, time_limit_minutes: time, retake_limit: retake, is_active: active, shuffle_questions: shuffleQ, shuffle_answers: shuffleA }
      await api[testId ? 'put' : 'post'](url, body)
      showAlert(testId ? 'Test updated' : 'Test created', 'success')
      onSaved(); onClose()
    } catch (err) { showAlert(err.response?.data?.error || 'Save failed', 'error') }
  }

  if (!loaded) return null

  const toggleStyle = (on) => ({
    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
    background: on ? 'var(--primary)' : 'var(--border)',
    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
  })
  const knobStyle = (on) => ({
    position: 'absolute', top: 3, left: on ? 21 : 3,
    width: 16, height: 16, borderRadius: '50%', background: '#fff',
    transition: 'left 0.2s',
  })

  return (
    <Modal title={<><i className="fas fa-clipboard-list" style={{ color: '#10b981', marginRight: 8 }}></i>{testId ? 'Edit Test' : 'Add Test'}</>} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><i className="fas fa-floppy-disk"></i> Save</button></>}>
      <div className="form-group">
        <label className="form-label">Test Name *</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Python Basics Test 1" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Time Limit (min) *</label>
          <input className="form-input" type="number" min={1} max={300} value={time} onChange={e => setTime(parseInt(e.target.value) || 30)} />
        </div>
        <div className="form-group">
          <label className="form-label">Retake Limit</label>
          <input className="form-input" type="number" min={1} max={99} value={retake} onChange={e => setRetake(parseInt(e.target.value) || 1)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Shuffle Questions</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <button style={toggleStyle(shuffleQ)} onClick={() => setShuffleQ(v => !v)}>
              <div style={knobStyle(shuffleQ)} />
            </button>
            <span style={{ fontSize: 12, color: shuffleQ ? 'var(--primary)' : 'var(--text-muted)' }}>
              <i className="fas fa-shuffle" style={{ marginRight: 4 }}></i>{shuffleQ ? 'On' : 'Off'}
            </span>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Shuffle Answers</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <button style={toggleStyle(shuffleA)} onClick={() => setShuffleA(v => !v)}>
              <div style={knobStyle(shuffleA)} />
            </button>
            <span style={{ fontSize: 12, color: shuffleA ? 'var(--primary)' : 'var(--text-muted)' }}>
              <i className="fas fa-shuffle" style={{ marginRight: 4 }}></i>{shuffleA ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </div>
      <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
        <label className="form-label">Status</label>
        <select className="form-input" value={active ? 'true' : 'false'} onChange={e => setActive(e.target.value === 'true')}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </Modal>
  )
}

export function QuestionModal({ testId, question, onClose, onSaved, showAlert }) {
  const [text, setText] = useState(question?.question_text || '')
  const [optA, setOptA] = useState(question?.option_a || '')
  const [optB, setOptB] = useState(question?.option_b || '')
  const [optC, setOptC] = useState(question?.option_c || '')
  const [optD, setOptD] = useState(question?.option_d || '')
  const [ans, setAns] = useState(question?.correct_answer || '')
  const [expl, setExpl] = useState(question?.explanation || '')
  const [active, setActive] = useState(question ? (question.is_active !== false) : true)

  const optMap = { A: optA, B: optB, C: optC, D: optD }

  async function save() {
    if (!text.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      showAlert('All fields are required', 'error'); return
    }
    const correctText = optMap[ans] || ans
    if (!correctText.trim()) { showAlert('Correct answer option is empty', 'error'); return }
    try {
      const url = question ? `/admin/questions/${question.id}` : '/admin/questions'
      const body = question
        ? { question_text: text, option_a: optA, option_b: optB, option_c: optC, option_d: optD, correct_answer: correctText, explanation: expl || null, is_active: active }
        : { quiz_test_id: testId, question_text: text, option_a: optA, option_b: optB, option_c: optC, option_d: optD, correct_answer: correctText, explanation: expl || null, is_active: active }
      await api[question ? 'put' : 'post'](url, body)
      showAlert(question ? 'Question updated' : 'Question added', 'success')
      onSaved(); onClose()
    } catch (err) { showAlert(err.response?.data?.error || 'Save failed', 'error') }
  }

  // Determine which label (A/B/C/D) matches the stored correct_answer text for the select default
  const currentLabel = question
    ? (['A', 'B', 'C', 'D'].find(l => question[`option_${l.toLowerCase()}`]?.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase()) || 'A')
    : 'A'
  const [selectedLabel, setSelectedLabel] = useState(currentLabel)

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div className="modal-title"><i className="fas fa-circle-question" style={{ color: 'var(--primary)', marginRight: 8 }}></i>{question ? 'Edit Question' : 'Add Question'}</div>
          <button className="modal-close" onClick={onClose}><i className="fas fa-xmark"></i></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea className="form-input" rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Enter the question" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {[['A', optA, setOptA], ['B', optB, setOptB], ['C', optC, setOptC], ['D', optD, setOptD]].map(([label, val, setter]) => (
              <div key={label} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Option {label} *</label>
                <input className="form-input" value={val} onChange={e => setter(e.target.value)} placeholder={`Option ${label}`} />
              </div>
            ))}
          </div>
          <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
            <label className="form-label">Correct Answer *</label>
            <select className="form-input" value={selectedLabel} onChange={e => { setSelectedLabel(e.target.value); setAns(e.target.value) }}>
              {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>Option {o}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
            <label className="form-label">Explanation <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>(optional)</span></label>
            <textarea className="form-input" rows={3} value={expl} onChange={e => setExpl(e.target.value)} placeholder="Explain why the correct answer is right (shown after quiz)" />
          </div>
          {question && (
            <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-input" value={active ? 'true' : 'false'} onChange={e => setActive(e.target.value === 'true')}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}><i className="fas fa-floppy-disk"></i> Save</button>
        </div>
      </div>
    </div>
  )
}

export function UploadModal({ testId, onClose, onSaved, showAlert }) {
  const [rows, setRows] = useState([])
  const [preview, setPreview] = useState(null)

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []
    const delimiter = lines[0].includes('\t') ? '\t' : ','
    const header = lines[0].toLowerCase()
    const startIdx = (header.includes('question') || header.includes('option') || header.includes('correct')) ? 1 : 0
    const headerCols = splitLine(lines[0], delimiter).map(h => h.replace(/"/g, '').trim().toLowerCase())
    const hasSerialCol = /^(no\.?|#|s\.?no\.?|sr\.?|num\.?)$/i.test(headerCols[0])
    const offset = hasSerialCol ? 1 : 0
    const result = []
    for (let i = startIdx; i < lines.length; i++) {
      const cols = splitLine(lines[i], delimiter)
      if (cols.length < 6 + offset) continue
      if (!cols[offset].trim()) continue
      const optA = cols[1 + offset].trim(), optB = cols[2 + offset].trim(), optC = cols[3 + offset].trim(), optD = cols[4 + offset].trim()
      const raw = cols[5 + offset].trim()
      const label = raw.toUpperCase().replace(/^([ABCD]).*/, '$1')
      let correctText
      if (['A', 'B', 'C', 'D'].includes(label)) {
        correctText = { A: optA, B: optB, C: optC, D: optD }[label]
      } else {
        // try matching full answer text against options (case-insensitive)
        const match = [optA, optB, optC, optD].find(o => o.toLowerCase() === raw.toLowerCase())
        if (!match) continue
        correctText = match
      }
      result.push({ question_text: cols[offset].trim(), option_a: optA, option_b: optB, option_c: optC, option_d: optD, correct_answer: correctText, explanation: cols[6 + offset]?.trim() || null })
    }
    return result
  }

  function splitLine(line, delimiter = ',') {
    if (delimiter === '\t') return line.split('\t')
    const result = []; let current = ''; let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } else { inQuotes = !inQuotes } }
      else if (ch === ',' && !inQuotes) { result.push(current); current = '' }
      else { current += ch }
    }
    result.push(current); return result
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const parsed = parseCSV(ev.target.result)
      setRows(parsed)
      setPreview(parsed.length > 0 ? `${parsed.length} questions ready to upload` : 'No valid rows found')
    }
    reader.readAsText(file)
  }

  async function upload() {
    if (!rows.length) { showAlert('No data to upload', 'error'); return }
    try {
      const res = await api.post(`/admin/quiz-tests/${testId}/upload-questions`, { questions: rows })
      showAlert(res.data.message, 'success')
      onSaved(); onClose()
    } catch (err) { showAlert(err.response?.data?.error || 'Upload failed', 'error') }
  }

  return (
    <Modal title={<><i className="fas fa-file-csv" style={{ color: 'var(--primary)', marginRight: 8 }}></i>Upload Questions via CSV</>} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={upload} disabled={rows.length === 0}><i className="fas fa-upload"></i> Upload</button></>}>
      <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '12px 14px', marginBottom: 18, fontSize: 12, color: 'var(--primary-dark)' }}>
        <strong>Required columns:</strong> Question, Option A, Option B, Option C, Option D, Correct Answer<br />
        <span style={{ opacity: 0.8 }}>Optional 7th column: <strong>Explanation</strong>. Correct Answer accepts either a label (<strong>A/B/C/D</strong>) or the <strong>exact option text</strong>. Supports comma and tab-separated files.</span>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Select CSV File *</label>
        <input type="file" className="form-input" accept=".csv,.txt" onChange={handleFile} />
      </div>
      {preview && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: rows.length > 0 ? '#d1fae5' : '#fee2e2', color: rows.length > 0 ? '#065f46' : '#991b1b', fontSize: 13, fontWeight: 600 }}>
          <i className={`fas ${rows.length > 0 ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: 6 }}></i>{preview}
        </div>
      )}
    </Modal>
  )
}

export function FlagDetailsModal({ questionId, onClose }) {
  const [data, setData] = useState(null)

  useState(() => {
    api.get(`/admin/questions/${questionId}/flag-details`).then(r => setData(r.data))
  })

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-box" style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div className="modal-title">
            <i className="fas fa-flag" style={{ color: '#f59e0b', marginRight: 8 }}></i>
            Flagged By Users
          </div>
          <button className="modal-close" onClick={onClose}><i className="fas fa-xmark"></i></button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {!data ? (
            <div style={{ textAlign: 'center', padding: 24 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 20, color: 'var(--text-muted)' }}></i></div>
          ) : (
            <>
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b44', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#78350f' }}>
                <i className="fas fa-circle-question" style={{ marginRight: 6 }}></i>
                <strong>{data.question_text}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total flags:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '2px 10px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
                  <i className="fas fa-flag"></i>{data.flag_count}
                </span>
              </div>
              {data.flags.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>No flags recorded.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Their Answer</th>
                        <th style={{ textAlign: 'center' }}>Result</th>
                        <th style={{ textAlign: 'right' }}>Answered At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.flags.map((f, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{f.username}</td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: 180 }}>{f.selected_answer || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${f.is_correct ? 'badge-success' : 'badge-danger'}`}>
                              {f.is_correct ? '✓ Correct' : '✗ Wrong'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 11 }}>
                            {f.answered_at ? new Date(f.answered_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={onClose}><i className="fas fa-xmark"></i> Close</button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({ title, message, onConfirm, onClose, confirmLabel, confirmColor }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-box" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div className="modal-body" style={{ paddingTop: 32 }}>
          <div style={{ width: 56, height: 56, background: confirmColor ? `${confirmColor}22` : '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <i className={`fas ${confirmLabel ? 'fa-circle-exclamation' : 'fa-trash'}`} style={{ fontSize: 22, color: confirmColor || 'var(--danger)' }}></i>
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose}><i className="fas fa-xmark"></i> Cancel</button>
          <button className="btn" style={{ background: confirmColor || 'var(--danger)', color: '#fff', border: 'none' }} onClick={onConfirm}>
            <i className={`fas ${confirmLabel ? 'fa-check' : 'fa-trash'}`}></i> {confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function UserLimitModal({ testId, testName, retakeLimit, onClose, showAlert }) {
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  async function load() {
    setLoading(true)
    try {
      const r = await api.get(`/admin/quiz-tests/${testId}/user-limits`)
      setAllUsers(r.data.users)
    } catch { showAlert('Failed to load users', 'error') }
    setLoading(false)
  }

  useState(() => { load() })

  const filtered = allUsers.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function handleSearch(val) { setSearch(val); setPage(1) }

  async function save(userId, extra) {
    setSaving(s => ({ ...s, [userId]: true }))
    try {
      await api.put(`/admin/quiz-tests/${testId}/user-limits/${userId}`, { extra_attempts: extra })
      setAllUsers(u => u.map(x => x.user_id === userId
        ? { ...x, test_extra_attempts: extra, effective_limit: retakeLimit + (x.global_extra_attempts || 0) + extra }
        : x))
      showAlert('Limit updated', 'success')
    } catch (err) { showAlert(err.response?.data?.error || 'Save failed', 'error') }
    setSaving(s => ({ ...s, [userId]: false }))
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-box" style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <div className="modal-title">
            <i className="fas fa-users" style={{ color: 'var(--primary)', marginRight: 8 }}></i>
            User Attempt Limits — {testName}
          </div>
          <button className="modal-close" onClick={onClose}><i className="fas fa-xmark"></i></button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: 'var(--primary-dark)' }}>
            <i className="fas fa-circle-info" style={{ marginRight: 6 }}></i>
            Default: <strong>{retakeLimit}</strong> attempt{retakeLimit !== 1 ? 's' : ''}.
            Effective = Default + Global Extra (set in User Management) + Test-specific Extra (set below).
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}></i>
              <input className="form-input" placeholder="Search by username or email..." value={search}
                onChange={e => handleSearch(e.target.value)}
                style={{ paddingLeft: 30, fontSize: 13 }} />
            </div>
            <span className="badge badge-secondary" style={{ alignSelf: 'center' }}>{filtered.length} users</span>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 20 }}></i>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th style={{ textAlign: 'center' }}>Used</th>
                      <th style={{ textAlign: 'center' }}>Default</th>
                      <th style={{ textAlign: 'center' }}>Global+</th>
                      <th style={{ textAlign: 'center' }}>Test+</th>
                      <th style={{ textAlign: 'center' }}>Effective</th>
                      <th style={{ textAlign: 'center' }}>Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(u => (
                      <tr key={u.user_id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{u.username}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${u.completed_attempts >= u.effective_limit ? 'badge-danger' : 'badge-secondary'}`}>
                            {u.completed_attempts}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{retakeLimit}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-secondary">{u.global_extra_attempts || 0}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min={0} max={999}
                            defaultValue={u.test_extra_attempts || 0}
                            id={`extra-${u.user_id}`}
                            style={{ width: 55, textAlign: 'center', padding: '3px 5px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12 }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-primary">{u.effective_limit}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={saving[u.user_id]}
                            onClick={() => {
                              const val = parseInt(document.getElementById(`extra-${u.user_id}`).value) || 0
                              save(u.user_id, val)
                            }}
                          >
                            {saving[u.user_id] ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-floppy-disk"></i>}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
