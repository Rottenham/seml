"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zombieTypeAbbrToEnum = exports.ZombieType = void 0;
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
exports.zombieTypeAbbrToEnum = {
    "base": ZombieType.zombie,
    // to avoid clash with zomboni
    "flag": ZombieType.flag,
    "cone": ZombieType.conehead,
    "pole": ZombieType.poleVaulting,
    "buck": ZombieType.buckethead,
    "news": ZombieType.newspaper,
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
//# sourceMappingURL=zombie_types.js.map