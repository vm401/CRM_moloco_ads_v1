#!/usr/bin/env python3
"""
Startup script for Railway deployment
"""
import os
import subprocess
import sys

def main():
    # Set PYTHONPATH to include current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    
    # Get port from environment
    port = os.environ.get('PORT', '8000')
    
    # Start uvicorn
    cmd = [
        sys.executable, '-m', 'uvicorn', 
        'backend.fastapi_main:app',
        '--host', '0.0.0.0',
        '--port', port
    ]
    
    print(f"🚀 Starting server with command: {' '.join(cmd)}")
    subprocess.run(cmd)

if __name__ == '__main__':
    main()
