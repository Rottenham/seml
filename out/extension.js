"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
function activate(context) {
    function error(lineNum, message, source) {
        vscode.window.showErrorMessage(`[第${lineNum}行] ${message}: ${source}`);
    }
    // only accept non-negative whole numbers, no leading + allowed
    function strictParseInt(str) {
        if (!/^\d+$/.test(str)) {
            return NaN;
        }
        return parseInt(str, 10);
    }
    // only accept non-negative whole or decimal numbers, no leading + allowed
    function strictParseFloat(str) {
        if (!/^\d+(\.\d+)?$/.test(str)) {
            return NaN;
        }
        return parseFloat(str);
    }
    function parseWave(out, lineNum, line) {
        const parseWaveNum = (waveNumToken) => {
            const waveNum = strictParseInt(waveNumToken.slice(1));
            if (isNaN(waveNum) || waveNum < 1 || waveNum > 9) {
                error(lineNum, "波数应为 1~9 内的整数", waveNumToken);
                return;
            }
            return waveNum;
        };
        const parseIceTimes = (iceTimeTokens) => {
            const iceTimes = [];
            for (const iceTimeToken of iceTimeTokens) {
                const iceTime = strictParseInt(iceTimeToken);
                if (isNaN(iceTime) || iceTime <= 0) {
                    error(lineNum, "用冰时机应为正整数", iceTimeToken);
                    return;
                }
                iceTimes.push(iceTime);
            }
            return iceTimes;
        };
        const parseWaveLength = (waveLengthToken) => {
            const waveLength = strictParseInt(waveLengthToken);
            if (isNaN(waveLength) || waveLength < 601) {
                error(lineNum, "波长应为 >= 601 的整数", waveLengthToken);
            }
            return waveLength;
        };
        const tokens = line.split(" ");
        const waveNumToken = tokens[0], iceTimeTokens = tokens.slice(1, tokens.length - 1), waveLengthToken = tokens[tokens.length - 1];
        if (waveLengthToken === undefined) {
            error(lineNum, "请提供波长", line);
            return;
        }
        const waveNum = parseWaveNum(waveNumToken);
        if (waveNum === undefined) {
            return;
        }
        if (out[waveNum] !== undefined) {
            error(lineNum, "波数重复", waveNumToken);
            return;
        }
        const iceTimes = parseIceTimes(iceTimeTokens);
        if (iceTimes === undefined) {
            return;
        }
        const waveLength = parseWaveLength(waveLengthToken);
        if (waveLength === undefined) {
            return;
        }
        const lastIceTime = iceTimes[iceTimes.length - 1];
        if (lastIceTime !== undefined && waveLength < lastIceTime) {
            error(lineNum, "波长应 >= 最后一次用冰时机", line);
            return;
        }
        out[waveNum] = { iceTimes, waveLength, actions: [] };
        return waveNum;
    }
    function parseTime(lineNum, timeToken, prevTime) {
        const isDelay = timeToken.startsWith("+");
        timeToken = isDelay ? timeToken.slice(1) : timeToken;
        const time = strictParseInt(timeToken);
        if (isNaN(time) || time < 0) {
            error(lineNum, "时间应为非负整数", timeToken);
            return;
        }
        if (!isDelay) {
            return time;
        }
        else {
            if (prevTime === undefined) {
                error(lineNum, "没有延迟基准", `+${timeToken}`);
                return;
            }
            ;
            return prevTime + time;
        }
    }
    ;
    function parseRows(lineNum, rowsToken, expectedNum, suffix, description) {
        const rows = [];
        if (expectedNum !== null && expectedNum !== rowsToken.length) {
            error(lineNum, `请提供 ${expectedNum} 个${description}`, rowsToken);
            return;
        }
        for (let cur = 0; cur < rowsToken.length; cur++) {
            const rowToken = rowsToken[cur];
            const row = strictParseInt(rowToken);
            if (isNaN(row) || row < 1 || row > 6) {
                error(lineNum, `${description}应为 1~6 内的整数`, rowToken);
                return;
            }
            const nextChar = rowsToken[cur + 1];
            let hasSuffix = false;
            if (nextChar !== undefined && suffix !== null && nextChar === suffix) {
                hasSuffix = true;
                cur++;
            }
            rows.push({ row, hasSuffix });
        }
        return rows;
    }
    ;
    function parseCob(out, lineNum, line, currentWave, cobNum) {
        const wave = out[currentWave];
        if (!wave) {
            error(lineNum, "请先设定波次", line);
            return;
        }
        const parseCol = (colToken) => {
            const col = strictParseFloat(colToken);
            if (isNaN(col) || col < 0.0 || col > 10.0) {
                error(lineNum, "落点列应为 0.0~10.0 内的数字", colToken);
                return;
            }
            return col;
        };
        const tokens = line.split(" ");
        const timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3];
        if (timeToken === undefined) {
            error(lineNum, "请提供炮生效时机", line);
            return;
        }
        if (rowsToken === undefined) {
            error(lineNum, "请提供落点行", line);
            return;
        }
        if (colToken === undefined) {
            error(lineNum, "请提供落点列", line);
            return;
        }
        const time = parseTime(lineNum, timeToken, wave.actions[wave.actions.length - 1]?.time);
        if (time === undefined) {
            return;
        }
        const rows = parseRows(lineNum, rowsToken, cobNum, null, "落点行");
        if (rows === undefined) {
            return;
        }
        const col = parseCol(colToken);
        if (col === undefined) {
            return;
        }
        for (const row of rows) {
            wave.actions.push({
                op: "Cob",
                time,
                row: row.row,
                col
            });
        }
        return true;
    }
    function parseFodder(out, lineNum, line, currentWave) {
        const wave = out[currentWave];
        if (!wave) {
            error(lineNum, "请先设定波次", line);
            return;
        }
        const parseTimes = (timesToken) => {
            let cardTimeToken;
            let shovelTimeToken = undefined;
            let prefix = "";
            if (timesToken.startsWith("+")) {
                prefix = "+";
                timesToken = timesToken.slice(1);
            }
            if (timesToken.includes("+")) {
                cardTimeToken = prefix + timesToken.split('+')[0];
                shovelTimeToken = `+${timesToken.split('+')[1]}`;
            }
            else if (timesToken.includes("~")) {
                cardTimeToken = prefix + timesToken.split('~')[0];
                shovelTimeToken = timesToken.split('~')[1];
            }
            else {
                cardTimeToken = prefix + timesToken;
            }
            const cardTime = parseTime(lineNum, cardTimeToken, wave.actions[wave.actions.length - 1]?.time);
            if (cardTime === undefined) {
                return;
            }
            let shovelTime = undefined;
            if (shovelTimeToken !== undefined) {
                shovelTime = parseTime(lineNum, shovelTimeToken, cardTime);
                if (shovelTime === undefined) {
                    return;
                }
                if (shovelTime < cardTime) {
                    error(lineNum, "铲除时机不可早于用垫时机", shovelTimeToken);
                    return;
                }
            }
            return [cardTime, shovelTime];
        };
        const parseCol = (colToken) => {
            const col = strictParseInt(colToken);
            if (isNaN(col) || col < 1 || col > 9) {
                error(lineNum, "用垫列应为 1~9 内的整数", colToken);
                return;
            }
            return col;
        };
        const parseExtraArgs = (extraArgTokens, cardNum) => {
            if (extraArgTokens.length === 0) {
                return {};
            }
            let extraArgs = {};
            for (const extraArgToken of extraArgTokens) {
                if (!extraArgToken.includes(":")) {
                    error(lineNum, "传参格式应为 [参数]:[值] ", extraArgToken);
                    return;
                }
                const key = extraArgToken.split(":")[0], value = extraArgToken.split(":")[1];
                if (key in extraArgs) {
                    error(lineNum, "参数重复", key);
                    return;
                }
                if (key === "choose") {
                    const chooseNum = strictParseInt(value);
                    if (isNaN(chooseNum) || chooseNum < 1 || chooseNum > cardNum) {
                        error(lineNum, `choose 的值应为 1~${cardNum} 内的整数`, value);
                        return;
                    }
                    extraArgs["choose"] = chooseNum;
                }
                else if (key === "wave") {
                    extraArgs.waves = [];
                    if (value.length === 0) {
                        error(lineNum, "wave 的值不可为空", value);
                        return;
                    }
                    for (const waveToken of value) {
                        const wave = strictParseInt(waveToken);
                        if (isNaN(wave) || wave < 1 || wave > currentWave) {
                            error(lineNum, `wave 的值应为 1~${currentWave} 内的整数`, value);
                            return;
                        }
                        if (extraArgs.waves.includes(wave)) {
                            error(lineNum, "wave 重复", wave.toString());
                            return;
                        }
                        extraArgs.waves.push(wave);
                    }
                }
                else {
                    error(lineNum, "未知参数", key);
                    return;
                }
            }
            if (extraArgs.choose === undefined) {
                error(lineNum, "必须提供 choose 的值", extraArgTokens.join(" "));
                return;
            }
            return extraArgs;
        };
        const tokens = line.split(" ");
        const timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3], extraArgTokens = tokens.slice(4);
        if (timeToken === undefined) {
            error(lineNum, "请提供用垫时机", line);
            return;
        }
        if (rowsToken === undefined) {
            error(lineNum, "请提供用垫行", line);
            return;
        }
        if (colToken === undefined) {
            error(lineNum, "请提供用垫列", line);
            return;
        }
        const times = parseTimes(timeToken);
        if (times === undefined) {
            return;
        }
        const rows = parseRows(lineNum, rowsToken, null, "'", "用垫行");
        if (rows === undefined) {
            return;
        }
        const col = parseCol(colToken);
        if (col === undefined) {
            return;
        }
        const extraArgs = parseExtraArgs(extraArgTokens, rows.length);
        if (extraArgs === undefined) {
            return;
        }
        for (const row of rows) {
            wave.actions.push({
                op: "Card",
                type: row.hasSuffix ? "Puff" : "Normal",
                time: times[0],
                shovelTime: times[1],
                row: row.row,
                col,
                ...extraArgs
            });
        }
        return true;
    }
    function parse(text) {
        let out = {};
        const lines = text.split(/\r?\n/);
        let currentWave = 0;
        for (const [i, originalLine] of lines.entries()) {
            const lineNum = i + 1;
            const line = originalLine.split("#")[0].trim(); // ignore comments
            if (line.length > 0) {
                const originalSymbol = line.split(" ")[0];
                const symbol = originalSymbol.toUpperCase();
                if (symbol.startsWith("W")) {
                    const wave = parseWave(out, lineNum, line) ?? NaN;
                    if (isNaN(wave)) {
                        return;
                    }
                    if (wave !== currentWave + 1) {
                        error(lineNum, `请先设定第 ${currentWave + 1} 波`, originalSymbol);
                        return;
                    }
                    currentWave = wave;
                }
                else if (["B", "P", "D"].includes(symbol)) {
                    if (!parseCob(out, lineNum, line, currentWave, 1)) {
                        return;
                    }
                }
                else if (["BB", "PP", "DD"].includes(symbol)) {
                    if (!parseCob(out, lineNum, line, currentWave, 2)) {
                        return;
                    }
                }
                else if (symbol === "C") {
                    if (!parseFodder(out, lineNum, line, currentWave)) {
                        return;
                    }
                }
                else {
                    error(lineNum, "未知符号", originalSymbol);
                    return;
                }
            }
        }
        return JSON.stringify(out, null, 4);
    }
    let disposable = vscode.commands.registerCommand('seml.toJSON', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        const jsonOutput = parse(editor.document.getText());
        if (jsonOutput === undefined) {
            return;
        }
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
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map