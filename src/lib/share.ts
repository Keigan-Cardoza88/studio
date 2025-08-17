
import pako from 'pako';
import type { Workbook } from './types';

function toBase64(arr: Uint8Array): string {
    return btoa(String.fromCharCode.apply(null, Array.from(arr)));
}

function fromBase64(str: string): Uint8Array {
    return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
}

export function encodeWorkbook(workbook: Workbook): string {
    const jsonString = JSON.stringify(workbook);
    // Use the highest compression level (9) for the smallest output size.
    const compressed = pako.deflate(jsonString, { level: 9 });
    return toBase64(compressed);
}

export function decodeWorkbook(encoded: string): Workbook | null {
    try {
        const compressed = fromBase64(encoded);
        const jsonString = pako.inflate(compressed, { to: 'string' });
        const workbook = JSON.parse(jsonString);
        // Basic validation
        if (workbook && workbook.id && workbook.name && Array.isArray(workbook.setlists)) {
            return workbook as Workbook;
        }
        return null;
    } catch (e) {
        console.error("Failed to decode workbook:", e);
        return null;
    }
}
