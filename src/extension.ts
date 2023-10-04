import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { parse, isError } from './parser';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('seml.toJSON', () => {

		const editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			return;
		}

		const out = parse(editor.document.getText());
		if (isError(out)) {
			const {lineNum, msg, src} = out;
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
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
