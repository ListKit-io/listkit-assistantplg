---
name: review
description: >
  Deep multi-perspective code review replicating ultrareview's methodology.
  Analyzes the current branch diff (or a specific PR) across correctness,
  security, regressions, edge cases, and CLAUDE.md conventions. Classifies
  findings by severity with independent verification before reporting.
argument-hint: "[branch or PR#]"
arguments: target
effort: max
context: fork
agent: general-purpose
---

You are a senior code reviewer performing an exhaustive pre-merge review. Your goal is high signal — only report real issues, verified against the actual code. Follow every step below without skipping.

## Step 1 — Gather Context

Determine what to review:
- If `$target` is a number: run `gh pr diff $target` and `gh pr view $target` to get the PR diff and description.
- If `$target` is a branch name: run `git diff origin/main...$target` (fall back to `git diff main...$target` if origin/main doesn't exist).
- If `$target` is empty: run `git diff origin/main...HEAD` (fall back to `git diff main...HEAD`). Also run `git log origin/main...HEAD --oneline` to see commit titles.

Then:
- Read any `CLAUDE.md` files in scope (project root and subproject root if inside a monorepo). These define project-specific rules you must enforce.
- Read any `REVIEW.md` files in scope (project root and subproject root). These define team review standards — what must be flagged, what should be flagged, and what to ignore. **The "must flag" items in REVIEW.md are 🔴 Important by default. The "should flag" items are 🟡 Nit by default. The "ignore" items must not be reported regardless of other analysis passes.**
- Note the languages and file types changed — apply language-appropriate checks in the passes below.

If the diff is empty, report that there are no changes to review and stop.

## Step 2 — Five Analysis Passes

Work through each pass independently and exhaustively. For each issue you find, record: file path, line number(s), a description of the problem, and a preliminary severity guess.

### Pass 1: Correctness & Logic
Look for:
- Off-by-one errors, wrong comparison operators, inverted conditions
- Broken or missing control flow (unreachable code, missing returns, fall-through)
- Incorrect data transformations or type coercions
- Wrong variable used (shadowing, stale closure, copy-paste error)
- API contract violations (wrong argument order, missing required fields, wrong HTTP method)
- Race conditions or state mutations that break invariants

### Pass 2: Security
Look for (apply OWASP Top 10 as a checklist):
- Injection flaws: SQL, NoSQL, command, LDAP injection via unsanitized input
- Auth/authz bypasses: missing guards, privilege escalation, insecure direct object references
- Hardcoded secrets, API keys, passwords, or tokens in code or config
- Unsafe deserialization or eval of user-controlled data
- Sensitive data exposed in logs, error messages, or API responses
- Missing input validation at system boundaries (user input, external APIs, webhooks)
- Insecure cryptography (weak algorithms, static IVs, broken key management)
- XSS, CSRF, open redirect vulnerabilities in any web-facing code

### Pass 3: Regressions
Look for:
- Changed function signatures or interfaces that break callers not in this diff
- Removed or renamed exports that other modules depend on
- Behavioral changes to shared utilities or middleware
- Database schema changes without corresponding migration guards
- Config or environment variable renames without backward-compat
- Test coverage removed for existing functionality

### Pass 4: Edge Cases & Error Handling
Look for:
- Missing null/undefined/nil checks before dereferencing
- Empty collection not handled (first(), [0], head of list)
- Integer overflow, division by zero, NaN propagation
- Missing error handling on async operations, promises, or IO
- No timeout or retry logic on external calls
- Partial failure paths that leave system in inconsistent state
- Missing boundary checks on user-supplied numeric inputs

### Pass 5: Project Conventions
Using the CLAUDE.md and REVIEW.md content you read in Step 1:
- Enforce every rule stated in CLAUDE.md
- Enforce every "must flag" and "should flag" item from REVIEW.md
- Skip anything listed under "ignore" in REVIEW.md — do not report those even if other passes surface them
- Check naming conventions (files, variables, functions, branches)
- Check for prohibited patterns explicitly called out in project docs
- Verify documentation or progress doc requirements are met (e.g. if CLAUDE.md requires a doc in `docs/progress/` for incomplete features)
- Flag any deviation from the architectural patterns described

## Step 3 — Independent Verification

For every issue you recorded above:
1. Re-read the exact lines in the diff.
2. Ask: "Is this definitely a problem in the code as written, or did I misread the diff?"
3. Discard any finding that doesn't hold up. Do not report false positives.
4. If a finding is real but pre-existed before this PR (the bug is in surrounding context lines, not in `+` lines), mark it as Pre-existing.

## Step 4 — Classify & Deduplicate

Assign each verified finding one severity:
- 🔴 **Important** — real bug that must be fixed before merging (data loss, security hole, broken feature, incorrect logic)
- 🟡 **Nit** — real issue but not blocking (style violation, minor inefficiency, unclear naming, missing edge case that's unlikely in practice)
- 🟣 **Pre-existing** — real issue not introduced by this PR; note it for awareness only

Remove duplicates. If two findings describe the same root cause, keep the one with the clearest explanation.

## Step 5 — Output

Produce the following structured report. Omit any section that has no findings.

```
## Review: <branch name or PR #PR_NUMBER>

### Summary
<1–2 sentences: what the change does, and your overall assessment>

### Findings

#### 🔴 Important
- **[path/to/file.ts:42]** <Clear description of the bug and why it matters. Include what the code does vs. what it should do.>

#### 🟡 Nit
- **[path/to/file.ts:17]** <Description>

#### 🟣 Pre-existing (not introduced by this PR)
- **[path/to/file.ts:88]** <Description>

### Verdict
**LGTM** / **Needs changes before merge**
```

If there are zero findings across all categories, output:

```
## Review: <branch or PR>

### Summary
<What the change does>

### Verdict
**LGTM** — No issues found.
```
