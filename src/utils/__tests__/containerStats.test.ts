import { calculateContainerStats, ContainerConfig } from '../containerStats';

const baseConfig: ContainerConfig = {
  small: 0,
  medium: 0,
  large: 1,
  isFilled: true,
  oreType: 'iron',
  customDensity: 0,
};

describe('calculateContainerStats', () => {
  test('calculates mass with iron ore', () => {
    const stats = calculateContainerStats('small', baseConfig);
    expect(Math.round(stats.totalMass)).toBe(Math.round(626.2 + 15625 * 7.8));
  });

  test('calculates mass with stone ore', () => {
    const config = { ...baseConfig, oreType: 'stone' };
    const stats = calculateContainerStats('small', config);
    expect(Math.round(stats.totalMass)).toBe(Math.round(626.2 + 15625 * 2.7));
  });

  test('calculates mass with custom density', () => {
    const config = { ...baseConfig, oreType: 'custom', customDensity: 10 };
    const stats = calculateContainerStats('small', config);
    expect(Math.round(stats.totalMass)).toBe(Math.round(626.2 + 15625 * 10));
  });
});
