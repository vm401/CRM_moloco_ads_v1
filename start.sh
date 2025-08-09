#!/bin/bash
cd backend
python -m uvicorn fastapi_main:app --host 0.0.0.0 --port $PORT