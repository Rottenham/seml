"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const parser_1 = require("./parser");
const { execFile } = require('child_process');
function runBinary(filename, args) {
    const binaryPath = path.join(__dirname, 'bin', filename);
    execFile(binaryPath, args, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`出错: ${error.message}`);
            return;
        }
        if (stderr) {
            vscode.window.showErrorMessage(`出错: ${stderr}`);
            return;
        }
        vscode.window.showInformationMessage(`${stdout}`);
    });
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('seml.toJSON', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        const out = (0, parser_1.parseSmash)(editor.document.getText());
        if ((0, parser_1.isError)(out)) {
            const { lineNum, msg, src } = out;
            vscode.window.showErrorMessage(`[第${lineNum}行] ${msg}: ${src}`);
            return;
        }
        const jsonOutput = JSON.stringify(out, null, 4);
        const folderPath = editor.document.uri.fsPath;
        const fileNameWithoutExt = path.basename(folderPath, path.extname(folderPath));
        const dirName = path.dirname(folderPath);
        const jsonFilePath = path.join(dirName, fileNameWithoutExt + '.json');
        fs.writeFile(jsonFilePath, jsonOutput, 'utf8', function (err) {
            if (err) {
                vscode.window.showErrorMessage("JSON 保存失败");
                console.error(err);
                return;
            }
            vscode.window.showInformationMessage(`JSON 已保存至 ${jsonFilePath}`);
            vscode.workspace.openTextDocument(jsonFilePath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
            runBinary('hello.exe', ["-a", "hi"]);
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map