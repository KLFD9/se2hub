import { smallShipCargo, largeShipCargo, ores } from '../config/thrustersData';

export interface ContainerConfig {
  small: number;
  medium: number;
  large: number;
  isFilled: boolean;
  oreType: string;
  customDensity: number;
}

export interface ContainerStats {
  totalMass: number;
  totalVolume: number;
  emptyMass: number;
  maxCapacity: number;
  fillStatus: string;
}

export function calculateContainerStats(shipSize: 'small' | 'large', containers: ContainerConfig): ContainerStats {
  const cargoData = shipSize === 'small' ? smallShipCargo : largeShipCargo;
  let totalVolume = 0;
  let emptyMass = 0;
  let maxCapacity = 0;

  (['small', 'medium', 'large'] as const).forEach(size => {
    const count = Number(containers[size] || 0);
    const data = (cargoData as any)[size];
    if (data) {
      emptyMass += data.mass * count;
      totalVolume += data.volume * count;
      maxCapacity += data.volume * count * 7.8;
    }
  });

  const density = containers.oreType === 'custom'
    ? containers.customDensity || 0
    : ores[containers.oreType]?.mass ?? ores.iron.mass;

  const totalMass = containers.isFilled ? emptyMass + totalVolume * density : emptyMass;
  const fillStatus = containers.isFilled
    ? `Remplis de ${containers.oreType === 'custom' ? 'contenu personnalisé' : ores[containers.oreType]?.name ?? 'minerai'}`
    : 'Vides';

  return { totalMass, totalVolume, emptyMass, maxCapacity, fillStatus };
}
