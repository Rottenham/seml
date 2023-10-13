import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { isError } from './error';
import { parse } from './parser';
import { execFile, ExecFileException } from 'child_process';

function runBinary(filename: string, args: string[], jsonFilePath: string) {
	const binaryPath = path.join(__dirname, "bin", filename);

	execFile(binaryPath, args, (err: ExecFileException | null, stdout: string, stderr: string) => {
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

function compileToJson(src: string, fsPath: string)
	: { dirName: string, baseName: string, jsonFilePath: string, jsonOutput: string, args: { [key: string]: string[] } } | undefined {
	const parsedOutput = parse(src);
	if (isError(parsedOutput)) {
		const { lineNum, msg, src } = parsedOutput;
		vscode.window.showErrorMessage(`[第${lineNum}行] ${msg}: ${src}`);
		return;
	}

	const { out, args } = parsedOutput;
	const jsonOutput = JSON.stringify(out, null, 4);

	const semlFilePath = fsPath;
	if (path.extname(semlFilePath) !== ".seml") {
		vscode.window.showErrorMessage("请打开 .seml 文件");
		return;
	}

	const dirName = path.dirname(semlFilePath);
	const baseName = path.basename(semlFilePath, ".seml");
	const jsonFilePath = path.join(dirName, `${baseName}.json`);

	return { dirName, baseName, jsonFilePath, jsonOutput, args };
}

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('seml.testSmash', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}

		const compiiledJson = compileToJson(editor.document.getText(), editor.document.uri.fsPath);
		if (compiiledJson === undefined) {
			return;
		}

		const { dirName, baseName, jsonFilePath, jsonOutput, args } = compiiledJson;

		const destDirName = path.join(dirName, "dest");
		if (!fs.existsSync(destDirName)) {
			fs.mkdirSync(destDirName);
		}

		const outputFile = path.join(destDirName, baseName + "_smash");

		fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
			if (err) {
				vscode.window.showErrorMessage(`JSON 保存失败: ${err}`);
				return;
			}

			runBinary('smash_test.exe',
				[...Object.values(args).flatMap(x => x), "-f", jsonFilePath, "-o", outputFile],
				jsonFilePath);
		});
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('seml.compileToJson', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}

		const compiledJson = compileToJson(editor.document.getText(), editor.document.uri.fsPath);
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
	});
	context.subscriptions.push(disposable);
}

export function deactivate() { }
