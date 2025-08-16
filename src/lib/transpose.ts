

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
    
    // Default to sharp notes unless the original had a 'b' and the new note can be flat.
    const preferFlat = note.includes('b');
    
    if (preferFlat) {
      return notesFlat[newIndex];
    }
    return notesSharp[newIndex];
};

const isValidChord = (word: string): boolean => {
    if (!word) return false;
    // Match the root note (e.g., C, F#, Bb)
    const rootMatch = word.match(/^[A-G](b|#)?/);
    if (!rootMatch) return false;

    // The rest of the string after the root note
    const rest = word.substring(rootMatch[0].length);

    // If there's nothing after the root, it's a valid chord (e.g., "C", "G#")
    if (rest.length === 0) return true;

    // This regex checks for all valid chord extensions, modifiers, and slash chords.
    // It allows for:
    // - Modifiers like m, maj, min, dim, aug, sus, add
    // - Numbers for extensions (7, 9, 11, 13)
    // - Alterations like b5, #9
    // - Slash chords like /F#
    // - Trailing characters like *
    // Crucially, it will fail on words like "Chorus" because 'h', 'o', 'r', 'u', 's' are not in the allowed patterns.
    const chordQualityRegex = /^((maj|min|m|dim|aug|sus|add|M|º|o|\+)?\d*([#b]\d+)*(\/[A-G](b|#)?)?(\*)*)*$/;
    
    return chordQualityRegex.test(rest);
}


const transposeChord = (chord: string, semitones: number): string => {
    if (!chord) return "";
    
    // Find the root note, which could be one or two characters (e.g., C, C#)
    const rootMatch = chord.match(/^[A-G](?:#|b)?/);
    if (!rootMatch) {
      return chord; 
    }
    
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
