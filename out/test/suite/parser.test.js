"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/naming-convention */
const parser_1 = require("../../parser");
const chai_1 = require("chai");
describe("parseCob", () => {
    let out = {};
    const lineNum = 1;
    beforeEach(() => {
        out = {};
    });
    it("should return an error if no wave is set", () => {
        const line = "P 300 2 9";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, 1, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请先设定波次", line));
    });
    it("should return an error if time is missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请提供炮生效时机", line));
    });
    it("should return an error if time is negative", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P -1 2 9";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "时间应为非负整数", "-1"));
    });
    it("should return an error if delay is used without context", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P +220 2 9";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "没有延迟基准", "+220"));
    });
    it("should return an error if rows are missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P 300";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请提供落点行", line));
    });
    it("should return an error if number of rows dooes not match expected number of cobs", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "PP 300 2 9";
        const cobNum = 2;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请提供 2 个落点行", "2"));
    });
    it("should return an error if colToken is missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P 300 2";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请提供落点列", line));
    });
    it("should return an error if row is not a number", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P 300 a 9";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "落点行应为 1~6 内的整数", "a"));
    });
    it("should return an error if row is not within 1-6", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P 300 7 9";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "落点行应为 1~6 内的整数", "7"));
    });
    it("should return an error if col is not a number", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P 300 2 a";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "落点列应为 0.0~10.0 内的数字", "a"));
    });
    it("should return an error if col is not within 0.0-10.0", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P 300 2 11";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "落点列应为 0.0~10.0 内的数字", "11"));
    });
    it("should add a Cob action to the current wave", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "P 300 2 9";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: "Cob",
                time: 300,
                row: 2,
                col: 9,
            },
        ]);
    });
    it("should add a delayed Cob action to the current wave", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, parser_1.parseCob)(out, lineNum, "P 300 2 9", 1);
        const line = "P +134 2 9";
        const cobNum = 1;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: "Cob",
                time: 300,
                row: 2,
                col: 9,
            },
            {
                op: "Cob",
                time: 300 + 134,
                row: 2,
                col: 9,
            },
        ]);
    });
    it("should add multiple Cob actions to the current wave if there are multiple rows", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        const line = "PP 300 25 9";
        const cobNum = 2;
        const result = (0, parser_1.parseCob)(out, lineNum, line, cobNum);
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: "Cob",
                time: 300,
                row: 2,
                col: 9,
            },
            {
                op: "Cob",
                time: 300,
                row: 5,
                col: 9,
            },
        ]);
    });
});
describe('parseWave', () => {
    let out = {};
    const lineNum = 1;
    beforeEach(() => {
        out = {};
    });
    it('should parse valid wave', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, lineNum, 'W1 100 200 300 601')).equal(null);
        (0, chai_1.expect)(out).to.deep.equal({
            1: {
                iceTimes: [100, 200, 300],
                waveLength: 601,
                actions: [],
            },
        });
    });
    it('should return an error for invalid wave number', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, lineNum, 'W0 100 200 300 601')).to.deep.equal({
            type: 'Error',
            lineNum,
            msg: '波数应为 1~9 内的整数',
            src: 'W0',
        });
    });
    it('should return an error for duplicate wave number', () => {
        out[1] = { iceTimes: [], waveLength: 601, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseWave)(out, lineNum, 'W1 100 200 300 601')).to.deep.equal({
            type: 'Error',
            lineNum,
            msg: '波数重复',
            src: 'W1',
        });
    });
    it('should return an error for missing wave length', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, lineNum, 'W1')).to.deep.equal({
            type: 'Error',
            lineNum,
            msg: '请提供波长',
            src: 'W1',
        });
    });
    it('should return an error for invalid wave length', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, lineNum, 'W1 100 200 300 0')).to.deep.equal({
            type: 'Error',
            lineNum,
            msg: '波长应为 >= 601 的整数',
            src: '0',
        });
    });
    it('should return an error for invalid ice time', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, lineNum, 'W1 100 a 300 601')).to.deep.equal({
            type: 'Error',
            lineNum,
            msg: '用冰时机应为正整数',
            src: 'a',
        });
    });
    it('should return an error for wave length less than last ice time', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, lineNum, 'W1 602 601')).to.deep.equal({
            type: 'Error',
            lineNum,
            msg: '波长应 >= 最后一次用冰时机',
            src: 'W1 602 601',
        });
    });
    it('should return an error for missing previous wave', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, lineNum, 'W2 601')).to.deep.equal({
            type: 'Error',
            lineNum,
            msg: '请先设定第 1 波',
            src: 'W2',
        });
    });
});
describe("parseFodder", () => {
    let out;
    const lineNum = 1;
    beforeEach(() => {
        out = {};
    });
    it("should return an error if no wave has been set", () => {
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请先设定波次", "C 300 2 9"));
    });
    it("should return an error if time is missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请提供用垫时机", "C"));
    });
    it("should return an error if delay is used without context", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C +134 2 9");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "没有延迟基准", "+134"));
    });
    it("should return an error if shovel time is negative", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 100+-134 2 9");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "时间应为非负整数", "-134"));
    });
    it("should return an error if shovel time is earlier than fodder time", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300~299 2 9");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "铲除时机不可早于用垫时机", "299"));
    });
    it("should return an error if rows are missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请提供用垫行", "C 300"));
    });
    it("should return an error if colToken is missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "请提供用垫列", "C 300 2"));
    });
    it("should return an error if rows are invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 7 9");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "用垫行应为 1~6 内的整数", "7"));
    });
    it("should return an error if colToken is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 0");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "用垫列应为 1~9 内的整数", "0"));
    });
    it("should return an error if choose value is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 choose:0");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "choose 的值应为 1~1 内的整数", "0"));
    });
    it("should return an error if wave value is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 choose:1 wave:0");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "wave 的值应为 1~1 内的整数", "0"));
    });
    it("should return an error if wave value is repeated", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 choose:1 wave:11");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "wave 重复", "1"));
    });
    it("should return an error if parameter format is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 ??");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "传参格式应为 [参数]:[值] ", "??"));
    });
    it("should return an error if parameter key is empty", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 :1");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "参数不可为空", ":1"));
    });
    it("should return an error if parameter value is empty", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 choose:");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "值不可为空", "choose:"));
    });
    it("should return an error if parameter key is unknown", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 unknown:1");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "未知参数", "unknown"));
    });
    it("should return an error if parameter key is duplicated", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 choose:1 choose:2");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "参数重复", "choose"));
    });
    it("should return an error if choose value is missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9 wave:1");
        (0, chai_1.expect)(result).to.deep.equal((0, parser_1.error)(lineNum, "必须提供 choose 的值", "wave:1"));
    });
    it("should add a Normal card action to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2 9");
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                type: "Normal",
                time: 300,
                shovelTime: undefined,
                row: 2,
                col: 9,
            },
        ]);
    });
    it("should add a Puff card action to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2' 9");
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                type: "Puff",
                time: 300,
                shovelTime: undefined,
                row: 2,
                col: 9,
            },
        ]);
    });
    it("should add a card action with relative shovel time to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300+134 2 9");
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                type: "Normal",
                time: 300,
                shovelTime: 300 + 134,
                row: 2,
                col: 9,
            },
        ]);
    });
    it("should add a card action with absolute shovel time to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300~600 2 9");
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                type: "Normal",
                time: 300,
                shovelTime: 600,
                row: 2,
                col: 9,
            },
        ]);
    });
    it("should add multiple card actions to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 25 9");
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                type: "Normal",
                time: 300,
                shovelTime: undefined,
                row: 2,
                col: 9,
            },
            {
                op: "FixedFodder",
                type: "Normal",
                time: 300,
                shovelTime: undefined,
                row: 5,
                col: 9,
            },
        ]);
    });
    it("should add extra arguments to the card action", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        const result = (0, parser_1.parseFodder)(out, lineNum, "C 300 2'5 9 choose:2 wave:1");
        (0, chai_1.expect)(result).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "SmartFodder",
                "choices": [
                    {
                        "row": 2,
                        "col": 9,
                        "type": "Puff"
                    },
                    {
                        "row": 5,
                        "col": 9,
                        "type": "Normal"
                    }
                ],
                time: 300,
                shovelTime: undefined,
                choose: 2,
                waves: [1],
            },
        ]);
    });
});
describe("parse", () => {
    it("should return empty object if input is empty", () => {
        (0, chai_1.expect)((0, parser_1.parse)("")).to.deep.equal({});
    });
    it("should parse a single wave with a cob and a fixed fodder", () => {
        const input = "W1 601\nP 300 2 9\nC +134+134 5 9\n";
        const expectedOutput = {
            1: {
                iceTimes: [],
                waveLength: 601,
                actions: [
                    {
                        op: "Cob",
                        time: 300,
                        row: 2,
                        col: 9,
                    },
                    {
                        op: "FixedFodder",
                        type: "Normal",
                        time: 300 + 134,
                        shovelTime: 300 + 134 + 134,
                        row: 5,
                        col: 9,
                    },
                ],
            },
        };
        (0, chai_1.expect)((0, parser_1.parse)(input)).to.deep.equal(expectedOutput);
    });
    it("should parse a single wave with a smart fodder", () => {
        const input = "W1 601\nC 300~500 25 9 choose:1";
        const expectedOutput = {
            1: {
                iceTimes: [],
                waveLength: 601,
                actions: [
                    {
                        op: "SmartFodder",
                        time: 300,
                        shovelTime: 500,
                        choices: [
                            {
                                type: "Normal",
                                row: 2,
                                col: 9,
                            },
                            {
                                type: "Normal",
                                row: 5,
                                col: 9,
                            },
                        ],
                        choose: 1,
                        waves: undefined,
                    },
                ],
            },
        };
        (0, chai_1.expect)((0, parser_1.parse)(input)).to.deep.equal(expectedOutput);
    });
    it("should parse multiple waves", () => {
        const input = "W1 601\nPP 300 25 9\nW2 1 1250\nC 400+134 3 4 choose:1 wave:12\n";
        const expectedOutput = {
            1: {
                iceTimes: [],
                waveLength: 601,
                actions: [
                    {
                        op: "Cob",
                        time: 300,
                        row: 2,
                        col: 9,
                    },
                    {
                        op: "Cob",
                        time: 300,
                        row: 5,
                        col: 9,
                    },
                ],
            },
            2: {
                iceTimes: [1],
                waveLength: 1250,
                actions: [
                    {
                        op: "SmartFodder",
                        time: 400,
                        shovelTime: 400 + 134,
                        choices: [
                            {
                                type: "Normal",
                                row: 3,
                                col: 4,
                            },
                        ],
                        choose: 1,
                        waves: [1, 2],
                    },
                ],
            },
        };
        (0, chai_1.expect)((0, parser_1.parse)(input)).to.deep.equal(expectedOutput);
    });
    it("should ignore comments", () => {
        const input = "W1 1 601 # this is a comment\nP 300 2 9\n";
        const expectedOutput = {
            1: {
                iceTimes: [1],
                waveLength: 601,
                actions: [
                    {
                        op: "Cob",
                        time: 300,
                        row: 2,
                        col: 9,
                    },
                ],
            },
        };
        (0, chai_1.expect)((0, parser_1.parse)(input)).to.deep.equal(expectedOutput);
    });
    it("should return an error for an unknown symbol", () => {
        const input = "W1 601\nX\n";
        const expectedOutput = {
            type: "Error",
            lineNum: 2,
            msg: "未知符号",
            src: "X",
        };
        (0, chai_1.expect)((0, parser_1.parse)(input)).to.deep.equal(expectedOutput);
    });
});
//# sourceMappingURL=parser.test.js.map