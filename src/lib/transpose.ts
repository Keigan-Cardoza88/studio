
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
    
    // Regex to find a valid root note (C, C#, Db, etc.)
    const rootMatch = word.match(/^[A-G](b|#)?/);
    if (!rootMatch) return false;

    const rootNote = rootMatch[0];
    const restOfString = word.substring(rootNote.length);

    // If the word is just the root note, it's a valid chord.
    if (restOfString.length === 0) return true;

    // A list of valid chord qualities and extensions that can follow a root note.
    const validQualities = [
        'm', 'maj', 'dim', 'aug', 'sus', 'add', 
        '7', '9', '11', '13', '6', '5', '4', '2',
        'b', '#', '/', '*',
        'sus2', 'sus4', 'maj7', 'min7', 'm7',
    ];
    
    // Check if the rest of the string starts with a valid chord quality.
    // If not, it's a regular word, not a chord.
    const startsWithValidQuality = validQualities.some(q => restOfString.startsWith(q));

    if (!startsWithValidQuality) {
        // A special case for chords like C(add9)
        if (restOfString.startsWith('(') && restOfString.endsWith(')')) return true;
        return false;
    }

    // Now, ensure ALL characters in the rest of the string are valid chord characters.
    const validChordCharRegex = /^[mMajAdDimSusAugb#/\d*()]+$/;
    
    return validChordCharRegex.test(restOfString);
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
