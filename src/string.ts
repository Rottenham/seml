export function chopPrefix(str: string, prefix: string): [string, boolean] {
    if (str.startsWith(prefix)) {
        return [str.slice(prefix.length), true];
    } else {
        return [str, false];
    }
}

export function chopSuffix(str: string, suffix: string): [string, boolean] {
    if (str.endsWith(suffix)) {
        return [str.slice(0, -suffix.length), true];
    } else {
        return [str, false];
    }
}

// only accept non-negative whole numbers, no leading + allowed
export function parseNatural(str: string): number | null {
    if (!/^\d+$/.test(str)) {
        return null;
    } else {
        return parseInt(str, 10);
    }
}

// only accept non-negative whole or decimal numbers, no leading + allowed
export function parseDecimal(str: string) {
    if (!/^\d+(\.\d+)?$/.test(str)) {
        return null;
    } else {
        return parseFloat(str);
    }
}