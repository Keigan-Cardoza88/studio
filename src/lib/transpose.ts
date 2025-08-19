

// This complex regex identifies a musical chord. It breaks down into the following parts:
// 1. ([A-G](?:#|b)?): Captures the root note (A-G with an optional sharp or flat). This is Group 1.
// 2. ((?:maj|min|m|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*): Captures the chord quality (like maj7, sus4, etc.). This is Group 2. This part is complex to catch many variations.
// 3. ((?:\/[A-G](?:#|b)?)?): Captures an optional slash chord bass note (like /G#). This is Group 3.
// 4. (\*?): Captures an optional trailing asterisk for single strums. This is Group 4.
const chordRegex = /([A-G](?:#|b)?)((?:maj|min|m|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*)((?:\/[A-G](?:#|b)?)?)(\*?)/g;
const standaloneChordRegex = /^[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*(?:\/[A-G](?:#|b)?)?\*?$/;


const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTES_FLAT  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function transposeNote(note: string, semitones: number): string {
    const isFlat = note.includes('b');
    const sourceNotes = isFlat ? NOTES_FLAT : NOTES_SHARP;
    const targetNotes = isFlat ? NOTES_FLAT : NOTES_SHARP;

    const normNote = note.charAt(0).toUpperCase() + note.slice(1);
    const index = sourceNotes.indexOf(normNote);
    if (index === -1) return note;

    const newIndex = (index + semitones + 12) % 12;
    return targetNotes[newIndex];
}

function transposeSingleChord(chord: string, semitones: number): string {
    // We use a regex replacement function. For each match, the function is called with the captured groups.
    return chord.replace(chordRegex, (fullMatch, root, quality = '', slash = '', asterisk = '') => {
        // Transpose the main root note
        const transposedRoot = transposeNote(root, semitones);
        
        let transposedSlash = '';
        if (slash) {
            // If there's a slash chord, transpose the note after the slash
            const slashNote = slash.substring(1);
            transposedSlash = `/${transposeNote(slashNote, semitones)}`;
        }

        // Reconstruct the chord with the transposed parts
        return `${transposedRoot}${quality}${transposedSlash}${asterisk}`;
    });
}

// This regex finds either bracketed content `[Anything]` or words that could be chords.
// Group 1: ([\[].*?[\]]) - Captures anything inside square brackets.
const lineRegex = /(\[.*?\])/g;

function isChordLine(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed === '') return false;
    // A line is a chord line if it contains chords in brackets and no other text,
    // or if it contains what look like chords without brackets and no other text.
    
    // This removes bracketed chords and extra whitespace to see if any lyrics remain.
    const lyricsOnly = trimmed.replace(/\[[^\]]+\]/g, '').trim();
    if (lyricsOnly.length > 0) {
        // There are non-chord lyrics on this line. Is it *just* chords otherwise?
        const parts = trimmed.split(/\s+/).filter(p => !p.startsWith('['));
        return parts.every(part => standaloneChordRegex.test(part));
    }
    
    // This handles lines with only bracketed chords, or only un-bracketed chords
    const parts = trimmed.split(/\s+/);
    return parts.every(part => {
        if (part.startsWith('[') && part.endsWith(']')) {
            const content = part.slice(1, -1);
            return standaloneChordRegex.test(content);
        }
        return standaloneChordRegex.test(part);
    });
}


export function transpose(text: string, semitones: number): string {
    if (semitones === 0) return text;

    return text.split("\n").map(line => {
        const isNonMusicalLabel = /^\s*(chorus|verse|intro|outro|bridge|pre-chorus|interlude|solo|instrumental|capo|key|t(uning)?)\s*[:]?\s*$/i.test(line);
        if (isNonMusicalLabel) {
            return line;
        }

        // A line is considered a "chord line" if it only contains recognizable chord patterns and whitespace.
        // We will only transpose chords on such lines.
        const chordLineRegex = /^\s*([A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*(?:\/[A-G](?:#|b)?)?\*?\s*)+$/;
        
        // This is a simplified check for a line containing only chords.
        if (isChordLine(line)) {
            // It's a chord line, so we transpose each "word" on it.
             return line.split(/(\s+)/).map(part => {
                if (part.trim() === '') return part; // Keep whitespace
                return transposeSingleChord(part, semitones);
            }).join('');
        }
        
        // If it's not a pure chord line, we return it as is, without transposing anything.
        return line;
    }).join("\n");
}
