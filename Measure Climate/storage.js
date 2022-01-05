/**
 * Macro module helper to save persistent data to device
 * 
 * Usage:
 * const storage = require('./storage');
 *
 * await storage.save({ authors: ['Martin Myrseth', 'Tore Bjolseth'] });
 * // ...
 * const saved = await storage.load();
 * console.log('Authors:', saved.authors);
 * // ...
 * await storage.clear();
 */
import xapi from 'xapi';

const macroName = require.main.name.replace(/^\.\//, '');
const storageMacro = `${macroName}-STORAGE`;

export async function load() {
  try { 
    const macros = await xapi.Command.Macros.Macro.Get({
      Name: storageMacro,
      Content: true,
    });
    const content = macros.Macro[0].Content;
    return JSON.parse(content.trim().split('\n').slice(1, -1).join('\n'));
  } catch (error) {
    if (error.message !== 'No such macro') {
      throw error;
    }
  }
}

export async function save(storage) {
  await xapi.Command.Macros.Macro.Save({
    Name: storageMacro,
    Overwrite: true,
    Transpile: false, 
  }, `/* Storage for "${macroName}" | DO NOT DELETE OR RENAME | Last updated: ${new Date()}
${JSON.stringify(storage, null, 2)}
*/`);
}

export async function clear() {
  try {
    await xapi.Command.Macros.Macro.Remove({ Name: storageMacro });
  } catch (error) {
    if (!error.message.startsWith('No such macro')) {
      throw error;
    }
  }
}
