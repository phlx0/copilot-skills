import { program } from 'commander';
import { createRequire } from 'node:module';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { updateCommand } from './commands/update.js';
import { searchCommand } from './commands/search.js';
import { infoCommand } from './commands/info.js';
import { registriesCommand } from './commands/registries.js';
import { REGISTRIES } from './lib/registry.js';
import { DEFAULT_SKILLS_PATH, displayPath } from './lib/paths.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');
const registryNames = Object.keys(REGISTRIES).join(', ');

program
  .name('copilot-skills')
  .description(
    'Install and manage agent SKILL.md files.\n\n' +
      'Works with: GitHub Copilot, Claude Code, Gemini CLI, Cursor, Codex, and more.\n' +
      `Default install path: ${displayPath(DEFAULT_SKILLS_PATH)}`
  )
  .version(version);

program
  .command('add <source>')
  .description(
    'Install a skill.\n\n' +
      '  Formats:\n' +
      '    skill-name                  search default registry\n' +
      '    registry:skill-name         e.g. openai:gh-address-comments\n' +
      '    owner/repo                  entire repo is the skill\n' +
      '    owner/repo/path/to/skill    specific path in a GitHub repo\n' +
      '    https://github.com/...      any GitHub tree or blob URL\n' +
      '    ./local/path                local directory'
  )
  .option(
    '-p, --path <dir>',
    `skills directory (default: ${displayPath(DEFAULT_SKILLS_PATH)})`
  )
  .option('--name <name>', 'override the installed skill name')
  .action(addCommand);

program
  .command('list')
  .description('List all installed skills')
  .option(
    '-p, --path <dir>',
    `skills directory (default: ${displayPath(DEFAULT_SKILLS_PATH)})`
  )
  .action(listCommand);

program
  .command('remove <name>')
  .description('Remove an installed skill')
  .option(
    '-p, --path <dir>',
    `skills directory (default: ${displayPath(DEFAULT_SKILLS_PATH)})`
  )
  .action(removeCommand);

program
  .command('update [name]')
  .description('Update an installed skill to the latest version')
  .option(
    '-p, --path <dir>',
    `skills directory (default: ${displayPath(DEFAULT_SKILLS_PATH)})`
  )
  .option('--all', 'update all installed skills')
  .action(updateCommand);

program
  .command('search <query>')
  .description('Search for skills across registries')
  .option(
    '--registry <name>',
    `registry to search (${registryNames})`,
    'default'
  )
  .option('--all', 'search all registries at once')
  .option('--limit <n>', 'max results to show', '20')
  .action(searchCommand);

program
  .command('info <source>')
  .description(
    'Preview a skill before installing.\n\n' +
      '  Accepts the same source formats as add.'
  )
  .action(infoCommand);

program
  .command('registries')
  .description('List all available registries')
  .action(registriesCommand);

program.parse();
