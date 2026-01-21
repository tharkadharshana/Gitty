# Gitty API Reference

This document outlines the core data functions and API endpoints used to interact with Git repositories.

### Repository Operations

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/git/open` | Validates and opens a repository path. |
| GET | `/api/git/repo-info` | Returns branch status, detachment, and uncommitted changes. |

### History & Inspection

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/git/history` | Retrieves the visual commit log (up to 100 commits). |
| GET | `/api/git/commit-files/:hash` | Lists files changed in a specific commit. |
| GET | `/api/git/diff/:hash/:path` | Returns old/new content for a file at a specific commit. |

### Editing Workflow

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/git/checkout-commit` | Checks out a commit (Detached HEAD) for editing. |
| POST | `/api/git/write-file` | Saves edited content back to the disk. |
| POST | `/api/git/stage-files` | Adds files to the Git index. |
| POST | `/api/git/amend-commit` | Performs `git commit --amend` to update the current HEAD. |
| POST | `/api/git/rebase-onto` | Replays history from an old base to a new base. |

### Conflict & Remote Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/git/continue-rebase` | Continues an interrupted rebase after conflict resolution. |
| POST | `/api/git/abort-rebase` | Aborts a rebase and returns to the previous state. |
| POST | `/api/git/force-push` | Updates the remote repository with the locally rewritten history. |
