"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannedZombieTypes = exports.zombieTypeENAbbrToEnum = exports.zombieTypeCNAbbrToEnum = exports.ZombieType = void 0;
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
exports.zombieTypeCNAbbrToEnum = {
    "杆": ZombieType.poleVaulting,
    "桶": ZombieType.buckethead,
    "门": ZombieType.screendoor,
    "橄": ZombieType.football,
    "舞": ZombieType.dancing,
    "潜": ZombieType.snorkel,
    "车": ZombieType.zomboni,
    "豚": ZombieType.dolphinRider,
    "丑": ZombieType.jackInTheBox,
    "气": ZombieType.balloon,
    "矿": ZombieType.digger,
    "跳": ZombieType.pogo,
    "偷": ZombieType.bungee,
    "梯": ZombieType.ladder,
    "篮": ZombieType.catapult,
    "白": ZombieType.gargantuar,
    "红": ZombieType.gigaGargantuar,
};
exports.zombieTypeENAbbrToEnum = {
    "pole": ZombieType.poleVaulting,
    "buck": ZombieType.buckethead,
    "scre": ZombieType.screendoor,
    "foot": ZombieType.football,
    "danc": ZombieType.dancing,
    "snor": ZombieType.snorkel,
    "zomb": ZombieType.zomboni,
    "dolp": ZombieType.dolphinRider,
    "jack": ZombieType.jackInTheBox,
    "ball": ZombieType.balloon,
    "digg": ZombieType.digger,
    "pogo": ZombieType.pogo,
    "bung": ZombieType.bungee,
    "ladd": ZombieType.ladder,
    "cata": ZombieType.catapult,
    "garg": ZombieType.gargantuar,
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