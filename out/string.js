"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDecimal = exports.parseNatural = exports.chopSuffix = exports.chopPrefix = void 0;
function chopPrefix(str, prefix) {
    if (str.startsWith(prefix)) {
        return [str.slice(prefix.length), true];
    }
    else {
        return [str, false];
    }
}
exports.chopPrefix = chopPrefix;
function chopSuffix(str, suffix) {
    if (str.endsWith(suffix)) {
        return [str.slice(0, -suffix.length), true];
    }
    else {
        return [str, false];
    }
}
exports.chopSuffix = chopSuffix;
// only accept non-negative whole numbers, no leading + allowed
function parseNatural(str) {
    if (!/^\d+$/.test(str)) {
        return null;
    }
    else {
        return parseInt(str, 10);
    }
}
exports.parseNatural = parseNatural;
// only accept non-negative whole or decimal numbers, no leading + allowed
function parseDecimal(str) {
    if (!/^\d+(\.\d+)?$/.test(str)) {
        return null;
    }
    else {
        return parseFloat(str);
    }
}
exports.parseDecimal = parseDecimal;
//# sourceMappingURL=string.js.map