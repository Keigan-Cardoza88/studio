

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
    const originalIndex = getNoteIndex(note);
    if (originalIndex === -1) return note;
    const newIndex = (originalIndex + semitones + 12) % 12;

    const preferFlat = note.includes('b');
    
    // Heuristic: Prefer sharp unless original was flat or it's a common flat key note
    if (preferFlat && notesFlat[newIndex].includes('b')) {
      return notesFlat[newIndex];
    }
    if (!note.includes('b') && notesSharp.includes(note)) {
         return notesSharp[newIndex];
    }
    
    return notesFlat[newIndex] ? notesFlat[newIndex] : notesSharp[newIndex];
};


const isValidChord = (word: string): boolean => {
    if (!word) return false;

    // Match the root note, which can be one or two characters (e.g., C, C#, Db).
    const rootMatch = word.match(/^[A-G](b|#)?/);
    if (!rootMatch) {
        return false; // Doesn't even start with a note.
    }
    
    const rootNote = rootMatch[0];
    const restOfString = word.substring(rootNote.length);

    // If the word is just the root note, it's a valid chord (e.g., "C", "F#").
    if (restOfString.length === 0) {
        return true;
    }

    // If there's more to the word, the character immediately following the root
    // must be a valid chord modifier. Words like "Chorus" will fail here because 'h' is not valid.
    const validChordModifiers = "majdimaugsusb#*()/\d";
    const nextChar = restOfString[0];

    if (validChordModifiers.includes(nextChar) || (nextChar === 'm' && restOfString.startsWith('min'))) {
         // This is likely a chord. We can be more lenient with the rest of the string
         // as it's highly unlikely to be a regular word now.
         return true;
    }
    
    return false;
}


const transposeChord = (chord: string, semitones: number): string => {
    if (!chord) return "";
    
    const rootMatch = chord.match(/^[A-G](?:#|b)?/);
    if (!rootMatch) return chord; 
    
    const root = rootMatch[0];
    const rest = chord.substring(root.length);
    let transposedRoot = transposeNote(root, semitones);
    
    // Handle slash chords: find and transpose the bass note as well
    if (rest.includes('/')) {
        const parts = rest.split('/');
        const quality = parts[0];
        const bassNoteMatch = parts[1].match(/^[A-G](?:#|b)?/);
        if (bassNoteMatch) {
            const bassNote = bassNoteMatch[0];
            const bassNoteRest = parts[1].substring(bassNote.length);
            const transposedBass = transposeNote(bassNote, semitones);
            return `${transposedRoot}${quality}/${transposedBass}${bassNoteRest}`;
        }
    }
    
    return `${transposedRoot}${rest}`;
};

export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0) return lyricsWithChords;
    
    return lyricsWithChords.split('\n').map(line => {
        // First, handle bracketed chords like [Am]
        let processedLine = line.replace(/\[([^\]]+)\]/g, (match, chord) => {
            return `[${transposeChord(chord, semitones)}]`;
        });
        
        // Split the line into parts: bracketed chords and text in between.
        const parts = processedLine.split(/(\[[^\]]+\])/);

        return parts.map(part => {
            // If the part is an already-transposed inline chord, leave it alone.
            if (part.startsWith('[') && part.endsWith(']')) {
                return part;
            }

            // For text parts, split by space to check for standalone chords.
            return part.split(/(\s+)/).map(word => {
                if (isValidChord(word)) {
                    return transposeChord(word, semitones);
                }
                return word;
            }).join('');

        }).join('');
    }).join('\n');
};
