import { formatDuration } from '../../utils/formatDuration';

describe('formatDuration', () => {
  test.each([
    ['PT1H2M3S', '1:02:03'],
    ['PT15M45S', '15:45'],
    ['PT45S', '0:45'],
    ['PT1H', '1:00:00'],
  ])('parses %s', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});
