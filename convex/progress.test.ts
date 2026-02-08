jest.mock(
  '@convex-dev/auth/server',
  () => ({
    getAuthUserId: jest.fn(),
  }),
  { virtual: true },
);

import { calculateXpForReview, getLevelFromXp } from './progress';

describe('getLevelFromXp', () => {
  it('returns level 1 baseline at 0 XP', () => {
    expect(getLevelFromXp(0)).toEqual({
      level: 1,
      title: 'Beginner',
      currentXp: 0,
      xpForNextLevel: 100,
      xpProgress: 0,
    });
  });

  it('handles threshold boundaries correctly', () => {
    expect(getLevelFromXp(99).level).toBe(1);
    expect(getLevelFromXp(100).level).toBe(2);
    expect(getLevelFromXp(299).level).toBe(2);
    expect(getLevelFromXp(300).level).toBe(3);
  });

  it('caps progress at max level', () => {
    expect(getLevelFromXp(22000)).toEqual({
      level: 15,
      title: 'Legend',
      currentXp: 0,
      xpForNextLevel: 0,
      xpProgress: 100,
    });
  });
});

describe('calculateXpForReview', () => {
  it('maps quality buckets to base XP', () => {
    expect(calculateXpForReview(1, 0, false)).toEqual({
      baseXp: 1,
      bonusXp: 0,
      totalXp: 1,
    });
    expect(calculateXpForReview(2, 0, false)).toEqual({
      baseXp: 5,
      bonusXp: 0,
      totalXp: 5,
    });
    expect(calculateXpForReview(4, 0, false)).toEqual({
      baseXp: 10,
      bonusXp: 0,
      totalXp: 10,
    });
    expect(calculateXpForReview(5, 0, false)).toEqual({
      baseXp: 15,
      bonusXp: 0,
      totalXp: 15,
    });
  });

  it('adds the daily bonus for first review of the day', () => {
    expect(calculateXpForReview(4, 3, true)).toEqual({
      baseXp: 10,
      bonusXp: 25,
      totalXp: 35,
    });
  });

  it('adds streak multiplier bonus at 7+ day streaks', () => {
    expect(calculateXpForReview(5, 7, false)).toEqual({
      baseXp: 15,
      bonusXp: 3,
      totalXp: 18,
    });
  });

  it('combines daily and streak bonuses', () => {
    expect(calculateXpForReview(5, 12, true)).toEqual({
      baseXp: 15,
      bonusXp: 28,
      totalXp: 43,
    });
  });
});
