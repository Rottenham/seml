"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.parseSetting = exports.parseFodder = exports.parseCob = exports.parseWave = exports.isError = exports.error = void 0;
function error(lineNum, msg, src) {
    return { type: "Error", lineNum, msg, src };
}
exports.error = error;
function isError(result) {
    return result?.type === "Error";
}
exports.isError = isError;
function getMaxRows(scene) {
    if (scene === undefined || scene === "PE") {
        return 6;
    }
    else {
        return 5;
    }
}
function rangeOverlap(range1, range2) {
    console.assert(range1.start <= range1.end && range2.start <= range2.end);
    return range1.start <= range2.end && range2.start <= range1.end;
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
function parseRows(lineNum, rowsToken, expectedNum, suffix, description) {
    const rows = [];
    if (expectedNum !== null && expectedNum !== rowsToken.length) {
        return error(lineNum, `请提供 ${expectedNum} 个${description}`, rowsToken);
    }
    let hasSuffix = false;
    for (const [i, rowToken] of [...rowsToken].entries()) {
        if (hasSuffix) {
            hasSuffix = false;
        }
        else {
            const row = strictParseInt(rowToken);
            if (isNaN(row) || row < 1 || row > 6) {
                return error(lineNum, `${description}应为 1~6 内的整数`, rowToken);
            }
            const nextChar = rowsToken[i + 1];
            if (nextChar !== undefined && suffix !== null && nextChar === suffix) {
                hasSuffix = true;
            }
            rows.push({ row, hasSuffix });
        }
    }
    return rows;
}
;
function parseCob(out, lineNum, line, cobNum) {
    const currWave = lastWave(out)[1];
    if (currWave === undefined) {
        return error(lineNum, "请先设定波次", line);
    }
    const parseCol = (colToken) => {
        const col = strictParseFloat(colToken);
        if (isNaN(col) || col < 0.0 || col > 10.0) {
            return error(lineNum, "落点列应为 0.0~10.0 内的数字", colToken);
        }
        return col;
    };
    const tokens = line.split(" ");
    const timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3];
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
    const rows = parseRows(lineNum, rowsToken, cobNum, null, "落点行");
    if (isError(rows)) {
        return rows;
    }
    const col = parseCol(colToken);
    if (isError(col)) {
        return col;
    }
    currWave.actions.push({
        op: "Cob",
        time,
        positions: rows.map(row => ({ row: row.row, col: col }))
    });
    return null;
}
exports.parseCob = parseCob;
function parseArg(lineNum, argToken) {
    if (!argToken.includes(":")) {
        return error(lineNum, "传参格式应为 [参数]:[值] ", argToken);
    }
    const key = argToken.split(":")[0], value = argToken.split(":")[1];
    if (key.length === 0) {
        return error(lineNum, "参数不可为空", argToken);
    }
    if (value.length === 0) {
        return error(lineNum, "值不可为空", argToken);
    }
    return { key: key.trim(), value: value.trim() };
}
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
    const parseCol = (colToken) => {
        const col = strictParseInt(colToken);
        if (isNaN(col) || col < 1 || col > 9) {
            return error(lineNum, "用垫列应为 1~9 内的整数", colToken);
        }
        return col;
    };
    const parseFodderArgs = (fodderArgTokens, cardNum) => {
        if (fodderArgTokens.length === 0) {
            return null;
        }
        const fodderArgs = {};
        for (const fodderArgToken of fodderArgTokens) {
            const parsedFodderArg = parseArg(lineNum, fodderArgToken);
            if (isError(parsedFodderArg)) {
                return parsedFodderArg;
            }
            const { key, value } = parsedFodderArg;
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
        if (fodderArgs.choose === undefined) {
            return error(lineNum, "必须提供 choose 的值", "");
        }
        return { choose: fodderArgs.choose, waves: fodderArgs.waves ?? [] };
    };
    const tokens = line.split(" ");
    const timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3], fodderArgTokens = tokens.slice(4);
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
    const rows = parseRows(lineNum, rowsToken, null, "'", "用垫行");
    if (isError(rows)) {
        return rows;
    }
    const col = parseCol(colToken);
    if (isError(col)) {
        return col;
    }
    const fodderArgs = parseFodderArgs(fodderArgTokens, rows.length);
    if (isError(fodderArgs)) {
        return fodderArgs;
    }
    const positions = rows.map(({ row, hasSuffix }) => ({ type: hasSuffix ? "Puff" : "Normal", row, col }));
    if (fodderArgs === null) {
        currWave.actions.push({
            op: "FixedFodder",
            time: times[0],
            shovelTime: times[1] ?? undefined,
            positions
        });
    }
    else {
        currWave.actions.push({
            op: "SmartFodder",
            time: times[0],
            shovelTime: times[1] ?? undefined,
            positions,
            choose: fodderArgs.choose,
            waves: fodderArgs.waves
        });
    }
    return null;
}
exports.parseFodder = parseFodder;
function parseSetting(out, lineNum, line) {
    const parsedArg = parseArg(lineNum, line);
    if (isError(parsedArg)) {
        return parsedArg;
    }
    const { key, value } = parsedArg;
    if (key in out.setting) {
        return error(lineNum, "参数重复", key);
    }
    if (key === 'scene') {
        const valueUpperCased = value.toUpperCase();
        if (["DE", "NE"].includes(valueUpperCased)) {
            out.setting.scene = "DE";
        }
        else if (["PE", "FE"].includes(valueUpperCased)) {
            out.setting.scene = "PE";
        }
        else if (["RE", "ME"].includes(valueUpperCased)) {
            out.setting.scene = "RE";
        }
        else {
            return error(lineNum, "未知场地", value);
        }
    }
    else if (key === "protect") {
        out.setting.protect = [];
        for (let posToken of value.split(" ")) {
            let isNormal = false;
            if (posToken.endsWith("'")) {
                posToken = posToken.slice(0, -1);
                isNormal = true;
            }
            if (posToken.length < 2) {
                return error(lineNum, "请提供要保护的行与列", posToken);
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
            const posToColRange = (pos) => {
                return { start: pos.col, end: pos.type === "Normal" ? pos.col : pos.col + 1 };
            };
            for (const prevPos of out.setting.protect) {
                if (prevPos.row === row && rangeOverlap(posToColRange(prevPos), posToColRange(pos))) {
                    return error(lineNum, "保护位置重叠", posToken);
                }
            }
            out.setting.protect.push(pos);
        }
    }
    else {
        return error(lineNum, "未知参数", key);
    }
    return null;
}
exports.parseSetting = parseSetting;
function parse(text) {
    const out = { setting: {} };
    const lines = text.split(/\r?\n/);
    for (const [i, originalLine] of lines.entries()) {
        const lineNum = i + 1;
        const line = originalLine.split("#")[0].trim();
        if (line.startsWith("scene")) {
            const parseResult = parseSetting(out, lineNum, line);
            if (isError(parseResult)) {
                return parseResult;
            }
            break;
        }
    }
    for (const [i, originalLine] of lines.entries()) {
        const lineNum = i + 1;
        const line = originalLine.split("#")[0].trim(); // ignore comments
        if (line.length > 0 && !line.startsWith("scene")) {
            const originalSymbol = line.split(" ")[0];
            const symbol = originalSymbol.toUpperCase();
            let parseResult = null;
            if (symbol.includes(":")) {
                parseResult = parseSetting(out, lineNum, line);
            }
            else if (symbol.startsWith("W")) {
                parseResult = parseWave(out, lineNum, line);
            }
            else if (["B", "P", "D"].includes(symbol)) {
                parseResult = parseCob(out, lineNum, line, 1);
            }
            else if (["BB", "PP", "DD"].includes(symbol)) {
                parseResult = parseCob(out, lineNum, line, 2);
            }
            else if (symbol === "C") {
                parseResult = parseFodder(out, lineNum, line);
            }
            else {
                parseResult = error(lineNum, "未知符号", originalSymbol);
            }
            if (isError(parseResult)) {
                return parseResult;
            }
        }
    }
    return out;
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
//# sourceMappingURL=parser.js.map