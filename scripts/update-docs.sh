#!/bin/sh
# Pre-commit step: asks the Copilot CLI to update docs/ from staged code changes using the tech-docs skill.
set -eu

SKILL=".github/skills/create-update-eleventy-docs/SKILL.md"

if [ "${SKIP_DOCS_UPDATE:-}" = "1" ]; then
  echo "update-docs: skipped (SKIP_DOCS_UPDATE=1)"
  exit 0
fi

# Only code-affecting changes should trigger a documentation update.
CODE_CHANGES=$(git diff --cached --name-only --diff-filter=ACMRD -- \
  'src/*' 'compose*' 'compose/*' 'Dockerfile' 'vite.config.js' 'package.json' 'config/*' || true)
if [ -z "$CODE_CHANGES" ]; then
  echo "update-docs: no staged code changes, skipping"
  exit 0
fi

if ! command -v copilot >/dev/null 2>&1; then
  echo "update-docs: copilot CLI not found, skipping documentation update" >&2
  exit 0
fi

# Do not document source changes that are absent from the commit.
if ! git diff --quiet; then
  echo "update-docs: unstaged tracked changes, skipping to avoid documenting uncommitted code" >&2
  exit 0
fi

# Refuse to run when docs/ already has edits, so only generated changes get staged.
if [ -n "$(git status --porcelain -- docs)" ]; then
  echo "update-docs: docs/ has uncommitted changes, skipping to avoid staging unrelated edits" >&2
  exit 0
fi

if [ "${ALLOW_UNRESTRICTED_DOCS_UPDATE:-}" != "1" ]; then
  echo "update-docs: skipped (set ALLOW_UNRESTRICTED_DOCS_UPDATE=1 to allow unrestricted Copilot CLI tools)" >&2
  exit 0
fi

echo "update-docs: updating docs/ for staged changes"
PROMPT="Follow the skill in ${SKILL}. The staged code changes are listed by 'git diff --cached --name-only'; read them with 'git diff --cached'. Update only the Markdown files under docs/ (including the docs/index.md index) so they match the current code. Do not modify any other file and do not run git commands that change the index or history."

copilot -p "$PROMPT" --allow-all-tools -s

if [ -n "$(git status --porcelain -- docs)" ]; then
  npx prettier --write docs >/dev/null
  git add docs
  echo "update-docs: docs/ updated and staged"
else
  echo "update-docs: no documentation changes needed"
fi
