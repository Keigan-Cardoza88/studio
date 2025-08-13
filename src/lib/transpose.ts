
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
    // Return empty strings or pure whitespace as is.
    if (!note.trim()) return note;

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
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) return false;

    // Ignore lines with lyrics in brackets
    if (trimmedLine.includes('[') || trimmedLine.includes(']')) {
        return false;
    }

    // Ignore structural markers like "Verse", "Chorus", "Intro", "Outro", etc.
    const structuralMarkers = /^(verse|chorus|intro|outro|bridge|pre-chorus|interlude|solo|instrumental)/i;
    if (structuralMarkers.test(trimmedLine)) {
        return false;
    }

    // A line is a chord line if all non-whitespace parts look like chords.
    const potentialChords = trimmedLine.split(/\s+/);
    // This pattern is simplified and may not catch all complex chords, but covers the basics.
    const chordPattern = /^[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7)?(\/[A-G](b|#)?)?$/i;
    
    return potentialChords.every(pc => chordPattern.test(pc));
};


export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0) return lyricsWithChords;
    
    return lyricsWithChords.split('\n').map(line => {
        if (isChordLine(line)) {
            // Replace each sequence of non-whitespace characters (a chord)
            // with its transposed version, preserving original spacing.
            return line.replace(/\S+/g, chord => transposeNote(chord, semitones));
        }
        
        // This is a lyric line or a line with bracketed chords, return as is.
        return line;
    }).join('\n');
};
