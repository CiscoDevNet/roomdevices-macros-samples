/**
 * Script to create manifest for an extension, based on the files in the extension folder.
 * The manifest.json file will be put inside the extension folder, replacing any existing
 * manifest file there.
 * 
 * It's used by eg roomos.cisco.com to install extensions easily.
 * 
 * Usage:
 * node make_manifest <extension_folder>
 * 
 */
const { readFileSync, readdirSync, fstat, writeFileSync } = require('fs');
const { join, basename } = require('path');

const template = require('./manifest-template.json');

function endsWith(ext, file) {
  if (Array.isArray(ext)) {
    return ext.some(e => file.toLowerCase().endsWith(e.toLowerCase()));
  }
  return file.toLowerCase().endsWith(ext.toLowerCase());
}


function findFiles(dir, extension) {
  return readdirSync(dir, { withFileTypes: true })
    .filter(item => item.isFile() && endsWith(extension, item.name))
    .map(item => item.name);
}


function go(dir) {
  // console.log('make manifest', dir);
  const macros = findFiles(dir, '.js');
  const macroList = macros.map(file => {
    const id = basename(file, '.js');
    return {
      payload: file,
      id,
      type: 'url'
    }
  });

  const roomcontrol = findFiles(dir, '.xml');
  const roomcontrolList = roomcontrol.map(file => {
    const id = basename(file, '.xml');
    return {
      payload: file,
      id,
      type: 'url'
    }
  });

  template.profile.macro.items = macroList;
  template.profile.roomcontrol.items = roomcontrolList;
  template.profile.userParams = [];

  const file = join(dir, 'manifest.json');
  writeFileSync(file, JSON.stringify(template, null, 2));
  console.log('wrote', file);
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
   console.log(`\nUsage: node ${process.argv[1]} <extension_dir>\n`);
   process.exit(1);
  }

  go(dir);
}

main();