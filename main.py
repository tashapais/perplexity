#!/usr/bin/env python3
"""
Railway entry point for the Perplexity Clone backend.
This file allows Railway to properly detect this as a Python project.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import and run the FastAPI app from the backend
from backend.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
