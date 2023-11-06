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

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0]![j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i]![j] = matrix[i - 1]![j - 1]!;
            } else {
                matrix[i]![j] = Math.min(
                    matrix[i - 1]![j - 1]! + 1, // substitution
                    Math.min(
                        matrix[i]![j - 1]! + 1, // insertion
                        matrix[i - 1]![j]! + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length]![a.length]!;
}

// return null if strs is empty, or if query is completely different to all strs
export function findClosestString(query: string, strs: string[]): string | null {
    let closestStr: string | null = null;
    let smallestDistance: number = Infinity;

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