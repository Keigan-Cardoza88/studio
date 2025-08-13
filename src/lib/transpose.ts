const notesSharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const notesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const getNoteIndex = (note: string): number => {
    let index = notesSharp.indexOf(note);
    if (index !== -1) return index;
    index = notesFlat.indexOf(note);
    if (index !== -1) return index;
    return -1;
};

const transposeNote = (note: string, semitones: number): string => {
    const noteRootMatch = note.match(/^[A-G](b|#)?/);
    if (!noteRootMatch) return note;

    const root = noteRootMatch[0];
    const rest = note.substring(root.length);
    const originalIndex = getNoteIndex(root);
    
    if (originalIndex === -1) return note;

    const newIndex = (originalIndex + semitones + 12) % 12;
    
    // Prefer sharp for transposition result
    return notesSharp[newIndex] + rest;
};

const isChordLine = (line: string): boolean => {
    // A line is a chord line if it doesn't contain bracketed annotations
    if (/\[.*?\]/.test(line)) return false;

    if (line.trim().length === 0) return false;

    // This pattern is simplified and may not catch all complex chords, but covers the basics.
    const chordPattern = /^[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13)?(\/[A-G](b|#)?)?$/i;
    
    // Check if every non-whitespace part of the line is a valid chord.
    const potentialChords = line.trim().split(/\s+/);
    return potentialChords.every(pc => chordPattern.test(pc));
};


export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0) return lyricsWithChords;
    
    return lyricsWithChords.split('\n').map(line => {
        // If the line is determined to be a chord line (and does not contain brackets), transpose it.
        if (isChordLine(line)) {
            return line.split(/(\s+)/).map(part => {
                // Transpose only the parts that are actual chords, leave whitespace intact.
                if (part.trim().length > 0) {
                    return transposeNote(part, semitones);
                }
                return part;
            }).join('');
        }
        
        // If it's not a chord line (e.g., it contains lyrics or bracketed annotations), return it as is.
        return line;
    }).join('\n');
};
