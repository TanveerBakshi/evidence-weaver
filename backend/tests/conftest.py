import os
import sys

# Make `services`, `clients`, `utils` importable the same way main.py does
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# The Anthropic client is constructed at import time and needs a key.
# Tests never hit the real API — call_claude is mocked — so a dummy is fine.
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")
