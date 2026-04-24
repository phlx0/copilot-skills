# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| latest (`main`) | Yes |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Use GitHub's private vulnerability reporting instead:
[Report a vulnerability](https://github.com/phlx0/copilot-skills/security/advisories/new)

You will receive a response within 72 hours. If the issue is confirmed, a patch will be released as soon as possible and you will be credited in the release notes (unless you prefer otherwise).

## Scope

Areas of particular concern:

- **Path traversal** via skill names or file paths during install
- **Malicious SKILL.md** content that could execute code through the AI agent
- **GitHub API token leakage** via logging or error messages
- **Registry URL injection** via crafted source strings

## Out of scope

- Skills from third-party registries that contain harmful instructions (this is a content moderation problem, not a code vulnerability)
- Rate limiting bypass via GITHUB_TOKEN (this is expected behavior)
