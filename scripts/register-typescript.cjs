const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, ...args) {
  const filename = request.startsWith('@/')
    ? path.join(projectRoot, 'src', request.slice(2))
    : request;
  return resolveFilename.call(this, filename, parent, ...args);
};

function compileTypeScript(module, filename) {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  });
  module._compile(compiled.outputText, filename);
}

require.extensions['.ts'] = compileTypeScript;
require.extensions['.tsx'] = compileTypeScript;
