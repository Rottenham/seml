"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceVariables = exports.expandLines = exports.parse = exports.parseIntArg = exports.parseProtect = exports.parseScene = exports.parseSet = exports.parseJalapeno = exports.parseFodder = exports.parseCob = exports.parseWave = void 0;
const error_1 = require("./error");
const string_1 = require("./string");
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
        const waveNum = (0, string_1.parseNatural)(waveNumToken.slice(1));
        if (waveNum === null || waveNum < 1 || waveNum > 9) {
            return (0, error_1.error)(lineNum, "波数应为 1~9 内的整数", waveNumToken);
        }
        return waveNum;
    };
    const parseIceTimes = (iceTimeTokens) => {
        const iceTimes = [];
        for (const iceTimeToken of iceTimeTokens) {
            const iceTime = (0, string_1.parseNatural)(iceTimeToken);
            if (iceTime === null || iceTime <= 0) {
                return (0, error_1.error)(lineNum, "用冰时机应为正整数", iceTimeToken);
            }
            iceTimes.push(iceTime);
        }
        return iceTimes;
    };
    const parseWaveLength = (waveLengthToken) => {
        const waveLength = (0, string_1.parseNatural)(waveLengthToken);
        if (waveLength === null || waveLength < 601) {
            return (0, error_1.error)(lineNum, "波长应为 >= 601 的整数", waveLengthToken);
        }
        return waveLength;
    };
    const tokens = line.split(" ");
    if (tokens.length < 2) {
        return (0, error_1.error)(lineNum, "请提供波长", line);
    }
    const waveNumToken = tokens[0], iceTimeTokens = tokens.slice(1, -1), waveLengthToken = tokens[tokens.length - 1];
    const waveNum = parseWaveNum(waveNumToken);
    if ((0, error_1.isError)(waveNum)) {
        return waveNum;
    }
    if (waveNum in out) {
        return (0, error_1.error)(lineNum, "波数重复", waveNumToken);
    }
    const prevWaveNum = lastWave(out)[0] ?? 0;
    if (prevWaveNum + 1 !== waveNum) {
        return (0, error_1.error)(lineNum, `请先设定第 ${prevWaveNum + 1} 波`, waveNumToken);
    }
    const iceTimes = parseIceTimes(iceTimeTokens);
    if ((0, error_1.isError)(iceTimes)) {
        return iceTimes;
    }
    const waveLength = parseWaveLength(waveLengthToken);
    if ((0, error_1.isError)(waveLength)) {
        return waveLength;
    }
    const lastIceTime = iceTimes[iceTimes.length - 1];
    if (lastIceTime !== undefined && waveLength < lastIceTime) {
        return (0, error_1.error)(lineNum, "波长应 >= 最后一次用冰时机", line);
    }
    out[waveNum] = { iceTimes: iceTimes, waveLength: waveLength, actions: [] };
    return null;
}
exports.parseWave = parseWave;
function parseTime(lineNum, timeToken, prevTime) {
    const [choppedTimeToken, isDelay] = (0, string_1.chopPrefix)(timeToken, "+");
    const time = (0, string_1.parseNatural)(choppedTimeToken);
    if (time === null || time < 0) {
        return (0, error_1.error)(lineNum, "时间应为非负整数", choppedTimeToken);
    }
    if (!isDelay) {
        return time;
    }
    else {
        if (prevTime === undefined) {
            return (0, error_1.error)(lineNum, "没有延迟基准", timeToken);
        }
        ;
        return prevTime + time;
    }
}
;
function parseCob(out, lineNum, line, cobNum) {
    const currWave = lastWave(out)[1];
    if (currWave === undefined) {
        return (0, error_1.error)(lineNum, "请先设定波次", line);
    }
    const parseRows = (rowsToken) => {
        if (rowsToken.length !== cobNum) {
            return (0, error_1.error)(lineNum, `请提供 ${cobNum} 个落点行`, rowsToken);
        }
        const rows = [];
        for (const rowToken of rowsToken) {
            const row = (0, string_1.parseNatural)(rowToken);
            if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
                return (0, error_1.error)(lineNum, `落点行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
            }
            rows.push(row);
        }
        rows.sort();
        return rows;
    };
    const parseCol = (colToken) => {
        const col = (0, string_1.parseDecimal)(colToken);
        if (col === null || col < 0.0 || col > 10.0) {
            return (0, error_1.error)(lineNum, "落点列应为 0.0~10.0 内的数字", colToken);
        }
        return col;
    };
    const tokens = line.split(" ");
    const symbol = tokens[0], timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3];
    if (timeToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供炮生效时机", line);
    }
    if (rowsToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供落点行", line);
    }
    if (colToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供落点列", line);
    }
    let cobCol;
    if (/\d$/.test(symbol)) {
        if (out.setting.scene !== "ME") {
            return (0, error_1.error)(lineNum, "只有屋顶场合可以指定炮尾列", symbol);
        }
        const parsedCobCol = (0, string_1.parseNatural)(symbol.slice(-1));
        if (parsedCobCol === null || parsedCobCol < 1 || parsedCobCol > 8) {
            return (0, error_1.error)(lineNum, "炮尾列应为 1~8 内的整数", symbol.slice(-1));
        }
        cobCol = parsedCobCol;
    }
    else {
        if (out.setting.scene === "ME") {
            return (0, error_1.error)(lineNum, "屋顶场合请提供落点列", line);
        }
    }
    const time = parseTime(lineNum, timeToken, currWave.actions[currWave.actions.length - 1]?.time);
    if ((0, error_1.isError)(time)) {
        return time;
    }
    const rows = parseRows(rowsToken);
    if ((0, error_1.isError)(rows)) {
        return rows;
    }
    const col = parseCol(colToken);
    if ((0, error_1.isError)(col)) {
        return col;
    }
    currWave.actions.push({
        op: "Cob",
        symbol,
        time,
        positions: rows.map(row => ({ row, col })),
        cobCol
    });
    return null;
}
exports.parseCob = parseCob;
function parseCardAndShovelTime(lineNum, timesToken, currWave) {
    let cardTimeToken;
    let shovelTimeToken;
    const delimIndex = Math.max(timesToken.lastIndexOf("+"), timesToken.lastIndexOf("~"));
    if (delimIndex <= 0) { // if starts with "+" (delimIndex is 0), still ignore it
        cardTimeToken = timesToken;
    }
    else {
        cardTimeToken = timesToken.slice(0, delimIndex);
        shovelTimeToken = (0, string_1.chopPrefix)(timesToken.slice(delimIndex), "~")[0];
    }
    const cardTime = parseTime(lineNum, cardTimeToken, currWave.actions.slice(-1)[0]?.time);
    if ((0, error_1.isError)(cardTime)) {
        return cardTime;
    }
    if (shovelTimeToken === undefined) {
        return [cardTime, null];
    }
    else {
        const shovelTime = parseTime(lineNum, shovelTimeToken, cardTime);
        if ((0, error_1.isError)(shovelTime)) {
            return shovelTime;
        }
        if (shovelTime < cardTime) {
            return (0, error_1.error)(lineNum, "铲除时机不可早于用垫时机", shovelTimeToken);
        }
        return [cardTime, shovelTime];
    }
}
;
function parseCardCol(lineNum, colToken, desc) {
    const col = (0, string_1.parseNatural)(colToken);
    if (col === null || col < 1 || col > 9) {
        return (0, error_1.error)(lineNum, `用${desc}列应为 1~9 内的整数`, colToken);
    }
    return col;
}
;
function parseFodder(out, lineNum, line) {
    const [currWaveNum, currWave] = lastWave(out);
    if (currWaveNum === undefined || currWave === undefined) {
        return (0, error_1.error)(lineNum, "请先设定波次", line);
    }
    const parseRows = (rowsToken) => {
        const rows = [];
        let skip = false;
        for (const [i, rowToken] of [...rowsToken].entries()) {
            if (skip) {
                skip = false;
            }
            else {
                const row = (0, string_1.parseNatural)(rowToken);
                if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
                    return (0, error_1.error)(lineNum, `用垫行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
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
    const parseFodderArgs = (fodderArgTokens, cardNum, mustProvideChoose) => {
        const fodderArgs = {};
        for (const fodderArgToken of fodderArgTokens) {
            if (!fodderArgToken.includes(":")) {
                return (0, error_1.error)(lineNum, "传参格式应为 [参数]:[值] ", fodderArgToken);
            }
            let key = fodderArgToken.split(":")[0];
            let value = fodderArgToken.split(":")[1];
            if (key.length === 0) {
                return (0, error_1.error)(lineNum, "参数不可为空", fodderArgToken);
            }
            if (value.length === 0) {
                return (0, error_1.error)(lineNum, "值不可为空", fodderArgToken);
            }
            if (key in fodderArgs) {
                return (0, error_1.error)(lineNum, "参数重复", key);
            }
            if (key === "choose") {
                const chooseNum = (0, string_1.parseNatural)(value);
                if (chooseNum === null || chooseNum < 1 || chooseNum > cardNum) {
                    return (0, error_1.error)(lineNum, `choose 的值应为 1~${cardNum} 内的整数`, value);
                }
                fodderArgs[key] = chooseNum;
            }
            else if (key === "waves") {
                const waves = [];
                for (const waveNumToken of value) {
                    const waveNum = (0, string_1.parseNatural)(waveNumToken);
                    if (waveNum === null || waveNum < 1 || waveNum > currWaveNum) {
                        return (0, error_1.error)(lineNum, `waves 的值应为 1~${currWaveNum} 内的整数`, value);
                    }
                    if (waves.includes(waveNum)) {
                        return (0, error_1.error)(lineNum, "waves 重复", waveNum.toString());
                    }
                    waves.push(waveNum);
                }
                fodderArgs[key] = waves;
            }
            else {
                return (0, error_1.error)(lineNum, "未知参数", key);
            }
        }
        if (mustProvideChoose && fodderArgs.choose === undefined) {
            return (0, error_1.error)(lineNum, "必须提供 choose 的值", "");
        }
        return { choose: fodderArgs.choose ?? cardNum, waves: fodderArgs.waves ?? [] };
    };
    const tokens = line.split(" ");
    const symbol = tokens[0], timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3], fodderArgTokens = tokens.slice(4);
    if (timeToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用垫时机", line);
    }
    if (rowsToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用垫行", line);
    }
    if (colToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用垫列", line);
    }
    const times = parseCardAndShovelTime(lineNum, timeToken, currWave);
    if ((0, error_1.isError)(times)) {
        return times;
    }
    const time = times[0], shovelTime = times[1] ?? undefined;
    const rows = parseRows(rowsToken);
    if ((0, error_1.isError)(rows)) {
        return rows;
    }
    const col = parseCardCol(lineNum, colToken, "垫");
    if ((0, error_1.isError)(col)) {
        return col;
    }
    const cards = rows.map(({ card }) => card);
    const positions = rows.map(({ row }) => ({ row, col }));
    if (symbol === "C") {
        currWave.actions.push({
            op: "FixedFodder",
            symbol,
            time,
            shovelTime,
            fodders: cards,
            positions
        });
    }
    else {
        const fodderArgs = parseFodderArgs(fodderArgTokens, rows.length, symbol === "C_POS");
        if ((0, error_1.isError)(fodderArgs)) {
            return fodderArgs;
        }
        const { choose, waves } = fodderArgs;
        currWave.actions.push({
            op: "SmartFodder",
            symbol,
            time,
            shovelTime,
            fodders: cards,
            positions,
            choose,
            waves,
        });
    }
    return null;
}
exports.parseFodder = parseFodder;
function parseJalapeno(out, lineNum, line) {
    const currWave = lastWave(out)[1];
    if (currWave === undefined) {
        return (0, error_1.error)(lineNum, "请先设定波次", line);
    }
    const parseRow = (rowToken) => {
        const row = (0, string_1.parseNatural)(rowToken);
        if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
            return (0, error_1.error)(lineNum, `用卡行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
        }
        return row;
    };
    const tokens = line.split(" ");
    const symbol = tokens[0], timeToken = tokens[1], rowToken = tokens[2], colToken = tokens[3];
    if (timeToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用卡时机", line);
    }
    if (rowToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用卡行", line);
    }
    if (colToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用卡列", line);
    }
    const time = parseTime(lineNum, timeToken, currWave.actions.slice(-1)[0]?.time);
    if ((0, error_1.isError)(time)) {
        return time;
    }
    const row = parseRow(rowToken);
    if ((0, error_1.isError)(row)) {
        return row;
    }
    const col = parseCardCol(lineNum, colToken, "卡");
    if ((0, error_1.isError)(col)) {
        return col;
    }
    currWave.actions.push({
        op: "Jalapeno",
        symbol,
        time,
        position: { row, col }
    });
    return null;
}
exports.parseJalapeno = parseJalapeno;
function parseSet(out, lineNum, line) {
    const tokens = line.split(" ");
    if (tokens.length < 3) {
        return (0, error_1.error)(lineNum, "请提供变量名与表达式", line);
    }
    const varName = tokens[1], expr = tokens[2];
    if (varName.length === 0) {
        return (0, error_1.error)(lineNum, "变量名不可为空", line);
    }
    if (/^\d+$/.test(varName)) {
        return (0, error_1.error)(lineNum, "变量名不可为纯数字", varName);
    }
    if (expr.length === 0) {
        return (0, error_1.error)(lineNum, "表达式不可为空", line);
    }
    if (!(/^[0-9+\-*/()]+$/.test(expr))) {
        return (0, error_1.error)(lineNum, "表达式只能包含数字、运算符与括号", expr);
    }
    const val = Number(eval(expr));
    if (!isFinite(val)) {
        return (0, error_1.error)(lineNum, "表达式无效", expr);
    }
    if (out.setting.variables === undefined) {
        out.setting.variables = {};
    }
    out.setting.variables[varName] = val;
    return null;
}
exports.parseSet = parseSet;
function parseScene(out, lines) {
    for (const { lineNum, line } of lines) {
        if (line.startsWith("scene:")) {
            if ("scene" in out.setting) {
                return (0, error_1.error)(lineNum, "参数重复", "scene");
            }
            const scene = line.split(":").slice(1).join(":");
            const upperCasedScene = scene.toUpperCase();
            if (["DE", "NE"].includes(upperCasedScene)) {
                out.setting.scene = "NE";
            }
            else if (["PE", "FE"].includes(upperCasedScene)) {
                out.setting.scene = "FE";
            }
            else if (["RE", "ME"].includes(upperCasedScene)) {
                out.setting.scene = "ME";
            }
            else {
                return (0, error_1.error)(lineNum, "未知场地", scene);
            }
        }
    }
    if (out.setting.scene === undefined) {
        out.setting.scene = "FE";
    }
    return null;
}
exports.parseScene = parseScene;
function parseProtect(out, lineNum, line) {
    if ("protect" in out.setting) {
        return (0, error_1.error)(lineNum, "参数重复", "protect");
    }
    const value = line.split(":").slice(1).join(":");
    if (value.length === 0) {
        return (0, error_1.error)(lineNum, "protect 的值不可为空", line);
    }
    out.setting.protect = [];
    for (let posToken of value.split(" ")) {
        const [choppedPosToken, isNormal] = (0, string_1.chopSuffix)(posToken, "'");
        if (choppedPosToken.length < 2) {
            return (0, error_1.error)(lineNum, "请提供要保护的行与列", line);
        }
        const rowToken = choppedPosToken[0], colToken = choppedPosToken[1];
        const row = (0, string_1.parseNatural)(rowToken), col = (0, string_1.parseNatural)(colToken);
        if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
            return (0, error_1.error)(lineNum, `保护行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
        }
        const minCol = isNormal ? 1 : 2;
        if (col === null || col < minCol || col > 9) {
            return (0, error_1.error)(lineNum, `${isNormal ? "普通植物" : "炮"}所在列应为 ${minCol}~9 内的整数`, colToken);
        }
        const pos = { type: isNormal ? "Normal" : "Cob", row, col };
        if (out.setting.protect.map(pos => pos.row).includes(row)) {
            return (0, error_1.error)(lineNum, "保护位置重叠", posToken);
        }
        out.setting.protect.push(pos);
    }
    return null;
}
exports.parseProtect = parseProtect;
function parseIntArg(args, argName, argFlag, lineNum, line) {
    if (argName in args) {
        return (0, error_1.error)(lineNum, "参数重复", argName);
    }
    const value = line.split(":").slice(1).join(":");
    const parsedValue = (0, string_1.parseNatural)(value);
    if (parsedValue === null || parsedValue <= 0) {
        return (0, error_1.error)(lineNum, `${argName} 的值应为正整数`, value);
    }
    args[argName] = [argFlag, parsedValue.toString()];
    return null;
}
exports.parseIntArg = parseIntArg;
function parse(text) {
    const out = { setting: {} };
    const args = {};
    const lines = expandLines(text.split(/\r?\n/));
    if ((0, error_1.isError)(lines)) {
        return lines;
    }
    const parseResult = parseScene(out, lines);
    if ((0, error_1.isError)(parseResult)) {
        return parseResult;
    }
    for (let { lineNum, line } of lines) {
        if (line.length > 0 && !line.startsWith("scene:")) {
            line = replaceVariables(out, line);
            const symbol = line.split(" ")[0];
            let parseResult = null;
            if (symbol.startsWith("protect:")) {
                parseResult = parseProtect(out, lineNum, line);
            }
            else if (symbol.startsWith("repeat:")) {
                parseResult = parseIntArg(args, "repeat", "-r", lineNum, line);
            }
            else if (symbol.startsWith("w")) {
                parseResult = parseWave(out, lineNum, line);
            }
            else if (/^(B|P|D)\d?$/.test(symbol.toUpperCase())) {
                parseResult = parseCob(out, lineNum, line, 1);
            }
            else if (/^(BB|PP|DD)\d?$/.test(symbol.toUpperCase())) {
                parseResult = parseCob(out, lineNum, line, 2);
            }
            else if (symbol === "C" || symbol === "C_POS" || symbol === "C_NUM") {
                parseResult = parseFodder(out, lineNum, line);
            }
            else if (symbol === "J") {
                parseResult = parseJalapeno(out, lineNum, line);
            }
            else if (symbol === "SET") {
                parseResult = parseSet(out, lineNum, line);
            }
            else {
                parseResult = (0, error_1.error)(lineNum, "未知符号", symbol);
            }
            if ((0, error_1.isError)(parseResult)) {
                return parseResult;
            }
        }
    }
    delete out.setting.variables;
    return { out, args };
}
exports.parse = parse;
function lastWave(out) {
    const numberKeys = Object.keys(out).map(key => Number(key)).filter(key => !isNaN(key));
    if (numberKeys.length === 0) {
        return [undefined, undefined];
    }
    else {
        const largestNumberKey = Math.max(...numberKeys);
        return [largestNumberKey, out[largestNumberKey]];
    }
}
function expandLines(lines) {
    const originalLines = lines.map((line, lineNum) => ({ lineNum: lineNum + 1, line: line.split("#")[0].trim() }));
    const expandedLines = [];
    const populateLineWithWave = (line, waveNum) => {
        if (line.startsWith("w")) {
            return `w${waveNum} ${line.split(" ").slice(1).join(" ")}`.trim();
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
            const startWave = (0, string_1.parseNatural)(symbol.slice(1, symbol.indexOf("~")));
            const endWave = (0, string_1.parseNatural)(symbol.slice(symbol.indexOf("~") + 1));
            if (startWave === null || endWave === null) {
                return (0, error_1.error)(lineNum, "波数应为正整数", symbol);
            }
            if (startWave > endWave) {
                return (0, error_1.error)(lineNum, "起始波数应大于终止波数", symbol);
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
function replaceVariables(out, line) {
    if (out.setting.variables === undefined) {
        return line;
    }
    else {
        const reservedNum = line.startsWith("SET") ? 2 : 1;
        let head = line.split(" ").slice(0, reservedNum).join(" ");
        let tail = line.split(" ").slice(reservedNum).join(" ");
        for (const [varName, varValue] of Object.entries(out.setting.variables)) {
            tail = tail.replaceAll(varName, varValue.toString());
        }
        return [head, tail].join(" ").trim();
    }
}
exports.replaceVariables = replaceVariables;
//# sourceMappingURL=parser.js.map