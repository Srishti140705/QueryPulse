"""Reusable logger configuration for QueryPulse.

Provides a module-level `logger` and a `get_logger()` helper. Logs are emitted
at INFO level (and above) to both the console and a file at `logs/querypulse.log`.
The log directory is created automatically relative to the backend folder.

Usage:
    from app.logger import logger
    logger.info("ready")

    or

    from app.logger import get_logger
    log = get_logger(__name__)
    log.error("something went wrong")
"""

from __future__ import annotations

import logging
import os
from logging import Logger


# Determine logs directory relative to backend/ (backend/logs/querypulse.log)
_LOGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logs"))
os.makedirs(_LOGS_DIR, exist_ok=True)

_LOG_FILE = os.path.join(_LOGS_DIR, "querypulse.log")


def _configure_logger(name: str = "querypulse") -> Logger:
    """Configure and return a logger instance.

    Ensures that handlers are only added once to avoid duplicate messages when
    the module is imported multiple times.
    """
    logger = logging.getLogger(name)

    # Avoid reconfiguration if logger already has handlers
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)

    formatter = logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")

    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # File handler
    try:
        fh = logging.FileHandler(_LOG_FILE, encoding="utf-8")
        fh.setLevel(logging.INFO)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
    except Exception:
        # If file handler cannot be created, still return a working console logger
        logger.exception("Failed to create file handler for logs; continuing with console only")

    # Prevent double logging if root logger is configured elsewhere
    logger.propagate = False

    return logger


# Module-level reusable logger
logger: Logger = _configure_logger()


def get_logger(name: str | None = None) -> Logger:
    """Return a logger instance for the given name.

    If `name` is None, returns the module-level `logger`. If provided, returns
    a child logger using the module logger as parent so formatting and handlers
    are shared.
    """
    if not name:
        return logger
    return logger.getChild(name)
