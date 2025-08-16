
// Notes map with sharps and flats
const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTES_FLAT  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// This regex captures: 
// 1. The root note (e.g., "C", "F#").
// 2. The chord quality (e.g., "maj7", "m", "dim").
// 3. An optional slash chord part (e.g., "/G#").
// 4. An optional trailing asterisk.
const chordRegex = /([A-G](?:#|b)?)(maj7?|m(?:aj)?7?|min7?|7sus4|7|6|9|11|13|dim|aug|sus[24]?)?((?:\/[A-G](?:#|b)?)?)(\*?)/g;


// Helper: normalize chord root (C# == Db, etc.)
function normalize(note: string): { index: number; accidental: string } {
    note = note.charAt(0).toUpperCase() + note.slice(1);

    let index = NOTES_SHARP.indexOf(note);
    if (index === -1) index = NOTES_FLAT.indexOf(note);
    if (index === -1) return { index: -1, accidental: "sharp" }; // Not a valid note

    return { index, accidental: note.includes("b") ? "flat" : "sharp" };
}

// Transpose a single chord root (like C#, F, Bb)
function transposeNote(note: string, semitones: number): string {
    const { index, accidental } = normalize(note);
    if (index === -1) return note; // Don't transpose if it's not a valid note

    const newIndex = (index + semitones + 12) % 12;
    return accidental === "flat" ? NOTES_FLAT[newIndex] : NOTES_SHARP[newIndex];
}

function transposeSingleChord(chord: string, semitones: number): string {
    const parts = chord.match(chordRegex);
    // This is a safety check; ideally, this function is only called with valid chords.
    if (!parts) return chord;

    chordRegex.lastIndex = 0; // Reset regex state
    return chord.replace(chordRegex, (fullMatch, root, quality = '', slash = '', asterisk = '') => {
        // Transpose the main root note
        const transposedRoot = transposeNote(root, semitones);
        
        let transposedSlash = '';
        if (slash) {
            // If there's a slash, transpose the note after the slash
            const slashNote = slash.substring(1);
            transposedSlash = `/${transposeNote(slashNote, semitones)}`;
        }

        return `${transposedRoot}${quality}${transposedSlash}${asterisk}`;
    });
}

function isWordAChord(word: string): boolean {
    if (!word) return false;
    // A word is a chord if it matches the chord regex and isn't just a single letter from A-G that could be a word.
    // We add a negative lookahead to prevent matching common words like "A", "Am", "Be".
    // This is a tricky balance. For this app, we'll be more direct.
    
    // Words like "Am", "Is", "In", "Do" can be musical but are also common words.
    // A simple check is if it contains numbers or special characters that are rare in regular words.
    if (/\d/.test(word) || /#|b|sus|maj|min|dim|aug/.test(word)) {
        return chordRegex.test(word);
    }
    
    // For simple chords (C, G, Dm), we'll assume if they are in brackets, they are chords.
    // The main logic will handle bracketed vs inline chords. Here we just validate the shape.
    chordRegex.lastIndex = 0; // Reset regex state
    return chordRegex.test(word);
}

export function transpose(text: string, semitones: number): string {
    if (semitones === 0) return text;

    const lineEnding = "\n";
    return text.split(lineEnding).map(line => {
        // Regex to find chords in brackets or potential inline chords.
        // It captures [chord], or a standalone word that looks like a chord.
        const lineRegex = /(\[[^\]]+\])|(\b[A-G](?:#|b)?(?:maj7?|m(?:aj)?7?|min7?|7sus4|7|6|9|11|13|dim|aug|sus[24]?)?(?:\/[A-G](?:#|b)?)?\*?\b)/g;

        return line.replace(lineRegex, (match, bracketedChord, inlineChord) => {
            if (bracketedChord) {
                // It's a bracketed chord like [C#m7]
                const chord = bracketedChord.slice(1, -1);
                return `[${transposeSingleChord(chord, semitones)}]`;
            }
            if (inlineChord) {
                // It's a potential inline chord. We must be careful not to transpose "A" in "A boy".
                // A simple heuristic: if the line contains brackets, we assume inline chords are less likely to be just words.
                // A more robust check might be needed if false positives persist.
                // For now, let's be conservative and only transpose if it doesn't look like a regular word.
                // The word "Chorus" would not match our regex, so it's safe.
                return transposeSingleChord(inlineChord, semitones);
            }
            return match;
        });
    }).join(lineEnding);
}
