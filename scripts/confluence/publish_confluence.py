#!/usr/bin/env python3
"""Publish Eleventy Markdown documentation to Confluence Cloud (REST API v2).

A document is published only when its YAML front matter contains:

    confluence:
      page_id: "123456789"  # existing page; this script never creates pages
      publish: true         # optional, defaults to true
      delete_mode: trash    # optional: trash (default) or retain

Documents without this mapping are skipped.
Deleted or renamed files are detected from Git history, and their page
mapping is read from the base revision.

Required environment variables (not needed with --dry-run):
    CONFLUENCE_BASE_URL   e.g. https://your-site.atlassian.net
    CONFLUENCE_EMAIL      Atlassian account email
    CONFLUENCE_API_TOKEN  Atlassian API token
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import markdown
import yaml

ZERO_SHA = "0" * 40
FRONT_MATTER = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n?", re.DOTALL)
PAGE_ID = re.compile(r"\d+")
DELETE_MODES = {"trash", "retain"}


class ConfluenceError(RuntimeError):
    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


@dataclass(frozen=True)
class PageTarget:
    page_id: str
    title: str
    delete_mode: str
    body: str


@dataclass(frozen=True)
class Change:
    status: str
    path: str
    old_path: str | None = None


def is_before_revision(value: str) -> bool:
    return value == ZERO_SHA or re.fullmatch(r"[0-9a-fA-F]{40}\^?", value) is not None


def is_after_revision(value: str) -> bool:
    return value == "HEAD" or re.fullmatch(r"[0-9a-fA-F]{40}", value) is not None


def git_show(base: str, path: str) -> str:
    if not is_before_revision(base):
        raise ValueError("Git base must be a full commit SHA, SHA^, or the zero SHA")
    return subprocess.run(
        ["git", "--literal-pathspecs", "show", f"{base}:{path}"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout


def parse_before_revision(value: str) -> str:
    if is_before_revision(value):
        return value
    raise argparse.ArgumentTypeError(
        "--before must be a full commit SHA, SHA^, or the zero SHA"
    )


def parse_after_revision(value: str) -> str:
    if is_after_revision(value):
        return value
    raise argparse.ArgumentTypeError("--after must be a full commit SHA or HEAD")


def parse_target(text: str, path: str) -> PageTarget | None:
    match = FRONT_MATTER.match(text)
    meta = (yaml.safe_load(match.group(1)) or {}) if match else {}
    body = text[match.end() :] if match else text

    conf = meta.get("confluence")
    if not isinstance(conf, dict) or conf.get("publish", True) is not True:
        return None

    page_id = str(conf.get("page_id", "")).strip()
    if not PAGE_ID.fullmatch(page_id):
        raise ValueError(f"{path}: confluence.page_id must be a numeric string")

    delete_mode = conf.get("delete_mode", "trash")
    if delete_mode not in DELETE_MODES:
        raise ValueError(f"{path}: delete_mode must be one of {sorted(DELETE_MODES)}")

    title = str(meta.get("title", "")).strip()
    if not title:
        raise ValueError(f"{path}: front matter title is required")

    return PageTarget(page_id, title, delete_mode, body)


def read_target(path: str) -> PageTarget | None:
    return parse_target(Path(path).read_text(encoding="utf-8"), path)


def read_base_target(base: str, path: str) -> PageTarget | None:
    return parse_target(git_show(base, path), path)


class Confluence:
    def __init__(self, base_url: str, email: str, token: str):
        self.api = base_url.rstrip("/") + "/wiki/api/v2"
        credentials = base64.b64encode(f"{email}:{token}".encode()).decode()
        self.auth = f"Basic {credentials}"

    @classmethod
    def from_env(cls) -> Confluence:
        names = ["CONFLUENCE_BASE_URL", "CONFLUENCE_EMAIL", "CONFLUENCE_API_TOKEN"]
        missing = [name for name in names if not os.environ.get(name)]
        if missing:
            raise SystemExit(f"Missing environment variables: {', '.join(missing)}")
        return cls(
            os.environ["CONFLUENCE_BASE_URL"],
            os.environ["CONFLUENCE_EMAIL"],
            os.environ["CONFLUENCE_API_TOKEN"],
        )

    def _request(self, method: str, path: str, payload: dict | None = None) -> dict | None:
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(
            self.api + path,
            data=data,
            method=method,
            headers={
                "Authorization": self.auth,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise ConfluenceError(
                f"{method} {path} failed with HTTP {exc.code}: {detail}", exc.code
            ) from exc

    def get_page(self, page_id: str) -> dict:
        return self._request("GET", f"/pages/{page_id}") or {}

    def update_page(self, page_id: str, title: str, html: str, version: int) -> None:
        self._request(
            "PUT",
            f"/pages/{page_id}",
            {
                "id": page_id,
                "status": "current",
                "title": title,
                "body": {"representation": "storage", "value": html},
                "version": {"number": version, "message": "Published from repository"},
            },
        )

    def trash_page(self, page_id: str) -> None:
        self._request("DELETE", f"/pages/{page_id}")


def publish(target: PageTarget, path: str, client: Confluence | None) -> None:
    html = markdown.markdown(target.body, extensions=["tables", "fenced_code"])
    if client is None:
        print(f"DRY RUN: would update page {target.page_id} from {path}")
        return

    current = client.get_page(target.page_id)
    if current.get("status") != "current":
        raise ConfluenceError(
            f"page {target.page_id} is not current (status: {current.get('status')})"
        )
    version = current["version"]["number"] + 1
    client.update_page(target.page_id, target.title, html, version)
    print(f"Updated page {target.page_id} from {path} (version {version})")


def retire(target: PageTarget | None, path: str, client: Confluence | None) -> None:
    if target is None:
        return
    if target.delete_mode == "retain":
        print(f"Retaining page {target.page_id} for removed {path}")
        return
    if client is None:
        print(f"DRY RUN: would trash page {target.page_id} for removed {path}")
        return
    try:
        client.trash_page(target.page_id)
        print(f"Trashed page {target.page_id} for removed {path}")
    except ConfluenceError as exc:
        if exc.status == 404:
            print(f"Page {target.page_id} for {path} no longer exists; nothing to trash")
        else:
            raise


def git_changes(base: str, head: str, docs_root: str) -> list[Change]:
    if not is_before_revision(base) or not is_after_revision(head):
        raise ValueError("Invalid Git revision argument")
    changes: list[Change] = []
    output = subprocess.run(
        [
            "git",
            "--literal-pathspecs",
            "diff",
            "--name-status",
            "-M",
            base,
            head,
            "--",
            docs_root,
        ],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    for line in output.splitlines():
        fields = line.split("\t")
        if fields[0].startswith("R"):
            changes.append(Change("R", fields[2], fields[1]))
        else:
            changes.append(Change(fields[0][0], fields[1]))
    return [change for change in changes if change.path.endswith(".md")]


def all_documents(docs_root: str) -> list[Change]:
    return [
        Change("M", str(path)) for path in sorted(Path(docs_root).rglob("*.md"))
    ]


def handle(change: Change, base: str | None, client: Confluence | None) -> None:
    if change.status == "D":
        retire(read_base_target(base, change.path), change.path, client)
        return

    target = read_target(change.path)
    if change.status == "R" and change.old_path:
        old_target = read_base_target(base, change.old_path)
        if old_target and (target is None or target.page_id != old_target.page_id):
            retire(old_target, change.old_path, client)

    if target is None:
        print(f"Skipping {change.path}: no publishable confluence mapping")
        return
    publish(target, change.path, client)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--docs-root", default="docs")
    parser.add_argument(
        "--before", type=parse_before_revision, help="base commit SHA for change detection"
    )
    parser.add_argument(
        "--after", default="HEAD", type=parse_after_revision, help="head commit SHA"
    )
    parser.add_argument("--all", action="store_true", help="publish every mapped document")
    parser.add_argument("--dry-run", action="store_true", help="report actions without calling Confluence")
    args = parser.parse_args(argv)

    if not args.all and not args.before:
        parser.error("either --before or --all is required")

    if args.all or args.before == ZERO_SHA:
        base = None
        changes = all_documents(args.docs_root)
    else:
        base = args.before
        changes = git_changes(args.before, args.after, args.docs_root)

    client = None if args.dry_run else Confluence.from_env()
    failures = 0
    for change in changes:
        try:
            handle(change, base, client)
        except (ConfluenceError, ValueError, OSError, subprocess.CalledProcessError) as exc:
            failures += 1
            print(f"::error file={change.path}::{exc}")

    if failures:
        print(f"{failures} document(s) failed to publish", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
