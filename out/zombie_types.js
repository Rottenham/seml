"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannedZombieTypes = exports.zombieTypeENAbbrToEnum = exports.zombieTypeCNAbbrToEnum = exports.acceptableZombieTypes = exports.ZombieType = void 0;
// These names are taken from PvZ Emulator.
var ZombieType;
(function (ZombieType) {
    ZombieType[ZombieType["zombie"] = 0] = "zombie";
    ZombieType[ZombieType["flag"] = 1] = "flag";
    ZombieType[ZombieType["conehead"] = 2] = "conehead";
    ZombieType[ZombieType["poleVaulting"] = 3] = "poleVaulting";
    ZombieType[ZombieType["buckethead"] = 4] = "buckethead";
    ZombieType[ZombieType["newspaper"] = 5] = "newspaper";
    ZombieType[ZombieType["screendoor"] = 6] = "screendoor";
    ZombieType[ZombieType["football"] = 7] = "football";
    ZombieType[ZombieType["dancing"] = 8] = "dancing";
    ZombieType[ZombieType["backupDancer"] = 9] = "backupDancer";
    ZombieType[ZombieType["duckyTube"] = 10] = "duckyTube";
    ZombieType[ZombieType["snorkel"] = 11] = "snorkel";
    ZombieType[ZombieType["zomboni"] = 12] = "zomboni";
    ZombieType[ZombieType["dolphinRider"] = 14] = "dolphinRider";
    ZombieType[ZombieType["jackInTheBox"] = 15] = "jackInTheBox";
    ZombieType[ZombieType["balloon"] = 16] = "balloon";
    ZombieType[ZombieType["digger"] = 17] = "digger";
    ZombieType[ZombieType["pogo"] = 18] = "pogo";
    ZombieType[ZombieType["yeti"] = 19] = "yeti";
    ZombieType[ZombieType["bungee"] = 20] = "bungee";
    ZombieType[ZombieType["ladder"] = 21] = "ladder";
    ZombieType[ZombieType["catapult"] = 22] = "catapult";
    ZombieType[ZombieType["gargantuar"] = 23] = "gargantuar";
    ZombieType[ZombieType["imp"] = 24] = "imp";
    ZombieType[ZombieType["gigaGargantuar"] = 32] = "gigaGargantuar";
})(ZombieType || (exports.ZombieType = ZombieType = {}));
;
exports.acceptableZombieTypes = [ZombieType.poleVaulting, ZombieType.buckethead, ZombieType.screendoor, ZombieType.football, ZombieType.dancing, ZombieType.snorkel, ZombieType.zomboni, ZombieType.dolphinRider, ZombieType.jackInTheBox, ZombieType.balloon, ZombieType.digger, ZombieType.pogo, ZombieType.bungee, ZombieType.ladder, ZombieType.catapult, ZombieType.gargantuar, ZombieType.gigaGargantuar];
exports.zombieTypeCNAbbrToEnum = {
    "普": ZombieType.zombie,
    "旗": ZombieType.flag,
    "障": ZombieType.conehead,
    "杆": ZombieType.poleVaulting,
    "桶": ZombieType.buckethead,
    "报": ZombieType.buckethead,
    "门": ZombieType.screendoor,
    "橄": ZombieType.football,
    "舞": ZombieType.dancing,
    "伴": ZombieType.backupDancer,
    "鸭": ZombieType.duckyTube,
    "潜": ZombieType.snorkel,
    "车": ZombieType.zomboni,
    "豚": ZombieType.dolphinRider,
    "丑": ZombieType.jackInTheBox,
    "气": ZombieType.balloon,
    "矿": ZombieType.digger,
    "跳": ZombieType.pogo,
    "雪": ZombieType.yeti,
    "偷": ZombieType.bungee,
    "梯": ZombieType.ladder,
    "篮": ZombieType.catapult,
    "白": ZombieType.gargantuar,
    "鬼": ZombieType.imp,
    "红": ZombieType.gigaGargantuar,
};
exports.zombieTypeENAbbrToEnum = {
    "regu": ZombieType.zombie,
    "flag": ZombieType.flag,
    "cone": ZombieType.conehead,
    "pole": ZombieType.poleVaulting,
    "buck": ZombieType.buckethead,
    "news": ZombieType.buckethead,
    "scre": ZombieType.screendoor,
    "foot": ZombieType.football,
    "danc": ZombieType.dancing,
    "back": ZombieType.backupDancer,
    "duck": ZombieType.duckyTube,
    "snor": ZombieType.snorkel,
    "zomb": ZombieType.zomboni,
    "dolp": ZombieType.dolphinRider,
    "jack": ZombieType.jackInTheBox,
    "ball": ZombieType.balloon,
    "digg": ZombieType.digger,
    "pogo": ZombieType.pogo,
    "yeti": ZombieType.yeti,
    "bung": ZombieType.bungee,
    "ladd": ZombieType.ladder,
    "cata": ZombieType.catapult,
    "garg": ZombieType.gargantuar,
    "imp": ZombieType.imp,
    "giga": ZombieType.gigaGargantuar,
};
/* eslint-disable @typescript-eslint/naming-convention */
exports.bannedZombieTypes = {
    "DE": [ZombieType.snorkel, ZombieType.dolphinRider],
    "NE": [ZombieType.snorkel, ZombieType.zomboni, ZombieType.dolphinRider],
    "PE": [],
    "FE": [],
    "RE": [ZombieType.dancing, ZombieType.snorkel, ZombieType.dolphinRider,
        ZombieType.digger],
    "ME": [ZombieType.dancing, ZombieType.snorkel, ZombieType.dolphinRider,
        ZombieType.digger]
};
//# sourceMappingURL=zombie_types.js.map