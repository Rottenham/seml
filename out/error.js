"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = exports.error = void 0;
function error(lineNum, msg, src) {
    return { type: "Error", lineNum, msg, src };
}
exports.error = error;
function isError(result) {
    return result?.type === "Error";
}
exports.isError = isError;
//# sourceMappingURL=error.js.map