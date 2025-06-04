import { optimizeBatteryCombo, batteries } from '../thrustersData';

describe('optimizeBatteryCombo', () => {
  test.each([
    { power: 1, energy: 1 },
    { power: 5, energy: 8 }
  ])('valid combo for power %p MW and energy %p MWh', ({ power, energy }) => {
    const combo = optimizeBatteryCombo(power, energy);
    const totalPower = combo.large * batteries.largeBattery.maxOutput +
      combo.small * batteries.smallBattery.maxOutput;
    const totalEnergy = combo.large * batteries.largeBattery.maxStoredPower +
      combo.small * batteries.smallBattery.maxStoredPower;

    expect(totalPower).toBeGreaterThanOrEqual(power);
    expect(totalEnergy).toBeGreaterThanOrEqual(energy);

    if (combo.large > 0) {
      const p = (combo.large - 1) * batteries.largeBattery.maxOutput + combo.small * batteries.smallBattery.maxOutput;
      const e = (combo.large - 1) * batteries.largeBattery.maxStoredPower + combo.small * batteries.smallBattery.maxStoredPower;
      expect(p < power || e < energy).toBeTruthy();
    }
    if (combo.small > 0) {
      const p = combo.large * batteries.largeBattery.maxOutput + (combo.small - 1) * batteries.smallBattery.maxOutput;
      const e = combo.large * batteries.largeBattery.maxStoredPower + (combo.small - 1) * batteries.smallBattery.maxStoredPower;
      expect(p < power || e < energy).toBeTruthy();
    }
  });
});
