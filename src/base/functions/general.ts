export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ignoreExceptions(): void {
    return;
}

export function generateRandomId(idLength?: number): string {
    if (!idLength) {
        idLength = 0xffff;
    }
    return (Date.now() & idLength).toString();
}

export function mssince(tsFrom: number, tsTo?: number): number {
    if (!tsTo) {
        tsTo = Date.now();
    }
    return tsTo - tsFrom;
}

export function ssince(tsFrom: number, tsTo?: number): number {
    return Math.round(mssince(tsFrom, tsTo) / 1000);
}

export function msince(tsFrom: number, tsTo?: number): number {
    return Math.round(mssince(tsFrom, tsTo) / 60000);
}
