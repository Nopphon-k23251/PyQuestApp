import logging as py_logging
import sys

def setup_logging():
    log_format = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    py_logging.basicConfig(
        level=py_logging.INFO,
        format=log_format,
        datefmt=date_format,
        handlers=[
            py_logging.StreamHandler(sys.stdout)
        ]
    )
    return py_logging.getLogger("pyquest")

logger = setup_logging()
