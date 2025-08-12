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
    if (line.trim().length === 0) return false;
    // Regex to match common chord patterns. This can be improved for more complex chords.
    // It looks for chords like C, G, Am, F, C/G, Dm7, Gsus4
    const chordRegex = /\b[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m7|maj7|7)?(\d)?(\/[A-G](b|#)?)?\b/g;
    const nonChordChars = line.replace(chordRegex, '').replace(/\s/g, '');
    
    // If after removing chords and whitespace, there's nothing left, it's likely a chord line.
    // This is a heuristic and might not be perfect for all cases.
    return nonChordChars.length === 0;
};

export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0) return lyricsWithChords;
    
    const lines = lyricsWithChords.split('\n');
    const transposedLines = lines.map(line => {
        // Transpose chords within brackets
        let transposedLine = line.replace(/\[([^\]]+)\]/g, (match, chord) => {
            const transposedChords = chord.split(' ').map(c => transposeNote(c, semitones)).join(' ');
            return `[${transposedChords}]`;
        });

        // Check if the line is a chord-only line and transpose it.
        // This is done on the line that has already processed bracketed chords
        // to avoid double-transposing if a line has both.
        if (isChordLine(transposedLine.replace(/\[([^\]]+)\]/g, ''))) {
            const chords = transposedLine.split(/(\s+)/);
            return chords.map(chord => {
                if (/\S/.test(chord)) { // check if it's not just whitespace
                    return transposeNote(chord, semitones);
                }
                return chord;
            }).join('');
        }

        return transposedLine;
    });

    return transposedLines.join('\n');
};
