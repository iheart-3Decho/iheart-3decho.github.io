"""Supervise this demo's Firefox profile, including Ubuntu Snap launches."""

import os
from pathlib import Path
import signal
import subprocess
import threading
import time

PROFILE = str(Path.home() / "demos/crf-demo/lyh/browser-profile")
stopping = threading.Event()


def is_demo_browser(pid):
    try:
        process = Path("/proc") / str(pid)
        if process.stat().st_uid != os.getuid():
            return False
        args = process.joinpath("cmdline").read_bytes().split(b"\0")
        return (
            args[0].endswith(b"/firefox")
            and b"--kiosk" in args
            and b"--profile" in args
            and args[args.index(b"--profile") + 1] == PROFILE.encode()
        )
    except (OSError, IndexError):
        return False


def existing_browser():
    return next(
        (int(p.name) for p in Path("/proc").iterdir() if p.name.isdigit() and is_demo_browser(int(p.name))),
        None,
    )


def request_stop(_signal, _frame):
    stopping.set()


def main():
    signal.signal(signal.SIGTERM, request_stop)
    signal.signal(signal.SIGINT, request_stop)
    pid = existing_browser()
    launcher = None
    if pid is None:
        launcher = subprocess.Popen([
            "/usr/bin/firefox", "--kiosk", "--no-remote", "--marionette",
            "--profile", PROFILE, "http://127.0.0.1:8080/",
        ])
        deadline = time.monotonic() + 30
        while pid is None and not stopping.is_set() and time.monotonic() < deadline:
            stopping.wait(0.25)
            pid = existing_browser()
    if pid is None:
        raise RuntimeError("The iHeart kiosk profile did not start")
    print(f"Supervising iHeart Firefox PID {pid}", flush=True)
    try:
        while not stopping.wait(1):
            if not is_demo_browser(pid):
                raise RuntimeError("The iHeart kiosk browser exited")
    finally:
        # Snap moves Firefox into a separate scope. Stop only this exact profile.
        if is_demo_browser(pid):
            try:
                os.kill(pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            deadline = time.monotonic() + 20
            while is_demo_browser(pid) and time.monotonic() < deadline:
                time.sleep(0.25)
            if is_demo_browser(pid):
                os.kill(pid, signal.SIGKILL)
        if launcher is not None:
            launcher.wait(timeout=5)


if __name__ == "__main__":
    main()
