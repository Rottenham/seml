/* eslint-disable @typescript-eslint/naming-convention */
import { ParserOutput, error, parseCob, parseWave, parseFodder, parseScene, parseProtect, parseSmash } from '../../parser';
import { expect } from 'chai';

describe("parseCob", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {} };
    });

    it("should return an error if no wave is set", () => {
        expect(parseCob(out, 1, "P 300 2 9", 1)).to.deep.equal(
            error(1, "请先设定波次", "P 300 2 9")
        );
    });

    it("should return an error if time is missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P", 1)).to.deep.equal(
            error(1, "请提供炮生效时机", "P")
        );
    });

    it("should return an error if time is negative", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P -1 2 9", 1)).to.deep.equal(
            error(1, "时间应为非负整数", "-1")
        );
    });

    it("should return an error if delay is used without context", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P +220 2 9", 1)).to.deep.equal(
            error(1, "没有延迟基准", "+220")
        );
    });

    it("should return an error if rows are missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300", 1)).to.deep.equal(
            error(1, "请提供落点行", "P 300")
        );
    });

    it("should return an error if number of rows dooes not match expected number of cobs", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "PP 300 2 9", 2)).to.deep.equal(
            error(1, "请提供 2 个落点行", "2")
        );
    });

    it("should return an error if colToken is missing", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2", 1)).to.deep.equal(
            error(1, "请提供落点列", "P 300 2")
        );
    });

    it("should return an error if row is not a number", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 a 9", 1)).to.deep.equal(
            error(1, "落点行应为 1~6 内的整数", "a")
        );
    });

    it("should return an error if row is not within 1-6", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 7 9", 1)).to.deep.equal(
            error(1, "落点行应为 1~6 内的整数", "7")
        );
    });

    it("should return an error if col is not a number", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 a", 1)).to.deep.equal(
            error(1, "落点列应为 0.0~10.0 内的数字", "a")
        );
    });

    it("should return an error if col is not within 0.0-10.0", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 11", 1)).to.deep.equal(
            error(1, "落点列应为 0.0~10.0 内的数字", "11")
        );
    });

    it("should add a Cob action to the current wave", () => {
        out[1] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 9", 1)).equal(null);
        expect(out[1]?.actions).to.deep.equal([
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
        expect(parseCob(out, 1, "P 300 2 9", 1)).equal(null);
        expect(parseCob(out, 2, "P +134 2 9", 1)).equal(null);
        expect(out[1]?.actions).to.deep.equal([
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
        expect(parseCob(out, 1, "PP 300 25 9", 2)).equal(null);
        expect(out[1]?.actions).to.deep.equal([
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
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {} };
    });

    it('should parse valid wave', () => {
        expect(parseWave(out, 1, 'W1 100 200 300 601')).equal(null);
        expect(out[1]).to.deep.equal({
            iceTimes: [100, 200, 300],
            waveLength: 601,
            actions: [],
        });
    });

    it('should return an error for invalid wave number', () => {
        expect(parseWave(out, 1, 'W0 100 200 300 601',))
            .to.deep.equal(error(1, '波数应为 1~9 内的整数', 'W0'));
    });

    it('should return an error for duplicate wave number', () => {
        out[1] = { iceTimes: [], waveLength: 601, actions: [] };
        expect(parseWave(out, 1, 'W1 100 200 300 601',))
            .to.deep.equal(error(1, '波数重复', 'W1'));
    });

    it('should return an error for missing wave length', () => {
        expect(parseWave(out, 1, 'W1',))
            .to.deep.equal(error(1, '请提供波长', 'W1'));
    });

    it('should return an error for invalid wave length', () => {
        expect(parseWave(out, 1, 'W1 100 200 300 0',))
            .to.deep.equal(error(1, '波长应为 >= 601 的整数', '0'));
    });

    it('should return an error for invalid ice time', () => {
        expect(parseWave(out, 1, 'W1 100 a 300 601',))
            .to.deep.equal(error(1, '用冰时机应为正整数', 'a'));
    });

    it('should return an error for wave length less than last ice time', () => {
        expect(parseWave(out, 1, 'W1 602 601',))
            .to.deep.equal(error(1, '波长应 >= 最后一次用冰时机', 'W1 602 601'));
    });

    it('should return an error for missing previous wave', () => {
        expect(parseWave(out, 1, 'W2 601',))
            .to.deep.equal(error(1, '请先设定第 1 波', 'W2'));
    });
});

describe("parseFodder", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {} };
    });

    it("should return an error if no wave has been set", () => {
        expect(parseFodder(out, 1, "C 300 2 9"))
            .to.deep.equal(error(1, "请先设定波次", "C 300 2 9"));
    });

    it("should return an error if time is missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C"))
            .to.deep.equal(error(1, "请提供用垫时机", "C"));
    });

    it("should return an error if delay is used without context", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C +134 2 9"))
            .to.deep.equal(error(1, "没有延迟基准", "+134"));
    });

    it("should return an error if shovel time is negative", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 100+-134 2 9"))
            .to.deep.equal(error(1, "时间应为非负整数", "-134"));
    });

    it("should return an error if shovel time is earlier than fodder time", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300~299 2 9"))
            .to.deep.equal(error(1, "铲除时机不可早于用垫时机", "299"));
    });

    it("should return an error if rows are missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300"))
            .to.deep.equal(error(1, "请提供用垫行", "C 300"));
    });

    it("should return an error if colToken is missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2"))
            .to.deep.equal(error(1, "请提供用垫列", "C 300 2"));
    });

    it("should return an error if rows are invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 7 9"))
            .to.deep.equal(error(1, "用垫行应为 1~6 内的整数", "7"));
    });

    it("should return an error if colToken is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 0"))
            .to.deep.equal(error(1, "用垫列应为 1~9 内的整数", "0"));
    });

    it("should return an error if choose value is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 choose:0"))
            .to.deep.equal(error(1, "choose 的值应为 1~1 内的整数", "0"));
    });

    it("should return an error if wave value is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 choose:1 waves:0"))
            .to.deep.equal(error(1, "waves 的值应为 1~1 内的整数", "0"));
    });

    it("should return an error if wave value is repeated", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 choose:1 waves:11"))
            .to.deep.equal(error(1, "waves 重复", "1"));
    });

    it("should return an error if parameter format is invalid", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 ??"))
            .to.deep.equal(error(1, "传参格式应为 [参数]:[值] ", "??"));
    });

    it("should return an error if parameter key is empty", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 :1"))
            .to.deep.equal(error(1, "参数不可为空", ":1"));
    });

    it("should return an error if parameter value is empty", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 choose:"))
            .to.deep.equal(error(1, "值不可为空", "choose:"));
    });

    it("should return an error if parameter key is unknown", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 wave:1"))
            .to.deep.equal(error(1, "未知参数", "wave"));
    });

    it("should return an error if parameter key is duplicated", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 choose:1 choose:2"))
            .to.deep.equal(error(1, "参数重复", "choose"));
    });

    it("should return an error if choose value is missing", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9 waves:1"))
            .to.deep.equal(error(1, "必须提供 choose 的值", ""));
    });

    it("should add a Normal card action to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9")).equal(null);
        expect(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                positions: [
                    {
                        type: "Normal",
                        row: 2,
                        col: 9,
                    }]
            },
        ]);
    });

    it("should add a Puff card action to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2' 9")).equal(null);
        expect(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                positions: [
                    {
                        type: "Puff",
                        row: 2,
                        col: 9,
                    }]
            },
        ]);
    });

    it("should add a card action with relative shovel time to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300+134 2 9")).equal(null);
        expect(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: 300 + 134,
                positions: [
                    {
                        type: "Normal",
                        row: 2,
                        col: 9,
                    }],
            },
        ]);
    });

    it("should add a card action with absolute shovel time to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300~600 2 9")).equal(null);
        expect(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: 600,
                positions: [
                    {
                        type: "Normal",
                        row: 2,
                        col: 9,
                    }],
            },
        ]);
    });

    it("should add multiple card actions to the current wave", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 25 9")).equal(null);
        expect(out[1].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                positions: [
                    {
                        type: "Normal",
                        row: 2,
                        col: 9,
                    },
                    {
                        type: "Normal",
                        row: 5,
                        col: 9,
                    }],
            }
        ]);
    });

    it("should add extra arguments to the card action", () => {
        out[1] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2'5 9 choose:2 waves:1")).equal(null);
        expect(out[1].actions).to.deep.equal([
            {
                op: "SmartFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                positions: [
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
                choose: 2,
                waves: [1],
            },
        ]);
    });
});

describe("parseScene", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {} };
    });

    it("should reutrn an error if setting arg is badly formatted", () => {
        expect(parseSmash(":")).to.deep.equal({
            type: "Error",
            lineNum: 1,
            msg: "参数不可为空",
            src: ":",
        });
    });

    it("should return an error scene is unknown", () => {
        expect(parseScene(out, 1, "scene:AQE"))
            .to.deep.equal(error(1, "未知场地", "AQE"));
    });

    it("should parse scene", () => {
        expect(parseScene(out, 1, "scene:FE")).equal(null);
        expect(out).to.deep.equal({
            setting: {
                scene: "FE"
            }
        });
    });

    it("should parse scene case-insensitively", () => {
        expect(parseScene(out, 1, "scene:nE")).equal(null);
        expect(out).to.deep.equal({
            setting: {
                scene: "NE"
            }
        });
    });

    it("should parse scene alias", () => {
        expect(parseScene(out, 1, "scene:RE")).equal(null);
        expect(out).to.deep.equal({
            setting: {
                scene: "ME"
            }
        });
    });

    it("should return an error if setting args are repeated", () => {
        expect(parseScene(out, 1, "scene:PE")).equal(null);
        expect(parseScene(out, 2, "scene:DE")).to.deep.equal(error(2, "参数重复", "scene"));
    });
});

describe("parseProtect", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {} };
    });


    it("should return an error if row / col is missing", () => {
        expect(parseProtect(out, 1, "protect:1"))
            .to.deep.equal(error(1, "请提供要保护的行与列", "1"));
    });

    it("should return an error if row is out of bound", () => {
        expect(parseProtect(out, 1, "protect:08"))
            .to.deep.equal(error(1, "保护行应为 1~6 内的整数", "0"));
    });

    it("should return an error if cob col is out of bound", () => {
        expect(parseProtect(out, 1, "protect:19"))
            .to.deep.equal(error(1, "炮所在列应为 1~8 内的整数", "9"));
    });

    it("should return an error if normal col is out of bound", () => {
        expect(parseProtect(out, 1, "protect:10'"))
            .to.deep.equal(error(1, "普通植物所在列应为 1~9 内的整数", "0"));
    });

    it("should return an error if positions are repeated", () => {
        expect(parseProtect({ setting: {} }, 1, "protect:18 18"))
            .to.deep.equal(error(1, "保护位置重叠", "18"));
        expect(parseProtect({ setting: {} }, 1, "protect:19' 18"))
            .to.deep.equal(error(1, "保护位置重叠", "18"));
    });

    it("should parse protect positions", () => {
        expect(parseProtect(out, 1, "protect:18 29'")).equal(null);
        expect(out).to.deep.equal({
            setting: {
                protect: [{
                    type: "Cob",
                    row: 1,
                    col: 8,
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

describe("parse", () => {
    it("should return empty object if input is empty", () => {
        expect(parseSmash("")).to.deep.equal({
            setting: {},
        });
    });

    it("should use scene information to deduce max rows", () => {
        expect(parseSmash("protect:68\nscene:DE"))
            .to.deep.equal(error(1, "保护行应为 1~5 内的整数", "6"));
    });

    it("should return an error if scene is unknown", () => {
        expect(parseSmash("protect:68\nscene:AQE"))
            .to.deep.equal(error(2, "未知场地", "AQE"));
    });

    it("should parse a single wave with a cob and a fixed fodder", () => {
        expect(parseSmash("\nW1 601\nP 300 2 9\nC +134+134 5 9\n")).to.deep.equal({
            setting: {},
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
                            }],
                    },
                    {
                        op: "FixedFodder",
                        time: 300 + 134,
                        symbol: "C",
                        shovelTime: 300 + 134 + 134,
                        positions: [
                            {
                                type: "Normal",
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
        expect(parseSmash("w1 601\nC 300~500 25 9 choose:1")).to.deep.equal({
            setting: {},
            1: {
                iceTimes: [],
                waveLength: 601,
                actions: [
                    {
                        op: "SmartFodder",
                        time: 300,
                        symbol: "C",
                        shovelTime: 500,
                        positions: [
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
                        waves: [],
                    },
                ],
            },
        });
    });

    it("should parse multiple waves", () => {
        expect(parseSmash("W1 601\nPP 300 25 9\nW2 1 1250\nC 400+134 3 4 choose:1 waves:12\n")).to.deep.equal({
            setting: {},
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
                        symbol: "C",
                        shovelTime: 400 + 134,
                        positions: [
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
        });
    });

    it("should ignore comments", () => {
        expect(parseSmash("W1 1 601 # this is a comment\nP 300 2 9\n")).to.deep.equal({
            setting: {},
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
        expect(parseSmash("W1 601\nX\n")).to.deep.equal({
            type: "Error",
            lineNum: 2,
            msg: "未知符号",
            src: "X",
        });
    });
});