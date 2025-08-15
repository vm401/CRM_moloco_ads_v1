#!/usr/bin/env python3
"""
Main entry point for Render deployment
Redirects to the actual FastAPI app in backend/
"""

import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_path)

# Import the FastAPI app from backend
from fastapi_main import app

# Export for Render
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
