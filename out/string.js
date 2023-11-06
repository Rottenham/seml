"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findClosestString = exports.parseDecimal = exports.parseNatural = exports.chopSuffix = exports.chopPrefix = void 0;
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
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                Math.min(matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1 // deletion
                ));
            }
        }
    }
    return matrix[b.length][a.length];
}
// return null if strs is empty, or if query is completely different to all strs
function findClosestString(query, strs) {
    let closestStr = null;
    let smallestDistance = Infinity;
    for (const str of strs) {
        const distance = levenshteinDistance(query, str);
        const maxPossibleDistance = Math.max(query.length, str.length);
        if (distance < maxPossibleDistance && distance < smallestDistance) {
            smallestDistance = distance;
            closestStr = str;
        }
    }
    return closestStr;
}
exports.findClosestString = findClosestString;
//# sourceMappingURL=string.js.map