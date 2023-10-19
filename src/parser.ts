import { Error, error, isError } from "./error";
import { chopPrefix, chopSuffix, parseNatural, parseDecimal } from "./string";

type Position = {
	readonly row: number;
	readonly col: number;
};

type Cob = {
	readonly op: "Cob";
	readonly symbol: string;
	readonly time: number;
	readonly positions: Position[];
	readonly cobCol?: number;
};

type Jalapeno = {
	readonly op: "Jalapeno";
	readonly symbol: string;
	readonly time: number;
	readonly position: Position;
};

type Fodder = "Normal" | "Puff" | "Pot";

type FixedFodder = {
	readonly op: "FixedFodder";
	readonly symbol: string;
	readonly time: number;
	readonly shovelTime?: number;
	readonly fodders: Fodder[];
	readonly positions: Position[];
};

type SmartFodder = {
	readonly op: "SmartFodder";
	readonly symbol: string;
	readonly time: number;
	readonly shovelTime?: number;
	readonly fodders: Fodder[];
	readonly positions: Position[];
	readonly choose: number;
	readonly waves: number[];
};

type Action = Cob | Jalapeno | FixedFodder | SmartFodder;

type Wave = {
	readonly iceTimes: number[],
	readonly waveLength: number,
	readonly actions: Action[]
};

type ProtectPos = {
	readonly type: "Cob" | "Normal"
} & Position;

export type ParserOutput = {
	setting: {
		protect?: ProtectPos[],
		scene?: "NE" | "FE" | "ME",
		variables?: { [key: string]: number },
	},
	[key: number]: Wave;
};

function getMaxRows(scene: "NE" | "FE" | "ME" | undefined) {
	if (scene === undefined || scene === "FE") {
		return 6;
	} else {
		return 5;
	}
}

export function parseWave(out: ParserOutput, lineNum: number, line: string): null | Error {
	const parseWaveNum = (waveNumToken: string): number | Error => {
		const waveNum = parseNatural(waveNumToken.slice(1));

		if (waveNum === null || waveNum < 1 || waveNum > 9) {
			return error(lineNum, "波数应为 1~9 内的整数", waveNumToken);
		}

		return waveNum;
	};

	const parseIceTimes = (iceTimeTokens: readonly string[]): number[] | Error => {
		const iceTimes = [];
		for (const iceTimeToken of iceTimeTokens) {
			const iceTime = parseNatural(iceTimeToken);

			if (iceTime === null || iceTime <= 0) {
				return error(lineNum, "用冰时机应为正整数", iceTimeToken);
			}

			iceTimes.push(iceTime);
		}
		return iceTimes;
	};

	const parseWaveLength = (waveLengthToken: string): number | Error => {
		const waveLength = parseNatural(waveLengthToken);

		if (waveLength === null || waveLength < 601) {
			return error(lineNum, "波长应为 >= 601 的整数", waveLengthToken);
		}

		return waveLength;
	};

	const tokens = line.split(" ");
	if (tokens.length < 2) {
		return error(lineNum, "请提供波长", line);
	}

	const waveNumToken = tokens[0]!,
		iceTimeTokens = tokens.slice(1, - 1),
		waveLengthToken = tokens[tokens.length - 1]!;

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

function parseTime(lineNum: number, timeToken: string, prevTime: number | undefined): number | Error {
	const [choppedTimeToken, isDelay] = chopPrefix(timeToken, "+");

	const time = parseNatural(choppedTimeToken);
	if (time === null || time < 0) {
		return error(lineNum, "时间应为非负整数", choppedTimeToken);
	}

	if (!isDelay) {
		return time;
	} else {
		if (prevTime === undefined) {
			return error(lineNum, "没有延迟基准", timeToken);
		};
		return prevTime + time;
	}
};

export function parseCob(out: ParserOutput, lineNum: number, line: string, cobNum: number): null | Error {
	const currWave = lastWave(out)[1];
	if (currWave === undefined) {
		return error(lineNum, "请先设定波次", line);
	}

	const parseRows = (rowsToken: string): number[] | Error => {
		if (rowsToken.length !== cobNum) {
			return error(lineNum, `请提供 ${cobNum} 个落点行`, rowsToken);
		}

		const rows = [];
		for (const rowToken of rowsToken) {
			const row = parseNatural(rowToken);
			if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
				return error(lineNum, `落点行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
			}
			rows.push(row);
		}
		rows.sort();
		return rows;
	};

	const parseCol = (colToken: string): number | Error => {
		const col = parseDecimal(colToken);

		if (col === null || col < 0.0 || col > 10.0) {
			return error(lineNum, "落点列应为 0.0~10.0 内的数字", colToken);
		}

		return col;
	};

	const tokens = line.split(" ");
	const symbol = tokens[0]!, timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3];

	if (timeToken === undefined) {
		return error(lineNum, "请提供炮生效时机", line);
	}
	if (rowsToken === undefined) {
		return error(lineNum, "请提供落点行", line);
	}
	if (colToken === undefined) {
		return error(lineNum, "请提供落点列", line);
	}

	let cobCol: number | undefined;
	if (/\d$/.test(symbol)) {
		if (out.setting.scene !== "ME") {
			return error(lineNum, "只有屋顶场合可以指定炮尾列", symbol);
		}

		const parsedCobCol = parseNatural(symbol.slice(-1));
		if (parsedCobCol === null || parsedCobCol < 1 || parsedCobCol > 8) {
			return error(lineNum, "炮尾列应为 1~8 内的整数", symbol.slice(-1));
		}
		cobCol = parsedCobCol;
	} else {
		if (out.setting.scene === "ME") {
			return error(lineNum, "屋顶场合请提供落点列", line);
		}
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
		positions: rows.map(row => ({ row, col })),
		cobCol
	});
	return null;
}

function parseCardAndShovelTime(lineNum: number, timesToken: string, currWave: Wave)
	: [number, number | null] | Error {
	let cardTimeToken: string;
	let shovelTimeToken: string | undefined;

	const delimIndex = Math.max(timesToken.lastIndexOf("+"), timesToken.lastIndexOf("~"));
	if (delimIndex <= 0) {  // if starts with "+" (delimIndex is 0), still ignore it
		cardTimeToken = timesToken;
	} else {
		cardTimeToken = timesToken.slice(0, delimIndex);
		shovelTimeToken = chopPrefix(timesToken.slice(delimIndex), "~")[0];
	}

	const cardTime = parseTime(lineNum, cardTimeToken, currWave.actions.slice(-1)[0]?.time);
	if (isError(cardTime)) {
		return cardTime;
	}

	if (shovelTimeToken === undefined) {
		return [cardTime, null];
	} else {
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

function parseCardCol(lineNum: number, colToken: string, desc: string): number | Error {
	const col = parseNatural(colToken);

	if (col === null || col < 1 || col > 9) {
		return error(lineNum, `用${desc}列应为 1~9 内的整数`, colToken);
	}

	return col;
};

export function parseFodder(out: ParserOutput, lineNum: number, line: string): null | Error {
	const [currWaveNum, currWave] = lastWave(out);
	if (currWaveNum === undefined || currWave === undefined) {
		return error(lineNum, "请先设定波次", line);
	}

	const parseRows = (rowsToken: string): { row: number, card: Fodder }[] | Error => {
		const rows: { row: number, card: Fodder }[] = [];

		let skip = false;
		for (const [i, rowToken] of [...rowsToken].entries()) {
			if (skip) {
				skip = false;
			} else {
				const row = parseNatural(rowToken);
				if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
					return error(lineNum, `用垫行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
				}

				let card: Fodder = "Normal";
				const nextChar = rowsToken[i + 1];;

				if (nextChar !== undefined) {
					if (nextChar === `'`) {
						card = "Puff";
						skip = true;
					} else if (nextChar === `"`) {
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

	const parseFodderArgs = (fodderArgTokens: string[], cardNum: number, mustProvideChoose: boolean)
		: { "choose": number, "waves": number[] } | Error => {

		const fodderArgs: { "choose"?: number, "waves"?: number[] } = {};
		for (const fodderArgToken of fodderArgTokens) {
			if (!fodderArgToken.includes(":")) {
				return error(lineNum, "传参格式应为 [参数]:[值] ", fodderArgToken);
			}

			let key = fodderArgToken.split(":")[0]!;
			let value = fodderArgToken.split(":")[1]!;

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
				const chooseNum = parseNatural(value);
				if (chooseNum === null || chooseNum < 1 || chooseNum > cardNum) {
					return error(lineNum, `choose 的值应为 1~${cardNum} 内的整数`, value);
				}
				fodderArgs[key] = chooseNum;
			} else if (key === "waves") {
				const waves: number[] = [];

				for (const waveNumToken of value) {
					const waveNum = parseNatural(waveNumToken);
					if (waveNum === null || waveNum < 1 || waveNum > currWaveNum) {
						return error(lineNum, `waves 的值应为 1~${currWaveNum} 内的整数`, value);
					}
					if (waves.includes(waveNum)) {
						return error(lineNum, "waves 重复", waveNum.toString());
					}
					waves.push(waveNum);
				}
				fodderArgs[key] = waves;
			} else {
				return error(lineNum, "未知参数", key);
			}
		}

		if (mustProvideChoose && fodderArgs.choose === undefined) {
			return error(lineNum, "必须提供 choose 的值", "");
		}
		return { choose: fodderArgs.choose ?? cardNum, waves: fodderArgs.waves ?? [] };
	};

	const tokens = line.split(" ");
	const symbol = tokens[0]!, timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3], fodderArgTokens = tokens.slice(4);

	if (timeToken === undefined) {
		return error(lineNum, "请提供用垫时机", line);
	}
	if (rowsToken === undefined) {
		return error(lineNum, "请提供用垫行", line);
	}
	if (colToken === undefined) {
		return error(lineNum, "请提供用垫列", line);
	}

	const times = parseCardAndShovelTime(lineNum, timeToken, currWave);
	if (isError(times)) {
		return times;
	}
	const time = times[0], shovelTime = times[1] ?? undefined;

	const rows = parseRows(rowsToken);
	if (isError(rows)) {
		return rows;
	}

	const col = parseCardCol(lineNum, colToken, "垫");
	if (isError(col)) {
		return col;
	}

	const cards: Fodder[] = rows.map(({ card }) => card);
	const positions: Position[] = rows.map(({ row }) => ({ row, col }));

	if (symbol === "C") {
		currWave.actions.push({
			op: "FixedFodder",
			symbol,
			time,
			shovelTime,
			fodders: cards,
			positions
		});
	} else {
		const fodderArgs = parseFodderArgs(fodderArgTokens, rows.length, symbol === "C_POS");
		if (isError(fodderArgs)) {
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

export function parseJalapeno(out: ParserOutput, lineNum: number, line: string): null | Error {
	const currWave = lastWave(out)[1];
	if (currWave === undefined) {
		return error(lineNum, "请先设定波次", line);
	}

	const parseRow = (rowToken: string): number | Error => {
		const row = parseNatural(rowToken);
		if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
			return error(lineNum, `用卡行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
		}

		return row;
	};

	const tokens = line.split(" ");
	const symbol = tokens[0]!, timeToken = tokens[1], rowToken = tokens[2], colToken = tokens[3];

	if (timeToken === undefined) {
		return error(lineNum, "请提供用卡时机", line);
	}
	if (rowToken === undefined) {
		return error(lineNum, "请提供用卡行", line);
	}
	if (colToken === undefined) {
		return error(lineNum, "请提供用卡列", line);
	}

	const time = parseTime(lineNum, timeToken, currWave.actions.slice(-1)[0]?.time);
	if (isError(time)) {
		return time;
	}

	const row = parseRow(rowToken);
	if (isError(row)) {
		return row;
	}

	const col = parseCardCol(lineNum, colToken, "卡");
	if (isError(col)) {
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

export function parseSet(out: ParserOutput, lineNum: number, line: string): null | Error {
	const tokens = line.split(" ");

	if (tokens.length < 3) {
		return error(lineNum, "请提供变量名与表达式", line);
	}
	const varName = tokens[1]!, expr = tokens[2]!;
	if (varName.length === 0) {
		return error(lineNum, "变量名不可为空", line);
	}
	if (/^\d+$/.test(varName)) {
		return error(lineNum, "变量名不可为纯数字", varName);
	}

	if (expr.length === 0) {
		return error(lineNum, "表达式不可为空", line);
	}
	if (!(/^[0-9+\-*/()]+$/.test(expr))) {
		return error(lineNum, "表达式只能包含数字、运算符与括号", expr);
	}
	const val = Number(eval(expr));
	if (!isFinite(val)) {
		return error(lineNum, "表达式无效", expr);
	}

	if (out.setting.variables === undefined) {
		out.setting.variables = {};
	}
	out.setting.variables[varName] = val;
	return null;
}

export function parseScene(out: ParserOutput, lines: Line[]): null | Error {
	for (const { lineNum, line } of lines) {
		if (line.startsWith("scene:")) {
			if ("scene" in out.setting) {
				return error(lineNum, "参数重复", "scene");
			}

			const scene = line.split(":").slice(1).join(":");
			const upperCasedScene = scene.toUpperCase();

			if (["DE", "NE"].includes(upperCasedScene)) {
				out.setting.scene = "NE";
			} else if (["PE", "FE"].includes(upperCasedScene)) {
				out.setting.scene = "FE";
			} else if (["RE", "ME"].includes(upperCasedScene)) {
				out.setting.scene = "ME";
			} else {
				return error(lineNum, "未知场地", scene);
			}
		}
	}
	if (out.setting.scene === undefined) {
		out.setting.scene = "FE";
	}
	return null;
}

export function parseProtect(out: ParserOutput, lineNum: number, line: string): null | Error {
	if ("protect" in out.setting) {
		return error(lineNum, "参数重复", "protect");
	}
	const value = line.split(":").slice(1).join(":");
	if (value.length === 0) {
		return error(lineNum, "protect 的值不可为空", line);
	}

	out.setting.protect = [];

	for (let posToken of value.split(" ")) {
		const [choppedPosToken, isNormal] = chopSuffix(posToken, "'");

		if (choppedPosToken.length < 2) {
			return error(lineNum, "请提供要保护的行与列", line);
		}

		const rowToken = choppedPosToken[0]!, colToken = choppedPosToken[1]!;
		const row = parseNatural(rowToken), col = parseNatural(colToken);

		if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
			return error(lineNum, `保护行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
		}

		const minCol = isNormal ? 1 : 2;
		if (col === null || col < minCol || col > 9) {
			return error(lineNum, `${isNormal ? "普通植物" : "炮"}所在列应为 ${minCol}~9 内的整数`, colToken);
		}

		const pos: ProtectPos = { type: isNormal ? "Normal" : "Cob", row, col };

		if (out.setting.protect.map(pos => pos.row).includes(row)) {
			return error(lineNum, "保护位置重叠", posToken);
		}

		out.setting.protect.push(pos);
	}
	return null;
}

export function parseIntArg(args: { [key: string]: string[] }, argName: string, argFlag: string,
	lineNum: number, line: string): null | Error {
	if (argName in args) {
		return error(lineNum, "参数重复", argName);
	}
	const value = line.split(":").slice(1).join(":");

	const parsedValue = parseNatural(value);
	if (parsedValue === null || parsedValue <= 0) {
		return error(lineNum, `${argName} 的值应为正整数`, value);
	}
	args[argName] = [argFlag, parsedValue.toString()];
	return null;
}

export function parse(text: string) {
	const out: ParserOutput = { setting: {} };
	const args: { [key: string]: string[] } = {};

	const lines = expandLines(text.split(/\r?\n/));
	if (isError(lines)) {
		return lines;
	}

	const parseResult = parseScene(out, lines);
	if (isError(parseResult)) {
		return parseResult;
	}

	for (let { lineNum, line } of lines) {
		if (line.length > 0 && !line.startsWith("scene:")) {
			line = replaceVariables(out, line);
			const symbol = line.split(" ")[0]!;

			let parseResult = null;
			if (symbol.startsWith("protect:")) {
				parseResult = parseProtect(out, lineNum, line);
			} else if (symbol.startsWith("repeat:")) {
				parseResult = parseIntArg(args, "repeat", "-r", lineNum, line);
			} else if (symbol.startsWith("w")) {
				parseResult = parseWave(out, lineNum, line);
			} else if (/^(B|P|D)\d?$/.test(symbol.toUpperCase())) {
				parseResult = parseCob(out, lineNum, line, 1);
			} else if (/^(BB|PP|DD)\d?$/.test(symbol.toUpperCase())) {
				parseResult = parseCob(out, lineNum, line, 2);
			} else if (symbol === "C" || symbol === "C_POS" || symbol === "C_NUM") {
				parseResult = parseFodder(out, lineNum, line);
			} else if (symbol === "J") {
				parseResult = parseJalapeno(out, lineNum, line);
			} else if (symbol === "SET") {
				parseResult = parseSet(out, lineNum, line);
			} else {
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

function lastWave(out: ParserOutput): [number | undefined, Wave | undefined] {
	const numberKeys = Object.keys(out).map(key => Number(key)).filter(key => !isNaN(key));
	if (numberKeys.length === 0) {
		return [undefined, undefined];
	} else {
		const largestNumberKey = Math.max(...numberKeys);
		return [largestNumberKey, out[largestNumberKey]];
	}
}

type Line = {
	lineNum: number;
	line: string;
};

export function expandLines(lines: string[]): Line[] | Error {
	const originalLines: Line[] = lines.map((line, lineNum) =>
		({ lineNum: lineNum + 1, line: line.split("#")[0]!.trim() }));
	const expandedLines: Line[] = [];

	const populateLineWithWave = (line: string, waveNum: number) => {
		if (line.startsWith("w")) {
			return `w${waveNum} ${line.split(" ").slice(1).join(" ")}`.trim();
		} else {
			return line;
		}
	};

	for (let cur = 0; cur < originalLines.length; cur++) {
		let { lineNum, line } = originalLines[cur]!;

		const symbol = line.split(" ")[0]!;

		if (!(symbol.startsWith("w") && symbol.includes("~"))) {
			expandedLines.push({ lineNum, line });
		}
		else {
			const startWave = parseNatural(symbol.slice(1, symbol.indexOf("~")));
			const endWave = parseNatural(symbol.slice(symbol.indexOf("~") + 1));
			if (startWave === null || endWave === null) {
				return error(lineNum, "波数应为正整数", symbol);
			}
			if (startWave > endWave) {
				return error(lineNum, "起始波数应大于终止波数", symbol);
			}

			let nextCur = cur;
			while (nextCur + 1 < originalLines.length
				&& !originalLines[nextCur + 1]!.line.startsWith("w")) {
				nextCur++;
			}
			for (let waveNum = startWave; waveNum <= endWave; waveNum++) {
				for (let i = cur; i <= nextCur; i++) {
					const { lineNum, line } = originalLines[i]!;
					expandedLines.push({ lineNum, line: populateLineWithWave(line, waveNum) });
				}
			}
			cur = nextCur;
		}
	}
	return expandedLines;
}

export function replaceVariables(out: ParserOutput, line: string) {
	if (out.setting.variables === undefined) {
		return line;
	} else {
		const reservedNum = line.startsWith("SET") ? 2 : 1;
		let head = line.split(" ").slice(0, reservedNum).join(" ");
		let tail = line.split(" ").slice(reservedNum).join(" ");

		for (const [varName, varValue] of Object.entries(out.setting.variables)) {
			tail = tail.replaceAll(varName, varValue.toString());
		}
		return [head, tail].join(" ").trim();
	}
}