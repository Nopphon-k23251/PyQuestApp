import logging as py_logging
import sys

def setup_logging():
    log_format = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # Ensure stdout handles UTF-8 properly on Windows without crashing on Thai characters
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    handler = py_logging.StreamHandler(sys.stdout)

    py_logging.basicConfig(
        level=py_logging.INFO,
        format=log_format,
        datefmt=date_format,
        handlers=[handler]
    )
    return py_logging.getLogger("pyquest")

logger = setup_logging()
