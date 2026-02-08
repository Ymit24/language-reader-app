import { cn } from './utils';

describe('cn', () => {
  it('merges tailwind utility conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('keeps truthy class names', () => {
    expect(cn('font-bold', null, undefined, ['text-sm'])).toBe(
      'font-bold text-sm',
    );
  });
});
