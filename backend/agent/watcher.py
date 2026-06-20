"""
Network drive file system watcher.

Uses watchdog to monitor a local folder (mapped network drive or UNC path).
When a supported file is created or modified, it calls the upload callback.
"""

import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".pptx", ".txt"}


class DriveEventHandler(FileSystemEventHandler):
    def __init__(self, on_file_change):
        """
        on_file_change: async-compatible callable(file_path: str) -> None
        Called whenever a supported file is created or modified.
        """
        self._callback = on_file_change

    def _handle(self, path: str) -> None:
        if Path(path).suffix.lower() in SUPPORTED_EXTENSIONS:
            logger.info("Detected change: %s", path)
            self._callback(path)

    def on_created(self, event):
        if not event.is_directory:
            self._handle(event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._handle(event.src_path)

    def on_moved(self, event):
        # Treat a rename/move as a new file at the destination
        if not event.is_directory:
            self._handle(event.dest_path)


def start_watcher(watch_path: str, on_file_change) -> Observer:
    """
    Start watching watch_path recursively.
    Returns the Observer so the caller can stop it later.
    """
    handler = DriveEventHandler(on_file_change)
    observer = Observer()
    observer.schedule(handler, watch_path, recursive=True)
    observer.start()
    logger.info("Watching path: %s", watch_path)
    return observer
