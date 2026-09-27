"""
One-time migration: convert correct_answer from 'a/b/c/d' label to actual option text.
Run from quiz_app root:  python -m backend.migrate_correct_answer
"""
from backend.models.models import SessionLocal, Question

db = SessionLocal()
questions = db.query(Question).all()
updated = 0

for q in questions:
    label = (q.correct_answer or '').strip().lower()
    option_map = {'a': q.option_a, 'b': q.option_b, 'c': q.option_c, 'd': q.option_d}
    if label in option_map:
        q.correct_answer = option_map[label]
        updated += 1

db.commit()
db.close()
print(f"Migration complete: {updated} questions updated.")
