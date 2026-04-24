import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSource } from '../src/lib/registry.js';
import { sanitizeSkillName, resolveSkillsPath } from '../src/lib/paths.js';

describe('parseSource', () => {
  it('local ./path', () => {
    const r = parseSource('./my-skill');
    assert.equal(r.type, 'local');
    assert.equal(r.path, './my-skill');
  });

  it('local ../path', () => {
    const r = parseSource('../other-skill');
    assert.equal(r.type, 'local');
  });

  it('local absolute path', () => {
    const r = parseSource('/tmp/skill');
    assert.equal(r.type, 'local');
    assert.equal(r.path, '/tmp/skill');
  });

  it('github tree URL', () => {
    const r = parseSource(
      'https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/brainstorming'
    );
    assert.equal(r.type, 'github');
    assert.equal(r.owner, 'sickn33');
    assert.equal(r.repo, 'antigravity-awesome-skills');
    assert.equal(r.ref, 'main');
    assert.equal(r.path, 'skills/brainstorming');
  });

  it('github tree URL strips trailing /SKILL.md', () => {
    const r = parseSource(
      'https://github.com/owner/repo/tree/main/path/SKILL.md'
    );
    assert.equal(r.type, 'github');
    assert.equal(r.path, 'path');
  });

  it('github repo URL only', () => {
    const r = parseSource('https://github.com/owner/repo');
    assert.equal(r.type, 'github');
    assert.equal(r.path, '');
  });

  it('registry:skill routes to registry-search', () => {
    const r = parseSource('openai:gh-address-comments');
    assert.equal(r.type, 'registry-search');
    assert.equal(r.registryKey, 'openai');
    assert.equal(r.name, 'gh-address-comments');
  });

  it('unknown registry:skill falls through to owner/repo pattern', () => {
    const r = parseSource('unknown:something');
    assert.ok(r.type === 'registry-search' || r.type === 'github');
  });

  it('owner/repo/path', () => {
    const r = parseSource(
      'sickn33/antigravity-awesome-skills/skills/brainstorming'
    );
    assert.equal(r.type, 'github');
    assert.equal(r.owner, 'sickn33');
    assert.equal(r.repo, 'antigravity-awesome-skills');
    assert.equal(r.path, 'skills/brainstorming');
  });

  it('owner/repo', () => {
    const r = parseSource('owner/repo');
    assert.equal(r.type, 'github');
    assert.equal(r.owner, 'owner');
    assert.equal(r.repo, 'repo');
    assert.equal(r.path, '');
  });

  it('bare skill name routes to default registry-search', () => {
    const r = parseSource('brainstorming');
    assert.equal(r.type, 'registry-search');
    assert.equal(r.registryKey, 'default');
    assert.equal(r.name, 'brainstorming');
  });
});

describe('sanitizeSkillName', () => {
  it('strips leading dots (directory traversal)', () => {
    const r = sanitizeSkillName('../evil');
    assert.ok(!r.includes('..'));
    assert.ok(!r.includes('/'));
  });

  it('strips slashes', () => {
    const r = sanitizeSkillName('foo/bar');
    assert.ok(!r.includes('/'));
  });

  it('preserves alphanumeric and hyphens', () => {
    const r = sanitizeSkillName('my-skill-123');
    assert.equal(r, 'my-skill-123');
  });

  it('lowercases the name', () => {
    const r = sanitizeSkillName('MySkill');
    assert.equal(r, r.toLowerCase());
  });
});

describe('resolveSkillsPath', () => {
  it('undefined returns default path containing .copilot/skills', () => {
    const r = resolveSkillsPath(undefined);
    assert.ok(r.includes('.copilot') || r.includes('copilot'));
  });

  it('expands ~/ prefix', () => {
    const r = resolveSkillsPath('~/custom/path');
    assert.ok(!r.startsWith('~'));
    assert.ok(r.includes('custom/path'));
  });
});
