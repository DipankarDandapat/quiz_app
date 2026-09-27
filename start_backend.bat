@echo off
echo Starting FastAPI backend...
cd /d %~dp0

if exist venv\Scripts\activate (
    call venv\Scripts\activate
    venv\Scripts\pip install -r backend\requirements.txt -q
) else (
    echo No venv found, using system python
    pip install -r backend\requirements.txt -q
)

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
