

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
    if (!note) return "";
    const originalIndex = getNoteIndex(note);
    if (originalIndex === -1) return note;

    const newIndex = (originalIndex + semitones + 12) % 12;
    
    // Default to sharps, but use flats if the original note was flat or in a list of common flat keys
    // This is a heuristic to make chords more readable.
    const commonFlatNotes = ["F", "Bb", "Eb", "Ab", "Db", "Gb"];
    if (note.includes('b') || commonFlatNotes.includes(note)) {
      return notesFlat[newIndex];
    }
    return notesSharp[newIndex];
};


const chordRegex = /\[([^\]]+)\]|([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13|b5|#9|add9|sus2|sus4)?(?:(?:\/[A-G](?:#|b)?))?)(?![a-z])/g;


export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0 || !lyricsWithChords) return lyricsWithChords;

    const transposeChord = (chord: string): string => {
        if (!chord) return "";

        const [fullMatch, root, quality, bass] = chord.match(/^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/) || [];
        
        if (!root) return chord;
        
        const transposedRoot = transposeNote(root, semitones);
        const transposedBass = transposeNote(bass, semitones);

        return `${transposedRoot}${quality || ''}${transposedBass ? `/${transposedBass}` : ''}`;
    }

    const processLine = (line: string): string => {
        // Handle bracketed chords e.g. [Am]
        let pass1 = line.replace(/\[([^\]]+)\]/g, (match, chord) => `[${transposeChord(chord)}]`);
        
        // Handle standalone chords on a line
        const isChordLine = pass1.split(/\s+/).every(word => {
            if (!word) return true; // ignore empty strings from multiple spaces
            const rootMatch = word.match(/^[A-G](b|#)?/);
            if (!rootMatch) return false; // not a chord if it doesn't start with a note
            // If the rest of the string contains letters other than m,a,j,i,n,d,s,u,g,b,#
            const rest = word.substring(rootMatch[0].length);
            return !/[h-l|o-r|t|v-z]/.test(rest.toLowerCase());
        });

        if (isChordLine) {
           return pass1.split(/(\s+)/).map(transposeChord).join('');
        }

        return pass1;
    }

    return lyricsWithChords.split('\n').map(processLine).join('\n');
};
