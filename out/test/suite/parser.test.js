"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/naming-convention */
const error_1 = require("../../error");
const parser_1 = require("../../parser");
const chai_1 = require("chai");
describe("parseCob", () => {
    let out;
    beforeEach(() => {
        out = { setting: {} };
    });
    it("should return an error if no wave is set", () => {
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300 2 9", 1)).to.deep.equal((0, error_1.error)(1, "请先设定波次", "P 300 2 9"));
    });
    it("should return an error if time is missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P", 1)).to.deep.equal((0, error_1.error)(1, "请提供炮生效时机", "P"));
    });
    it("should return an error if time is negative", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P -1 2 9", 1)).to.deep.equal((0, error_1.error)(1, "时间应为非负整数", "-1"));
    });
    it("should return an error if delay is used without context", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P +220 2 9", 1)).to.deep.equal((0, error_1.error)(1, "没有延迟基准", "+220"));
    });
    it("should return an error if rows are missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300", 1)).to.deep.equal((0, error_1.error)(1, "请提供落点行", "P 300"));
    });
    it("should return an error if number of rows dooes not match expected number of cobs", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "PP 300 2 9", 2)).to.deep.equal((0, error_1.error)(1, "请提供 2 个落点行", "2"));
    });
    it("should return an error if colToken is missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300 2", 1)).to.deep.equal((0, error_1.error)(1, "请提供落点列", "P 300 2"));
    });
    it("should return an error if row is not a number", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300 a 9", 1)).to.deep.equal((0, error_1.error)(1, "落点行应为 1~6 内的整数", "a"));
    });
    it("should return an error if row is not within 1-6", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300 7 9", 1)).to.deep.equal((0, error_1.error)(1, "落点行应为 1~6 内的整数", "7"));
    });
    it("should return an error if col is not a number", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300 2 a", 1)).to.deep.equal((0, error_1.error)(1, "落点列应为 0.0~10.0 内的数字", "a"));
    });
    it("should return an error if col is not within 0.0-10.0", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300 2 11", 1)).to.deep.equal((0, error_1.error)(1, "落点列应为 0.0~10.0 内的数字", "11"));
    });
    it("should add a Cob action to the current wave", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300 2 9", 1)).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: "Cob",
                time: 300,
                symbol: "P",
                positions: [{
                        row: 2,
                        col: 9,
                    }]
            },
        ]);
    });
    it("should add a delayed Cob action to the current wave", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "P 300 2 9", 1)).equal(null);
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 2, "P +134 2 9", 1)).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: "Cob",
                symbol: "P",
                time: 300,
                positions: [{
                        row: 2,
                        col: 9,
                    }]
            },
            {
                op: "Cob",
                symbol: "P",
                time: 300 + 134,
                positions: [{
                        row: 2,
                        col: 9,
                    }]
            },
        ]);
    });
    it("should add multiple Cob actions to the current wave if there are multiple rows", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseCob)(out, 1, "PP 300 25 9", 2)).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: "Cob",
                symbol: "PP",
                time: 300,
                positions: [{
                        row: 2,
                        col: 9,
                    }, {
                        row: 5,
                        col: 9,
                    }]
            },
        ]);
    });
});
describe('parseWave', () => {
    let out;
    beforeEach(() => {
        out = { setting: {} };
    });
    it('should parse valid wave', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, 1, 'w1 100 200 300 601')).equal(null);
        (0, chai_1.expect)(out[1]).to.deep.equal({
            iceTimes: [100, 200, 300],
            waveLength: 601,
            actions: [],
        });
    });
    it('should return an error for invalid wave number', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, 1, 'w0 100 200 300 601'))
            .to.deep.equal((0, error_1.error)(1, '波数应为 1~9 内的整数', 'w0'));
    });
    it('should return an error for duplicate wave number', () => {
        out[1] = { iceTimes: [], waveLength: 601, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseWave)(out, 1, 'w1 100 200 300 601'))
            .to.deep.equal((0, error_1.error)(1, '波数重复', 'w1'));
    });
    it('should return an error for missing wave length', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, 1, 'w1'))
            .to.deep.equal((0, error_1.error)(1, '请提供波长', 'w1'));
    });
    it('should return an error for invalid wave length', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, 1, 'w1 100 200 300 0'))
            .to.deep.equal((0, error_1.error)(1, '波长应为 >= 601 的整数', '0'));
    });
    it('should return an error for invalid ice time', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, 1, 'w1 100 a 300 601'))
            .to.deep.equal((0, error_1.error)(1, '用冰时机应为正整数', 'a'));
    });
    it('should return an error for wave length less than last ice time', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, 1, 'w1 602 601'))
            .to.deep.equal((0, error_1.error)(1, '波长应 >= 最后一次用冰时机', 'w1 602 601'));
    });
    it('should return an error for missing previous wave', () => {
        (0, chai_1.expect)((0, parser_1.parseWave)(out, 1, 'w2 601'))
            .to.deep.equal((0, error_1.error)(1, '请先设定第 1 波', 'w2'));
    });
});
describe("parseFodder", () => {
    let out;
    beforeEach(() => {
        out = { setting: {} };
    });
    it("should return an error if no wave has been set", () => {
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300 2 9"))
            .to.deep.equal((0, error_1.error)(1, "请先设定波次", "C 300 2 9"));
    });
    it("should return an error if time is missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C"))
            .to.deep.equal((0, error_1.error)(1, "请提供用垫时机", "C"));
    });
    it("should return an error if delay is used without context", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C +134 2 9"))
            .to.deep.equal((0, error_1.error)(1, "没有延迟基准", "+134"));
    });
    it("should return an error if shovel time is negative", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 100+-134 2 9"))
            .to.deep.equal((0, error_1.error)(1, "时间应为非负整数", "-134"));
    });
    it("should return an error if shovel time is earlier than fodder time", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300~299 2 9"))
            .to.deep.equal((0, error_1.error)(1, "铲除时机不可早于用垫时机", "299"));
    });
    it("should return an error if rows are missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300"))
            .to.deep.equal((0, error_1.error)(1, "请提供用垫行", "C 300"));
    });
    it("should return an error if colToken is missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300 2"))
            .to.deep.equal((0, error_1.error)(1, "请提供用垫列", "C 300 2"));
    });
    it("should return an error if rows are invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300 7 9"))
            .to.deep.equal((0, error_1.error)(1, "用垫行应为 1~6 内的整数", "7"));
    });
    it("should return an error if colToken is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300 2 0"))
            .to.deep.equal((0, error_1.error)(1, "用垫列应为 1~9 内的整数", "0"));
    });
    it("should return an error if choose value is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 choose:0"))
            .to.deep.equal((0, error_1.error)(1, "choose 的值应为 1~1 内的整数", "0"));
    });
    it("should return an error if wave value is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 choose:1 waves:0"))
            .to.deep.equal((0, error_1.error)(1, "waves 的值应为 1~1 内的整数", "0"));
    });
    it("should return an error if wave value is repeated", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 choose:1 waves:11"))
            .to.deep.equal((0, error_1.error)(1, "waves 重复", "1"));
    });
    it("should return an error if parameter format is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 ??"))
            .to.deep.equal((0, error_1.error)(1, "传参格式应为 [参数]:[值] ", "??"));
    });
    it("should return an error if parameter key is empty", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 :1"))
            .to.deep.equal((0, error_1.error)(1, "参数不可为空", ":1"));
    });
    it("should return an error if parameter value is empty", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 choose:"))
            .to.deep.equal((0, error_1.error)(1, "值不可为空", "choose:"));
    });
    it("should return an error if parameter key is unknown", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 wave:1"))
            .to.deep.equal((0, error_1.error)(1, "未知参数", "wave"));
    });
    it("should return an error if parameter key is duplicated", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 choose:1 choose:2"))
            .to.deep.equal((0, error_1.error)(1, "参数重复", "choose"));
    });
    it("should return an error if choose value is missing for C_POS", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2 9 waves:1"))
            .to.deep.equal((0, error_1.error)(1, "必须提供 choose 的值", ""));
    });
    it("should not return an error if choose value is missing for C_NUM", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_NUM 300 2 9"))
            .to.equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([{
                op: "SmartFodder",
                time: 300,
                symbol: "C_NUM",
                shovelTime: undefined,
                cards: [
                    "Normal"
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }
                ],
                choose: 1,
                waves: [],
            }]);
    });
    it("should add a Normal card action to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300 2 9")).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                cards: [
                    "Normal"
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }
                ]
            },
        ]);
    });
    it("should add a Puff card action to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300 2' 9")).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                cards: [
                    "Puff",
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }
                ]
            },
        ]);
    });
    it("should add a Pot card action to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, 'C 300 2" 9')).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                cards: [
                    "Pot",
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }
                ]
            },
        ]);
    });
    it("should add a card action with relative shovel time to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300+134 2 9")).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: 300 + 134,
                cards: [
                    "Normal"
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }
                ],
            },
        ]);
    });
    it("should add a card action with absolute shovel time to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300~600 2 9")).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: 600,
                cards: [
                    "Normal"
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }
                ],
            },
        ]);
    });
    it("should add multiple card actions to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C 300 25 9")).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                cards: [
                    "Normal",
                    "Normal",
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    },
                    {
                        row: 5,
                        col: 9,
                    }
                ],
            }
        ]);
    });
    it("should add extra arguments to the card action", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        (0, chai_1.expect)((0, parser_1.parseFodder)(out, 1, "C_POS 300 2'5 9 choose:2 waves:1")).equal(null);
        (0, chai_1.expect)(out[1].actions).to.deep.equal([
            {
                op: "SmartFodder",
                time: 300,
                symbol: "C_POS",
                shovelTime: undefined,
                cards: [
                    "Puff",
                    "Normal",
                ],
                positions: [
                    {
                        "row": 2,
                        "col": 9,
                    },
                    {
                        "row": 5,
                        "col": 9,
                    }
                ],
                choose: 2,
                waves: [1],
            },
        ]);
    });
});
describe('parseJalapeno', () => {
    let out;
    beforeEach(() => {
        out = { setting: {} };
    });
    it('should return an error if no wave is set', () => {
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100 1 1')).to.deep.equal((0, error_1.error)(1, '请先设定波次', 'J 100 1 1'));
    });
    it('should return an error if timeToken is missing', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J')).to.deep.equal((0, error_1.error)(1, '请提供用卡时机', 'J'));
    });
    it('should return an error if rowToken is missing', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100')).to.deep.equal((0, error_1.error)(1, '请提供用卡行', 'J 100'));
    });
    it('should return an error if colToken is missing', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100 1')).to.deep.equal((0, error_1.error)(1, '请提供用卡列', 'J 100 1'));
    });
    it('should return an error if shovel time is negative', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100+-134 1 1')).to.deep.equal((0, error_1.error)(1, '时间应为非负整数', '-134'));
    });
    it('should return an error if row is not a number', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100 a 1')).to.deep.equal((0, error_1.error)(1, '用卡行应为 1~6 内的整数', 'a'));
    });
    it('should return an error if row is not within 1-6', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100 7 1')).to.deep.equal((0, error_1.error)(1, '用卡行应为 1~6 内的整数', '7'));
    });
    it('should return an error if col is not within 1~9', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100 1 0')).to.deep.equal((0, error_1.error)(1, '用卡列应为 1~9 内的整数', '0'));
    });
    it('should add a Jalapeno action to the current wave', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100 1 1')).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: 'Jalapeno',
                symbol: 'J',
                time: 100,
                shovelTime: undefined,
                position: { row: 1, col: 1 },
            },
        ]);
    });
    it('should add a delayed Jalapeno action to the current wave', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100 1 1')).equal(null);
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 2, 'J +134 1 1')).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: 'Jalapeno',
                symbol: 'J',
                time: 100,
                shovelTime: undefined,
                position: { row: 1, col: 1 },
            },
            {
                op: 'Jalapeno',
                symbol: 'J',
                time: 100 + 134,
                shovelTime: undefined,
                position: { row: 1, col: 1 },
            },
        ]);
    });
    it('should add a Jalapeno action with shovel time to the current wave', () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        (0, chai_1.expect)((0, parser_1.parseJalapeno)(out, 1, 'J 100~200 1 1')).equal(null);
        (0, chai_1.expect)(out[1]?.actions).to.deep.equal([
            {
                op: 'Jalapeno',
                symbol: 'J',
                time: 100,
                shovelTime: 200,
                position: { row: 1, col: 1 },
            },
        ]);
    });
});
describe('parseSet', () => {
    let out;
    beforeEach(() => {
        out = { setting: {} };
    });
    it('should return an error if variable name is missing', () => {
        (0, chai_1.expect)((0, parser_1.parseSet)(out, 1, 'set'))
            .to.deep.equal((0, error_1.error)(1, '请提供变量名与表达式', 'set'));
    });
    it('should return an error if variable name is empty', () => {
        (0, chai_1.expect)((0, parser_1.parseSet)(out, 1, 'set  1+2'))
            .to.deep.equal((0, error_1.error)(1, '变量名不可为空', 'set  1+2'));
    });
    it('should return an error if variable name is a pure number', () => {
        (0, chai_1.expect)((0, parser_1.parseSet)(out, 1, 'set 123 1+2'))
            .to.deep.equal((0, error_1.error)(1, '变量名不可为纯数字', '123'));
    });
    it('should return an error if expression is missing', () => {
        (0, chai_1.expect)((0, parser_1.parseSet)(out, 1, 'set x '))
            .to.deep.equal((0, error_1.error)(1, '表达式不可为空', 'set x '));
    });
    it('should return an error if expression contains invalid characters', () => {
        (0, chai_1.expect)((0, parser_1.parseSet)(out, 1, 'set x 1+2-3*4/5%6'))
            .to.deep.equal((0, error_1.error)(1, '表达式只能包含数字、运算符与括号', '1+2-3*4/5%6'));
    });
    it('should return an error if expression is invalid', () => {
        (0, chai_1.expect)((0, parser_1.parseSet)(out, 1, 'set x 1/0'))
            .to.deep.equal((0, error_1.error)(1, '表达式无效', '1/0'));
    });
    it('should add a variable to the output', () => {
        (0, chai_1.expect)((0, parser_1.parseSet)(out, 1, 'set x 1+2')).to.equal(null);
        (0, chai_1.expect)(out.setting.variables)
            .to.deep.equal({ x: 3 });
    });
});
describe("parseScene", () => {
    let out;
    beforeEach(() => {
        out = { setting: {} };
    });
    it("should return an error scene is unknown", () => {
        (0, chai_1.expect)((0, parser_1.parseScene)(out, [{ lineNum: 1, line: "scene:AQE" }]))
            .to.deep.equal((0, error_1.error)(1, "未知场地", "AQE"));
    });
    it("should parse scene", () => {
        (0, chai_1.expect)((0, parser_1.parseScene)(out, [{ lineNum: 1, line: "scene:FE" }])).equal(null);
        (0, chai_1.expect)(out).to.deep.equal({
            setting: {
                scene: "FE"
            }
        });
    });
    it("should parse scene case-insensitively", () => {
        (0, chai_1.expect)((0, parser_1.parseScene)(out, [{ lineNum: 1, line: "scene:nE" }])).equal(null);
        (0, chai_1.expect)(out).to.deep.equal({
            setting: {
                scene: "NE"
            }
        });
    });
    it("should parse scene alias", () => {
        (0, chai_1.expect)((0, parser_1.parseScene)(out, [{ lineNum: 1, line: "scene:RE" }])).equal(null);
        (0, chai_1.expect)(out).to.deep.equal({
            setting: {
                scene: "ME"
            }
        });
    });
    it("should return an error if setting args are repeated", () => {
        (0, chai_1.expect)((0, parser_1.parseScene)(out, [{ lineNum: 1, line: "scene:PE" }, { lineNum: 2, line: "scene:DE" }]))
            .to.deep.equal((0, error_1.error)(2, "参数重复", "scene"));
    });
});
describe("parseProtect", () => {
    let out;
    beforeEach(() => {
        out = { setting: {} };
    });
    it("should return an error if protect is duplicated", () => {
        (0, chai_1.expect)((0, parser_1.parseProtect)(out, 1, "protect:17")).to.equal(null);
        (0, chai_1.expect)((0, parser_1.parseProtect)(out, 2, "protect:17"))
            .to.deep.equal((0, error_1.error)(2, "参数重复", "protect"));
    });
    it("should return an error if there is no value", () => {
        (0, chai_1.expect)((0, parser_1.parseProtect)(out, 1, "protect:"))
            .to.deep.equal((0, error_1.error)(1, "protect 的值不可为空", "protect:"));
    });
    it("should return an error if row / col is missing", () => {
        (0, chai_1.expect)((0, parser_1.parseProtect)(out, 1, "protect:1"))
            .to.deep.equal((0, error_1.error)(1, "请提供要保护的行与列", "protect:1"));
    });
    it("should return an error if row is out of bound", () => {
        (0, chai_1.expect)((0, parser_1.parseProtect)(out, 1, "protect:08"))
            .to.deep.equal((0, error_1.error)(1, "保护行应为 1~6 内的整数", "0"));
    });
    it("should return an error if cob col is out of bound", () => {
        (0, chai_1.expect)((0, parser_1.parseProtect)(out, 1, "protect:11"))
            .to.deep.equal((0, error_1.error)(1, "炮所在列应为 2~9 内的整数", "1"));
    });
    it("should return an error if normal col is out of bound", () => {
        (0, chai_1.expect)((0, parser_1.parseProtect)(out, 1, "protect:10'"))
            .to.deep.equal((0, error_1.error)(1, "普通植物所在列应为 1~9 内的整数", "0"));
    });
    it("should return an error if positions are repeated", () => {
        (0, chai_1.expect)((0, parser_1.parseProtect)({ setting: {} }, 1, "protect:18 18"))
            .to.deep.equal((0, error_1.error)(1, "保护位置重叠", "18"));
        (0, chai_1.expect)((0, parser_1.parseProtect)({ setting: {} }, 1, "protect:19' 18"))
            .to.deep.equal((0, error_1.error)(1, "保护位置重叠", "18"));
    });
    it("should parse protect positions", () => {
        (0, chai_1.expect)((0, parser_1.parseProtect)(out, 1, "protect:18 29'")).equal(null);
        (0, chai_1.expect)(out).to.deep.equal({
            setting: {
                protect: [{
                        type: "Cob",
                        row: 1,
                        col: 7,
                    },
                    {
                        type: "Normal",
                        row: 2,
                        col: 9,
                    }],
            }
        });
    });
});
describe("parseIntArg", () => {
    let args;
    beforeEach(() => {
        args = {};
    });
    it("should parse repeat", () => {
        (0, chai_1.expect)((0, parser_1.parseIntArg)(args, "repeat", "-r", 1, "repeat:1437")).to.equal(null);
        (0, chai_1.expect)(args).to.deep.equal({ repeat: ["-r", "1437"] });
    });
    it("should parse thread", () => {
        (0, chai_1.expect)((0, parser_1.parseIntArg)(args, "thread", "-t", 1, "thread:69")).to.equal(null);
        (0, chai_1.expect)(args).to.deep.equal({ thread: ["-t", "69"] });
    });
    it("should return an error if arg is specified multiple times", () => {
        (0, chai_1.expect)((0, parser_1.parseIntArg)(args, "repeat", "-r", 1, "repeat:1437")).to.equal(null);
        (0, chai_1.expect)((0, parser_1.parseIntArg)(args, "repeat", "-r", 2, "repeat:2222"))
            .to.deep.equal((0, error_1.error)(2, "参数重复", "repeat"));
    });
    it("should return an error if arg is not a non-negative integer", () => {
        (0, chai_1.expect)((0, parser_1.parseIntArg)(args, "repeat", "-r", 1, "repeat:0"))
            .to.deep.equal((0, error_1.error)(1, "repeat 的值应为正整数", "0"));
    });
});
describe("parse", () => {
    it("should return empty object if input is empty", () => {
        (0, chai_1.expect)((0, parser_1.parse)(""))
            .to.have.property("out").that.deep.equal({
            setting: { scene: "FE" },
        });
    });
    it("should use scene information to deduce max rows", () => {
        (0, chai_1.expect)((0, parser_1.parse)("protect:68\nscene:DE"))
            .to.deep.equal((0, error_1.error)(1, "保护行应为 1~5 内的整数", "6"));
    });
    it("should return an error if scene is unknown", () => {
        (0, chai_1.expect)((0, parser_1.parse)("protect:68\nscene:AQE"))
            .to.deep.equal((0, error_1.error)(2, "未知场地", "AQE"));
    });
    it("should parse a single wave with a cob and a fixed fodder", () => {
        (0, chai_1.expect)((0, parser_1.parse)("\nw1 601\nP 300 2 9\nC +134+134 5 9\n"))
            .to.have.property("out").that.deep.equal({
            setting: { scene: "FE" },
            1: {
                iceTimes: [],
                waveLength: 601,
                actions: [
                    {
                        op: "Cob",
                        time: 300,
                        symbol: "P",
                        positions: [
                            {
                                row: 2,
                                col: 9,
                            }
                        ],
                    },
                    {
                        op: "FixedFodder",
                        time: 300 + 134,
                        symbol: "C",
                        shovelTime: 300 + 134 + 134,
                        cards: [
                            "Normal",
                        ],
                        positions: [
                            {
                                row: 5,
                                col: 9,
                            }
                        ]
                    },
                ],
            },
        });
    });
    it("should parse a single wave (lowercase) with a smart fodder", () => {
        (0, chai_1.expect)((0, parser_1.parse)("w1 601\nC_POS 300~500 25 9 choose:1"))
            .to.have.property("out").that.deep.equal({
            setting: { scene: "FE" },
            1: {
                iceTimes: [],
                waveLength: 601,
                actions: [
                    {
                        op: "SmartFodder",
                        time: 300,
                        symbol: "C_POS",
                        shovelTime: 500,
                        cards: [
                            "Normal",
                            "Normal",
                        ],
                        positions: [
                            {
                                row: 2,
                                col: 9,
                            },
                            {
                                row: 5,
                                col: 9,
                            },
                        ],
                        choose: 1,
                        waves: [],
                    },
                ],
            },
        });
    });
    it("should parse multiple waves with metadata", () => {
        (0, chai_1.expect)((0, parser_1.parse)("thread:1\nrepeat:10\nw1 601\nPP 300 25 9\nw2 1 1250\nC_POS 400+134 3 4 choose:1 waves:12\n"))
            .to.deep.equal({
            out: {
                setting: { scene: "FE" },
                1: {
                    iceTimes: [],
                    waveLength: 601,
                    actions: [
                        {
                            op: "Cob",
                            time: 300,
                            symbol: "PP",
                            positions: [
                                {
                                    row: 2,
                                    col: 9,
                                },
                                {
                                    row: 5,
                                    col: 9,
                                }
                            ]
                        }
                    ],
                },
                2: {
                    iceTimes: [1],
                    waveLength: 1250,
                    actions: [
                        {
                            op: "SmartFodder",
                            time: 400,
                            symbol: "C_POS",
                            shovelTime: 400 + 134,
                            cards: [
                                "Normal",
                            ],
                            positions: [
                                {
                                    row: 3,
                                    col: 4,
                                },
                            ],
                            choose: 1,
                            waves: [1, 2],
                        },
                    ],
                },
            }, args: {
                repeat: ["-r", "10"],
                thread: ["-t", "1"],
            }
        });
    });
    it("should ignore comments", () => {
        (0, chai_1.expect)((0, parser_1.parse)("w1 1 601 # this is a comment\nP 300 2 9\n"))
            .to.have.property("out").that.deep.equal({
            setting: { scene: "FE" },
            1: {
                iceTimes: [1],
                waveLength: 601,
                actions: [
                    {
                        op: "Cob",
                        symbol: "P",
                        time: 300,
                        positions: [
                            {
                                row: 2,
                                col: 9,
                            }
                        ]
                    },
                ],
            },
        });
    });
    it("should return an error for an unknown symbol", () => {
        (0, chai_1.expect)((0, parser_1.parse)("w1 601\nX\n")).to.deep.equal({
            type: "Error",
            lineNum: 2,
            msg: "未知符号",
            src: "X",
        });
    });
});
describe('expandLines', () => {
    it('should expand a single wave line', () => {
        const input = ['w1 # comment', 'a b c'];
        (0, chai_1.expect)((0, parser_1.expandLines)(input))
            .to.deep.equal([
            { lineNum: 1, line: "w1" },
            { lineNum: 2, line: "a b c" },
        ]);
    });
    it('should expand multiple wave lines', () => {
        const input = ['w1~3 # comment', 'a b c', 'd e f', 'g h i'];
        (0, chai_1.expect)((0, parser_1.expandLines)(input))
            .to.deep.equal([
            { lineNum: 1, line: 'w1' },
            { lineNum: 2, line: 'a b c' },
            { lineNum: 3, line: 'd e f' },
            { lineNum: 4, line: 'g h i' },
            { lineNum: 1, line: 'w2' },
            { lineNum: 2, line: 'a b c' },
            { lineNum: 3, line: 'd e f' },
            { lineNum: 4, line: 'g h i' },
            { lineNum: 1, line: 'w3' },
            { lineNum: 2, line: 'a b c' },
            { lineNum: 3, line: 'd e f' },
            { lineNum: 4, line: 'g h i' },
        ]);
    });
    it('should handle invalid wave syntax', () => {
        const input = ['w1~a # comment', 'a b c'];
        (0, chai_1.expect)((0, parser_1.expandLines)(input))
            .to.deep.equal((0, error_1.error)(1, '波数应为正整数', 'w1~a'));
    });
    it('should handle invalid wave range', () => {
        const input = ['w3~1 # comment', 'a b c'];
        (0, chai_1.expect)((0, parser_1.expandLines)(input))
            .to.deep.equal((0, error_1.error)(1, '起始波数应大于终止波数', 'w3~1'));
    });
});
describe('replaceVariables', () => {
    let out;
    beforeEach(() => {
        out = { setting: {} };
    });
    it('should return the original line if variables are not defined', () => {
        const line = 'SET $a 1';
        (0, chai_1.expect)((0, parser_1.replaceVariables)(out, line)).to.equal(line);
    });
    it('should replace variables with their values', () => {
        out.setting.variables = { $a: 1, $b: 2 };
        (0, chai_1.expect)((0, parser_1.replaceVariables)(out, 'SET $a $b')).to.equal('SET $a 2');
    });
    it('should not replace variable to be SET', () => {
        out.setting.variables = { $a: 1 };
        (0, chai_1.expect)((0, parser_1.replaceVariables)(out, 'SET $a 1')).to.equal('SET $a 1');
    });
    it('should replace variables in non-reserved words', () => {
        out.setting.variables = { $a: 1 };
        (0, chai_1.expect)((0, parser_1.replaceVariables)(out, 'P $a 2 9')).to.equal('P 1 2 9');
    });
    it('should replace variables in the middle of a word', () => {
        out.setting.variables = { $a: 1 };
        (0, chai_1.expect)((0, parser_1.replaceVariables)(out, 'P $a1 2 9')).to.equal('P 11 2 9');
    });
    it('should replace multiple variables in a line', () => {
        out.setting.variables = { $a: 1, $b: 2 };
        (0, chai_1.expect)((0, parser_1.replaceVariables)(out, 'P $a $b $a')).to.equal('P 1 2 1');
    });
});
//# sourceMappingURL=parser.test.js.map