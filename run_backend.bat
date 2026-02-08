@echo off
echo Starting Backend Server...
python -m uvicorn backend.main:app --reload --port 8000
pause
