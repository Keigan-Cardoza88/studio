

const notesSharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const notesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// This regex is designed to be more specific.
// It captures:
// 1. Root note: [A-G](?:#|b)?
// 2. Chord Quality: (?:m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*
// 3. Slash chord note: (?:\/[A-G](?:#|b)?)?
// 4. Trailing non-alphanumeric characters like '*': (\*?)
const chordRegex = /([A-G](?:#|b)?)([^/ \n\r\[\]]*?)(\/[A-G](?:#|b)?)?(\*?)/g;


const getNoteIndex = (note: string): number => {
    let index = notesSharp.indexOf(note);
    if (index !== -1) return index;
    index = notesFlat.indexOf(note);
    if (index !== -1) return index;
    return -1;
};

const transposeNote = (note: string, semitones: number): string => {
    const originalIndex = getNoteIndex(note);
    if (originalIndex === -1) return note; // Not a valid note, return as is.
    const newIndex = (originalIndex + semitones + 12) % 12;
    // Prefer sharp notes for consistency, unless the original was flat (and no sharp equivalent exists)
    if (note.includes('b') && !notesSharp.includes(note)) {
         return notesFlat[newIndex];
    }
    return notesSharp[newIndex];
};


const transposeSingleChord = (match: string, root: string, quality: string, slash: string, asterisk: string, semitones: number): string => {
    const transposedRoot = transposeNote(root, semitones);
    let transposedSlash = '';
    if (slash) {
        const slashNote = slash.substring(1);
        const transposedSlashNote = transposeNote(slashNote, semitones);
        transposedSlash = '/' + transposedSlashNote;
    }
    return `${transposedRoot}${quality || ''}${transposedSlash}${asterisk || ''}`;
};


const isChordLine = (line: string): boolean => {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) return false;

    // A line containing lyrics is not a chord line.
    // Heuristic: if there are letters not part of any valid chord, it's lyrics.
    // This removes most lyrics, structural markers etc.
    const nonChordChars = trimmedLine
        .replace(/\[[^\]]+\]/g, '') // remove inline chords
        .replace(/[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)?(\/[A-G](b|#)?)?(\*?)/gi, '') // remove valid chord patterns
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
        // For lines containing only chords, transpose each chord.
        if (isChordLine(line)) {
            return line.replace(chordRegex, (match, root, quality, slash, asterisk) => {
                 if (!root) return match; // If regex somehow matches something not a chord, skip it
                 return transposeSingleChord(match, root, quality, slash, asterisk, semitones);
            });
        }
        
        // For lines with inline chords (e.g., "[Am]Some lyrics"), transpose only the chords inside brackets.
        return line.replace(/\[([^\]]+)\]/g, (matchWithBrackets) => {
            const chordInside = matchWithBrackets.substring(1, matchWithBrackets.length - 1);
            const transposedChord = chordInside.replace(chordRegex, (match, root, quality, slash, asterisk) => {
                 if (!root) return match;
                 return transposeSingleChord(match, root, quality, slash, asterisk, semitones);
            });
            return `[${transposedChord}]`;
        });

    }).join('\n');
};
