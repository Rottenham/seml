export type Error = { type: "Error", lineNum: number, msg: string, src: string };

export function error(lineNum: number, msg: string, src: string): Error {
    return { type: "Error", lineNum, msg, src };
}

export function isError(result: any | Error): result is Error {
    return (result as Error)?.type === "Error";
}