import { determineGameConsistency } from '../../config/thrustersData';

describe('determineGameConsistency', () => {
  test('returns full for matching thruster', () => {
    expect(determineGameConsistency('thruster', 'largeIon')).toBe('full');
  });

  test('returns partial for thruster with differing official data', () => {
    expect(determineGameConsistency('thruster', 'smallHydrogen')).toBe('partial');
  });

  test('returns mismatch for unknown thruster', () => {
    expect(determineGameConsistency('thruster', 'largeFlatAtmospheric')).toBe('mismatch');
  });

  test('returns partial for battery with differing official data', () => {
    expect(determineGameConsistency('battery', 'smallBattery')).toBe('partial');
  });

  test('returns mismatch for unknown battery', () => {
    expect(determineGameConsistency('battery', 'nonExisting')).toBe('mismatch');
  });
});
