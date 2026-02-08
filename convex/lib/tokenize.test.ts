import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('returns an empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('preserves the original text when surfaces are concatenated', () => {
    const text = "Bonjour, aujourd’hui c'est l'heure de l'E-Mail.\n\nD'accord?";
    const tokens = tokenize(text);
    const reconstructed = tokens.map((token) => token.surface).join('');

    expect(reconstructed).toBe(text);
  });

  it('separates words from punctuation/whitespace tokens', () => {
    const tokens = tokenize('Salut, monde !');

    expect(tokens).toEqual([
      { surface: 'Salut', normalized: 'salut', isWord: true },
      { surface: ', ', isWord: false },
      { surface: 'monde', normalized: 'monde', isWord: true },
      { surface: ' !', isWord: false },
    ]);
  });

  it('keeps internal apostrophes and hyphens in words', () => {
    const tokens = tokenize("d'accord E-Mail aujourd’hui");
    const words = tokens.filter((token) => token.isWord);

    expect(words.map((token) => token.surface)).toEqual([
      "d'accord",
      'E-Mail',
      'aujourd’hui',
    ]);
  });

  it('normalizes words to lowercase', () => {
    const tokens = tokenize('BONJOUR E-Mail');
    const words = tokens.filter((token) => token.isWord);

    expect(words.map((token) => token.normalized)).toEqual([
      'bonjour',
      'e-mail',
    ]);
  });
});
