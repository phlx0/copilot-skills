import { homedir } from 'node:os';
import { join } from 'node:path';
import { getContents } from './github.js';

export const REGISTRIES = {
  default: {
    label: 'Antigravity Awesome Skills',
    owner: 'sickn33',
    repo: 'antigravity-awesome-skills',
    skillsPath: 'skills',
    indexUrl:
      'https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills_index.json'
  },
  openai: {
    label: 'OpenAI Codex Skills',
    owner: 'openai',
    repo: 'skills',
    skillsPath: 'skills',
    searchSubPaths: ['.curated', '.system', '.experimental'],
    indexUrl: null
  },
  google: {
    label: 'Google Stitch Skills',
    owner: 'google-labs-code',
    repo: 'stitch-skills',
    skillsPath: 'skills',
    indexUrl: null
  },
  anthropic: {
    label: 'Anthropic Official Skills',
    owner: 'anthropics',
    repo: 'skills',
    skillsPath: '',
    indexUrl: null
  }
};

export function parseSource(source) {
  const s = source.trim();

  if (s.startsWith('./') || s.startsWith('../') || s.startsWith('/')) {
    return { type: 'local', path: s };
  }
  if (s.startsWith('~/')) {
    return { type: 'local', path: join(homedir(), s.slice(2)) };
  }

  const ghPathMatch = s.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(tree|blob)\/([^/]+)\/(.+?)(?:\/SKILL\.md)?$/
  );
  if (ghPathMatch) {
    return {
      type: 'github',
      owner: ghPathMatch[1],
      repo: ghPathMatch[2],
      ref: ghPathMatch[4],
      path: ghPathMatch[5]
    };
  }

  const ghRepoMatch = s.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (ghRepoMatch) {
    return {
      type: 'github',
      owner: ghRepoMatch[1],
      repo: ghRepoMatch[2],
      ref: 'main',
      path: ''
    };
  }

  const regMatch = s.match(/^([a-z][a-z0-9]*):([\w/.-]+)$/);
  if (regMatch && REGISTRIES[regMatch[1]]) {
    return {
      type: 'registry-search',
      name: regMatch[2],
      registryKey: regMatch[1]
    };
  }

  const ownerRepoPath = s.match(/^([\w.-]+)\/([\w.-]+)\/(.+)$/);
  if (ownerRepoPath) {
    return {
      type: 'github',
      owner: ownerRepoPath[1],
      repo: ownerRepoPath[2],
      ref: 'main',
      path: ownerRepoPath[3]
    };
  }

  const ownerRepo = s.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (ownerRepo) {
    return {
      type: 'github',
      owner: ownerRepo[1],
      repo: ownerRepo[2],
      ref: 'main',
      path: ''
    };
  }

  return { type: 'registry-search', name: s, registryKey: 'default' };
}

export async function resolveRegistrySkill(skillName, registryKey = 'default') {
  const reg = REGISTRIES[registryKey] || REGISTRIES.default;

  const candidatePaths = [];
  if (reg.skillsPath) {
    candidatePaths.push(`${reg.skillsPath}/${skillName}`);
    for (const sub of reg.searchSubPaths || []) {
      candidatePaths.push(`${reg.skillsPath}/${sub}/${skillName}`);
    }
  } else {
    candidatePaths.push(skillName);
  }

  const results = await Promise.all(
    candidatePaths.map(async (skillPath) => {
      const contents = await getContents(reg.owner, reg.repo, skillPath);
      if (!Array.isArray(contents)) return null;
      if (!contents.find((e) => e.name === 'SKILL.md' && e.type === 'file'))
        return null;
      return {
        type: 'github',
        owner: reg.owner,
        repo: reg.repo,
        ref: 'main',
        path: skillPath,
        skillName
      };
    })
  );

  return results.find(Boolean) ?? null;
}
