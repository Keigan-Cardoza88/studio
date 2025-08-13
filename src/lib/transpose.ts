
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

export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0) return lyricsWithChords;
    
    const chordRegex = /\[([^\]]+)\]/g;

    return lyricsWithChords.split('\n').map(line => {
        // This will find all bracketed chords like [Am], [G], [C#m7] etc.
        return line.replace(chordRegex, (match, chord) => {
            // match is the full thing e.g. "[Am]"
            // chord is the content inside the brackets e.g. "Am"
            const transposedChord = transposeNote(chord, semitones);
            return `[${transposedChord}]`;
        });
    }).join('\n');
};
