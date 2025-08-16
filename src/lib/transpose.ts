
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
    
    const useFlat = note.includes('b');

    if (useFlat && notesFlat[newIndex].includes('b')) {
        return notesFlat[newIndex];
    }
    if(notesSharp[newIndex].includes('#')) {
        return notesSharp[newIndex];
    }
    // Prefer flat for certain notes to avoid E# or B#
    if (newIndex === 4 || newIndex === 11) { // Eb, Bb
        return notesFlat[newIndex]
    }

    return notesSharp[newIndex];
};

const isValidChord = (word: string): boolean => {
    if (!word) return false;
    // Regex to match a root note, and then check what follows.
    const match = word.match(/^[A-G](?:#|b)?/);
    if (!match) return false;

    // The rest of the word after the root note
    const rest = word.substring(match[0].length);
    
    // If the rest is empty, it's a valid chord (e.g., "C", "G#").
    if (rest.length === 0) return true;

    // Check if the rest of the characters are valid for a chord.
    // This regex allows for common chord notations (m, maj, dim, aug, sus, add, numbers, slashes, asterisks)
    // and crucially, does NOT allow for most other letters (like 'h', 'o', 'r', 'u' in "Chorus").
    return /^(m|maj|min|dim|aug|sus|add|7|6|9|11|13|b5|#5|\/|\*)*$/.test(rest.replace(/[A-G](?:#|b)?/g, ''));
}


const transposeChord = (chord: string, semitones: number): string => {
    if (!chord) return "";
    
    const rootMatch = chord.match(/^[A-G](?:#|b)?/);
    if (!rootMatch) {
      return chord; 
    }
    
    const root = rootMatch[0];
    const rest = chord.substring(root.length);
    const transposedRoot = transposeNote(root, semitones);
    
    if (rest.startsWith('/')) {
        const bassMatch = rest.match(/^\/[A-G](?:#|b)?/);
        if (bassMatch) {
            const bass = bassMatch[0].substring(1);
            const transposedBass = transposeNote(bass, semitones);
            const bassRest = rest.substring(bassMatch[0].length);
            return `${transposedRoot}${bassRest}/${transposedBass}`;
        }
    }

    return `${transposedRoot}${rest}`;
};

export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0) return lyricsWithChords;
    
    return lyricsWithChords.split('\n').map(line => {
        // First, handle inline chords like [Am]
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
