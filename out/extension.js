"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const error_1 = require("./error");
const parser_1 = require("./parser");
const child_process_1 = require("child_process");
function runBinary(filename, args, jsonFilePath) {
    const binaryPath = path.join(__dirname, "bin", filename);
    (0, child_process_1.execFile)(binaryPath, args, (err, stdout, stderr) => {
        if (err) {
            vscode.window.showErrorMessage(`出错: ${err}`);
            return;
        }
        if (stderr) {
            vscode.window.showErrorMessage(`出错: ${stderr}`);
            return;
        }
        fs.unlink(jsonFilePath, (err) => {
            if (err) {
                vscode.window.showErrorMessage(`删除 JSON 临时文件时出错: ${err}`);
                return;
            }
        });
        vscode.window.showInformationMessage(`${stdout}`);
    });
}
function compileToJson(doc) {
    const parsedOutput = (0, parser_1.parse)(doc.getText());
    if ((0, error_1.isError)(parsedOutput)) {
        const { lineNum, msg, src } = parsedOutput;
        vscode.window.showErrorMessage(`[第${lineNum}行] ${msg}: ${src}`);
        return;
    }
    const { out, args } = parsedOutput;
    const semlFilePath = doc.uri.fsPath;
    if (path.extname(semlFilePath) !== ".seml") {
        vscode.window.showErrorMessage("请打开 .seml 文件");
        return;
    }
    const dirName = path.dirname(semlFilePath);
    const baseName = path.basename(semlFilePath, ".seml");
    return {
        dirName,
        baseName,
        jsonFilePath: path.join(dirName, `${baseName}.json`),
        jsonOutput: JSON.stringify(out, null, 4),
        args
    };
}
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('seml.compileToJson', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        const compiledJson = compileToJson(editor.document);
        if (compiledJson === undefined) {
            return;
        }
        const { jsonFilePath, jsonOutput } = compiledJson;
        fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
            if (err) {
                vscode.window.showErrorMessage(`JSON 保存失败: ${err.message}`);
                return;
            }
            vscode.workspace.openTextDocument(jsonFilePath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('seml.testSmash', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        const compiledJson = compileToJson(editor.document);
        if (compiledJson === undefined) {
            return;
        }
        const { dirName, baseName, jsonFilePath, jsonOutput, args } = compiledJson;
        const destDirName = path.join(dirName, "dest");
        if (!fs.existsSync(destDirName)) {
            fs.mkdirSync(destDirName);
        }
        fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
            if (err) {
                vscode.window.showErrorMessage(`JSON 保存失败: ${err}`);
                return;
            }
            runBinary('smash_test.exe', [...Object.values(args).flatMap(x => x),
                "-f", jsonFilePath,
                "-o", path.join(destDirName, baseName + "_smash")], jsonFilePath);
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('seml.testExplode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        const compiledJson = compileToJson(editor.document);
        if (compiledJson === undefined) {
            return;
        }
        const { dirName, baseName, jsonFilePath, jsonOutput, args } = compiledJson;
        const destDirName = path.join(dirName, "dest");
        if (!fs.existsSync(destDirName)) {
            fs.mkdirSync(destDirName);
        }
        fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
            if (err) {
                vscode.window.showErrorMessage(`JSON 保存失败: ${err}`);
                return;
            }
            runBinary('explode_test.exe', [...Object.values(args).flatMap(x => x),
                "-f", jsonFilePath,
                "-o", path.join(destDirName, baseName + "_explode")], jsonFilePath);
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('seml.testPogo', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        const compiledJson = compileToJson(editor.document);
        if (compiledJson === undefined) {
            return;
        }
        const { dirName, baseName, jsonFilePath, jsonOutput, args } = compiledJson;
        const destDirName = path.join(dirName, "dest");
        if (!fs.existsSync(destDirName)) {
            fs.mkdirSync(destDirName);
        }
        fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
            if (err) {
                vscode.window.showErrorMessage(`JSON 保存失败: ${err}`);
                return;
            }
            runBinary('pogo_test.exe', [...Object.values(args).flatMap(x => x),
                "-f", jsonFilePath,
                "-o", path.join(destDirName, baseName + "_pogo")], jsonFilePath);
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('seml.testRefresh', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        const compiledJson = compileToJson(editor.document);
        if (compiledJson === undefined) {
            return;
        }
        const { dirName, baseName, jsonFilePath, jsonOutput, args } = compiledJson;
        const destDirName = path.join(dirName, "dest");
        if (!fs.existsSync(destDirName)) {
            fs.mkdirSync(destDirName);
        }
        fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
            if (err) {
                vscode.window.showErrorMessage(`JSON 保存失败: ${err}`);
                return;
            }
            runBinary('refresh_test.exe', [...Object.values(args).flatMap(x => x),
                "-f", jsonFilePath,
                "-o", path.join(destDirName, baseName + "_refresh")], jsonFilePath);
        });
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map