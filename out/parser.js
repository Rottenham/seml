"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceVariables = exports.expandLines = exports.parse = exports.parseBoolArg = exports.parseZombieTypeArg = exports.parseIntArg = exports.parseProtect = exports.parseScene = exports.parseSet = exports.parseSmartCard = exports.parseFixedCard = exports.parseFodder = exports.parseCob = exports.parseWave = void 0;
const error_1 = require("./error");
const string_1 = require("./string");
const plant_types_1 = require("./plant_types");
const zombie_types_1 = require("./zombie_types");
function getMaxRows(scene) {
    if (scene === undefined || scene === "FE") {
        return 6;
    }
    else {
        return 5;
    }
}
function parseWave(out, lineNum, line) {
    const parseWaveNum = (waveNumToken, prevWaveNum) => {
        if (waveNumToken === "w") {
            return prevWaveNum + 1;
        }
        else {
            const waveNum = (0, string_1.parseNatural)((0, string_1.chopPrefix)(waveNumToken, "w"));
            if (waveNum === null || waveNum < 1 || waveNum > 9) {
                return (0, error_1.error)(lineNum, "波数应为正整数", waveNumToken);
            }
            return waveNum;
        }
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
    const parseWaveRange = (waveRangeToken) => {
        const [startTickToken, waveLengthToken] = waveRangeToken.includes("~")
            ? [waveRangeToken.split("~")[0], waveRangeToken.split("~")[1]]
            : [undefined, waveRangeToken];
        const waveLength = (0, string_1.parseNatural)(waveLengthToken);
        if (waveLength === null || waveLength < 601) {
            return (0, error_1.error)(lineNum, "波长应为 >= 601 的整数", waveRangeToken);
        }
        let startTick;
        if (startTickToken !== undefined) {
            let parsedStartTick = (0, string_1.parseNatural)(startTickToken);
            if (parsedStartTick === null || parsedStartTick > waveLength) {
                return (0, error_1.error)(lineNum, "起始时刻应 <= 波长", startTickToken);
            }
            startTick = parsedStartTick;
        }
        return { waveLength, startTick };
    };
    const tokens = line.split(" ");
    if (tokens.length < 2) {
        return (0, error_1.error)(lineNum, "请提供波长", line);
    }
    const waveNumToken = tokens[0], iceTimeTokens = tokens.slice(1, -1), waveRangeToken = tokens[tokens.length - 1];
    const prevWaveNum = getCurrWaveNum(out);
    const waveNum = parseWaveNum(waveNumToken, prevWaveNum);
    if ((0, error_1.isError)(waveNum)) {
        return waveNum;
    }
    if (waveNum - 1 in out.waves) {
        return (0, error_1.error)(lineNum, "波数重复", waveNumToken);
    }
    if (prevWaveNum + 1 !== waveNum) {
        return (0, error_1.error)(lineNum, `请先设定第 ${prevWaveNum + 1} 波`, waveNumToken);
    }
    const iceTimes = parseIceTimes(iceTimeTokens);
    if ((0, error_1.isError)(iceTimes)) {
        return iceTimes;
    }
    const parsedWaveRange = parseWaveRange(waveRangeToken);
    if ((0, error_1.isError)(parsedWaveRange)) {
        return parsedWaveRange;
    }
    const { waveLength, startTick } = parsedWaveRange;
    const lastIceTime = iceTimes[iceTimes.length - 1];
    if (lastIceTime !== undefined && waveLength < lastIceTime) {
        return (0, error_1.error)(lineNum, "波长应 >= 最后一次用冰时机", line);
    }
    out.waves.push({ iceTimes: iceTimes, waveLength: waveLength, actions: [], startTick });
    return null;
}
exports.parseWave = parseWave;
function parseTime(lineNum, timeToken, prevTime) {
    const isDelay = timeToken.startsWith("+");
    const choppedTimeToken = (0, string_1.chopPrefix)(timeToken, "+");
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
    const currWave = getCurrWave(out);
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
    const symbol = tokens[0], timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3], tl = tokens.slice(4).join(" ");
    if (timeToken === undefined || rowsToken === undefined || colToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供炮生效时机, 落点行, 落点列", line);
    }
    if (tl.length > 0) {
        return (0, error_1.error)(lineNum, "多余的参数", tl);
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
            return (0, error_1.error)(lineNum, "屋顶场合请提供落点列", symbol);
        }
    }
    const time = parseTime(lineNum, timeToken, currWave.actions.slice(-1)[0]?.time);
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
function parseCardRow(out, lineNum, rowToken) {
    const row = (0, string_1.parseNatural)(rowToken);
    if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
        return (0, error_1.error)(lineNum, `用卡行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
    }
    return row;
}
function parseCardCol(lineNum, colToken) {
    const col = (0, string_1.parseNatural)(colToken);
    if (col === null || col < 1 || col > 9) {
        return (0, error_1.error)(lineNum, `用卡列应为 1~9 内的整数`, colToken);
    }
    return col;
}
;
function parseCardTimeAndShovelTime(lineNum, timesToken, currWave) {
    let cardTimeToken;
    let shovelTimeToken;
    const delimIndex = Math.max(timesToken.lastIndexOf("+"), timesToken.lastIndexOf("~"));
    if (delimIndex <= 0) { // if starts with "+" (delimIndex is 0), still ignore it
        cardTimeToken = timesToken;
    }
    else {
        cardTimeToken = timesToken.slice(0, delimIndex);
        shovelTimeToken = (0, string_1.chopPrefix)(timesToken.slice(delimIndex), "~");
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
            return (0, error_1.error)(lineNum, "铲除时机不可早于用卡时机", shovelTimeToken);
        }
        return [cardTime, shovelTime];
    }
}
;
function parseFodder(out, lineNum, line) {
    const currWaveNum = getCurrWaveNum(out);
    const currWave = getCurrWave(out);
    if (currWave === undefined) {
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
                    return (0, error_1.error)(lineNum, `用卡行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
                }
                if (rows.map(({ row }) => row).includes(row)) {
                    return (0, error_1.error)(lineNum, "用卡行重复", rowToken);
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
                for (const waveNumToken of value.split(",")) {
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
    if (timeToken === undefined || rowsToken === undefined || colToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用卡时机, 用卡行, 用卡列", line);
    }
    const times = parseCardTimeAndShovelTime(lineNum, timeToken, currWave);
    if ((0, error_1.isError)(times)) {
        return times;
    }
    const time = times[0], shovelTime = times[1] ?? undefined;
    const rows = parseRows(rowsToken);
    if ((0, error_1.isError)(rows)) {
        return rows;
    }
    const col = parseCardCol(lineNum, colToken);
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
        if (rowsToken.length < 2) {
            return (0, error_1.error)(lineNum, "请提供至少 2 个用卡行", rowsToken);
        }
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
function parseFixedCard(out, lineNum, line, plantType) {
    const currWave = getCurrWave(out);
    if (currWave === undefined) {
        return (0, error_1.error)(lineNum, "请先设定波次", line);
    }
    const tokens = line.split(" ");
    const symbol = tokens[0], timeToken = tokens[1], rowToken = tokens[2], colToken = tokens[3], tl = tokens.slice(4).join(" ");
    if (timeToken === undefined || rowToken === undefined || colToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用卡时机, 用卡行, 用卡列", line);
    }
    if (tl.length > 0) {
        return (0, error_1.error)(lineNum, "多余的参数", tl);
    }
    let time;
    let shovelTime = undefined;
    if (symbol === "G") {
        const parsedTimes = parseCardTimeAndShovelTime(lineNum, timeToken, currWave);
        if ((0, error_1.isError)(parsedTimes)) {
            return parsedTimes;
        }
        time = parsedTimes[0];
        shovelTime = parsedTimes[1] ?? undefined;
    }
    else {
        const parsedTime = parseTime(lineNum, timeToken, currWave.actions.slice(-1)[0]?.time);
        if ((0, error_1.isError)(parsedTime)) {
            return parsedTime;
        }
        time = parsedTime;
    }
    const row = parseCardRow(out, lineNum, rowToken);
    if ((0, error_1.isError)(row)) {
        return row;
    }
    const col = parseCardCol(lineNum, colToken);
    if ((0, error_1.isError)(col)) {
        return col;
    }
    currWave.actions.push({
        op: "FixedCard",
        symbol,
        time,
        shovelTime,
        plantType,
        position: { row, col }
    });
    return null;
}
exports.parseFixedCard = parseFixedCard;
function parseSmartCard(out, lineNum, line, plantType) {
    const currWave = getCurrWave(out);
    if (currWave === undefined) {
        return (0, error_1.error)(lineNum, "请先设定波次", line);
    }
    const parseRows = (rowsToken) => {
        if (rowsToken.length < 2) {
            return (0, error_1.error)(lineNum, "请提供至少 2 个用卡行", rowsToken);
        }
        const rows = [];
        for (const rowToken of rowsToken) {
            const row = (0, string_1.parseNatural)(rowToken);
            if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
                return (0, error_1.error)(lineNum, `用卡行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
            }
            if (rows.includes(row)) {
                return (0, error_1.error)(lineNum, "用卡行重复", rowToken);
            }
            rows.push(row);
        }
        rows.sort();
        return rows;
    };
    const tokens = line.split(" ");
    const symbol = tokens[0], timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3], tl = tokens.slice(4).join(" ");
    if (timeToken === undefined || rowsToken === undefined || colToken === undefined) {
        return (0, error_1.error)(lineNum, "请提供用卡时机, 用卡行, 用卡列", line);
    }
    if (tl.length > 0) {
        return (0, error_1.error)(lineNum, "多余的参数", tl);
    }
    const time = parseTime(lineNum, timeToken, currWave.actions.slice(-1)[0]?.time);
    if ((0, error_1.isError)(time)) {
        return time;
    }
    const rows = parseRows(rowsToken);
    if ((0, error_1.isError)(rows)) {
        return rows;
    }
    const col = parseCardCol(lineNum, colToken);
    if ((0, error_1.isError)(col)) {
        return col;
    }
    currWave.actions.push({
        op: "SmartCard",
        symbol,
        time,
        plantType,
        positions: rows.map(row => ({ row, col }))
    });
    return null;
}
exports.parseSmartCard = parseSmartCard;
function parseSet(out, lineNum, line) {
    const tokens = line.split(" ");
    const varName = tokens[1], expr = tokens.slice(2).join(" ");
    if (varName === undefined) {
        return (0, error_1.error)(lineNum, "请提供变量名与表达式", line);
    }
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
    const value = line.split(":").slice(1).join(":").trim();
    if (value.length === 0) {
        return (0, error_1.error)(lineNum, "protect 的值不可为空", line);
    }
    out.setting.protect = [];
    for (let posToken of value.split(" ")) {
        const isNormal = posToken.endsWith("'");
        const choppedPosToken = (0, string_1.chopSuffix)(posToken, "'");
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
        for (const prevPos of out.setting.protect) {
            if (prevPos.row === pos.row) {
                for (const prevCol of (prevPos.type === "Normal" ? [prevPos.col] : [prevPos.col - 1, prevPos.col])) {
                    for (const col of (pos.type === "Normal" ? [pos.col] : [pos.col - 1, pos.col])) {
                        if (prevCol === col) {
                            return (0, error_1.error)(lineNum, "保护位置重叠", posToken);
                        }
                    }
                }
            }
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
    const value = line.split(":").slice(1).join(":").trim();
    const parsedInt = (0, string_1.parseNatural)(value);
    if (parsedInt === null || parsedInt <= 0) {
        return (0, error_1.error)(lineNum, `${argName} 的值应为正整数`, value);
    }
    args[argName] = [argFlag, parsedInt.toString()];
    return null;
}
exports.parseIntArg = parseIntArg;
function parseZombieTypeArg(args, argName, argFlag, lineNum, line, prevTypesStr) {
    if (argName in args) {
        return (0, error_1.error)(lineNum, "参数重复", argName);
    }
    const zombieTypeAbbrs = line.split(":").slice(1).join(":").trim();
    const containChinese = !/^[A-Za-z\s]*$/.test(zombieTypeAbbrs);
    const prevTypes = prevTypesStr === undefined ? [] : prevTypesStr.split(",").map(type => parseInt(type));
    const zombieTypes = [];
    for (const zombieTypeAbbr of containChinese ? zombieTypeAbbrs : zombieTypeAbbrs.split(" ")) {
        const lowerCasedZombieTypeAbbr = zombieTypeAbbr.toLowerCase();
        let zombieType;
        if (containChinese) {
            const parsedZombieType = zombie_types_1.zombieTypeCNAbbrToEnum[lowerCasedZombieTypeAbbr];
            if (parsedZombieType === undefined) {
                return (0, error_1.error)(lineNum, `未知僵尸类型`, `${zombieTypeAbbr} (可用的僵尸类型: ${Object.keys(zombie_types_1.zombieTypeCNAbbrToEnum)})`);
            }
            zombieType = parsedZombieType;
        }
        else {
            const parsedZombieType = zombie_types_1.zombieTypeENAbbrToEnum[lowerCasedZombieTypeAbbr];
            if (parsedZombieType === undefined) {
                let errorSrc = zombieTypeAbbr;
                const closestZombieType = (0, string_1.findClosestString)(lowerCasedZombieTypeAbbr, Object.keys(zombie_types_1.zombieTypeENAbbrToEnum));
                if (closestZombieType !== null) {
                    errorSrc += ` (您是否要输入 ${closestZombieType}?)`;
                }
                return (0, error_1.error)(lineNum, `未知僵尸类型`, errorSrc);
            }
            zombieType = parsedZombieType;
        }
        if (zombieTypes.includes(zombieType) || prevTypes.includes(zombieType)) {
            return (0, error_1.error)(lineNum, "僵尸类型重复", zombieTypeAbbr);
        }
        zombieTypes.push(zombieType);
    }
    args[argName] = [argFlag, zombieTypes.join(",")];
    return null;
}
exports.parseZombieTypeArg = parseZombieTypeArg;
function parseBoolArg(args, argName, argFlag, lineNum, line) {
    if (argName in args) {
        return (0, error_1.error)(lineNum, "参数重复", argName);
    }
    const value = line.split(":").slice(1).join(":").trim().toLowerCase();
    if (value !== "true" && value !== "false") {
        return (0, error_1.error)(lineNum, `${argName} 的值应为 true 或 false`, value);
    }
    if (value === "true") {
        args[argName] = [argFlag];
    }
    return null;
}
exports.parseBoolArg = parseBoolArg;
function parse(text) {
    const out = { setting: {}, waves: [] };
    const args = {};
    const lines = expandLines(text.split(/\r?\n/)); // \r\n matches line break characters
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
            else if (symbol.startsWith("require:")) {
                parseResult = parseZombieTypeArg(args, "require", "-req", lineNum, line, args["ban"]?.[1]);
            }
            else if (symbol.startsWith("ban:")) {
                parseResult = parseZombieTypeArg(args, "ban", "-ban", lineNum, line, args["require"]?.[1]);
            }
            else if (symbol.startsWith("huge:")) {
                parseResult = parseBoolArg(args, "huge", "-h", lineNum, line);
            }
            else if (symbol.startsWith("assume_activate:")) {
                parseResult = parseBoolArg(args, "assume_activate", "-a", lineNum, line);
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
            else if (symbol === "G") {
                parseResult = parseFixedCard(out, lineNum, line, plant_types_1.PlantType.garlic);
            }
            else if (symbol === "A") {
                parseResult = parseFixedCard(out, lineNum, line, plant_types_1.PlantType.cherryBomb);
            }
            else if (symbol === "J") {
                parseResult = parseFixedCard(out, lineNum, line, plant_types_1.PlantType.jalapeno);
            }
            else if (symbol === "a") {
                parseResult = parseFixedCard(out, lineNum, line, plant_types_1.PlantType.squash);
            }
            else if (symbol === "A_NUM") {
                parseResult = parseSmartCard(out, lineNum, line, plant_types_1.PlantType.cherryBomb);
            }
            else if (symbol === "J_NUM") {
                parseResult = parseSmartCard(out, lineNum, line, plant_types_1.PlantType.jalapeno);
            }
            else if (symbol === "a_NUM") {
                parseResult = parseSmartCard(out, lineNum, line, plant_types_1.PlantType.squash);
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
    for (const wave of out.waves) {
        wave.actions.sort((a, b) => a.time - b.time);
    }
    return { out, args };
}
exports.parse = parse;
function expandLines(lines) {
    const originalLines = lines.map((line, lineNum) => ({
        lineNum: lineNum + 1, line: line
            .split("#")[0].trim() // ignore comments 
            .replace(/[ \t]+/g, ' ') // replace multiple spaces/tabs with one space
    }));
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
            let prevCur = cur;
            while (cur + 1 < originalLines.length
                && !originalLines[cur + 1].line.startsWith("w")) {
                cur++;
            }
            for (let waveNum = startWave; waveNum <= endWave; waveNum++) {
                for (let i = prevCur; i <= cur; i++) {
                    const { lineNum, line } = originalLines[i];
                    expandedLines.push({ lineNum, line: populateLineWithWave(line, waveNum) });
                }
            }
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
function getCurrWaveNum(out) {
    return out.waves.length;
}
function getCurrWave(out) {
    return out.waves.slice(-1)[0];
}
//# sourceMappingURL=parser.js.map