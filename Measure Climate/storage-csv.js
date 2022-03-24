import xapi from 'xapi';

const macroName = require.main.name.replace(/^\.\//, '');
const storageMacro = `${macroName}-STORAGE-CSV`;

export async function load(delimiter = ';', rowDelimiter = '\n') {
  try { 
    const macros = await xapi.Command.Macros.Macro.Get({
      Name: storageMacro,
      Content: true,
    });
    const content = macros.Macro[0].Content.trim();
    return content.split(rowDelimiter).map(row => row.trim().split(delimiter));
  } catch (error) {
    if (error.message !== 'No such macro') {
      throw error;
    }
  }
}

export async function save(rows, delimiter = ';', rowDelimiter = '\n') {
  const csv = rows.map(r => r.join(delimiter)).join(rowDelimiter);
  await xapi.Command.Macros.Macro.Save({
    Name: storageMacro,
    Overwrite: true,
    Transpile: false, 
  }, csv);
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

