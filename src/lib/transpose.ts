

// This complex regex identifies a musical chord. It breaks down into the following parts:
// 1. ([A-G](?:#|b)?): Captures the root note (A-G with an optional sharp or flat). This is Group 1.
// 2. ((?:maj|min|m|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*): Captures the chord quality (like maj7, sus4, etc.). This is Group 2. This part is complex to catch many variations.
// 3. ((?:\/[A-G](?:#|b)?)?): Captures an optional slash chord bass note (like /G#). This is Group 3.
// 4. (\*?): Captures an optional trailing asterisk for single strums. This is Group 4.
const chordRegex = /([A-G](?:#|b)?)((?:maj|min|m|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*)((?:\/[A-G](?:#|b)?)?)(\*?)/g;

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

export function transpose(text: string, semitones: number): string {
    if (semitones === 0) return text;

    // This regex finds either bracketed content `[Anything]` or words that look like chords.
    // Group 1: ([\[].*?[\]]) - Captures anything inside square brackets.
    // Group 2: (\b[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*(?:\/[A-G](?:#|b)?)?\*?\b) - Captures standalone words that are chords.
    const lineRegex = /(\[.*?\])|(\b[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add|m7|maj7|7|6|9|11|13|m\/maj7|m\/Maj7|sus2|sus4|add9)*(?:\/[A-G](?:#|b)?)?\*?\b)/g;

    return text.split("\n").map(line => {
        // We exclude lines that are common labels and not musical instruction
        const isNonMusicalLabel = /^\s*(chorus|verse|intro|outro|bridge|pre-chorus|interlude|solo|instrumental|capo|key|t(uning)?)\s*[:]?\s*$/i.test(line);
        if (isNonMusicalLabel) {
            return line;
        }

        return line.replace(lineRegex, (match, bracketedChord, inlineChord) => {
            if (bracketedChord) {
                // It's a bracketed chord or text, ignore it as requested.
                return bracketedChord;
            }
            if (inlineChord) {
                // It's a standalone chord word in the text.
                // We add an extra check to avoid transposing words like "A", "Am", "Be" in regular text
                 if (/\b(A|Am|As|B|Be|C|D|E|F|G)\b/i.test(inlineChord) && line.split(/\s+/).length > 4) {
                    return inlineChord;
                 }
                return transposeSingleChord(inlineChord, semitones);
            }
            // Should not happen, but as a fallback, return the original match.
            return match;
        });
    }).join("\n");
}
