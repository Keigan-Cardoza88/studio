
const notesSharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const notesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const chordRegex = /[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7)?(\/[A-G](b|#)?)?/g;


const getNoteIndex = (note: string): number => {
    let index = notesSharp.indexOf(note);
    if (index !== -1) return index;
    index = notesFlat.indexOf(note);
    if (index !== -1) return index;
    return -1;
};

const transposeNote = (note: string, semitones: number): string => {
    if (!note.trim()) return note;

    const noteRootMatch = note.match(/^[A-G](b|#)?/);
    if (!noteRootMatch) return note;

    const root = noteRootMatch[0];
    const rest = note.substring(root.length);
    const originalIndex = getNoteIndex(root);
    
    if (originalIndex === -1) return note;

    const newIndex = (originalIndex + semitones + 12) % 12;
    
    return notesSharp[newIndex] + rest;
};

const isChordLine = (line: string): boolean => {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) return false;

    // A line containing lyrics is not a chord line.
    // Heuristic: if there are letters not part of any valid chord, it's lyrics.
    // This removes most lyrics, structural markers etc.
    const nonChordChars = trimmedLine
        .replace(/\[[^\]]+\]/g, '') // remove inline chords
        .replace(/[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7)?(\/[A-G](b|#)?)?/gi, '') // remove valid chord patterns
        .replace(/[\s/|()-]/g, ''); // remove separators and formatting

    if (nonChordChars.length > 0) {
        return false;
    }

    // A line with bracketed chords is a lyric line with inline chords, not a "chord line" for transposition purposes.
    if (trimmedLine.includes('[') || trimmedLine.includes(']')) {
        return false;
    }

    return true;
};

export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0) return lyricsWithChords;
    
    return lyricsWithChords.split('\n').map(line => {
        // If the line is determined to be ONLY a chord line, transpose it.
        // This preserves spacing because `replace` with a global regex acts on each match.
        if (isChordLine(line)) {
            return line.replace(chordRegex, chord => transposeNote(chord, semitones));
        }

        // For all other lines (lyrics, lyrics with inline chords, structural markers),
        // return them completely unchanged.
        return line;
    }).join('\n');
};
