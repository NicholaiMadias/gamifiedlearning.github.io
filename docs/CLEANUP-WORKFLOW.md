# Repository Cleanup & Content Replacement Workflow

> **Operator Playbook** — Platform-agnostic, language-agnostic.  
> Works with GitHub, Azure DevOps, GitLab, and any CI pipeline you already have.

---

## Overview

| # | Phase | Purpose |
|---|-------|---------|
| 1 | [RECON](#phase-1-recon) | Audit the entire repo — branches, dependencies, dead code, broken links, large files — and compile a structured report |
| 2 | [PURGE](#phase-2-purge) | Atomic removal of stale branches, deprecated modules, dead code, and binary bloat with rollback-safe commits |
| 3 | [FORGE](#phase-3-forge) | Author clean replacement content — new modules, updated docs, refreshed configs — with inline documentation and tests |
| 4 | [VERIFY](#phase-4-verify) | Full validation gate — test suite, linting, link checks, dependency audit, peer review, and before/after metrics |
| 5 | [DEPLOY](#phase-5-deploy) | Merge to main, tag the release, update CHANGELOG, notify stakeholders, and schedule the next audit cycle |

---

## Commit Message Templates

Every commit in this workflow uses a bracketed prefix so history stays traceable:

```
[RECON]   <short description>   — audit findings and reports
[PURGE]   <short description>   — removals and deletions
[FORGE]   <short description>   — new/replacement content
[VERIFY]  <short description>   — validation fixes and test updates
[DEPLOY]  <short description>   — merge, tag, and release actions
[ROLLBACK] <short description>  — revert to safety tag
```

---

## Rollback Protocol

Before starting **any** phase, create a safety tag:

```bash
git tag cleanup/pre-<YYYYMMDD> HEAD
git push origin cleanup/pre-<YYYYMMDD>
```

To revert a single commit:

```bash
git revert <commit-sha> --no-edit
git push origin <branch>
```

To revert all the way to the safety tag:

```bash
git reset --hard cleanup/pre-<YYYYMMDD>
git push --force-with-lease origin <branch>
```

---

## Phase 1 — RECON

**Goal:** Compile a full picture of the repo's health before touching anything.

### Tasks

| # | Task | Tool / Command | Done |
|---|------|----------------|------|
| 1.1 | List all branches (local + remote) | `git branch -a` | ☐ |
| 1.2 | Identify stale branches (no commit in 30+ days) | `git for-each-ref --sort=-committerdate refs/remotes` | ☐ |
| 1.3 | Audit dependencies for outdated or vulnerable packages | `npm audit` / `pip list --outdated` / `bundler-audit` | ☐ |
| 1.4 | Find dead / unreferenced files | `git ls-files` + grep for unused imports | ☐ |
| 1.5 | Detect large files (>1 MB) | `git rev-list --objects --all \| git cat-file --batch-check \| sort -k3 -n -r \| head -20` | ☐ |
| 1.6 | Check for broken internal/external links | `lychee .` / `markdown-link-check` | ☐ |
| 1.7 | Review open issues and PRs for duplicates or rot | GitHub Issues / PR list | ☐ |
| 1.8 | Document findings in `docs/recon-report-<YYYYMMDD>.md` | manual | ☐ |

### Commit when done

```
[RECON] audit <YYYYMMDD> — <N> stale branches, <N> large files, <N> dead modules identified
```

### Phase Gate Checklist

- [ ] Recon report committed to branch
- [ ] All findings categorised (remove / replace / keep)
- [ ] Safety tag `cleanup/pre-<YYYYMMDD>` pushed

---

## Phase 2 — PURGE

**Goal:** Atomically remove everything flagged in RECON. One logical change per commit.

### Tasks

| # | Task | Done |
|---|------|------|
| 2.1 | Delete stale remote branches | ☐ |
| 2.2 | Remove deprecated / unused modules and source files | ☐ |
| 2.3 | Strip dead code blocks and commented-out experiments | ☐ |
| 2.4 | Delete binary blobs and large assets no longer referenced | ☐ |
| 2.5 | Remove redundant CI workflow files | ☐ |
| 2.6 | Clean up stale lock files / generated artefacts | ☐ |
| 2.7 | Verify no references remain to deleted items | ☐ |

### Commit convention

Make **one commit per logical deletion unit** so individual reverts stay clean:

```
[PURGE] remove deprecated <module-name> module
[PURGE] delete stale branch refs from CI config
[PURGE] strip dead code from <filename>
```

### Phase Gate Checklist

- [ ] Every deletion is a standalone, revertable commit
- [ ] `git grep` confirms no dangling references to deleted items
- [ ] Build/tests still pass after purge
- [ ] RECON report updated with purge summary

---

## Phase 3 — FORGE

**Goal:** Author the clean replacement content that fills the gaps left by PURGE.

### Tasks

| # | Task | Done |
|---|------|------|
| 3.1 | Write new / replacement source modules | ☐ |
| 3.2 | Update configuration files (CI, linting, build) | ☐ |
| 3.3 | Refresh or rewrite documentation | ☐ |
| 3.4 | Add inline code comments for non-obvious logic | ☐ |
| 3.5 | Write unit/integration tests for new code | ☐ |
| 3.6 | Update dependency versions where safe | ☐ |
| 3.7 | Replace large binary assets with optimised versions | ☐ |

### Commit convention

```
[FORGE] add <new-module> with full test coverage
[FORGE] update CI pipeline to Node 20 LTS
[FORGE] rewrite README with current architecture overview
```

### Phase Gate Checklist

- [ ] All new code has accompanying tests
- [ ] Documentation reflects the current state of the codebase
- [ ] No TODO / FIXME markers left unaddressed
- [ ] Dependencies pinned to audited versions

---

## Phase 4 — VERIFY

**Goal:** Full validation gate — nothing ships until every check is green.

### Tasks

| # | Task | Tool | Done |
|---|------|------|------|
| 4.1 | Run full test suite | `npm test` / `pytest` / `go test ./...` | ☐ |
| 4.2 | Lint all changed files | ESLint / Prettier / Rubocop / golangci-lint | ☐ |
| 4.3 | Check all internal and external links | `lychee` / `markdown-link-check` | ☐ |
| 4.4 | Re-run dependency vulnerability audit | `npm audit --audit-level=moderate` | ☐ |
| 4.5 | Confirm repo size reduction (before vs after) | `git count-objects -vH` | ☐ |
| 4.6 | Peer review — at least one approval on the cleanup PR | GitHub PR review | ☐ |
| 4.7 | Record before/after metrics in `docs/verify-report-<YYYYMMDD>.md` | manual | ☐ |

### Before / After Metrics Template

```markdown
## Verify Report — <YYYYMMDD>

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Repo size (packed) | | | |
| Number of branches | | | |
| Open issues | | | |
| Dependency vulnerabilities | | | |
| Test pass rate | | | |
| Lint warnings | | | |
```

### Commit when done

```
[VERIFY] all checks green — <N> tests pass, 0 lint errors, 0 high-severity CVEs
```

### Phase Gate Checklist

- [ ] CI pipeline is fully green
- [ ] Zero high/critical CVEs in dependency audit
- [ ] Verify report committed
- [ ] At least one peer approval on the PR

---

## Phase 5 — DEPLOY

**Goal:** Land the cleanup, tag the release, close the loop with stakeholders.

### Tasks

| # | Task | Done |
|---|------|------|
| 5.1 | Squash/merge the cleanup PR to `main` | ☐ |
| 5.2 | Tag the release: `git tag cleanup/<version> && git push origin cleanup/<version>` | ☐ |
| 5.3 | Update `CHANGELOG.md` with the cleanup summary | ☐ |
| 5.4 | Notify stakeholders (team chat, issue comment, release note) | ☐ |
| 5.5 | Delete the working cleanup branch | ☐ |
| 5.6 | Schedule the next audit cycle (add to project board or calendar) | ☐ |

### Commit convention

```
[DEPLOY] merge cleanup/<version> — repo health restored
[DEPLOY] tag cleanup/<version> release
[DEPLOY] update CHANGELOG for cleanup/<version>
```

### Release Summary Template

```markdown
## Cleanup Release — <version> (<YYYYMMDD>)

### Summary
Brief description of the cleanup scope.

### Before / After
| Metric | Before | After |
|--------|--------|-------|
| Repo size | | |
| Branches | | |
| Open issues | | |
| Vulnerabilities | | |

### What Was Removed
- List of purged files, branches, modules

### What Was Added / Replaced
- List of new or updated content

### Known Limitations
- Any items deferred to a future cycle

### Next Audit Scheduled
Date: <YYYY-MM-DD>
```

### Phase Gate Checklist

- [ ] PR merged to `main` with a merge commit or squash
- [ ] Release tag pushed
- [ ] CHANGELOG updated
- [ ] Stakeholders notified
- [ ] Working branch deleted
- [ ] Next audit date recorded

---

## Automation Recommendations

| Recommendation | Implementation |
|----------------|----------------|
| **Scheduled branch audit** | GitHub Actions `schedule` trigger + `git branch` list filtered by last-commit date |
| **Stale branch cleanup bot** | [actions/stale](https://github.com/actions/stale) configured for branches |
| **PR template** | `.github/pull_request_template.md` with phase-gate checklist |
| **Pre-commit hooks** | [pre-commit](https://pre-commit.com/) with lint, secret-scan, and large-file guards |
| **Dependency auto-update** | Dependabot (`/.github/dependabot.yml`) on weekly cadence |
| **Link checker in CI** | Add `lychee` step to existing workflow on PRs touching `*.md` |
| **Repo size badge** | Add `git count-objects` output to README as a health indicator |

---

## Quick-Reference Card

```
BEFORE YOU START
  git tag cleanup/pre-<YYYYMMDD> HEAD && git push origin cleanup/pre-<YYYYMMDD>

PHASE 1 — RECON    → audit + report
PHASE 2 — PURGE    → delete + commit atomically
PHASE 3 — FORGE    → create/replace + test
PHASE 4 — VERIFY   → green CI + peer review
PHASE 5 — DEPLOY   → merge + tag + changelog + notify

IF THINGS GO WRONG
  git revert <sha>                         # undo one commit
  git reset --hard cleanup/pre-<YYYYMMDD>  # nuclear reset to safety tag
  git push --force-with-lease origin <branch>
```
