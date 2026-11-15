"""What an existing user's copy of the built-in needs from this repository.

Kiro Crew adopts a user's built-in record onto this repository in place, at a
pinned commit, with no consent dialog, so the tree must be something it can take
over unchanged:

- the same name, permissions, platform and ``defaultEnabled`` as the built-in
  (``tests/fixtures/builtin-app.json`` is its manifest at the commit this was
  ported from), and a version never below its. A widened grant would be held
  back, and adoption refuses that. Adoption matches the version against Kiro
  Crew's pin of one commit here, so a later commit carries a later patch
  version, which is what shows an adopted user the update;
- no backend, no hooks and nothing that runs on the gateway: the built-in is a
  page only, and so is this;
- nothing that needs a build at install time, and no symlinks or file names a
  Windows checkout cannot hold;
- a committed UI bundle that imports only the modules the dashboard provides,
  and from the two SDK modules only names every supported host exports by
  name (a named import of a missing export fails the whole bundle at load); the
  one App Kit level 8 name, ``useHostSessions``, is read off a namespace import;
- ``minKiroCrewVersion`` set, so a host without the session seam refuses a
  fresh install instead of serving a page that can only say it needs an update.
"""

from __future__ import annotations

import json
import os
import re
import unittest
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1]
BUNDLE = APP_ROOT / "ui" / "dist" / "index.mjs"

HOST_MODULES = {
    "react",
    "react-dom",
    "react/jsx-runtime",
    "lucide-react",
    "@tanstack/react-query",
    "@kirocrew/app-sdk",
    "@kirocrew/app-sdk/ui",
}

# What a host BEFORE App Kit level 1 exports from each SDK module (its
# public/vendor/*.mjs stubs). A named import from these modules must stay in this
# set; a newer name is read off a namespace import in ui/src/hostSdk.ts.
LEVEL0_EXPORTS = {
    "@kirocrew/app-sdk": {
        "useAppApi",
        "useAppEvents",
        "useTheme",
        "useAppInfo",
        "useNavigate",
        "useNotify",
        "useNavBadge",
        "useChatLauncher",
        "AppApiProvider",
        "useImeGuard",
        "useLanguageGeneration",
        "activeLocale",
        "fmtNumber",
        "fmtDate",
        "fmtTime",
        "fmtDateTime",
        "fmtRelative",
        "compareText",
    },
    "@kirocrew/app-sdk/ui": {
        "Card",
        "CardTitle",
        "Btn",
        "SendBtn",
        "Input",
        "SearchInput",
        "Badge",
        "SourceBadge",
        "StatCard",
        "Skeleton",
        "ContentSkeleton",
        "EmptyState",
        "PageHeader",
        "Toggle",
        "InfoTip",
        "SegmentedControl",
        "MarkdownRenderer",
        "Clickable",
        "Modal",
        "ErrorNotice",
        "SettingsSection",
        "SettingsCard",
        "SettingsInput",
        "SettingsToggle",
        "SettingsSelect",
    },
}

#: The host paths the page calls, declared as the built-in's wheel copy declares them.
HOST_PATHS = [
    "=/api/chat",
    "/api/chat/slots",
    "/api/approvals",
    "=/api/crons",
    "=/api/spawn",
    "=/api/config/default-agent",
    "=/api/dashboard/config",
]

# Directories git ignores here (see .gitignore): never part of a clone.
_UNTRACKED_DIRS = {".git", "node_modules", "__pycache__", ".pytest_cache", ".venv"}
_WINDOWS_RESERVED = re.compile(r"^(con|prn|aux|nul|com[1-9]|lpt[1-9])$", re.IGNORECASE)
_STATIC_IMPORT = re.compile(
    r"^import\s+(?:(?P<clause>[^'\"]+?)\s+from\s+)?[\"'](?P<spec>[^\"']+)[\"'];?\s*$",
    re.MULTILINE,
)


def _manifest() -> dict:
    return json.loads((APP_ROOT / "app.json").read_text(encoding="utf-8"))


def _builtin() -> dict:
    return json.loads((APP_ROOT / "tests" / "fixtures" / "builtin-app.json").read_text("utf-8"))


def _text() -> str:
    return BUNDLE.read_text(encoding="utf-8")


def _bundle_imports() -> list[tuple[str, str]]:
    return [(m["spec"], (m["clause"] or "").strip()) for m in _STATIC_IMPORT.finditer(_text())]


def _named(clause: str) -> set[str]:
    """The imported names of ``{ a, b as c }``; empty for a namespace import."""
    match = re.search(r"\{([^}]*)\}", clause)
    if not match:
        return set()
    return {part.split(" as ")[0].strip() for part in match.group(1).split(",") if part.strip()}


def _tree() -> list[Path]:
    files: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(APP_ROOT):
        dirnames[:] = [d for d in dirnames if d not in _UNTRACKED_DIRS]
        files += [Path(dirpath) / name for name in filenames]
        files += [Path(dirpath) / d for d in dirnames if (Path(dirpath) / d).is_symlink()]
    return files


class TestTheBundle(unittest.TestCase):
    def test_the_entry_the_manifest_names_is_committed(self) -> None:
        ui = _manifest()["ui"]
        self.assertEqual(ui["entry"], "dist/index.mjs")
        # ui.entry is relative to ui/.
        self.assertTrue((APP_ROOT / "ui" / ui["entry"]).is_file(), "run `npm run build` in ui/")

    def test_it_imports_only_what_the_host_provides(self) -> None:
        imports = _bundle_imports()
        self.assertTrue(imports, "no import statements found; the scan is broken")
        # Every top-level import statement is one the pattern read in full.
        starts = re.findall(r"^import\b", _text(), re.MULTILINE)
        self.assertEqual(len(starts), len(imports), "an import the scan could not parse")
        self.assertLessEqual({spec for spec, _ in imports}, HOST_MODULES)
        self.assertNotRegex(_text(), r"\bimport\s*\(", "a dynamic import would load a second file")

    def test_named_sdk_imports_exist_on_every_supported_host(self) -> None:
        for spec, clause in _bundle_imports():
            if spec in LEVEL0_EXPORTS:
                with self.subTest(module=spec):
                    self.assertLessEqual(_named(clause), LEVEL0_EXPORTS[spec])

    def test_the_session_seam_is_read_off_a_namespace_import(self) -> None:
        """``useHostSessions`` is App Kit level 8: never a named import."""
        clauses = [clause for spec, clause in _bundle_imports() if spec == "@kirocrew/app-sdk"]
        self.assertTrue(any(c.startswith("* as ") for c in clauses), clauses)
        self.assertIn("useHostSessions", _text())

    def test_it_keeps_the_builtins_saved_state_keys(self) -> None:
        """An existing user's chosen scene and greeted agents live under these keys,
        and the pop-out talks to the page over this channel."""
        text = _text()
        for key in ("mc-agent-scene", "mc-scene-known-agents", "kirocrew-worlds-popout"):
            with self.subTest(key=key):
                self.assertIn(f'"{key}"', text)

    def test_it_calls_the_host_only_through_the_sdk(self) -> None:
        """No raw fetch: every request goes through the scoped client or the host seam."""
        self.assertNotRegex(_text(), r"\bfetch\(")

    def test_no_build_machine_path_is_baked_in(self) -> None:
        text = _text()
        self.assertNotIn(str(APP_ROOT), text)
        self.assertNotIn(APP_ROOT.as_posix(), text)
        self.assertNotIn("node_modules/", text)
        self.assertNotRegex(text, r"[A-Za-z]:\\\\(?:Users|a)\\\\")


class TestTheManifest(unittest.TestCase):
    def test_declares_the_first_kiro_crew_with_the_seam(self) -> None:
        self.assertEqual(_manifest().get("minKiroCrewVersion"), "0.14.0")

    def test_what_adoption_compares_is_the_builtins(self) -> None:
        manifest, builtin = _manifest(), _builtin()
        for key in ("name", "permissions", "defaultEnabled", "platform"):
            with self.subTest(field=key):
                self.assertEqual(manifest[key], builtin[key])

        def parsed(version: str) -> tuple[int, ...]:
            self.assertRegex(version, r"^\d+\.\d+\.\d+$")
            return tuple(int(part) for part in version.split("."))

        self.assertGreaterEqual(parsed(manifest["version"]), parsed(builtin["version"]))

    def test_declares_exactly_the_host_paths_the_page_calls(self) -> None:
        self.assertEqual(_manifest()["permissions"], {"api": HOST_PATHS})

    def test_declares_nothing_adoption_cannot_carry(self) -> None:
        manifest = _manifest()
        for key in ("agents", "skills", "mcpServers", "crons", "backend", "dependencies", "setup"):
            with self.subTest(field=key):
                self.assertNotIn(key, manifest)
        for key in ("sessionApproval", "chatSlots", "agentTurns"):
            with self.subTest(permission=key):
                self.assertNotIn(key, manifest["permissions"])
        self.assertNotIn("overlays", manifest["ui"])
        self.assertIs(manifest["defaultEnabled"], False)

    def test_the_page_carries_no_glyph_of_its_own(self) -> None:
        """The legacy ``/worlds`` route and its sidebar glyph come from Kiro Crew's
        adoption pin, not from here, so a fresh install cannot claim them."""
        pages = _manifest()["ui"]["pages"]
        self.assertEqual(pages, [{"route": "/apps/agent-worlds", "label": "Worlds"}])

    def test_listing_copy_matches_the_bundled_catalogs(self) -> None:
        """One source per string: the l10n block is the catalogs' ``manifest`` subtree."""
        manifest = _manifest()
        catalogs = {
            p.stem: json.loads(p.read_text(encoding="utf-8"))["manifest"]
            for p in sorted((APP_ROOT / "ui" / "i18n").glob("*.json"))
        }
        english = catalogs.pop("en")
        self.assertEqual(manifest["displayName"], english["display_name"])
        self.assertEqual(manifest["description"], english["description"])
        self.assertEqual(manifest["ui"]["pages"][0]["label"], english["page_label"])
        self.assertEqual(manifest["highlights"], [english[f"highlight_{i}"] for i in range(1, 6)])
        self.assertEqual(manifest["useCases"], [english["use_case_1"]])
        self.assertEqual(manifest["configuration"], [english["configuration_1"]])
        self.assertEqual(set(manifest["l10n"]), set(catalogs))
        for locale, strings in catalogs.items():
            with self.subTest(locale=locale):
                self.assertEqual(
                    manifest["l10n"][locale],
                    {
                        "displayName": strings["display_name"],
                        "description": strings["description"],
                        "pageLabel": strings["page_label"],
                        "highlights": [strings[f"highlight_{i}"] for i in range(1, 6)],
                    },
                )

    def test_l10n_is_within_the_host_parser_limits(self) -> None:
        """A locale over a limit is dropped by the host, silently for the reader."""
        l10n = _manifest()["l10n"]
        self.assertLessEqual(len(l10n), 32)
        for locale, entry in l10n.items():
            with self.subTest(locale=locale):
                self.assertRegex(locale, r"^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$")
                self.assertLessEqual(
                    set(entry), {"displayName", "description", "pageLabel", "highlights"}
                )
                self.assertLessEqual(len(entry["displayName"]), 120)
                self.assertLessEqual(len(entry["description"]), 1000)
                self.assertLessEqual(len(entry["pageLabel"]), 60)
                self.assertLessEqual(len(entry["highlights"]), 12)
                self.assertTrue(all(len(h) <= 300 for h in entry["highlights"]))

    def test_art_is_repo_relative_png(self) -> None:
        manifest = _manifest()
        for key in (
            "iconPath",
            "heroImage",
            "heroImageDark",
            "heroImageDetail",
            "heroImageDetailDark",
        ):
            with self.subTest(field=key):
                self.assertRegex(manifest[key], r"^assets/[\w-]+\.png$")
                self.assertTrue((APP_ROOT / manifest[key]).is_file())
        for shot in manifest["screenshots"]:
            self.assertRegex(shot, r"^assets/[\w-]+\.png$")
            self.assertTrue((APP_ROOT / shot).is_file())


class TestTheTreeIsAdoptable(unittest.TestCase):
    def test_no_root_build_file(self) -> None:
        for name in (
            "package.json",
            "pyproject.toml",
            "setup.py",
            "requirements.txt",
            ".gitattributes",
        ):
            with self.subTest(name=name):
                self.assertFalse((APP_ROOT / name).exists())

    def test_no_link_and_no_unportable_name(self) -> None:
        seen: dict[str, str] = {}
        for path in _tree():
            rel = path.relative_to(APP_ROOT).as_posix()
            with self.subTest(path=rel):
                self.assertFalse(path.is_symlink(), "a link is refused by adoption")
                self.assertTrue(path.is_file(), "only regular files")
                self.assertNotRegex(rel, r"[\\:]")
                for part in rel.split("/"):
                    self.assertFalse(part.endswith((".", " ")), part)
                    self.assertIsNone(_WINDOWS_RESERVED.match(part.split(".")[0]), part)
                self.assertNotIn(
                    rel.lower(), seen, f"differs only in case from {seen.get(rel.lower())}"
                )
                seen[rel.lower()] = rel

    def test_the_tree_is_within_the_adoption_caps(self) -> None:
        files = _tree()
        self.assertLessEqual(len(files), 5000)
        self.assertLessEqual(sum(p.stat().st_size for p in files), 64 * 1024 * 1024)

    def test_ships_no_python_outside_its_tests(self) -> None:
        """A page-only app: no Python runs on the gateway, which is what keeps the
        Windows claim free (no sandboxed process to spawn)."""
        offenders = [
            p.relative_to(APP_ROOT).as_posix()
            for p in _tree()
            if p.suffix == ".py" and p.relative_to(APP_ROOT).parts[0] not in ("tests", "capture")
        ]
        self.assertEqual(offenders, [])


if __name__ == "__main__":
    unittest.main()
