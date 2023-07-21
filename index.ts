import * as vscode from 'vscode';
import * as process from 'process';
import * as path from 'path';
import { homedir } from 'os';

export function replaceVariables(string: string, recursive = false) {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    string = string.replace(/\${workspaceFolder(:.+)?}/g, (_, m) => {
        const folder = m ? workspaceFolders?.find(w => w.name === m.slice(1)) : workspaceFolders?.[0];
        return folder?.uri.fsPath || '';
    });
    string = string.replace(/\${workspaceFolderBasename(:.+)?}/g, (_, m) => {
        const folder = m ? workspaceFolders?.find(w => w.name === m.slice(1)) : workspaceFolders?.[0];
        return folder?.uri.path.split('/').pop() || '';
    });
    const activeFileUri = vscode.window.activeTextEditor?.document.uri;
    string = string.replace(/\${file}/g, activeFileUri?.fsPath || '');

    const parsedPath = activeFileUri && path.parse(activeFileUri.fsPath);
    const fileWorkspaceFolder = activeFileUri && vscode.workspace.getWorkspaceFolder(activeFileUri);
    const relativeFile = fileWorkspaceFolder ? path.relative(fileWorkspaceFolder.uri.fsPath, activeFileUri.fsPath) : '';
    string = string.replace(/\${fileWorkspaceFolder}/g, () => fileWorkspaceFolder?.uri.fsPath || '');
    string = string.replace(/\${relativeFile}/g, relativeFile);
    string = string.replace(/\${relativeFileDirname}/g, path.dirname(relativeFile));
    string = string.replace(/\${fileBasename}/g, parsedPath?.base || '');
    string = string.replace(/\${fileBasenameNoExtension}/g, parsedPath?.name || '');
    string = string.replace(/\${fileExtname}/g, parsedPath?.ext || '');
    string = string.replace(/\${fileDirname}/g, parsedPath?.dir || '');
    string = string.replace(/\${cwd}/g, homedir());
    string = string.replace(/\${pathSeparator}/g, path.sep);
    string = string.replace(/\${lineNumber}/g, String((vscode.window.activeTextEditor?.selection.active.line || 0) + 1));
    string = string.replace(/\${selectedText}/g, () => {
        if (!vscode.window.activeTextEditor) {
            return '';
        }
        return vscode.window.activeTextEditor.document.getText(new vscode.Range(vscode.window.activeTextEditor.selection.start, vscode.window.activeTextEditor.selection.end))
    });

    string = string.replace(/\${env:(.*?)}/g, (_, v) => {
        return process.env[v] || '';
    });
    string = string.replace(/\${config:(.*?)}/g, (_, v) => {
        return vscode.workspace.getConfiguration().get(v, '');
    });

    if (recursive && string.match(/\${(workspaceFolder|workspaceFolderBasename|fileWorkspaceFolder|relativeFile|fileBasename|fileBasenameNoExtension|fileExtname|fileDirname|cwd|pathSeparator|lineNumber|selectedText|env:(.*?)|config:(.*?))}/)) {
        string = replaceVariables(string, recursive);
    }
    return string;
}
