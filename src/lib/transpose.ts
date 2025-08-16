

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
    
    const commonFlatNotes = ["F", "Bb", "Eb", "Ab", "Db", "Gb"];
    if (note.includes('b') || commonFlatNotes.includes(note)) {
      return notesFlat[newIndex];
    }
    return notesSharp[newIndex];
};


// A detailed regex to capture all parts of a complex chord.
// Group 1: The root note (e.g., "C", "F#")
// Group 2: The chord quality and extensions (e.g., "maj7", "m11", "dim")
// Group 3: A slash and the bass note (e.g., "/G", "/F#")
// Group 4: The bass note itself (e.g., "G", "F#")
// Group 5: Any trailing characters like '*'
const chordRegex = /([A-G](?:#|b)?)(maj7?|m(?:aj)?7?|min7?|7|6|9|11|13|dim|aug|sus[24]?)?((?:\/[A-G](?:#|b)?))?(\*?)/g;

const transposeChord = (match: string, semitones: number): string => {
  const parts = match.match(/([A-G](?:#|b)?)(.*?)(\/[A-G](?:#|b)?)?$/);
  if (!parts) return match;

  const root = parts[1];
  const quality = parts[2] || '';
  const bassSlash = parts[3] || '';

  const transposedRoot = transposeNote(root, semitones);
  let transposedBass = '';
  if (bassSlash) {
    const bassNote = bassSlash.substring(1);
    transposedBass = `/${transposeNote(bassNote, semitones)}`;
  }

  return `${transposedRoot}${quality}${transposedBass}`;
};

export const transpose = (lyricsWithChords: string, semitones: number): string => {
    if (semitones === 0 || !lyricsWithChords) return lyricsWithChords;

    // This regex finds either a chord in brackets or a standalone chord on a line.
    const fullRegex = /\[([^\]]+)\]|([A-G](?:#|b)?(?:maj7?|m(?:aj)?7?|min7?|7|6|9|11|13|dim|aug|sus[24]?)?(?:\/[A-G](?:#|b)?)?\*?)/g;

    return lyricsWithChords.split('\n').map(line => {
        // Don't transpose lines that are obviously not chord lines (e.g., titles, verse markers)
        if (line.trim().startsWith('(') || line.trim().toLowerCase().startsWith('chorus') || line.trim().toLowerCase().startsWith('verse') || line.trim().toLowerCase().startsWith('intro') || line.trim().toLowerCase().startsWith('outro') || line.trim().toLowerCase().startsWith('bridge')) {
            return line;
        }
        return line.replace(fullRegex, (match, bracketedChord) => {
            if (bracketedChord) {
                return `[${transposeChord(bracketedChord, semitones)}]`;
            }
            return transposeChord(match, semitones);
        });
    }).join('\n');
};
