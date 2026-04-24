import chalk from 'chalk';
import ora from 'ora';
import { parseSource, resolveRegistrySkill } from '../lib/registry.js';
import { getRawFile, getContents } from '../lib/github.js';
import { parseSkillFrontmatter } from '../lib/skills.js';
import { fetchLocalSkill } from '../lib/fetch-skill.js';

export async function infoCommand(source, options) {
  const spinner = ora(`Looking up ${chalk.cyan(source)}…`).start();

  try {
    const parsed = parseSource(source);

    if (parsed.type === 'local') {
      spinner.text = 'Reading local skill…';
      const { skillName, files } = await fetchLocalSkill(parsed.path);
      const skillMd = files.find((f) => f.path === 'SKILL.md');
      spinner.stop();
      displayInfo({
        name: skillName,
        content: skillMd?.content ?? null,
        files: files.map((f) => f.path),
        source: parsed.path,
        installHint: `copilot-skills add ${source}`
      });
      return;
    }

    let owner, repo, ref, skillPath, skillName;

    if (parsed.type === 'github') {
      ({ owner, repo, ref = 'main', path: skillPath } = parsed);
      skillName = skillPath ? skillPath.split('/').pop() : repo;
    } else if (parsed.type === 'registry-search') {
      spinner.text = `Searching registry for "${parsed.name}"…`;
      const found = await resolveRegistrySkill(parsed.name, parsed.registryKey);
      if (!found) {
        spinner.fail(`Skill "${parsed.name}" not found`);
        console.log(chalk.dim(`  Tip: copilot-skills search ${parsed.name}`));
        process.exit(1);
      }
      ({ owner, repo, ref = 'main', path: skillPath } = found);
      skillName = found.skillName;
    }

    spinner.text = 'Fetching SKILL.md…';
    const skillMdPath = skillPath ? `${skillPath}/SKILL.md` : 'SKILL.md';
    const content = await getRawFile(owner, repo, skillMdPath, ref);

    if (!content) {
      spinner.fail(
        `SKILL.md not found at github.com/${owner}/${repo}/${skillMdPath}`
      );
      process.exit(1);
    }

    spinner.text = 'Listing files…';
    const dirContents = await getContents(owner, repo, skillPath || '', ref);
    const fileList = Array.isArray(dirContents)
      ? dirContents.filter((e) => e.type === 'file').map((e) => e.name)
      : ['SKILL.md'];

    spinner.stop();
    displayInfo({
      name: skillName,
      content,
      files: fileList,
      source: `github.com/${owner}/${repo}${skillPath ? `/${skillPath}` : ''}`,
      installHint: `copilot-skills add ${source}`
    });
  } catch (err) {
    spinner.fail(err.message);
    process.exit(1);
  }
}

function displayInfo({ name, content, files, source, installHint }) {
  const fm = content ? parseSkillFrontmatter(content) : {};
  const description = fm.description || '';

  let body = '';
  if (content) {
    const stripped = content
      .replace(/^---[\s\S]*?---\s*/m, '')
      .replace(/^#+[^\n]*\n?/m, '')
      .trim();
    const firstPara = stripped.split(/\n\n/)[0]?.trim() || '';
    const flat = firstPara.replace(/\n/g, ' ');
    if (
      flat &&
      flat !== description &&
      flat.length < 400 &&
      !flat.startsWith('#')
    ) {
      body = flat;
    }
  }

  console.log('');
  console.log(chalk.bold.cyan(`  ${name}`));

  if (description) {
    console.log('');
    console.log(`  ${description}`);
  }

  if (body) {
    console.log('');
    for (const line of wordWrap(body, 72)) {
      console.log(chalk.dim(`  ${line}`));
    }
  }

  console.log('');
  console.log(`  ${chalk.dim('Source')}   ${source}`);

  if (files.length > 0) {
    console.log(
      `  ${chalk.dim('Files')}    ${files.slice(0, 8).join(', ')}${files.length > 8 ? ` +${files.length - 8} more` : ''}`
    );
  }

  console.log('');
  console.log(chalk.dim(`  Install:  ${installHint}`));
  console.log('');
}

function wordWrap(text, width) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
