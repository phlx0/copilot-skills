# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-04-24

### Added

- `add <source>` — install skills from the default registry, named registries (`openai:`, `google:`, `anthropic:`), GitHub URLs, `owner/repo/path` shorthand, or local paths
- `list` — show installed skills with descriptions and source attribution
- `remove <name>` — uninstall a skill
- `update [name]` / `update --all` — re-fetch skills from their original sources
- `search <query>` — search the default registry index by keyword; `--registry <key>` to target a specific registry; `--all` to search every registry at once
- `info <source>` — preview a skill's description and file list before installing
- `registries` — list all available registry keys and their GitHub sources
- Default registry: [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) with JSON index for fast search
- Named registries: `openai`, `google`, `anthropic`
- `openai` registry resolves skills across hidden subdirectories (`.curated`, `.system`, `.experimental`)
- Skill manifest at `~/.copilot/skills/.manifest.json` tracking source, install time, and file list
- `GITHUB_TOKEN` support to increase GitHub API rate limit from 60 to 5000 req/h
- Path sanitization to prevent directory traversal via skill names or file paths
- 17 unit tests (Node built-in test runner, no extra dependencies)
- Atomic installs — partial writes are cleaned up on error
- `update` validates upstream `SKILL.md` before overwriting (prevents data loss on broken upstream)
