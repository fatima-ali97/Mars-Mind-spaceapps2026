"""Generate the demo fixture once; tests do not require a NASA download."""
import subprocess
import sys
from pathlib import Path
import pytest

@pytest.fixture(scope="session", autouse=True)
def demo_data():
    base = Path(__file__).resolve().parents[1]
    subprocess.run([sys.executable, str(base / "scripts" / "make_demo_data.py")], check=True)
