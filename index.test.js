const { describe, it, afterEach } = require('node:test');
const assert = require('assert');
const path = require('path');
const proxyquire = require('proxyquire');

const vscode = { '@noCallThru': true };
const { replaceVariables } = proxyquire('./index.js', { vscode });

const tt = [
  ['hello', 'hello'],
  ['${workspaceFolder}', path.join(__dirname, 'foo')],
  ['${workspaceFolder:foo}', path.join(__dirname, 'foo')],
  ['${workspaceFolder:bar}', path.join(__dirname, 'bar')],
  ['${workspaceFolder:baz}', ''],

  ['${workspaceFolderBasename:foo}', 'foo'],
  ['${workspaceFolderBasename:bar}', 'bar'],
  ['${workspaceFolderBasename:baz}', ''],

  ['${fileWorkspaceFolder}', path.join(__dirname, 'bar')],
  ['${relativeFile}', 'hello.txt'],
  ['${relativeFileDirname}', '.'],
  ['${fileBasename}', 'hello.txt'],
  ['${fileBasenameNoExtension}', 'hello'],
  ['${fileExtname}', '.txt'],
  ['${fileDirname}', path.join(__dirname, 'bar')],
  ['${pathSeparator}', path.sep],
  ['${lineNumber}', '3'],
  ['${selectedText}', 'hello world'],

  ['${env:PATH}', process.env.PATH],
  ['${config:someConfig}', 'SOMECONFIG'],
];

afterEach(() => {
  for (const key of Object.keys(vscode)) {
    delete vscode[key];
  }
});

const fsPathToUri = (fsPath) => ({ fsPath, path: fsPath.replace(/\\/g, '/') });

for (const [input, expected] of tt) {
  it(`test ${input}`, () => {
    Object.assign(vscode, {
      Range: class{},
      window: {
        activeTextEditor: {
          document: {
            uri: fsPathToUri(path.join(__dirname, 'bar', 'hello.txt')),
            getText: () => 'hello world',
          },
          selection: { start: { line: 1, column: 3 }, end: { line: 2, column: 5 }, active: { line: 2, column: 5 } },
        },
      },
      workspace: {
        getConfiguration: () => ({ get: (key) => key.toUpperCase() }),
        getWorkspaceFolder(uri) {
          for (const folder of this.workspaceFolders) {
            if (uri.fsPath.startsWith(folder.uri.fsPath)) {
              return folder;
            }
          }
        },
        workspaceFolders: [
          { name: 'foo', uri: fsPathToUri(path.join(__dirname, 'foo')) },
          { name: 'bar', uri: fsPathToUri(path.join(__dirname, 'bar')) },
        ],
      },
    });

    assert.strictEqual(replaceVariables(input), expected);
  });
}
