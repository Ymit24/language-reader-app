import { convexTest } from 'convex-test';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

const modules = {
  './_generated/api.js': () => import('./_generated/api'),
  './_generated/server.js': () => import('./_generated/server'),
  './lessons.ts': () => import('./lessons'),
  './vocab.ts': () => import('./vocab'),
};

describe('lesson + vocab core flows', () => {
  let t = convexTest(schema, modules);

  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it('creates a lesson with ordered tokens and computed word count', async () => {
    const user = t.withIdentity({ subject: 'user-a' });
    const rawText = 'Bonjour, monde !\n\nSalut.';

    const lessonId = await user.mutation(api.lessons.createLesson, {
      title: 'Test lesson',
      language: 'fr',
      rawText,
    });

    const lesson = await user.query(api.lessons.getLesson, { lessonId });
    expect(lesson).not.toBeNull();
    expect(lesson!.title).toBe('Test lesson');
    expect(lesson!.language).toBe('fr');
    expect(lesson!.rawText).toBe(rawText);
    expect(lesson!.tokenCount).toBe(3);
    expect(lesson!.knownTokenCount).toBe(0);

    const tokenIndexes = lesson!.tokens.map((token) => token.index);
    expect(tokenIndexes).toEqual([...tokenIndexes].sort((a, b) => a - b));

    const reconstructed = lesson!.tokens.map((token) => token.surface).join('');
    expect(reconstructed).toBe(rawText);
  });

  it('creates then updates vocab status without duplicating terms', async () => {
    const user = t.withIdentity({ subject: 'user-a' });

    await user.mutation(api.vocab.updateVocabStatus, {
      language: 'fr',
      term: 'bonjour',
      status: 2,
    });

    let profile = await user.query(api.vocab.getVocabProfile, {
      language: 'fr',
    });
    expect(profile).toHaveLength(1);
    expect(profile[0]!.term).toBe('bonjour');
    expect(profile[0]!.status).toBe(2);
    expect(profile[0]!.nextReviewAt).toBeTypeOf('number');
    expect(profile[0]!.intervalDays).toBe(0);
    expect(profile[0]!.reviews).toBe(0);

    await user.mutation(api.vocab.updateVocabStatus, {
      language: 'fr',
      term: 'bonjour',
      status: 4,
    });

    profile = await user.query(api.vocab.getVocabProfile, { language: 'fr' });
    const entries = profile.filter((entry) => entry.term === 'bonjour');
    expect(entries).toHaveLength(1);
    expect(entries[0]!.status).toBe(4);
  });

  it('marks remaining lesson words as known while respecting keepUnknownTerms', async () => {
    const user = t.withIdentity({ subject: 'user-a' });

    const lessonId = await user.mutation(api.lessons.createLesson, {
      title: 'Animals',
      language: 'fr',
      rawText: 'chat chien chat oiseau',
    });

    await user.mutation(api.vocab.markRemainingWordsAsKnown, {
      lessonId,
      keepUnknownTerms: ['chien'],
    });

    const profile = await user.query(api.vocab.getVocabProfile, {
      language: 'fr',
    });

    const knownTerms = profile
      .filter((entry) => entry.status === 4)
      .map((entry) => entry.term)
      .sort();

    expect(knownTerms).toEqual(['chat', 'oiseau']);
    expect(profile.filter((entry) => entry.term === 'chat')).toHaveLength(1);
    expect(profile.some((entry) => entry.term === 'chien')).toBe(false);
  });

  it('rejects vocab mutations on lessons owned by another user', async () => {
    const userA = t.withIdentity({ subject: 'user-a' });
    const userB = t.withIdentity({ subject: 'user-b' });

    const lessonId = await userA.mutation(api.lessons.createLesson, {
      title: 'Private lesson',
      language: 'fr',
      rawText: 'bonjour monde',
    });

    await expect(
      userB.mutation(api.vocab.markWordsAsKnown, {
        lessonId,
        wordTerms: ['bonjour'],
      }),
    ).rejects.toThrow('Lesson not found or unauthorized');
  });
});
