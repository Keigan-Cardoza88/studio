
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

export function decodeWorkbook(encoded: string): Workbook {
    try {
        const compressed = fromBase64(encoded);
        const jsonString = pako.inflate(compressed, { to: 'string' });
        const workbook = JSON.parse(jsonString);
        
        // Basic validation
        if (workbook && workbook.id && workbook.name && Array.isArray(workbook.setlists)) {
            return workbook as Workbook;
        } else {
            // Throw a specific error for invalid structure
            throw new Error("File content is not a valid workbook structure.");
        }
    } catch (e) {
        // Any error during the process (atob, pako, JSON.parse, validation)
        // indicates an invalid file format. We throw a single, clear error.
        throw new Error("Invalid file format. This does not appear to be a ReadySetPlay workbook file.");
    }
}

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}
