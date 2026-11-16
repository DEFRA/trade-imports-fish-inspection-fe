#!/bin/sh
# Pre-commit step: asks the Copilot CLI to update docs/ from staged code changes using the create-update-mkdocs skill.
set -eu

SKILL=".github/skills/create-update-mkdocs/SKILL.md"

# Update docs for every staged change outside the documentation itself and its tooling.
NON_DOC_CHANGES=$(git diff --cached --name-only --diff-filter=ACMRD -- . \
  ':(exclude)docs/**' \
  ':(exclude).githooks/**' \
  ':(exclude)scripts/update-docs.sh' \
  ':(exclude).github/skills/create-update-mkdocs/**' || true)
if [ -z "$NON_DOC_CHANGES" ]; then
  echo "update-docs: no staged non-documentation changes, skipping"
  exit 0
fi

if ! command -v copilot >/dev/null 2>&1; then
  echo "update-docs: copilot CLI is required to update documentation" >&2
  exit 1
fi

if ! git diff --quiet; then
  echo "update-docs: commit or stash unstaged tracked changes before committing code" >&2
  exit 1
fi

if ! git diff --quiet -- docs || [ -n "$(git ls-files --others --exclude-standard -- docs)" ]; then
  echo "update-docs: commit or stash unstaged/untracked docs changes before committing code" >&2
  exit 1
fi

echo "update-docs: updating docs/ for staged changes"
PROMPT="Follow the skill in ${SKILL}. The staged code changes are listed by 'git diff --cached --name-only'; read them with 'git diff --cached'. Update only the Markdown files under docs/ (including the docs/index.md index) so they match the current code. Do not modify any other file and do not run git commands that change the index or history."

copilot -p "$PROMPT" -s --allow-tool='read, write(docs/), shell(git diff --cached*)'

if [ -n "$(git status --porcelain -- docs)" ]; then
  ./node_modules/.bin/prettier --write docs >/dev/null
  git add docs
  echo "update-docs: docs/ updated and staged"
else
  echo "update-docs: no documentation changes needed"
fi
