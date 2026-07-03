---
name: commit-and-push
description: Use this skill whenever the user asks to commit changes, "commit and push", "save my progress", or similar — including short triggers like "commit" or "push this". Generates a commit message from the actual diff content (same idea as VS Code's "Generate Commit Message"), commits, pulls, and pushes.
---

# Commit and Push

Stage changes, write a commit message purely from the diff content, commit, pull, and push — without asking the user to write the message themselves.

## Steps

1. **Inspect the current state**
   - Run `git status` to see what's changed.
   - Run `git diff` (unstaged) and `git diff --staged` (already staged) to see actual content changes, not just filenames.
   - If there are no changes at all, tell the user and stop — do not create an empty commit.

2. **Stage changes**
   - Default: `git add -A` (stage everything).
   - Exception: if the user names specific files/folders, stage only those.

3. **Generate the commit message from the diff**
   - Read the diff content itself, not just file paths — the message must reflect what actually changed (added a Lua script, fixed a race condition, wired a socket event, etc.), the same way VS Code's "Generate Commit Message" summarizes real changes.
   - Format: **Conventional Commits** style.
     - `feat: ...` new functionality
     - `fix: ...` bug fix
     - `refactor: ...` restructuring, no behavior change
     - `docs: ...` documentation only (README, ARCHITECTURE.md, PROMPTS.md)
     - `chore: ...` config, deps, tooling, Docker
     - `test: ...` tests
   - Subject line: imperative mood, concise, under ~72 chars (e.g. `feat: add atomic Redis Lua script for stock reservation`).
   - If the diff spans several unrelated concerns, add a short bullet body under the subject line summarizing each, rather than cramming everything into the subject.
   - Do not invent changes that aren't in the diff. Do not use generic messages like "update files" or "fix stuff."

4. **Commit**
   - `git commit -m "<generated message>"` (use `-F` with a temp file if the message has a multi-line body).
   - Show the user the exact message used.

5. **Pull**
   - `git pull --rebase` to avoid unnecessary merge commits.
   - If there's a conflict, stop immediately, show the user the conflicting files, and let them resolve it — do not attempt to auto-resolve conflicts.

6. **Push**
   - `git push`.
   - If the branch has no upstream yet, use `git push -u origin <current-branch>`.

7. **Confirm**
   - Report back: the commit message used, and confirmation that pull + push succeeded (or what went wrong, if anything).

## Notes
- Never commit `.env` or other files matching `.gitignore` — trust `git status`/`git add -A`, don't force-add ignored files.
- If unsure whether a change is `feat` vs `fix` vs `refactor`, prefer the most conservative accurate label based on the diff, not the user's framing of the request.
