import { Error, error, isError } from "./error";
import { chopPrefix, chopSuffix, parseNatural, parseDecimal, findClosestString } from "./string";
import { PlantType } from "./plant_types";
import { zombieTypeCNAbbrToEnum, zombieTypeENAbbrToEnum } from "./zombie_types";

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

type FixedCard = {
	readonly op: "FixedCard";
	readonly symbol: string;
	readonly time: number;
	readonly shovelTime?: number;
	readonly plantType: PlantType;
	readonly position: Position;
};

type SmartCard = {
	readonly op: "SmartCard";
	readonly symbol: string;
	readonly time: number;
	readonly plantType: PlantType;
	readonly positions: Position[];
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

type Action = Cob | FixedCard | SmartCard | FixedFodder | SmartFodder;

type Wave = {
	readonly iceTimes: number[],
	readonly waveLength: number,
	readonly actions: Action[],
	readonly startTick?: number,
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
	waves: Wave[],
};

function getMaxRows(scene: "NE" | "FE" | "ME" | undefined) {
	if (scene === undefined || scene === "FE") {
		return 6;
	} else {
		return 5;
	}
}

export function parseWave(out: ParserOutput, lineNum: number, line: string): null | Error {
	const parseWaveNum = (waveNumToken: string, prevWaveNum: number): number | Error => {
		if (waveNumToken === "w") {
			return prevWaveNum + 1;
		} else {
			const waveNum = parseNatural(chopPrefix(waveNumToken, "w"));

			if (waveNum === null || waveNum < 1 || waveNum > 9) {
				return error(lineNum, "波数应为正整数", waveNumToken);
			}

			return waveNum;
		}
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

	const parseWaveRange = (waveRangeToken: string): { waveLength: number, startTick?: number } | Error => {
		const [startTickToken, waveLengthToken] = waveRangeToken.includes("~")
			? [waveRangeToken.split("~")[0]!, waveRangeToken.split("~")[1]!]
			: [undefined, waveRangeToken];

		const waveLength = parseNatural(waveLengthToken);
		if (waveLength === null || waveLength < 601) {
			return error(lineNum, "波长应为 >= 601 的整数", waveRangeToken);
		}

		let startTick: number | undefined;
		if (startTickToken !== undefined) {
			let parsedStartTick = parseNatural(startTickToken);
			if (parsedStartTick === null || parsedStartTick > waveLength) {
				return error(lineNum, "起始时刻应 <= 波长", startTickToken);
			}
			startTick = parsedStartTick;
		}

		return { waveLength, startTick };
	};

	const tokens = line.split(" ");
	if (tokens.length < 2) {
		return error(lineNum, "请提供波长", line);
	}

	const waveNumToken = tokens[0]!,
		iceTimeTokens = tokens.slice(1, - 1),
		waveRangeToken = tokens[tokens.length - 1]!;

	const prevWaveNum = getCurrWaveNum(out);
	const waveNum = parseWaveNum(waveNumToken, prevWaveNum);
	if (isError(waveNum)) {
		return waveNum;
	}
	if (waveNum - 1 in out.waves!) {
		return error(lineNum, "波数重复", waveNumToken);
	}
	if (prevWaveNum + 1 !== waveNum) {
		return error(lineNum, `请先设定第 ${prevWaveNum + 1} 波`, waveNumToken);
	}

	const iceTimes = parseIceTimes(iceTimeTokens);
	if (isError(iceTimes)) {
		return iceTimes;
	}

	const parsedWaveRange = parseWaveRange(waveRangeToken);
	if (isError(parsedWaveRange)) {
		return parsedWaveRange;
	}
	const { waveLength, startTick } = parsedWaveRange;

	const lastIceTime = iceTimes[iceTimes.length - 1];
	if (lastIceTime !== undefined && waveLength < lastIceTime) {
		return error(lineNum, "波长应 >= 最后一次用冰时机", line);
	}

	out.waves.push({ iceTimes: iceTimes, waveLength: waveLength, actions: [], startTick });
	return null;
}

function parseTime(lineNum: number, timeToken: string, prevTime: number | undefined): number | Error {
	const isDelay = timeToken.startsWith("+");
	const choppedTimeToken = chopPrefix(timeToken, "+");

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
	const currWave = getCurrWave(out);
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
	const symbol = tokens[0]!, timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3],
		tl = tokens.slice(4).join(" ");

	if (timeToken === undefined || rowsToken === undefined || colToken === undefined) {
		return error(lineNum, "请提供炮生效时机, 落点行, 落点列", line);
	}
	if (tl.length > 0) {
		return error(lineNum, "多余的参数", tl);
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
			return error(lineNum, "屋顶场合请提供落点列", symbol);
		}
	}

	const time = parseTime(lineNum, timeToken, currWave.actions.slice(-1)[0]?.time);
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

function parseCardRow(out: ParserOutput, lineNum: number, rowToken: string): number | Error {
	const row = parseNatural(rowToken);
	if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
		return error(lineNum, `用卡行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
	}

	return row;
}

function parseCardCol(lineNum: number, colToken: string): number | Error {
	const col = parseNatural(colToken);

	if (col === null || col < 1 || col > 9) {
		return error(lineNum, `用卡列应为 1~9 内的整数`, colToken);
	}

	return col;
};

function parseCardTimeAndShovelTime(lineNum: number, timesToken: string, currWave: Wave): [number, number | null] | Error {
	let cardTimeToken: string;
	let shovelTimeToken: string | undefined;

	const delimIndex = Math.max(timesToken.lastIndexOf("+"), timesToken.lastIndexOf("~"));
	if (delimIndex <= 0) {  // if starts with "+" (delimIndex is 0), still ignore it
		cardTimeToken = timesToken;
	} else {
		cardTimeToken = timesToken.slice(0, delimIndex);
		shovelTimeToken = chopPrefix(timesToken.slice(delimIndex), "~");
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
			return error(lineNum, "铲除时机不可早于用卡时机", shovelTimeToken);
		}
		return [cardTime, shovelTime];
	}
};

export function parseFodder(out: ParserOutput, lineNum: number, line: string): null | Error {
	const currWaveNum = getCurrWaveNum(out);
	const currWave = getCurrWave(out);
	if (currWave === undefined) {
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
					return error(lineNum, `用卡行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
				}
				if (rows.map(({ row }) => row).includes(row)) {
					return error(lineNum, "用卡行重复", rowToken);
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

				for (const waveNumToken of value.split(",")) {
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

	if (timeToken === undefined || rowsToken === undefined || colToken === undefined) {
		return error(lineNum, "请提供用卡时机, 用卡行, 用卡列", line);
	}

	const times = parseCardTimeAndShovelTime(lineNum, timeToken, currWave);
	if (isError(times)) {
		return times;
	}
	const time = times[0], shovelTime = times[1] ?? undefined;

	const rows = parseRows(rowsToken);
	if (isError(rows)) {
		return rows;
	}

	const col = parseCardCol(lineNum, colToken);
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
		if (rowsToken.length < 2) {
			return error(lineNum, "请提供至少 2 个用卡行", rowsToken);
		}

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

export function parseFixedCard(out: ParserOutput, lineNum: number, line: string, plantType: PlantType)
	: null | Error {
	const currWave = getCurrWave(out);
	if (currWave === undefined) {
		return error(lineNum, "请先设定波次", line);
	}

	const tokens = line.split(" ");
	const symbol = tokens[0]!, timeToken = tokens[1], rowToken = tokens[2], colToken = tokens[3],
		tl = tokens.slice(4).join(" ");

	if (timeToken === undefined || rowToken === undefined || colToken === undefined) {
		return error(lineNum, "请提供用卡时机, 用卡行, 用卡列", line);
	}
	if (tl.length > 0) {
		return error(lineNum, "多余的参数", tl);
	}

	let time: number;
	let shovelTime: number | undefined = undefined;
	if (symbol === "G") {
		const parsedTimes = parseCardTimeAndShovelTime(lineNum, timeToken, currWave);
		if (isError(parsedTimes)) {
			return parsedTimes;
		}
		time = parsedTimes[0];
		shovelTime = parsedTimes[1] ?? undefined;
	} else {
		const parsedTime = parseTime(lineNum, timeToken, currWave.actions.slice(-1)[0]?.time);
		if (isError(parsedTime)) {
			return parsedTime;
		}
		time = parsedTime;
	}

	const row = parseCardRow(out, lineNum, rowToken);
	if (isError(row)) {
		return row;
	}

	const col = parseCardCol(lineNum, colToken);
	if (isError(col)) {
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

export function parseSmartCard(out: ParserOutput, lineNum: number, line: string, plantType: PlantType)
	: null | Error {
	const currWave = getCurrWave(out);
	if (currWave === undefined) {
		return error(lineNum, "请先设定波次", line);
	}

	const parseRows = (rowsToken: string): number[] | Error => {
		if (rowsToken.length < 2) {
			return error(lineNum, "请提供至少 2 个用卡行", rowsToken);
		}

		const rows: number[] = [];

		for (const rowToken of rowsToken) {
			const row = parseNatural(rowToken);
			if (row === null || row < 1 || row > getMaxRows(out.setting.scene)) {
				return error(lineNum, `用卡行应为 1~${getMaxRows(out.setting.scene)} 内的整数`, rowToken);
			}
			if (rows.includes(row)) {
				return error(lineNum, "用卡行重复", rowToken);
			}
			rows.push(row);
		}

		rows.sort();
		return rows;
	};

	const tokens = line.split(" ");
	const symbol = tokens[0]!, timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3],
		tl = tokens.slice(4).join(" ");

	if (timeToken === undefined || rowsToken === undefined || colToken === undefined) {
		return error(lineNum, "请提供用卡时机, 用卡行, 用卡列", line);
	}
	if (tl.length > 0) {
		return error(lineNum, "多余的参数", tl);
	}

	const time = parseTime(lineNum, timeToken, currWave.actions.slice(-1)[0]?.time);
	if (isError(time)) {
		return time;
	}

	const rows = parseRows(rowsToken);
	if (isError(rows)) {
		return rows;
	}

	const col = parseCardCol(lineNum, colToken);
	if (isError(col)) {
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

export function parseSet(out: ParserOutput, lineNum: number, line: string): null | Error {
	const tokens = line.split(" ");

	const varName = tokens[1], expr = tokens.slice(2).join(" ");
	if (varName === undefined) {
		return error(lineNum, "请提供变量名与表达式", line);
	}

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
	const value = line.split(":").slice(1).join(":").trim();
	if (value.length === 0) {
		return error(lineNum, "protect 的值不可为空", line);
	}

	out.setting.protect = [];

	for (let posToken of value.split(" ")) {
		const isNormal = posToken.endsWith("'");
		const choppedPosToken = chopSuffix(posToken, "'");

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

		for (const prevPos of out.setting.protect) {
			if (prevPos.row === pos.row) {
				for (const prevCol of (prevPos.type === "Normal" ? [prevPos.col] : [prevPos.col - 1, prevPos.col])) {
					for (const col of (pos.type === "Normal" ? [pos.col] : [pos.col - 1, pos.col])) {
						if (prevCol === col) {
							return error(lineNum, "保护位置重叠", posToken);
						}
					}
				}
			}
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
	const value = line.split(":").slice(1).join(":").trim();

	const parsedInt = parseNatural(value);
	if (parsedInt === null || parsedInt <= 0) {
		return error(lineNum, `${argName} 的值应为正整数`, value);
	}
	args[argName] = [argFlag, parsedInt.toString()];
	return null;
}

export function parseZombieTypeArg(args: { [key: string]: string[] }, argName: string, argFlag: string,
	lineNum: number, line: string, prevTypesStr: string | undefined): null | Error {
	if (argName in args) {
		return error(lineNum, "参数重复", argName);
	}

	const zombieTypeAbbrs = line.split(":").slice(1).join(":").trim();
	const containChinese = !/^[A-Za-z\s]*$/.test(zombieTypeAbbrs);
	const prevTypes = prevTypesStr === undefined ? [] : prevTypesStr.split(",").map(type => parseInt(type));
	const zombieTypes: number[] = [];

	for (const zombieTypeAbbr of containChinese ? zombieTypeAbbrs : zombieTypeAbbrs.split(" ")) {
		const lowerCasedZombieTypeAbbr = zombieTypeAbbr.toLowerCase();

		let zombieType: number;
		if (containChinese) {
			const parsedZombieType = zombieTypeCNAbbrToEnum[lowerCasedZombieTypeAbbr];
			if (parsedZombieType === undefined) {
				return error(lineNum, `未知僵尸类型`, `${zombieTypeAbbr} (可用的僵尸类型: ${Object.keys(zombieTypeCNAbbrToEnum)})`);
			}
			zombieType = parsedZombieType;
		} else {
			const parsedZombieType = zombieTypeENAbbrToEnum[lowerCasedZombieTypeAbbr];
			if (parsedZombieType === undefined) {
				let errorSrc = zombieTypeAbbr;

				const closestZombieType = findClosestString(lowerCasedZombieTypeAbbr, Object.keys(zombieTypeENAbbrToEnum));
				if (closestZombieType !== null) {
					errorSrc += ` (您是否要输入 ${closestZombieType}?)`;
				}

				return error(lineNum, `未知僵尸类型`, errorSrc);
			}
			zombieType = parsedZombieType;
		}

		if (zombieTypes.includes(zombieType) || prevTypes.includes(zombieType)) {
			return error(lineNum, "僵尸类型重复", zombieTypeAbbr);
		}
		zombieTypes.push(zombieType);
	}

	args[argName] = [argFlag, zombieTypes.join(",")];
	return null;
}

export function parseBoolArg(args: { [key: string]: string[] }, argName: string, argFlag: string,
	lineNum: number, line: string): null | Error {
	if (argName in args) {
		return error(lineNum, "参数重复", argName);
	}
	const value = line.split(":").slice(1).join(":").trim().toLowerCase();

	if (value !== "true" && value !== "false") {
		return error(lineNum, `${argName} 的值应为 true 或 false`, value);
	}

	if (value === "true") {
		args[argName] = [argFlag];
	}
	return null;
}

export function parse(text: string) {
	const out: ParserOutput = { setting: {}, waves: [] };
	const args: { [key: string]: string[] } = {};

	const lines = expandLines(text.split(/\r?\n/)); // \r\n matches line break characters
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
			} else if (symbol.startsWith("require:")) {
				parseResult = parseZombieTypeArg(args, "require", "-req", lineNum, line, args["ban"]?.[1]);
			} else if (symbol.startsWith("ban:")) {
				parseResult = parseZombieTypeArg(args, "ban", "-ban", lineNum, line, args["require"]?.[1]);
			} else if (symbol.startsWith("huge:")) {
				parseResult = parseBoolArg(args, "huge", "-h", lineNum, line);
			} else if (symbol.startsWith("assume_activate:")) {
				parseResult = parseBoolArg(args, "assume_activate", "-a", lineNum, line);
			} else if (symbol.startsWith("w")) {
				parseResult = parseWave(out, lineNum, line);
			} else if (/^(B|P|D)\d?$/.test(symbol.toUpperCase())) {
				parseResult = parseCob(out, lineNum, line, 1);
			} else if (/^(BB|PP|DD)\d?$/.test(symbol.toUpperCase())) {
				parseResult = parseCob(out, lineNum, line, 2);
			} else if (symbol === "C" || symbol === "C_POS" || symbol === "C_NUM") {
				parseResult = parseFodder(out, lineNum, line);
			} else if (symbol === "G") {
				parseResult = parseFixedCard(out, lineNum, line, PlantType.garlic);
			} else if (symbol === "A") {
				parseResult = parseFixedCard(out, lineNum, line, PlantType.cherryBomb);
			} else if (symbol === "J") {
				parseResult = parseFixedCard(out, lineNum, line, PlantType.jalapeno);
			} else if (symbol === "a") {
				parseResult = parseFixedCard(out, lineNum, line, PlantType.squash);
			} else if (symbol === "A_NUM") {
				parseResult = parseSmartCard(out, lineNum, line, PlantType.cherryBomb);
			} else if (symbol === "J_NUM") {
				parseResult = parseSmartCard(out, lineNum, line, PlantType.jalapeno);
			} else if (symbol === "a_NUM") {
				parseResult = parseSmartCard(out, lineNum, line, PlantType.squash);
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
	for (const wave of out.waves) {
		wave.actions.sort((a, b) => a.time - b.time);
	}

	return { out, args };
}

type Line = {
	lineNum: number;
	line: string;
	round?: number;
};

export function expandLines(lines: string[]): Line[] | Error {
	const originalLines: Line[] = lines.map((line, lineNum) =>
	({
		lineNum: lineNum + 1, line: line
			.split("#")[0]!.trim() 		// ignore comments 
			.replace(/[ \t]+/g, ' ')   	// replace multiple spaces/tabs with one space
	}));
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

			let prevCur = cur;
			while (cur + 1 < originalLines.length
				&& !originalLines[cur + 1]!.line.startsWith("w")) {
				cur++;
			}
			for (let waveNum = startWave; waveNum <= endWave; waveNum++) {
				for (let i = prevCur; i <= cur; i++) {
					const { lineNum, line } = originalLines[i]!;
					expandedLines.push({ lineNum, line: populateLineWithWave(line, waveNum) });
				}
			}
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

function getCurrWaveNum(out: ParserOutput): number {
	return out.waves.length;
}

function getCurrWave(out: ParserOutput): Wave | undefined {
	return out.waves.slice(-1)[0];
}