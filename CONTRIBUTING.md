# Contributing

Thanks for your interest in contributing to `copilot-skills`!

## Development setup

```sh
git clone https://github.com/phlx0/copilot-skills.git
cd copilot-skills
npm install
node bin/copilot-skills.js --help
```

## Branch naming

All branches should be cut from `main` and follow this pattern:

| Type | Pattern | Example |
| --- | --- | --- |
| Feature | `feat/<short-description>` | `feat/add-azure-registry` |
| Bug fix | `fix/<short-description>` | `fix/openai-subdir-resolution` |
| Docs | `docs/<short-description>` | `docs/update-readme` |
| Chore / CI | `chore/<short-description>` | `chore/update-deps` |
| Refactor | `refactor/<short-description>` | `refactor/extract-fetch-helper` |

Keep branch names lowercase and hyphenated. Delete the branch after the PR is merged.

## Commit messages — Conventional Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```text
<type>[optional scope]: <short description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
| --- | --- |
| `feat` | A new user-facing feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `refactor` | Code change that is not a fix or feature |
| `chore` | Maintenance (deps, CI, tooling) |
| `perf` | Performance improvement |
| `ci` | Changes to CI/CD workflows |

### Rules

- Use the **imperative mood**: `add support for X`, not `added support for X`
- Keep the subject line ≤ 72 characters
- Reference issues in the footer: `Closes #12` or `Fixes #34`
- A `feat` or `fix` commit triggers a version bump — make sure `CHANGELOG.md` is updated in the same commit

### Examples

```text
feat(registry): add azure registry

Adds 'azure' as a named registry sourced from microsoft/azure-copilot-skills.

Closes #42
```

```text
fix(search): resolve skills in hidden openai subdirectories

resolveRegistrySkill now probes .curated, .system, and .experimental
in parallel so 'add openai:<skill>' works for all skill variants.

Fixes #17
```

```text
chore: update commander to v13
```

## Running tests

```sh
npm test
```

All PRs must pass `npm test` before merging. Add or update tests when changing behaviour.

## Code style

- ESM only (`"type": "module"`)
- No build step — changes should run directly with `node`
- Keep production dependencies minimal; prefer Node built-ins

## Adding a registry

Edit `src/lib/registry.js` and add an entry to the `REGISTRIES` object:

```js
myregistry: {
  label: 'My Registry Label',
  owner: 'github-owner',
  repo: 'repo-name',
  skillsPath: 'skills',        // directory inside the repo containing skills
  indexUrl: null               // optional: URL to a JSON index for fast search
}
```

If the registry uses hidden subdirectories (like OpenAI's), add a `searchSubPaths` array:

```js
searchSubPaths: ['.curated', '.system']
```

Open a PR with the change and a brief note about the registry source.

## Submitting a PR

1. Fork the repo and cut a branch following the naming convention above
2. Make your changes with conventional commits
3. Update `CHANGELOG.md` under `## [Unreleased]` for any user-facing change
4. Run `npm test` — all tests must pass
5. Open a pull request; the template will guide you through the checklist
