/* eslint-disable @typescript-eslint/naming-convention */
import { error } from "../../error";
import {
    parse, ParserOutput, parseCob, parseWave, parseFodder, parseFixedCard, parseSmartCard,
    parseSet, parseScene, parseProtect, parseIntArg, parseZombieTypeArg, parseBoolArg,
    expandLines, replaceVariables
} from '../../parser';
import { PlantType } from "../../plant_types";
import { ZombieType } from "../../zombie_types";
import { expect } from 'chai';

describe("parseCob", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it("should return an error if no wave is set", () => {
        expect(parseCob(out, 1, "P 300 2 9", 1)).to.deep.equal(
            error(1, "请先设定波次", "P 300 2 9")
        );
    });

    it("should return an error if time is negative", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P -1 2 9", 1)).to.deep.equal(
            error(1, "时间应为非负整数", "-1")
        );
    });

    it("should return an error if delay is used without context", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P +220 2 9", 1)).to.deep.equal(
            error(1, "没有延迟基准, 请先使用非延迟语句", "+220")
        );
    });

    it("should return an error if number of rows does not match expected number of cobs", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "PP 300 2 9", 2)).to.deep.equal(
            error(1, "请提供 2 个落点行", "2")
        );
    });

    it("should return an error if colToken is missing", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2", 1)).to.deep.equal(
            error(1, "请提供炮生效时机, 落点行, 落点列", "P 300 2")
        );
    });

    it("should return an error if there is excessive argument", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 9 9", 1)).to.deep.equal(
            error(1, "请删去多余的参数", "9")
        );
    });

    it("should return an error if row is not a number", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 a 9", 1)).to.deep.equal(
            error(1, "落点行应为 1~6 内的整数", "a")
        );
    });

    it("should return an error if row is not within 1-6", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 7 9", 1)).to.deep.equal(
            error(1, "落点行应为 1~6 内的整数", "7")
        );
    });

    it("should return an error if col is not a number", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 a", 1)).to.deep.equal(
            error(1, "落点列应为 0.0~10.0 内的数字", "a")
        );
    });

    it("should return an error if col is not within 0.0-10.0", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 11", 1)).to.deep.equal(
            error(1, "落点列应为 0.0~10.0 内的数字", "11")
        );
    });

    it("should return an error if cob col is specified for non-roof scenes", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P3 300 2 11", 1)).to.deep.equal(
            error(1, "只有屋顶场合可以指定炮尾列", "P3")
        );
    });

    it("should return an error if cob col is not specified for roof scenes", () => {
        out.setting.scene = "ME";
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 9", 1)).to.deep.equal(
            error(1, "屋顶场合请提供落点列", "P")
        );
    });

    it("should return an error if specified cob col is invalid", () => {
        out.setting.scene = "ME";
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P0 300 2 11", 1)).to.deep.equal(
            error(1, "炮尾列应为 1~8 内的整数", "0")
        );
    });

    it("should add a Cob action to the current wave", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 9", 1)).equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
            {
                op: "Cob",
                time: 300,
                symbol: "P",
                positions: [{
                    row: 2,
                    col: 9,
                }],
                cobCol: undefined
            },
        ]);
    });

    it("should add a Cob action to the current wave with specified cob col", () => {
        out.setting.scene = "ME";
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P3 300 2 9", 1)).equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
            {
                op: "Cob",
                time: 300,
                symbol: "P3",
                positions: [{
                    row: 2,
                    col: 9,
                }],
                cobCol: 3
            },
        ]);
    });

    it("should add a delayed Cob action to the current wave", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "P 300 2 9", 1)).equal(null);
        expect(parseCob(out, 2, "P +134 2 9", 1)).equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
            {
                op: "Cob",
                symbol: "P",
                time: 300,
                positions: [{
                    row: 2,
                    col: 9,
                }],
                cobCol: undefined
            },
            {
                op: "Cob",
                symbol: "P",
                time: 300 + 134,
                positions: [{
                    row: 2,
                    col: 9,
                }],
                cobCol: undefined
            },
        ]);
    });

    it("should add multiple Cob actions to the current wave if there are multiple rows", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseCob(out, 1, "PP 300 25 9", 2)).equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
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
                }],
                cobCol: undefined
            },
        ]);
    });
});

describe('parseWave', () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it('should parse valid wave', () => {
        expect(parseWave(out, 1, 'w1 100 200 300 601')).equal(null);
        expect(out.waves[0]).to.deep.equal({
            iceTimes: [100, 200, 300],
            waveLength: 601,
            actions: [],
            startTick: undefined,
        });
    });

    it('should auto deduce wave num if it is not provided', () => {
        expect(parseWave(out, 1, 'w 100 200 300 601')).equal(null);
        expect(out.waves[0]).to.deep.equal({
            iceTimes: [100, 200, 300],
            waveLength: 601,
            actions: [],
            startTick: undefined,
        });
    });

    it('should parse valid wave with start tick', () => {
        expect(parseWave(out, 1, 'w1 100 200 300 300~601')).equal(null);
        expect(out.waves[0]).to.deep.equal({
            iceTimes: [100, 200, 300],
            waveLength: 601,
            actions: [],
            startTick: 300,
        });
    });

    it('should return an error for invalid wave number', () => {
        expect(parseWave(out, 1, 'w0 100 200 300 601',))
            .to.deep.equal(error(1, '波数应为正整数', 'w0'));
    });

    it('should return an error for duplicate wave number', () => {
        out.waves[0] = { iceTimes: [], waveLength: 601, actions: [] };
        expect(parseWave(out, 1, 'w1 100 200 300 601',))
            .to.deep.equal(error(1, '波数重复', 'w1'));
    });

    it('should return an error for missing wave length', () => {
        expect(parseWave(out, 1, 'w1',))
            .to.deep.equal(error(1, '请提供波长', 'w1'));
    });

    it('should return an error for invalid wave length', () => {
        expect(parseWave(out, 1, 'w1 100 200 300 0',))
            .to.deep.equal(error(1, '波长应为 ≥ 601 的整数', '0'));
    });

    it('should return an error for invalid ice time', () => {
        expect(parseWave(out, 1, 'w1 100 a 300 601',))
            .to.deep.equal(error(1, '用冰时机应为非负整数', 'a'));
    });

    it('should return an error for wave length less than last ice time', () => {
        expect(parseWave(out, 1, 'w1 602 601',))
            .to.deep.equal(error(1, '波长应 ≥ 最后一次用冰时机', 'w1 602 601'));
    });

    it('should return an error for missing previous wave', () => {
        expect(parseWave(out, 1, 'w2 601',))
            .to.deep.equal(error(1, '请先设定第 1 波', 'w2'));
    });

    it('should return an error if start tick is invalid', () => {
        expect(parseWave(out, 1, 'w1 602~601',))
            .to.deep.equal(error(1, '起始时刻应 ≤ 波长', '602'));
    });
});

describe("parseFodder", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it("should return an error if no wave has been set", () => {
        expect(parseFodder(out, 1, "C 300 2 9"))
            .to.deep.equal(error(1, "请先设定波次", "C 300 2 9"));
    });

    it("should return an error if delay is used without context", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C +134 2 9"))
            .to.deep.equal(error(1, "没有延迟基准, 请先使用非延迟语句", "+134"));
    });

    it("should return an error if shovel time is negative", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 100+-134 2 9"))
            .to.deep.equal(error(1, "时间应为非负整数", "-134"));
    });

    it("should return an error if shovel time is earlier than fodder time", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300~299 2 9"))
            .to.deep.equal(error(1, "铲除时机不可早于用卡时机", "299"));
    });

    it("should return an error if colToken is missing", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2"))
            .to.deep.equal(error(1, "请提供用卡时机, 用卡行, 用卡列", "C 300 2"));
    });

    it("should return an error if rows are invalid", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 7 9"))
            .to.deep.equal(error(1, "用卡行应为 1~6 内的整数", "7"));
    });

    it("should return an error if rows are repeated", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 11 9"))
            .to.deep.equal(error(1, "用卡行重复", "1"));
    });

    it("should return an error if colToken is invalid", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 0"))
            .to.deep.equal(error(1, "用卡列应为 1~9 内的整数", "0"));
    });

    it("should add a Normal card action to the current wave", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2 9")).equal(null);
        expect(out.waves[0].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                fodders: [
                    "Normal"
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }]
            },
        ]);
    });

    it("should add a Puff card action to the current wave", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 2' 9")).equal(null);
        expect(out.waves[0].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                fodders: [
                    "Puff",
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }]
            },
        ]);
    });

    it("should add a Pot card action to the current wave", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, 'C 300 2" 9')).equal(null);
        expect(out.waves[0].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                fodders: [
                    "Pot",
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }]
            },
        ]);
    });

    it("should add a card action with relative shovel time to the current wave", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300+134 2 9")).equal(null);
        expect(out.waves[0].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: 300 + 134,
                fodders: [
                    "Normal"
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }],
            },
        ]);
    });

    it("should add a card action with absolute shovel time to the current wave", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300~600 2 9")).equal(null);
        expect(out.waves[0].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: 600,
                fodders: [
                    "Normal"
                ],
                positions: [
                    {
                        row: 2,
                        col: 9,
                    }],
            },
        ]);
    });

    it("should add multiple card actions to the current wave", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C 300 25 9")).equal(null);
        expect(out.waves[0].actions).to.deep.equal([
            {
                op: "FixedFodder",
                time: 300,
                symbol: "C",
                shovelTime: undefined,
                fodders: [
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
                    }],
            }
        ]);
    });

});

describe('parseFodderWithArgs', () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it("should return an error if only one wave was provided", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 2 9 choose:0"))
            .to.deep.equal(error(1, "请提供至少 2 个用卡行", "2"));
    });

    it("should return an error if choose value is invalid", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 choose:0"))
            .to.deep.equal(error(1, "choose 的值应为 1~2 内的整数", "0"));
    });

    it("should return an error if wave value is invalid", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 choose:1 waves:0"))
            .to.deep.equal(error(1, "waves 的值应为 1~1 内的整数", "0"));
    });

    it("should return an error if wave value is repeated", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 choose:1 waves:1,1"))
            .to.deep.equal(error(1, "waves 重复", "1"));
    });

    it("should return an error if parameter format is invalid", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 ??"))
            .to.deep.equal(error(1, "传参格式应为 [参数]:[值] ", "??"));
    });

    it("should return an error if parameter key is empty", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 :1"))
            .to.deep.equal(error(1, "参数不可为空", ":1"));
    });

    it("should return an error if parameter value is empty", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 choose:"))
            .to.deep.equal(error(1, "值不可为空", "choose:"));
    });

    it("should return an error if parameter key is unknown", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 wave:1"))
            .to.deep.equal(error(1, "未知参数", "wave (支持的参数: choose, waves)"));
    });

    it("should return an error if parameter key is duplicated", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 choose:1 choose:2"))
            .to.deep.equal(error(1, "参数重复", "choose"));
    });

    it("should return an error if choose value is missing for C_POS", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 25 9 waves:1"))
            .to.deep.equal(error(1, "必须提供 choose 的值", ""));
    });

    it("should not return an error if choose value is missing for C_NUM", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_NUM 300 25 9"))
            .to.equal(null);
        expect(out.waves[0].actions).to.deep.equal([{
            op: "SmartFodder",
            time: 300,
            symbol: "C_NUM",
            shovelTime: undefined,
            fodders: [
                "Normal",
                "Normal"
            ],
            positions: [
                {
                    row: 2,
                    col: 9,
                }, {
                    row: 5,
                    col: 9,
                }],
            choose: 2,
            waves: [],
        }]);
    });

    it("should add extra arguments to the card action", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseFodder(out, 1, "C_POS 300 2'5 9 choose:2 waves:1")).equal(null);
        expect(out.waves[0].actions).to.deep.equal([
            {
                op: "SmartFodder",
                time: 300,
                symbol: "C_POS",
                shovelTime: undefined,
                fodders: [
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

describe('parseFixedCard', () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it('should return an error if no wave is set', () => {
        expect(parseFixedCard(out, 1, 'J 100 1 1', PlantType.jalapeno)).to.deep.equal(
            error(1, '请先设定波次', 'J 100 1 1')
        );
    });

    it('should return an error if colToken is missing', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'J 100 1', PlantType.jalapeno)).to.deep.equal(
            error(1, '请提供用卡时机, 用卡行, 用卡列', 'J 100 1')
        );
    });

    it('should return an error if there is excessive argument', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'J 100 1 9 9', PlantType.jalapeno)).to.deep.equal(
            error(1, '请删去多余的参数', '9')
        );
    });

    it('should return an error if time is invalid', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'J -100 1 1', PlantType.jalapeno)).to.deep.equal(
            error(1, '时间应为非负整数', '-100')
        );
        expect(parseFixedCard(out, 1, 'J 100+266 1 1', PlantType.jalapeno)).to.deep.equal(
            error(1, '时间应为非负整数', '100+266')
        );
        expect(parseFixedCard(out, 1, 'G 100+-134 1 1', PlantType.jalapeno)).to.deep.equal(
            error(1, '时间应为非负整数', '-134')
        );
    });

    it('should return an error if row is not a number', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'J 100 a 1', PlantType.jalapeno)).to.deep.equal(
            error(1, '用卡行应为 1~6 内的整数', 'a')
        );
    });

    it('should return an error if row is not within 1-6', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'J 100 7 1', PlantType.jalapeno)).to.deep.equal(
            error(1, '用卡行应为 1~6 内的整数', '7')
        );
    });

    it('should return an error if col is not within 1~9', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'J 100 1 0', PlantType.jalapeno)).to.deep.equal(
            error(1, '用卡列应为 1~9 内的整数', '0')
        );
    });

    it('should add a Jalapeno action to the current wave', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'J 100 1 1', PlantType.jalapeno)).equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
            {
                op: 'FixedCard',
                symbol: 'J',
                time: 100,
                shovelTime: undefined,
                plantType: PlantType.jalapeno,
                position: { row: 1, col: 1 },
            },
        ]);
    });

    it('should add a delayed Jalapeno action to the current wave', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'J 100 1 1', PlantType.jalapeno)).equal(null);
        expect(parseFixedCard(out, 2, 'J +134 1 1', PlantType.jalapeno)).equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
            {
                op: 'FixedCard',
                symbol: 'J',
                time: 100,
                shovelTime: undefined,
                plantType: PlantType.jalapeno,
                position: { row: 1, col: 1 },
            },
            {
                op: 'FixedCard',
                symbol: 'J',
                time: 100 + 134,
                shovelTime: undefined,
                plantType: PlantType.jalapeno,
                position: { row: 1, col: 1 },
            },
        ]);
    });

    it('should add a Garlic action with shovel time to the current wave', () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseFixedCard(out, 1, 'G 100+266 1 1', PlantType.garlic)).equal(null);
        expect(parseFixedCard(out, 2, 'G 300 1 1', PlantType.garlic)).equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
            {
                op: 'FixedCard',
                symbol: 'G',
                time: 100,
                shovelTime: 100 + 266,
                plantType: PlantType.garlic,
                position: { row: 1, col: 1 },
            }, {
                op: 'FixedCard',
                symbol: 'G',
                time: 300,
                shovelTime: undefined,
                plantType: PlantType.garlic,
                position: { row: 1, col: 1 },
            }
        ]);
    });
});

describe("parseSmartCard", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it("should return an error if colToken is missing", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 25", PlantType.jalapeno))
            .to.deep.equal(error(1, "请提供用卡时机, 用卡行, 用卡列", "J_NUM 300 25"));
    });

    it("should return an error if there is excessive argument", () => {
        out.waves[0] = { iceTimes: [], waveLength: 0, actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 25 9 9", PlantType.jalapeno))
            .to.deep.equal(error(1, "请删去多余的参数", "9"));
    });


    it("should return an error if no wave has been set", () => {
        expect(parseSmartCard(out, 1, "J_NUM 300 25 9", PlantType.jalapeno))
            .to.deep.equal(error(1, "请先设定波次", "J_NUM 300 25 9"));
    });

    it("should return an error if time is negative", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM -1 25 9", PlantType.jalapeno)).to.deep.equal(
            error(1, "时间应为非负整数", "-1")
        );
    });

    it("should return an error if row is not a number", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 1a 9", PlantType.jalapeno)).to.deep.equal(
            error(1, "用卡行应为 1~6 内的整数", "a")
        );
    });

    it("should return an error if row is not within 1-6", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 17 9", PlantType.jalapeno)).to.deep.equal(
            error(1, "用卡行应为 1~6 内的整数", "7")
        );
    });

    it("should return an error if only one row was provided", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 1 9", PlantType.jalapeno)).to.deep.equal(
            error(1, "请提供至少 2 个用卡行", "1")
        );
    });

    it("should return an error if col is not a number", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 25 a", PlantType.jalapeno)).to.deep.equal(
            error(1, "用卡列应为 1~9 内的整数", "a")
        );
    });

    it("should return an error if col is not within 1-10", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 25 10", PlantType.jalapeno)).to.deep.equal(
            error(1, "用卡列应为 1~9 内的整数", "10")
        );
    });

    it("should return an error if row is duplicated", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 22 9", PlantType.jalapeno)).to.deep.equal(
            error(1, "用卡行重复", "2")
        );
    });

    it("should add a SmartCard action to the current wave", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 25 9", PlantType.jalapeno)).to.equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
            {
                op: "SmartCard",
                time: 300,
                symbol: "J_NUM",
                plantType: PlantType.jalapeno,
                positions: [{
                    row: 2,
                    col: 9,
                }, {
                    row: 5,
                    col: 9,
                }],
            },
        ]);
    });

    it("should add multiple SmartCard actions to the current wave if there are multiple rows", () => {
        out.waves[0] = { waveLength: 601, iceTimes: [], actions: [] };
        expect(parseSmartCard(out, 1, "J_NUM 300 25 9", PlantType.jalapeno)).to.equal(null);
        expect(out.waves[0]!.actions).to.deep.equal([
            {
                op: "SmartCard",
                symbol: "J_NUM",
                time: 300,
                plantType: PlantType.jalapeno,
                positions: [{
                    row: 2,
                    col: 9,
                }, {
                    row: 5,
                    col: 9,
                }],
            },
        ]);
    });
});

describe('parseSet', () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it('should return an error if variable name is missing', () => {
        expect(parseSet(out, 1, 'set'))
            .to.deep.equal(error(1, '请提供变量名与表达式', 'set'));
    });

    it('should return an error if variable name is empty', () => {
        expect(parseSet(out, 1, 'set  1+2'))
            .to.deep.equal(error(1, '变量名不可为空', 'set  1+2'));
    });

    it('should return an error if variable name is a pure number', () => {
        expect(parseSet(out, 1, 'set 123 1+2'))
            .to.deep.equal(error(1, '变量名不可为纯数字', '123'));
    });

    it('should return an error if expression is missing', () => {
        expect(parseSet(out, 1, 'set x '))
            .to.deep.equal(error(1, '表达式不可为空', 'set x '));
    });

    it('should return an error if expression contains invalid characters', () => {
        expect(parseSet(out, 1, 'set x 1+2-3*4/5%6'))
            .to.deep.equal(error(1, '表达式只能包含数字、运算符与括号', '1+2-3*4/5%6'));
    });

    it('should return an error if expression is invalid', () => {
        expect(parseSet(out, 1, 'set x 1/0'))
            .to.deep.equal(error(1, '表达式无效', '1/0'));
    });

    it('should add a variable to the output', () => {
        expect(parseSet(out, 1, 'set x 1+2')).to.equal(null);
        expect(out.setting.variables)
            .to.deep.equal({ x: 3 });
    });
});

describe("parseScene", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it("should return an error scene is unknown", () => {
        expect(parseScene(out, [{ lineNum: 1, line: "scene:AQE" }]))
            .to.deep.equal(error(1, "未知场地", "AQE (支持的场地: DE, NE, PE, FE, RE, ME)"));
    });

    it("should parse scene", () => {
        expect(parseScene(out, [{ lineNum: 1, line: "scene:FE" }])).equal(null);
        expect(out).to.have.property("setting").that.deep.equal({
            originalScene: "FE",
            scene: "FE"
        });
    });

    it("should parse scene case-insensitively", () => {
        expect(parseScene(out, [{ lineNum: 1, line: "scene:nE" }])).equal(null);
        expect(out).to.have.property("setting").that.deep.equal({
            originalScene: "NE",
            scene: "NE"
        });
    });

    it("should parse scene alias and preserve original scene information", () => {
        expect(parseScene(out, [{ lineNum: 1, line: "scene:RE" }])).equal(null);
        expect(out).to.have.property("setting").that.deep.equal({
            originalScene: "RE",
            scene: "ME"
        });
    });

    it("should return an error if setting args are repeated", () => {
        expect(parseScene(out, [{ lineNum: 1, line: "scene:PE" }, { lineNum: 2, line: "scene:DE" }]))
            .to.deep.equal(error(2, "参数重复", "scene"));
    });
});

describe("parseProtect", () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it("should return an error if protect is duplicated", () => {
        expect(parseProtect(out, 1, "protect:17")).to.equal(null);
        expect(parseProtect(out, 2, "protect:17"))
            .to.deep.equal(error(2, "参数重复", "protect"));
    });

    it("should return an error if there is no value", () => {
        expect(parseProtect(out, 1, "protect:"))
            .to.deep.equal(error(1, "protect 的值不可为空", "protect:"));
    });

    it("should return an error if row / col is missing", () => {
        expect(parseProtect(out, 1, "protect:1"))
            .to.deep.equal(error(1, "请提供要保护的行与列", "protect:1"));
    });

    it("should return an error if row is out of bound", () => {
        expect(parseProtect(out, 1, "protect:08"))
            .to.deep.equal(error(1, "保护行应为 1~6 内的整数", "0"));
    });

    it("should return an error if cob col is out of bound", () => {
        expect(parseProtect(out, 1, "protect:11"))
            .to.deep.equal(error(1, "炮所在列应为 2~9 内的整数", "1"));
    });

    it("should return an error if normal col is out of bound", () => {
        expect(parseProtect(out, 1, "protect:10'"))
            .to.deep.equal(error(1, "普通植物所在列应为 1~9 内的整数", "0"));
    });

    it("should return an error if positions are repeated", () => {
        expect(parseProtect({ setting: {}, waves: [] }, 1, "protect:18 18"))
            .to.deep.equal(error(1, "保护位置重叠", "18"));
        expect(parseProtect({ setting: {}, waves: [] }, 1, "protect:17' 18"))
            .to.deep.equal(error(1, "保护位置重叠", "18"));
        expect(parseProtect({ setting: {}, waves: [] }, 1, "protect:18 17'"))
            .to.deep.equal(error(1, "保护位置重叠", "17'"));
        expect(parseProtect({ setting: {}, waves: [] }, 1, "protect:17' 17'"))
            .to.deep.equal(error(1, "保护位置重叠", "17'"));
    });

    it("should parse protect positions", () => {
        expect(parseProtect(out, 1, "protect:16' 18 26'")).equal(null);
        expect(out).to.have.property("setting").that.deep.equal({
            protect: [{
                type: "Normal",
                row: 1,
                col: 6,
            }, {
                type: "Cob",
                row: 1,
                col: 8,
            }, {
                type: "Normal",
                row: 2,
                col: 6,
            },],
        });
    });

});

describe("parseIntArg", () => {
    let args: { [key: string]: string[] };

    beforeEach(() => {
        args = {};
    });

    it("should parse repeat", () => {
        expect(parseIntArg(args, "repeat", "-r", 1, "repeat:1437")).to.equal(null);
        expect(args).to.deep.equal({ repeat: ["-r", "1437"] });
    });

    it("should parse thread", () => {
        expect(parseIntArg(args, "thread", "-t", 1, "thread:69")).to.equal(null);
        expect(args).to.deep.equal({ thread: ["-t", "69"] });
    });

    it("should return an error if arg is specified multiple times", () => {
        expect(parseIntArg(args, "repeat", "-r", 1, "repeat:1437")).to.equal(null);
        expect(parseIntArg(args, "repeat", "-r", 2, "repeat:2222"))
            .to.deep.equal(error(2, "参数重复", "repeat"));
    });

    it("should return an error if value is not a non-negative integer", () => {
        expect(parseIntArg(args, "repeat", "-r", 1, "repeat:0"))
            .to.deep.equal(error(1, "repeat 的值应为正整数", "0"));
    });
});


describe("parseZombieTypeArg", () => {
    let args: { [key: string]: string[] };

    beforeEach(() => {
        args = {};
    });

    it("should return an error if arg is specified multiple times", () => {
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:garg", undefined)).to.equal(null);
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 2, "require:giga", undefined))
            .to.deep.equal(error(2, "参数重复", "require"));
    });

    it("should return an error if zombieTypeAbbr is completely unmatched", () => {
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:xxxx", undefined)).to.deep.equal(
            error(1, "未知僵尸类型", "xxxx")
        );
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:僵", undefined)).to.deep.equal(
            error(1, "未知僵尸类型", "僵 (支持的僵尸类型: 杆,桶,门,橄,舞,潜,车,豚,丑,气,矿,跳,偷,梯,篮,白,红)")
        );
    });

    it("should return an error if zombieTypeAbbr is unknown and also suggest closest name", () => {
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:football", undefined)).to.deep.equal(
            error(1, "未知僵尸类型", "football (您是否要输入 foot?)")
        );
    });

    it("should return an error if zombie types are duplicated", () => {
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:buck buck", undefined)).to.deep.equal(
            error(1, "僵尸类型重复", "buck")
        );
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:buck", undefined)).to.equal(null);
        expect(parseZombieTypeArg(args, "ban", "-ban", "PE", 2, "ban:buck", ZombieType.buckethead.toString())).to.deep.equal(
            error(2, "僵尸类型重复", "buck")
        );
    });

    it("should add zombieType to args if it's valid", () => {
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:buck", undefined)).to.equal(null);
        expect(args).to.deep.equal({ require: ["-req", ZombieType.buckethead.toString()] });
    });

    it("should ignore case", () => {
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:BuCK", undefined)).to.equal(null);
        expect(args).to.deep.equal({ require: ["-req", ZombieType.buckethead.toString()] });
    });

    it("should add multiple zombieTypes to args if they're valid", () => {
        expect(parseZombieTypeArg(args, "require", "-req", "PE", 1, "require:buck scre", undefined)).to.equal(null);
        expect(args).to.have.property("require").deep.equal(["-req", [ZombieType.buckethead, ZombieType.screendoor].join(",")]);
        expect(parseZombieTypeArg(args, "ban", "-ban", "PE", 1, "ban:红白", undefined)).to.equal(null);
        expect(args).to.have.property("ban").that.deep.equal(["-ban", [ZombieType.gigaGargantuar, ZombieType.gargantuar].join(",")]);
    });
});

describe("parseBoolArg", () => {
    let args: { [key: string]: string[] };

    beforeEach(() => {
        args = {};
    });


    it("should parse huge", () => {
        expect(parseBoolArg(args, "huge", "-h", 1, "huge:true")).to.equal(null);
        expect(args).to.deep.equal({ huge: ["-h"] });
    });

    it("should parse activate", () => {
        expect(parseBoolArg(args, "activate", "-a", 1, "activate:true")).to.equal(null);
        expect(args).to.deep.equal({ activate: ["-a"] });
    });

    it("should return an error if arg is specified multiple times", () => {
        expect(parseBoolArg(args, "huge", "-h", 1, "huge:true")).to.equal(null);
        expect(parseBoolArg(args, "huge", "-h", 2, "huge:false"))
            .to.deep.equal(error(2, "参数重复", "huge"));
    });

    it("should return an error if value is neither true or false", () => {
        expect(parseBoolArg(args, "huge", "-h", 1, "huge:???"))
            .to.deep.equal(error(1, "huge 的值应为 true 或 false", "???"));
    });
});

describe("parse", () => {
    it("should return empty object if input is empty", () => {
        expect(parse(""))
            .to.have.property("out").that.deep.equal({
                setting: { scene: "FE" },
                waves: [],
            });
    });

    it("should return an error if cob is used before wave", () => {
        expect(parse("P 300 2 9\nw1 601"))
            .to.deep.equal(error(1, "请先设定波次", "P 300 2 9"));
    });

    it("should return an error if cannot expand lines", () => {
        expect(parse("w1~0 601"))
            .to.deep.equal(error(1, "起始波数应大于终止波数", "w1~0"));
    });

    it("should use scene information to deduce max rows", () => {
        expect(parse("protect:68\nscene:DE"))
            .to.deep.equal(error(1, "保护行应为 1~5 内的整数", "6"));
    });

    it("should return an error if scene is unknown", () => {
        expect(parse("protect:68\nscene:AQE"))
            .to.deep.equal(error(2, "未知场地", "AQE (支持的场地: DE, NE, PE, FE, RE, ME)"));
    });

    it("should parse a single wave with a cob and a fixed fodder", () => {
        expect(parse("\nw1 601\nP 300 2 9\nC +134+134 5 9\n"))
            .to.have.property("out").that.deep.equal({
                setting: { scene: "FE" },
                waves: [{
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
                            cobCol: undefined
                        },
                        {
                            op: "FixedFodder",
                            time: 300 + 134,
                            symbol: "C",
                            shovelTime: 300 + 134 + 134,
                            fodders: [
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
                    startTick: undefined,
                }],
            });
    });

    it("should parse a single wave with a smart fodder", () => {
        expect(parse("w1 601\nC_POS 300~500 25 9 choose:1"))
            .to.have.property("out").that.deep.equal({
                setting: { scene: "FE" },
                waves: [{
                    iceTimes: [],
                    waveLength: 601,
                    actions: [
                        {
                            op: "SmartFodder",
                            time: 300,
                            symbol: "C_POS",
                            shovelTime: 500,
                            fodders: [
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
                    startTick: undefined,
                }]
            });
    });

    it("should parse a single wave with all types of fixed cards", () => {
        expect(parse("w1 601\nJ 300 2 9\nG 100+266 5 9\nA 278 5 9\na 226 6 9"))
            .to.have.property("out").that.deep.equal({
                setting: { scene: "FE" },
                waves: [{
                    iceTimes: [],
                    waveLength: 601,
                    actions: [
                        {
                            op: "FixedCard",
                            symbol: "G",
                            time: 100,
                            shovelTime: 100 + 266,
                            plantType: PlantType.garlic,
                            position: {
                                row: 5,
                                col: 9
                            }
                        },
                        {
                            op: "FixedCard",
                            symbol: "a",
                            time: 226,
                            shovelTime: undefined,
                            plantType: PlantType.squash,
                            position: {
                                row: 6,
                                col: 9
                            }
                        },
                        {
                            op: "FixedCard",
                            symbol: "A",
                            time: 278,
                            shovelTime: undefined,
                            plantType: PlantType.cherryBomb,
                            position: {
                                row: 5,
                                col: 9
                            }
                        },
                        {
                            op: "FixedCard",
                            symbol: "J",
                            time: 300,
                            shovelTime: undefined,
                            plantType: PlantType.jalapeno,
                            position: {
                                row: 2,
                                col: 9
                            }
                        }
                    ],
                    startTick: undefined,
                }]
            });
    });

    it("should parse a single wave with all types of smart cards", () => {
        expect(parse("w1 601\nJ_NUM 300 25 9\nA_NUM 278 25 9\na_NUM 226 16 9"))
            .to.have.property("out").that.deep.equal({
                setting: { scene: "FE" },
                waves: [{
                    iceTimes: [],
                    waveLength: 601,
                    actions: [
                        {
                            op: "SmartCard",
                            symbol: "a_NUM",
                            time: 226,
                            plantType: PlantType.squash,
                            positions: [{
                                row: 1,
                                col: 9
                            },
                            {
                                row: 6,
                                col: 9
                            }]
                        },
                        {
                            op: "SmartCard",
                            symbol: "A_NUM",
                            time: 278,
                            plantType: PlantType.cherryBomb,
                            positions: [{
                                row: 2,
                                col: 9
                            },
                            {
                                row: 5,
                                col: 9
                            }]
                        },
                        {
                            op: "SmartCard",
                            symbol: "J_NUM",
                            time: 300,
                            plantType: PlantType.jalapeno,
                            positions: [{
                                row: 2,
                                col: 9
                            }, {
                                row: 5,
                                col: 9
                            }]
                        }
                    ],
                    startTick: undefined,
                }]
            });
    });


    it("should parse expanded waves with variables", () => {
        expect(parse("SET x 300\nw1~2 601\nP x 2 9 \nSET x x+100"))
            .to.have.property("out").that.deep.equal({
                setting: { scene: "FE" },
                waves: [{
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
                            cobCol: undefined
                        },
                    ],
                    startTick: undefined,
                },
                {
                    iceTimes: [],
                    waveLength: 601,
                    actions: [
                        {
                            op: "Cob",
                            time: 300 + 100,
                            symbol: "P",
                            positions: [
                                {
                                    row: 2,
                                    col: 9,
                                }],
                            cobCol: undefined
                        },
                    ],
                    startTick: undefined,
                }]
            });
    });

    it("should parse multiple waves with metadata", () => {
        expect(parse("scene:PE\nrepeat:10\nrequire:garg giga\nban:buck\nhuge:true\nactivate:false\ndance:true\nw1 601\nPP 300 25 9\nw2 1 1250\nC_POS 400+134 16 9 choose:1 waves:1,2\n"))
            .to.deep.equal({
                out: {
                    setting: { scene: "FE", originalScene: "PE" },
                    waves: [{
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
                                ],
                                cobCol: undefined
                            }
                        ],
                        startTick: undefined,
                    },
                    {
                        iceTimes: [1],
                        waveLength: 1250,
                        actions: [
                            {
                                op: "SmartFodder",
                                time: 400,
                                symbol: "C_POS",
                                shovelTime: 400 + 134,
                                fodders: [
                                    "Normal",
                                    "Normal",
                                ],
                                positions: [
                                    {
                                        row: 1,
                                        col: 9,
                                    }, {
                                        row: 6,
                                        col: 9,
                                    },
                                ],
                                choose: 1,
                                waves: [1, 2],
                            },
                        ],
                        startTick: undefined,
                    }]
                }, args: {
                    repeat: ["-r", "10"],
                    require: ["-req", "23,32"],
                    ban: ["-ban", "4"],
                    huge: ["-h"],
                    dance: ["-d"],
                }
            });
    });

    it("should ignore comments and multiple contiguous spaces/tabs", () => {
        expect(parse("w1 \t1    601 # this is a comment\nP 300 2 9\n"))
            .to.have.property("out").that.deep.equal({
                setting: { scene: "FE" },
                waves: [{
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
                            ],
                            cobCol: undefined
                        },
                    ],
                    startTick: undefined,
                }],
            });
    });

    it("should return an error for an unknown symbol", () => {
        expect(parse("w1 601\nX\n")).to.deep.equal({
            type: "Error",
            lineNum: 2,
            msg: "未知符号",
            src: "X (使用帮助: https://marketplace.visualstudio.com/items?itemName=Crescendo.seml)",
        });
    });

    it("should deprecate assume_activate", () => {
        expect(parse("assume_activate:true\n")).to.deep.equal({
            type: "Error",
            lineNum: 1,
            msg: "自 Seml 1.5.5 起, assume_activate 已更名为 activate",
            src: "assume_activate:true",
        });
    });
});

describe('expandLines', () => {
    it('should expand a single wave line', () => {
        const input = ['w1 # comment', 'a b c'];
        expect(expandLines(input))
            .to.deep.equal([
                { lineNum: 1, line: "w1" },
                { lineNum: 2, line: "a b c" },
            ]);
    });

    it('should expand multiple wave lines', () => {
        const input = ['w1~3 # comment', 'a b c', 'd e f', 'g h i'];
        expect(expandLines(input))
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
        expect(expandLines(input))
            .to.deep.equal(error(1, '波数应为正整数', 'w1~a'));
    });

    it('should handle invalid wave range', () => {
        const input = ['w3~1 # comment', 'a b c'];
        expect(expandLines(input))
            .to.deep.equal(error(1, '起始波数应大于终止波数', 'w3~1'));
    });
});

describe('replaceVariables', () => {
    let out: ParserOutput;

    beforeEach(() => {
        out = { setting: {}, waves: [] };
    });

    it('should return the original line if variables are not defined', () => {
        const line = 'SET $a 1';
        expect(replaceVariables(out, line)).to.equal(line);
    });

    it('should replace variables with their values', () => {
        out.setting.variables = { $a: 1, $b: 2 };
        expect(replaceVariables(out, 'SET $a $b')).to.equal('SET $a 2');
    });

    it('should not replace variable to be SET', () => {
        out.setting.variables = { $a: 1 };
        expect(replaceVariables(out, 'SET $a 1')).to.equal('SET $a 1');
    });

    it('should replace variables in non-reserved words', () => {
        out.setting.variables = { $a: 1 };
        expect(replaceVariables(out, 'P $a 2 9')).to.equal('P 1 2 9');
    });

    it('should replace variables in the middle of a word', () => {
        out.setting.variables = { $a: 1 };
        expect(replaceVariables(out, 'P $a1 2 9')).to.equal('P 11 2 9');
    });

    it('should replace multiple variables in a line', () => {
        out.setting.variables = { $a: 1, $b: 2 };
        expect(replaceVariables(out, 'P $a $b $a')).to.equal('P 1 2 1');
    });
});