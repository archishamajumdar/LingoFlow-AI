import uvicorn
import sys
import os

if __name__ == "__main__":
    # Ensure we are in the parent directory context to allow 'backend.' imports
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.append(parent_dir)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
