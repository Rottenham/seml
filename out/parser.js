"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandLines = exports.parse = exports.parseIntArg = exports.parseProtect = exports.parseScene = exports.parseFodder = exports.parseCob = exports.parseWave = exports.isError = exports.error = void 0;
function error(lineNum, msg, src) {
    return { type: "Error", lineNum, msg, src };
}
exports.error = error;
function isError(result) {
    return result?.type === "Error";
}
exports.isError = isError;
function getMaxRows(scene) {
    if (scene === undefined || scene === "FE") {
        return 6;
    }
    else {
        return 5;
    }
}
function parseWave(out, lineNum, line) {
    const parseWaveNum = (waveNumToken) => {
        const waveNum = strictParseInt(waveNumToken.slice(1));
        if (isNaN(waveNum) || waveNum < 1 || waveNum > 9) {
            return error(lineNum, "波数应为 1~9 内的整数", waveNumToken);
        }
        return waveNum;
    };
    const parseIceTimes = (iceTimeTokens) => {
        const iceTimes = [];
        for (const iceTimeToken of iceTimeTokens) {
            const iceTime = strictParseInt(iceTimeToken);
            if (isNaN(iceTime) || iceTime <= 0) {
                return error(lineNum, "用冰时机应为正整数", iceTimeToken);
            }
            iceTimes.push(iceTime);
        }
        return iceTimes;
    };
    const parseWaveLength = (waveLengthToken) => {
        const waveLength = strictParseInt(waveLengthToken);
        if (isNaN(waveLength) || waveLength < 601) {
            return error(lineNum, "波长应为 >= 601 的整数", waveLengthToken);
        }
        return waveLength;
    };
    const tokens = line.split(" ");
    if (tokens.length < 2) {
        return error(lineNum, "请提供波长", line);
    }
    const waveNumToken = tokens[0], iceTimeTokens = tokens.slice(1, -1), waveLengthToken = tokens[tokens.length - 1];
    const waveNum = parseWaveNum(waveNumToken);
    if (isError(waveNum)) {
        return waveNum;
    }
    if (waveNum in out) {
        return error(lineNum, "波数重复", waveNumToken);
    }
    const prevWaveNum = lastWave(out)[0] ?? 0;
    if (prevWaveNum + 1 !== waveNum) {
        return error(lineNum, `请先设定第 ${prevWaveNum + 1} 波`, waveNumToken);
    }
    const iceTimes = parseIceTimes(iceTimeTokens);
    if (isError(iceTimes)) {
        return iceTimes;
    }
    const waveLength = parseWaveLength(waveLengthToken);
    if (isError(waveLength)) {
        return waveLength;
    }
    const lastIceTime = iceTimes[iceTimes.length - 1];
    if (lastIceTime !== undefined && waveLength < lastIceTime) {
        return error(lineNum, "波长应 >= 最后一次用冰时机", line);
    }
    out[waveNum] = { iceTimes: iceTimes, waveLength: waveLength, actions: [] };
    return null;
}
exports.parseWave = parseWave;
function parseTime(lineNum, timeToken, prevTime) {
    const isDelay = timeToken.startsWith("+");
    timeToken = isDelay ? timeToken.slice(1) : timeToken;
    const time = strictParseInt(timeToken);
    if (isNaN(time) || time < 0) {
        return error(lineNum, "时间应为非负整数", timeToken);
    }
    if (!isDelay) {
        return time;
    }
    else {
        if (prevTime === undefined) {
            return error(lineNum, "没有延迟基准", `+${timeToken}`);
        }
        ;
        return prevTime + time;
    }
}
;
function parseCob(out, lineNum, line, cobNum) {
    const currWave = lastWave(out)[1];
    if (currWave === undefined) {
        return error(lineNum, "请先设定波次", line);
    }
    const parseRows = (rowsToken) => {
        if (rowsToken.length !== cobNum) {
            return error(lineNum, `请提供 ${cobNum} 个落点行`, rowsToken);
        }
        const rows = [];
        for (const rowToken of rowsToken) {
            const row = strictParseInt(rowToken);
            if (isNaN(row) || row < 1 || row > getMaxRows(out.setting.scene)) {
                return error(lineNum, `落点行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
            }
            rows.push(row);
        }
        rows.sort();
        return rows;
    };
    const parseCol = (colToken) => {
        const col = strictParseFloat(colToken);
        if (isNaN(col) || col < 0.0 || col > 10.0) {
            return error(lineNum, "落点列应为 0.0~10.0 内的数字", colToken);
        }
        return col;
    };
    const tokens = line.split(" ");
    const symbol = tokens[0], timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3];
    if (timeToken === undefined) {
        return error(lineNum, "请提供炮生效时机", line);
    }
    if (rowsToken === undefined) {
        return error(lineNum, "请提供落点行", line);
    }
    if (colToken === undefined) {
        return error(lineNum, "请提供落点列", line);
    }
    const time = parseTime(lineNum, timeToken, currWave.actions[currWave.actions.length - 1]?.time);
    if (isError(time)) {
        return time;
    }
    const rows = parseRows(rowsToken);
    if (isError(rows)) {
        return rows;
    }
    const col = parseCol(colToken);
    if (isError(col)) {
        return col;
    }
    currWave.actions.push({
        op: "Cob",
        symbol,
        time,
        positions: rows.map(row => ({ row, col }))
    });
    return null;
}
exports.parseCob = parseCob;
function parseFodder(out, lineNum, line) {
    const [currWaveNum, currWave] = lastWave(out);
    if (currWaveNum === undefined || currWave === undefined) {
        return error(lineNum, "请先设定波次", line);
    }
    const parseTimes = (timesToken) => {
        let cardTimeToken;
        let shovelTimeToken;
        const delimIndex = Math.max(timesToken.lastIndexOf("+"), timesToken.lastIndexOf("~"));
        if (delimIndex <= 0) { // if starts with "+" (delimIndex is 0), still ignore it
            cardTimeToken = timesToken;
        }
        else {
            cardTimeToken = timesToken.slice(0, delimIndex);
            shovelTimeToken = timesToken.slice(delimIndex);
            if (shovelTimeToken.startsWith("~")) {
                shovelTimeToken = shovelTimeToken.slice(1);
            }
        }
        const cardTime = parseTime(lineNum, cardTimeToken, currWave.actions[currWave.actions.length - 1]?.time);
        if (isError(cardTime)) {
            return cardTime;
        }
        if (shovelTimeToken === undefined) {
            return [cardTime, null];
        }
        else {
            const shovelTime = parseTime(lineNum, shovelTimeToken, cardTime);
            if (isError(shovelTime)) {
                return shovelTime;
            }
            if (shovelTime < cardTime) {
                return error(lineNum, "铲除时机不可早于用垫时机", shovelTimeToken);
            }
            return [cardTime, shovelTime];
        }
    };
    const parseRows = (rowsToken) => {
        const rows = [];
        let skip = false;
        for (const [i, rowToken] of [...rowsToken].entries()) {
            if (skip) {
                skip = false;
            }
            else {
                const row = strictParseInt(rowToken);
                if (isNaN(row) || row < 1 || row > getMaxRows(out.setting.scene)) {
                    return error(lineNum, `用垫行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
                }
                let card = "Normal";
                const nextChar = rowsToken[i + 1];
                ;
                if (nextChar !== undefined) {
                    if (nextChar === `'`) {
                        card = "Puff";
                        skip = true;
                    }
                    else if (nextChar === `"`) {
                        card = "Pot";
                        skip = true;
                    }
                }
                rows.push({ row, card });
            }
        }
        rows.sort((a, b) => a.row - b.row);
        return rows;
    };
    const parseCol = (colToken) => {
        const col = strictParseInt(colToken);
        if (isNaN(col) || col < 1 || col > 9) {
            return error(lineNum, "用垫列应为 1~9 内的整数", colToken);
        }
        return col;
    };
    const parseFodderArgs = (fodderArgTokens, cardNum, allowOmitChoose) => {
        const fodderArgs = {};
        for (const fodderArgToken of fodderArgTokens) {
            if (!fodderArgToken.includes(":")) {
                return error(lineNum, "传参格式应为 [参数]:[值] ", fodderArgToken);
            }
            let key = fodderArgToken.split(":")[0];
            let value = fodderArgToken.split(":")[1];
            if (key.length === 0) {
                return error(lineNum, "参数不可为空", fodderArgToken);
            }
            if (value.length === 0) {
                return error(lineNum, "值不可为空", fodderArgToken);
            }
            if (key in fodderArgs) {
                return error(lineNum, "参数重复", key);
            }
            if (key === "choose") {
                const chooseNum = strictParseInt(value);
                if (isNaN(chooseNum) || chooseNum < 1 || chooseNum > cardNum) {
                    return error(lineNum, `choose 的值应为 1~${cardNum} 内的整数`, value);
                }
                fodderArgs[key] = chooseNum;
            }
            else if (key === "waves") {
                const waves = [];
                for (const waveNumToken of value) {
                    const waveNum = strictParseInt(waveNumToken);
                    if (isNaN(waveNum) || waveNum < 1 || waveNum > currWaveNum) {
                        return error(lineNum, `waves 的值应为 1~${currWaveNum} 内的整数`, value);
                    }
                    if (waves.includes(waveNum)) {
                        return error(lineNum, "waves 重复", waveNum.toString());
                    }
                    waves.push(waveNum);
                }
                fodderArgs[key] = waves;
            }
            else {
                return error(lineNum, "未知参数", key);
            }
        }
        if (!allowOmitChoose && fodderArgs.choose === undefined) {
            return error(lineNum, "必须提供 choose 的值", "");
        }
        return { choose: fodderArgs.choose ?? cardNum, waves: fodderArgs.waves ?? [] };
    };
    const tokens = line.split(" ");
    const symbol = tokens[0], timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3], fodderArgTokens = tokens.slice(4);
    if (timeToken === undefined) {
        return error(lineNum, "请提供用垫时机", line);
    }
    if (rowsToken === undefined) {
        return error(lineNum, "请提供用垫行", line);
    }
    if (colToken === undefined) {
        return error(lineNum, "请提供用垫列", line);
    }
    const times = parseTimes(timeToken);
    if (isError(times)) {
        return times;
    }
    const rows = parseRows(rowsToken);
    if (isError(rows)) {
        return rows;
    }
    const col = parseCol(colToken);
    if (isError(col)) {
        return col;
    }
    const cards = rows.map(({ card }) => card);
    const positions = rows.map(({ row }) => ({ row, col }));
    if (symbol === "C") {
        currWave.actions.push({
            op: "FixedFodder",
            symbol,
            time: times[0],
            shovelTime: times[1] ?? undefined,
            cards,
            positions
        });
    }
    else {
        const fodderArgs = parseFodderArgs(fodderArgTokens, rows.length, symbol === "C_NUM");
        if (isError(fodderArgs)) {
            return fodderArgs;
        }
        currWave.actions.push({
            op: "SmartFodder",
            symbol,
            time: times[0],
            shovelTime: times[1] ?? undefined,
            cards,
            positions,
            choose: fodderArgs.choose,
            waves: fodderArgs.waves
        });
    }
    return null;
}
exports.parseFodder = parseFodder;
function parseScene(out, lineNum, line) {
    if ("scene" in out.setting) {
        return error(lineNum, "参数重复", "scene");
    }
    const value = line.split(":").slice(1).join(":");
    const upperCasedValue = value.toUpperCase();
    if (["DE", "NE"].includes(upperCasedValue)) {
        out.setting.scene = "NE";
    }
    else if (["PE", "FE"].includes(upperCasedValue)) {
        out.setting.scene = "FE";
    }
    else if (["RE", "ME"].includes(upperCasedValue)) {
        out.setting.scene = "ME";
    }
    else {
        return error(lineNum, "未知场地", value);
    }
    return null;
}
exports.parseScene = parseScene;
function parseProtect(out, lineNum, line) {
    const value = line.split(":").slice(1).join(":");
    if (value.length === 0) {
        return error(lineNum, "protect 的值不可为空", line);
    }
    out.setting.protect = [];
    for (let posToken of value.split(" ")) {
        let isNormal = false;
        if (posToken.endsWith("'")) {
            posToken = posToken.slice(0, -1);
            isNormal = true;
        }
        if (posToken.length < 2) {
            return error(lineNum, "请提供要保护的行与列", line);
        }
        const rowToken = posToken[0], colToken = posToken[1];
        const row = strictParseInt(rowToken), col = strictParseInt(colToken);
        if (isNaN(row) || row < 1 || row > getMaxRows(out.setting.scene)) {
            return error(lineNum, `保护行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
        }
        const maxCol = isNormal ? 9 : 8;
        if (isNaN(col) || col < 1 || col > maxCol) {
            return error(lineNum, `${isNormal ? "普通植物" : "炮"}所在列应为 1~${maxCol} 内的整数`, colToken);
        }
        const pos = { type: isNormal ? "Normal" : "Cob", row, col };
        if (out.setting.protect.map(pos => pos.row).includes(row)) {
            return error(lineNum, "保护位置重叠", posToken);
        }
        out.setting.protect.push(pos);
    }
    return null;
}
exports.parseProtect = parseProtect;
function parseIntArg(args, argName, argFlag, lineNum, line) {
    if (argName in args) {
        return error(lineNum, "参数重复", argName);
    }
    const value = line.split(":").slice(1).join(":");
    const parsedValue = strictParseInt(value);
    if (isNaN(parsedValue) || parsedValue <= 0) {
        return error(lineNum, `${argName} 的值应为正整数`, value);
    }
    args[argName] = [argFlag, parsedValue.toString()];
    return null;
}
exports.parseIntArg = parseIntArg;
function parse(text) {
    const out = { setting: { variables: {} } };
    const args = {};
    const lines = expandLines(text.split(/\r?\n/));
    if (isError(lines)) {
        return lines;
    }
    for (const { lineNum, line } of lines) {
        if (line.startsWith("scene:")) {
            const scene = parseScene(out, lineNum, line);
            if (isError(scene)) {
                return scene;
            }
            break;
        }
    }
    for (const { lineNum, line } of lines) {
        if (line.length > 0 && !line.startsWith("scene:")) {
            const symbol = line.split(" ")[0];
            const upperCasedSymbol = symbol.toUpperCase();
            let parseResult = null;
            if (symbol.startsWith("protect:")) {
                parseResult = parseProtect(out, lineNum, line);
            }
            else if (symbol.startsWith("repeat:")) {
                parseResult = parseIntArg(args, "repeat", "-r", lineNum, line);
            }
            else if (symbol.startsWith("thread:")) {
                parseResult = parseIntArg(args, "thread", "-t", lineNum, line);
            }
            else if (upperCasedSymbol.startsWith("W")) {
                parseResult = parseWave(out, lineNum, line);
            }
            else if (["B", "P", "D"].includes(upperCasedSymbol)) {
                parseResult = parseCob(out, lineNum, line, 1);
            }
            else if (["BB", "PP", "DD"].includes(upperCasedSymbol)) {
                parseResult = parseCob(out, lineNum, line, 2);
            }
            else if (symbol === "C" || symbol === "C_POS" || symbol === "C_NUM") {
                parseResult = parseFodder(out, lineNum, line);
            }
            else {
                parseResult = error(lineNum, "未知符号", symbol);
            }
            if (isError(parseResult)) {
                return parseResult;
            }
        }
    }
    delete out.setting.variables;
    return { out, args };
}
exports.parse = parse;
function lastWave(out) {
    let lastKey = Number(Object.keys(out)[Object.keys(out).length - 2]);
    if (isNaN(lastKey)) {
        return [undefined, undefined];
    }
    else {
        return [lastKey, out[lastKey]];
    }
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
function expandLines(lines) {
    const originalLines = lines.map((line, lineNum) => ({ lineNum: lineNum + 1, line: line.split("#")[0].trim() }));
    const expandedLines = [];
    const populateLineWithWave = (line, waveNum) => {
        if (line.startsWith("w")) {
            return `w${waveNum} ${line.split(" ").slice(1).join(" ")}`;
        }
        else {
            return line;
        }
    };
    for (let cur = 0; cur < originalLines.length; cur++) {
        let { lineNum, line } = originalLines[cur];
        const symbol = line.split(" ")[0];
        if (!(symbol.startsWith("w") && symbol.includes("~"))) {
            expandedLines.push({ lineNum, line });
        }
        else {
            const startWave = strictParseInt(symbol.slice(1, symbol.indexOf("~")));
            const endWave = strictParseInt(symbol.slice(symbol.indexOf("~") + 1));
            if (isNaN(startWave) || isNaN(endWave)) {
                return error(lineNum, "波数应为正整数", symbol);
            }
            if (startWave > endWave) {
                return error(lineNum, "起始波数应大于终止波数", symbol);
            }
            let nextCur = cur;
            while (nextCur + 1 < originalLines.length
                && !originalLines[nextCur + 1].line.startsWith("w")) {
                nextCur++;
            }
            for (let waveNum = startWave; waveNum <= endWave; waveNum++) {
                for (let i = cur; i <= nextCur; i++) {
                    const { lineNum, line } = originalLines[i];
                    expandedLines.push({ lineNum, line: populateLineWithWave(line, waveNum) });
                }
            }
            cur = nextCur;
        }
    }
    return expandedLines;
}
exports.expandLines = expandLines;
//# sourceMappingURL=parser.js.map