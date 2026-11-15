"""The platform claim: every OS the manifest names, and why each is free.

Ported from the built-in's own manifest tests. The page spawns nothing (no
backend, no dependencies on external commands), so Windows needs no OS sandbox
backend, and the pop-out is the dashboard's own browser window, so the app does
not need the desktop shell either.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1]
DECLARED_OS = ["macos", "linux", "windows"]
_SYS_PLATFORM_OS = {"darwin": "macos", "linux": "linux", "win32": "windows"}


def _manifest() -> dict:
    return json.loads((APP_ROOT / "app.json").read_text(encoding="utf-8"))


class TestPlatform(unittest.TestCase):
    def test_declares_all_three_desktop_platforms(self) -> None:
        self.assertEqual(_manifest()["platform"]["os"], DECLARED_OS)

    @unittest.skipUnless(sys.platform in _SYS_PLATFORM_OS, "only the three named platforms")
    def test_the_host_running_this_suite_is_one_of_them(self) -> None:
        self.assertIn(_SYS_PLATFORM_OS[sys.platform], _manifest()["platform"]["os"])

    def test_pop_out_does_not_require_the_desktop_shell(self) -> None:
        self.assertFalse(_manifest()["platform"].get("requiresDesktopApp", False))

    def test_declares_no_backend_so_windows_needs_no_sandbox(self) -> None:
        manifest = _manifest()
        self.assertNotIn("backend", manifest)
        self.assertNotIn("dependencies", manifest)


if __name__ == "__main__":
    unittest.main()
