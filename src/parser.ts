
export type Error = { type: "Error", lineNum: number, msg: string, src: string };

export function error(lineNum: number, msg: string, src: string): Error {
	return { type: "Error", lineNum, msg, src };
}

export function isError(result: any | Error): result is Error {
	return (result as Error)?.type === "Error";
}

type Cob = {
	op: "Cob";
	time: number;
	row: number;
	col: number
};

type FodderTime = { // these fields are shared by all fodder actions
	time: number;
	shovelTime?: number;
};

type FodderPos = {
	type: "Normal" | "Puff";
	row: number;
	col: number;
};

type FixedFodder = {
	op: "FixedFodder"
} & FodderTime & FodderPos;

type SmartFodder = {
	op: "SmartFodder"
	choices: FodderPos[];
	choose: number;
	waves?: number[];
} & FodderTime;

type Action = Cob | FixedFodder | SmartFodder;

type Wave = {
	iceTimes: number[],
	waveLength: number,
	actions: Action[]
};

export type ParserOutput = {
	[key: number]: Wave
};

export function parseWave(out: ParserOutput, lineNum: number, line: string): null | Error {
	const parseWaveNum = (waveNumToken: string): number | Error => {
		const waveNum = strictParseInt(waveNumToken.slice(1));

		if (isNaN(waveNum) || waveNum < 1 || waveNum > 9) {
			return error(lineNum, "波数应为 1~9 内的整数", waveNumToken);
		}

		return waveNum;
	};

	const parseIceTimes = (iceTimeTokens: string[]): number[] | Error => {
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

	const parseWaveLength = (waveLengthToken: string): number | Error => {
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
	const isDelay = timeToken.startsWith("+");
	timeToken = isDelay ? timeToken.slice(1) : timeToken;

	const time = strictParseInt(timeToken);
	if (isNaN(time) || time < 0) {
		return error(lineNum, "时间应为非负整数", timeToken);
	}

	if (!isDelay) {
		return time;
	} else {
		if (prevTime === undefined) {
			return error(lineNum, "没有延迟基准", `+${timeToken}`);
		};
		return prevTime + time;
	}
};

function parseRows(lineNum: number, rowsToken: string, expectedNum: number | null,
	suffix: string | null, description: string): { row: number, hasSuffix: boolean }[] | Error {
	const rows = [];

	if (expectedNum !== null && expectedNum !== rowsToken.length) {
		return error(lineNum, `请提供 ${expectedNum} 个${description}`, rowsToken);
	}

	for (let cur = 0; cur < rowsToken.length; cur++) {
		const rowToken = rowsToken[cur]!;

		const row = strictParseInt(rowToken);
		if (isNaN(row) || row < 1 || row > 6) {
			return error(lineNum, `${description}应为 1~6 内的整数`, rowToken);
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
};

export function parseCob(out: ParserOutput, lineNum: number, line: string, cobNum: number): null | Error {
	const currWave = lastWave(out)[1];
	if (currWave === undefined) {
		return error(lineNum, "请先设定波次", line);
	}

	const parseCol = (colToken: string): number | Error => {
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

	for (const row of rows) {
		currWave.actions.push({
			op: "Cob",
			time,
			row: row.row,
			col
		});
	}
	return null;
}

export function parseFodder(out: ParserOutput, lineNum: number, line: string): null | Error {
	const [currWaveNum, currWave] = lastWave(out);
	if (currWaveNum === undefined || currWave === undefined) {
		return error(lineNum, "请先设定波次", line);
	}

	const parseTimes = (timesToken: string): [number, number | null] | Error => {
		let cardTimeToken: string;
		let shovelTimeToken: string | undefined;

		let prefix = "";
		if (timesToken.startsWith("+")) {
			prefix = "+";
			timesToken = timesToken.slice(1);
		}

		if (timesToken.includes("+")) {
			cardTimeToken = prefix + timesToken.split('+')[0]!;
			shovelTimeToken = `+${timesToken.split('+')[1]!}`;
		} else if (timesToken.includes("~")) {
			cardTimeToken = prefix + timesToken.split('~')[0]!;
			shovelTimeToken = timesToken.split('~')[1]!;
		} else {
			cardTimeToken = prefix + timesToken;
		}

		const cardTime = parseTime(lineNum, cardTimeToken, currWave.actions[currWave.actions.length - 1]?.time);
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

	const parseCol = (colToken: string): number | Error => {
		const col = strictParseInt(colToken);

		if (isNaN(col) || col < 1 || col > 9) {
			return error(lineNum, "用垫列应为 1~9 内的整数", colToken);
		}

		return col;
	};

	const parseExtraArgs = (extraArgTokens: string[], cardNum: number): { "choose": number, "waves"?: number[] } | Error | null => {
		if (extraArgTokens.length === 0) { return null; }

		let extraArgs: { "choose"?: number, "waves"?: number[] } = {};

		for (const extraArgToken of extraArgTokens) {
			if (!extraArgToken.includes(":")) {
				return error(lineNum, "传参格式应为 [参数]:[值] ", extraArgToken);
			}

			const key = extraArgToken.split(":")[0]!, value = extraArgToken.split(":")[1]!;

			if (key.length === 0) {
				return error(lineNum, "参数不可为空", extraArgToken);
			}
			if (value.length === 0) {
				return error(lineNum, "值不可为空", extraArgToken);
			}
			if (key in extraArgs) {
				return error(lineNum, "参数重复", key);
			}

			if (key === "choose") {
				const chooseNum = strictParseInt(value);
				if (isNaN(chooseNum) || chooseNum < 1 || chooseNum > cardNum) {
					return error(lineNum, `choose 的值应为 1~${cardNum} 内的整数`, value);
				}
				extraArgs["choose"] = chooseNum;
			} else if (key === "wave") {
				extraArgs.waves = [];

				for (const waveNumToken of value) {
					const waveNum = strictParseInt(waveNumToken);
					if (isNaN(waveNum) || waveNum < 1 || waveNum > currWaveNum) {
						return error(lineNum, `wave 的值应为 1~${currWaveNum} 内的整数`, value);
					}
					if (extraArgs.waves.includes(waveNum)) {
						return error(lineNum, "wave 重复", waveNum.toString());
					}
					extraArgs.waves.push(waveNum);
				}
			} else {
				return error(lineNum, "未知参数", key);
			}
		}

		if (extraArgs.choose === undefined) {
			return error(lineNum, "必须提供 choose 的值", extraArgTokens.join(" "));
		}

		return { choose: extraArgs.choose, waves: extraArgs.waves };
	};

	const tokens = line.split(" ");
	const timeToken = tokens[1], rowsToken = tokens[2], colToken = tokens[3], extraArgTokens = tokens.slice(4);

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

	const extraArgs = parseExtraArgs(extraArgTokens, rows.length);
	if (isError(extraArgs)) {
		return extraArgs;
	}

	if (extraArgs === null) {
		for (const row of rows) {
			currWave.actions.push({
				op: "FixedFodder",
				type: row.hasSuffix ? "Puff" : "Normal",
				time: times[0],
				shovelTime: times[1] ?? undefined,
				row: row.row,
				col,
			});
		}
	} else {
		const choices: FodderPos[] = [];
		for (const row of rows) {
			choices.push({
				type: row.hasSuffix ? "Puff" : "Normal",
				row: row.row,
				col
			});
		}

		currWave.actions.push({
			op: "SmartFodder",
			time: times[0],
			shovelTime: times[1] ?? undefined,
			choices,
			choose: extraArgs.choose!,
			waves: extraArgs.waves
		});
	}

	return null;
}

export function parse(text: string) {
	const out: ParserOutput = {};
	const lines = text.split(/\r?\n/);

	for (const [i, originalLine] of lines.entries()) {
		const lineNum = i + 1;
		const line = originalLine.split("#")[0]!.trim(); // ignore comments
		if (line.length > 0) {
			const originalSymbol = line.split(" ")[0]!;
			const symbol = originalSymbol.toUpperCase();

			let parseResult = null;
			if (symbol.startsWith("W")) {
				parseResult = parseWave(out, lineNum, line);
			} else if (["B", "P", "D"].includes(symbol)) {
				parseResult = parseCob(out, lineNum, line, 1);
			} else if (["BB", "PP", "DD"].includes(symbol)) {
				parseResult = parseCob(out, lineNum, line, 2);
			} else if (symbol === "C") {
				parseResult = parseFodder(out, lineNum, line);
			} else {
				parseResult = error(lineNum, "未知符号", originalSymbol);
			}

			if (isError(parseResult)) {
				return parseResult;
			}
		}
	}
	return out;
}

function lastWave(out: ParserOutput): [number | undefined, Wave | undefined] {
	let lastKey = Number(Object.keys(out)[Object.keys(out).length - 1]);
	if (isNaN(lastKey)) {
		return [undefined, undefined];
	} else {
		return [lastKey, out[lastKey]];
	}
}

// only accept non-negative whole numbers, no leading + allowed
function strictParseInt(str: string) {
	if (!/^\d+$/.test(str)) {
		return NaN;
	}
	return parseInt(str, 10);
}

// only accept non-negative whole or decimal numbers, no leading + allowed
function strictParseFloat(str: string) {
	if (!/^\d+(\.\d+)?$/.test(str)) {
		return NaN;
	}
	return parseFloat(str);
}