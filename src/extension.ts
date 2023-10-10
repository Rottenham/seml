import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { parseSmash, isError } from './parser';
const { execFile } = require('child_process');

function runBinary(filename: string, args: string[], jsonFilePath: string) {
	const binaryPath = path.join(__dirname, "bin", filename);

	execFile(binaryPath, args, (error: Error, stdout: string, stderr: string) => {
		if (error) {
			vscode.window.showErrorMessage(`出错: ${error.message}`);
			return;
		}
		if (stderr) {
			vscode.window.showErrorMessage(`出错: ${stderr}`);
			return;
		}

		fs.unlink(jsonFilePath, (err) => {
			if (err) {
				vscode.window.showErrorMessage(`删除 JSON 临时文件时出错: ${err.message}`);
				return;
			}
		});
		
		vscode.window.showInformationMessage(`${stdout}`);
	});

}

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('seml.testSmash', () => {

		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}

		const parsedOutput = parseSmash(editor.document.getText());
		if (isError(parsedOutput)) {
			const { lineNum, msg, src } = parsedOutput;
			vscode.window.showErrorMessage(`[第${lineNum}行] ${msg}: ${src}`);
			return;
		}
		const { out, args } = parsedOutput;
		const jsonOutput = JSON.stringify(out, null, 4);

		const semlFilePath = editor.document.uri.fsPath;
		if (path.extname(semlFilePath) !== ".seml") {
			vscode.window.showErrorMessage("请打开 .seml 文件");
			return;
		}
		const dirName = path.dirname(semlFilePath);
		const destDirName = path.join(dirName, "dest");
		const baseName = path.basename(semlFilePath, ".seml");

		const jsonFilePath = path.join(dirName, `${baseName}.json`);
		if (!fs.existsSync(destDirName)) {
			fs.mkdirSync(destDirName);
		}
		const outputFilePath = path.join(destDirName, baseName + "_smash");

		fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
			if (err) {
				vscode.window.showErrorMessage(`JSON 保存失败: ${err.message}`);
				return;
			}

			runBinary('smash_test.exe',
				[...Object.values(args).flatMap(x => x), "-f", jsonFilePath, "-o", outputFilePath],
				jsonFilePath);
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
