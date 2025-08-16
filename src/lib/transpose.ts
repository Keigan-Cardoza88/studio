
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
    
    // Default to sharp notes, but use flats if the original note was flat,
    // or for common flat keys where it makes sense.
    const useFlat = note.includes('b');

    if (useFlat) {
        return notesFlat[newIndex];
    }
    return notesSharp[newIndex];
};

const transposeChord = (chord: string, semitones: number): string => {
    if (!chord) return "";
    
    // Match the root note (C, F#, Gb, etc.)
    const rootMatch = chord.match(/^[A-G](?:#|b)?/);
    if (!rootMatch) {
      return chord; // Not a valid chord start
    }
    
    const root = rootMatch[0];
    const rest = chord.substring(root.length);
    
    const transposedRoot = transposeNote(root, semitones);
    
    // Handle slash chords by transposing the bass note as well
    if (rest.startsWith('/')) {
        const bassMatch = rest.match(/^\/[A-G](?:#|b)?/);
        if (bassMatch) {
            const bass = bassMatch[0].substring(1);
            const bassRest = rest.substring(bassMatch[0].length);
            const transposedBass = transposeNote(bass, semitones);
            return `${transposedRoot}${bassRest}/${transposedBass}`;
        }
    }

    return `${transposedRoot}${rest}`;
};

export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0) return lyricsWithChords;
    
    const transposeLine = (line: string) => {
        return line.split(/(\s+)/).map(word => {
            // Trim and check if it's a chord. This is a heuristic.
            // A more robust solution might require a dictionary of chord types.
            const trimmedWord = word.trim();
            if (/^[A-G](?:#|b)?(m|maj|min|dim|aug|sus|add|7|6|9|11|13|b5|#5)?.*$/.test(trimmedWord)) {
                 return transposeChord(trimmedWord, semitones);
            }
            return word;
        }).join('');
    };

    return lyricsWithChords.split('\n').map(line => {
        // Transpose inline chords like [Am]
        let processedLine = line.replace(/\[([^\]]+)\]/g, (match, chord) => {
            return `[${transposeChord(chord, semitones)}]`;
        });
        
        // Check if the line (after stripping inline chords) looks like a chord line
        const lyricPart = processedLine.replace(/\[([^\]]+)\]/g, '').trim();
        const nonChordChars = lyricPart.replace(/[A-G](b|#)?(m|maj|min|dim|aug|sus|add|7|6|9|11|13|b5|#5|[/])?(\*?)|\s/gi, '');
        
        // If the line primarily contains chords and not much else, transpose it word by word
        if (lyricPart.length > 0 && nonChordChars.length < lyricPart.length / 2) {
             // Avoid re-transposing what's already in brackets
            const parts = processedLine.split(/(\[[^\]]+\])/);
            return parts.map(part => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    return part; // Already transposed, leave it.
                }
                return transposeLine(part);
            }).join('');
        }

        return processedLine;

    }).join('\n');
};
