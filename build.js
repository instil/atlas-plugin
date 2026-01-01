// Build script to bundle the plugin
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Building plugin...');

// First compile TypeScript
console.log('1/3 Compiling TypeScript...');
try {
  execSync('tsc', { stdio: 'inherit' });
} catch (error) {
  console.error('TypeScript compilation failed');
  process.exit(1);
}

// Read all compiled JS files
console.log('2/3 Bundling modules...');
const types = fs.readFileSync(path.join(distDir, 'types.js'), 'utf8');
const normalizeNode = fs.readFileSync(path.join(distDir, 'normalizeNode.js'), 'utf8');
const promptCompiler = fs.readFileSync(path.join(distDir, 'promptCompiler.js'), 'utf8');
const main = fs.readFileSync(path.join(distDir, 'main.js'), 'utf8');

// Remove import/export statements and bundle into one file
const stripImportsExports = (code) => {
  return code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^import\s+type\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export\s+/gm, '')
    .replace(/export\s*{\s*.*?\s*};?\s*$/gm, '');
};

const bundled = `
// Bundled Figma Plugin Code
"use strict";

${stripImportsExports(types)}

${stripImportsExports(normalizeNode)}

${stripImportsExports(promptCompiler)}

${stripImportsExports(main)}
`;

// Write bundled file
console.log('3/3 Writing bundle...');
fs.writeFileSync(path.join(distDir, 'code.js'), bundled);

console.log('✓ Build complete! Output: dist/code.js');

