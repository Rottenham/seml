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

function compileToJson(doc: vscode.TextDocument)
	: { dirName: string, baseName: string, jsonFilePath: string, jsonOutput: string, args: { [key: string]: string[] } } | undefined {
	const parsedOutput = parse(doc.getText());
	if (isError(parsedOutput)) {
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

export function activate(context: vscode.ExtensionContext) {

	let compileToJsonCmd = vscode.commands.registerCommand('seml.compileToJson', () => {
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
	});

	context.subscriptions.push(compileToJsonCmd);

	let testSmashCmd = vscode.commands.registerCommand('seml.testSmash', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}

		const compiiledJson = compileToJson(editor.document);
		if (compiiledJson === undefined) {
			return;
		}

		const { dirName, baseName, jsonFilePath, jsonOutput, args } = compiiledJson;

		const destDirName = path.join(dirName, "dest");
		if (!fs.existsSync(destDirName)) {
			fs.mkdirSync(destDirName);
		}

		fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
			if (err) {
				vscode.window.showErrorMessage(`JSON 保存失败: ${err}`);
				return;
			}

			runBinary('smash_test.exe',
				[...Object.values(args).flatMap(x => x),
					"-f", jsonFilePath,
					"-o", path.join(destDirName, baseName + "_smash")],
				jsonFilePath);
		});
	});

	context.subscriptions.push(testSmashCmd);

	let testExplodeCmd = vscode.commands.registerCommand('seml.testExplode', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}

		const compiiledJson = compileToJson(editor.document);
		if (compiiledJson === undefined) {
			return;
		}

		const { dirName, baseName, jsonFilePath, jsonOutput, args } = compiiledJson;

		const destDirName = path.join(dirName, "dest");
		if (!fs.existsSync(destDirName)) {
			fs.mkdirSync(destDirName);
		}

		fs.writeFile(jsonFilePath, jsonOutput, "utf8", function (err) {
			if (err) {
				vscode.window.showErrorMessage(`JSON 保存失败: ${err}`);
				return;
			}

			runBinary('explode_test.exe',
				[...Object.values(args).flatMap(x => x),
					"-f", jsonFilePath,
					"-o", path.join(destDirName, baseName + "_explode")],
				jsonFilePath);
		});
	});

	context.subscriptions.push(testExplodeCmd);

}

export function deactivate() { }
