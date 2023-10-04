"use strict";
// import * as path from 'path';
Object.defineProperty(exports, "__esModule", { value: true });
// // import { runTests } from '@vscode/test-electron';
// async function main() {
// 	try {
// 		// The folder containing the Extension Manifest package.json
// 		// Passed to `--extensionDevelopmentPath`
// 		const extensionDevelopmentPath = path.resolve(__dirname, '../../');
// 		// The path to test runner
// 		// Passed to --extensionTestsPath
// 		const extensionTestsPath = path.resolve(__dirname, './suite/index');
// 		// Download VS Code, unzip it and run the integration test
// 		await runTests({ extensionDevelopmentPath, extensionTestsPath });
// 	} catch (err) {
// 		console.error('Failed to run tests', err);
// 		process.exit(1);
// 	}
// }
// main();
const assert = require("assert");
suite('Extension Test Suite', () => {
    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5)); // Checking if 5 is NOT in the array, so -1 is expected
        assert.strictEqual(-1, [1, 2, 3].indexOf(0)); // Checking if 0 is NOT in the array, so -1 is expected
    });
});
//# sourceMappingURL=runTest.js.map