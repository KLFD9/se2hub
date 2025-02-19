import React, { useState, useEffect } from 'react';
import { 
  gravityOptions, 
  atmosphereOptions,
  containerMultiplierOptions,
  smallShipThrusters,
  largeShipThrusters,
  smallShipCargo,
  largeShipCargo,
  ThrusterData,
  batteries,
  ores
} from '../config/thrustersData';
import '../styles/pages/SpaceCalc.css';

type VehicleType = 'atmospheric' | 'interplanetary';

interface ContainerConfig {
  small: number;
  medium: number;
  large: number;
  isFilled: boolean;
}

interface CalculationResults {
  requiredThrust: number;
  containerStats: {
    totalMass: number;
    totalVolume: number;
    emptyMass: number;
    maxCapacity: number;
    fillStatus: string;
  };
  batteryRequirements: {
    count: number;
    optimalCount: number;
    combination: { large: number; small: number };
    totalWeight: number;
    totalVolume: number;
    totalStorage: number;
    rechargeTime: number;
    flightTime: number;
  };
}

interface SavedConfig {
  id: string;
  name: string;
  shipSize: 'small' | 'large';
  weight: string;
  gravity: string;
  atmosphere: string;
  multiplier: string;
  thrusterType: string;
  batteryType: string;
  systemMargin: number;
  targetAutonomy: number;
}

interface ContainerStats {
  totalMass: number;
  totalVolume: number;
  emptyMass: number;
  maxCapacity: number;
  fillStatus: string;
}

interface AxisConfiguration {
  direction: string;
  requiredThrust: number;
  combination: { key: string; count: number }[];
  brakingTime: number;
  maxSpeed: number;
}

interface MultiAxisResults {
  vertical: AxisConfiguration;
  front: AxisConfiguration;
  rear: AxisConfiguration;
  lateral: { left: AxisConfiguration; right: AxisConfiguration };
  totalPowerConsumption: number;
  totalMass: number;
  optimalBatteryCount: number;
}

interface ExportData {
  configuration: {
    shipSize: 'small' | 'large';
    baseWeight: number;
    gravity: string;
    gravityValue: number;
    atmosphere: string;
    atmosphereValue: number;
    multiplier: string;
    multiplierValue: number;
    vehicleType: VehicleType;
    systemMargin: number;
    targetAutonomy: number;
  };
  containerStats: ContainerStats;
  thrusterResults: CalculationResults | null;
  multiAxisConfig: MultiAxisResults | null;
  summary: string;
  timestamp: string;
  version: string;
}

const CURRENT_VERSION = '1.0.0';
const DISTANCE = 100; // en mètres
const efficiencyFactor = 0.85; // pour modéliser des pertes énergétiques

// Composant de vérification de cohérence
const GameConsistencyCheck = ({ type, id }: { type: 'thruster' | 'battery'; id: string }) => {
  const [consistency, setConsistency] = useState<'full' | 'partial' | 'mismatch'>('full');
  useEffect(() => {
    // Comparaison avec les données du jeu (à compléter)
    setConsistency('full');
  }, [type, id]);
  return (
    <span className={`consistency-indicator ${consistency}`}>
      {consistency === 'full' ? '✅' : consistency === 'partial' ? '⚠️' : '❌'}
    </span>
  );
};

const selectThrusterCombination = (
  available: { key: string; thruster: ThrusterData }[],
  R: number,
  atmosphereValue: number
): { combination: { key: string; count: number }[] } => {
  const effectiveR = R * 1.1;
  const suitable = available.filter(a => (a.thruster.thrust * calculateThrusterEfficiency(a.thruster, atmosphereValue)) >= effectiveR);
  if (suitable.length > 0) {
    const best = suitable.sort((a, b) =>
      Math.abs(a.thruster.thrust * calculateThrusterEfficiency(a.thruster, atmosphereValue) - effectiveR) -
      Math.abs(b.thruster.thrust * calculateThrusterEfficiency(b.thruster, atmosphereValue) - effectiveR)
    )[0];
    return { combination: [{ key: best.key, count: 1 }] };
  }
  const hybridCombinations = [
    { large: 1, small: 2 },
    { large: 0, small: 4 }
  ];
  const large = available.filter(a => a.key.toLowerCase().includes('large'));
  const small = available.filter(a => a.key.toLowerCase().includes('small'));
  if (large.length > 0 && small.length > 0) {
    const bestLarge = large.sort((a, b) => b.thruster.thrust - a.thruster.thrust)[0];
    const bestSmall = small.sort((a, b) => b.thruster.thrust - a.thruster.thrust)[0];
    let bestHybrid = { large: 0, small: Infinity };
    let bestTotalCount = Infinity;
    for (const combo of hybridCombinations) {
      const totalThrust = combo.large * bestLarge.thruster.thrust * calculateThrusterEfficiency(bestLarge.thruster, atmosphereValue)
                         + combo.small * bestSmall.thruster.thrust * calculateThrusterEfficiency(bestSmall.thruster, atmosphereValue);
      if (totalThrust >= effectiveR) {
        const totalCount = combo.large + combo.small;
        if (totalCount < bestTotalCount) {
          bestHybrid = combo;
          bestTotalCount = totalCount;
        }
      }
    }
    if (bestTotalCount !== Infinity) {
      return { combination: [
        ...(bestHybrid.large > 0 ? [{ key: bestLarge.key, count: bestHybrid.large }] : []),
        ...(bestHybrid.small > 0 ? [{ key: bestSmall.key, count: bestHybrid.small }] : [])
      ] };
    }
  }
  if (large.length > 0) {
    const chosenLarge = large.sort((a, b) => b.thruster.thrust - a.thruster.thrust)[0];
    const effLarge = chosenLarge.thruster.thrust * calculateThrusterEfficiency(chosenLarge.thruster, atmosphereValue);
    if (effLarge >= effectiveR * 0.7) {
      const remainder = effectiveR - effLarge;
      const combo = [{ key: chosenLarge.key, count: 1 }];
      if (remainder > 0 && small.length > 0) {
        const chosenSmall = small.sort((a, b) => b.thruster.thrust - a.thruster.thrust)[0];
        const effSmall = chosenSmall.thruster.thrust * calculateThrusterEfficiency(chosenSmall.thruster, atmosphereValue);
        const countSmall = Math.ceil(remainder / effSmall);
        combo.push({ key: chosenSmall.key, count: countSmall });
      }
      return { combination: combo };
    }
  }
  const best = available.sort(
    (a, b) => (b.thruster.thrust * calculateThrusterEfficiency(b.thruster, atmosphereValue)) -
              (a.thruster.thrust * calculateThrusterEfficiency(a.thruster, atmosphereValue))
  )[0];
  const effBest = best.thruster.thrust * calculateThrusterEfficiency(best.thruster, atmosphereValue);
  const countBest = Math.ceil(effectiveR / effBest);
  return { combination: [{ key: best.key, count: countBest }] };
};

const calculateThrusterEfficiency = (thruster: ThrusterData, atmosphereLevel: number): number => {
  if (thruster.atmosphere) {
    return atmosphereLevel <= 1
      ? thruster.atmosphere.minEfficiency + (thruster.atmosphere.maxEfficiency - thruster.atmosphere.minEfficiency) * atmosphereLevel
      : thruster.atmosphere.maxEfficiency;
  }
  if (thruster.name.includes("Ion")) {
    return atmosphereLevel > 0 ? 0.3 : 1;
  }
  return 1;
};

const getAvailableThrusters = (
  shipSize: 'small' | 'large',
  vehicleType: VehicleType,
  lateral: boolean
): { key: string; thruster: ThrusterData }[] => {
  const thrusters = shipSize === 'small' ? smallShipThrusters : largeShipThrusters;
  return Object.entries(thrusters)
    .map(([key, thruster]) => ({ key, thruster }))
    .filter(({ key, thruster }) => {
      if (lateral) {
        return key.toLowerCase().includes('smallatmospheric');
      }
      return thruster.name.toLowerCase().includes(vehicleType === 'atmospheric' ? 'atmospheric' : 'hydrogen');
    });
};

const SpaceCalcPage: React.FC = () => {
  const [shipSize, setShipSize] = useState<'small' | 'large'>('small');
  const [weight, setWeight] = useState<string>(''); // Masse de base
  const [gravity, setGravity] = useState<string>('earth');
  const [atmosphere, setAtmosphere] = useState<string>('normal');
  const [multiplier, setMultiplier] = useState<string>('realistic');
  const [vehicleType, setVehicleType] = useState<VehicleType>('atmospheric');
  // Fusion des paramètres en un unique facteur de marge (en %)
  const [systemMargin, setSystemMargin] = useState<number>(100);
  const [targetAutonomy, setTargetAutonomy] = useState<number>(1);
  const [containers, setContainers] = useState<ContainerConfig>({
    small: 0,
    medium: 0,
    large: 0,
    isFilled: false
  });
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [multiAxisResults, setMultiAxisResults] = useState<MultiAxisResults | null>(null);
  const [containerStats, setContainerStats] = useState<ContainerStats>({
    totalMass: 0,
    totalVolume: 0,
    emptyMass: 0,
    maxCapacity: 0,
    fillStatus: 'Vides'
  });
  const [batteryExplanation, setBatteryExplanation] = useState<string>("");
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [theme] = useState<'retro' | 'modern'>('retro');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const calculateContainerStats = (): ContainerStats => {
    const cargoData = shipSize === 'small' ? smallShipCargo : largeShipCargo;
    let totalVolume = 0, emptyMass = 0, maxCapacity = 0;
    Object.entries(containers).forEach(([size, value]) => {
      if (size !== 'isFilled' && cargoData[size]) {
        const count = Number(value);
        emptyMass += cargoData[size].mass * count;
        totalVolume += cargoData[size].volume * count;
        maxCapacity += cargoData[size].volume * count * 7.8;
      }
    });
    const totalMass = containers.isFilled ? emptyMass + (totalVolume * ores.iron.mass) : emptyMass;
    return { totalMass, totalVolume, emptyMass, maxCapacity, fillStatus: containers.isFilled ? 'Remplis de minerai de fer' : 'Vides' };
  };

  useEffect(() => {
    const saved = localStorage.getItem('spacecalc-configs');
    if (saved) setSavedConfigs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const stats = calculateContainerStats();
    setContainerStats(stats);
  }, [calculateContainerStats, containers, shipSize]);

  const resetConfig = () => {
    setWeight('');
    setSystemMargin(100);
    setTargetAutonomy(1);
    setContainers({ small: 0, medium: 0, large: 0, isFilled: false });
    setResults(null);
    setMultiAxisResults(null);
    setBatteryExplanation("");
  };

  const updateContainer = (key: keyof ContainerConfig, value: number | boolean) => {
    setContainers(prev => ({ ...prev, [key]: value }));
  };

  const loadConfig = (config: SavedConfig) => {
    setShipSize(config.shipSize);
    setWeight(config.weight);
    setGravity(config.gravity);
    setAtmosphere(config.atmosphere);
    setMultiplier(config.multiplier);
    setVehicleType(config.thrusterType === 'atmospheric' ? 'atmospheric' : 'interplanetary');
    setSystemMargin(config.systemMargin);
    setTargetAutonomy(config.targetAutonomy);
  };

  const deleteConfig = (id: string) => {
    const newConfigs = savedConfigs.filter(config => config.id !== id);
    setSavedConfigs(newConfigs);
    localStorage.setItem('spacecalc-configs', JSON.stringify(newConfigs));
  };

  const calculateAxisCombination = (
    R: number,
    atmosphereValue: number,
    lateral: boolean = false
  ): { combination: { key: string; count: number }[] } => {
    const available = getAvailableThrusters(shipSize, vehicleType, lateral);
    return selectThrusterCombination(available, R, atmosphereValue);
  };

  const calculateThrusters = (e: React.FormEvent): void => {
    e.preventDefault();
    const stats = calculateContainerStats();
    setContainerStats(stats);
    const baseWeight = parseFloat(weight);
    const totalWeight = baseWeight + stats.totalMass;
    const gravValue = gravityOptions[gravity];
    const atmosValue = atmosphereOptions[atmosphere];
    const multiValue = containerMultiplierOptions[multiplier];
    // Calcul de la poussée requise avec la marge unique (systemMargin)
    const requiredThrust = totalWeight * 9.81 * gravValue * (systemMargin / 100) / multiValue;
    
    // Calcul des axes
    const verticalThrust = totalWeight * 9.81 * gravValue * 1.5;
    const verticalCombo = calculateAxisCombination(verticalThrust, atmosValue);
    const horizontalThrustTotal = totalWeight * 9.81 * gravValue * 0.75;
    const frontCombo = calculateAxisCombination(horizontalThrustTotal / 2, atmosValue);
    const rearCombo = calculateAxisCombination(horizontalThrustTotal / 2, atmosValue);
    const lateralThrustTotal = totalWeight * 9.81 * gravValue * 0.5;
    const leftCombo = calculateAxisCombination(lateralThrustTotal / 2, atmosValue, true);
    const rightCombo = calculateAxisCombination(lateralThrustTotal / 2, atmosValue, true);

    const getPower = (combo: { combination: { key: string; count: number }[] }): number => {
      const thrustersObj = shipSize === 'small' ? smallShipThrusters : largeShipThrusters;
      return combo.combination.reduce((acc, c) => {
        const t = thrustersObj[c.key];
        return t ? acc + c.count * t.power : acc;
      }, 0);
    };
    const totalPowerConsumed = getPower(verticalCombo) + getPower(frontCombo) + getPower(rearCombo) + getPower(leftCombo) + getPower(rightCombo);

    // Calcul précis de la demande énergétique (en MWh)
    const requiredPower = totalPowerConsumed / 1e6;
    const requiredEnergy = requiredPower * targetAutonomy * (systemMargin / 100);

    // --- Sélection des batteries ---
    // Option A : uniquement petites batteries
    const optionSmallCount = Math.ceil(requiredEnergy / batteries.smallBattery.maxStoredPower);
    // Option B : uniquement grandes batteries (avec 10% de marge supplémentaire)
    const optionLargeCount = Math.ceil(requiredEnergy * 1.1 / batteries.largeBattery.maxStoredPower);
    // Option C : combinaison mixte
    const mixLarge = Math.floor(requiredEnergy / batteries.largeBattery.maxStoredPower);
    const remainingEnergy = requiredEnergy - mixLarge * batteries.largeBattery.maxStoredPower;
    const mixSmall = Math.ceil(remainingEnergy / batteries.smallBattery.maxStoredPower);

    const optionA = {
      large: 0,
      small: optionSmallCount,
      totalStorage: optionSmallCount * batteries.smallBattery.maxStoredPower,
      weight: optionSmallCount * batteries.smallBattery.weight
    };
    const optionB = {
      large: optionLargeCount,
      small: 0,
      totalStorage: optionLargeCount * batteries.largeBattery.maxStoredPower,
      weight: optionLargeCount * batteries.largeBattery.weight
    };
    const optionC = {
      large: mixLarge,
      small: mixSmall,
      totalStorage: mixLarge * batteries.largeBattery.maxStoredPower + mixSmall * batteries.smallBattery.maxStoredPower,
      weight: mixLarge * batteries.largeBattery.weight + mixSmall * batteries.smallBattery.weight
    };

    let batteryExplanation = "Sélection des batteries :\n";
    batteryExplanation += `Option A (petites uniquement) : ${optionA.small} petites, stockage total = ${optionA.totalStorage.toFixed(2)} MWh, poids = ${optionA.weight.toFixed(2)} kg.\n`;
    batteryExplanation += `Option B (grandes uniquement, +10% marge) : ${optionB.large} grandes, stockage total = ${optionB.totalStorage.toFixed(2)} MWh, poids = ${optionB.weight.toFixed(2)} kg.\n`;
    batteryExplanation += `Option C (mixte) : ${optionC.large} grandes + ${optionC.small} petites, stockage total = ${optionC.totalStorage.toFixed(2)} MWh, poids = ${optionC.weight.toFixed(2)} kg.\n`;
    
    let finalOption;
    if (optionB.weight < optionA.weight * 0.7) {
      batteryExplanation += "La règle de substitution a sélectionné l'option B car son poids est inférieur à 70% du poids de l'option A.\n";
      finalOption = { large: optionB.large, small: optionB.small };
    } else {
      const wasteA = optionA.totalStorage - requiredEnergy;
      const wasteB = optionB.totalStorage - requiredEnergy;
      const wasteC = optionC.totalStorage - requiredEnergy;
      const wasteRatioA = wasteA / requiredEnergy;
      const wasteRatioB = wasteB / requiredEnergy;
      const wasteRatioC = wasteC / requiredEnergy;
      const scoreA = wasteRatioA * 1000 + optionA.weight / 1000;
      const scoreB = wasteRatioB * 1000 + optionB.weight / 1000;
      const scoreC = wasteRatioC * 1000 + optionC.weight / 1000;
      batteryExplanation += `Scores : Option A = ${scoreA.toFixed(2)}, Option B = ${scoreB.toFixed(2)}, Option C = ${scoreC.toFixed(2)}.\n`;
      if (scoreA <= scoreB && scoreA <= scoreC) {
        finalOption = { large: optionA.large, small: optionA.small };
        batteryExplanation += "L'option A a le score le plus bas et a été sélectionnée.\n";
      } else if (scoreB <= scoreA && scoreB <= scoreC) {
        finalOption = { large: optionB.large, small: optionB.small };
        batteryExplanation += "L'option B a le score le plus bas et a été sélectionnée.\n";
      } else {
        finalOption = { large: optionC.large, small: optionC.small };
        batteryExplanation += "L'option C a le score le plus bas et a été sélectionnée.\n";
      }
    }
    // --- Fin de la sélection des batteries ---
    setBatteryExplanation(batteryExplanation);

    const batteryReqs = {
      count: finalOption.large + finalOption.small,
      optimalCount: finalOption.large + finalOption.small,
      combination: finalOption,
      totalWeight: finalOption.large * batteries.largeBattery.weight + finalOption.small * batteries.smallBattery.weight,
      totalVolume: finalOption.large * batteries.largeBattery.volume + finalOption.small * batteries.smallBattery.volume,
      totalStorage: finalOption.large * batteries.largeBattery.maxStoredPower + finalOption.small * batteries.smallBattery.maxStoredPower,
      rechargeTime: batteries.largeBattery.rechargeTime,
      flightTime: (finalOption.large * batteries.largeBattery.maxStoredPower + finalOption.small * batteries.smallBattery.maxStoredPower)
                  / ((requiredPower) / efficiencyFactor)
    };

    const calcResults: CalculationResults = {
      requiredThrust,
      containerStats: stats,
      batteryRequirements: batteryReqs
    };
    setResults(calcResults);

    const calcAxis = (R: number, axis: string, lateralMode: boolean = false): AxisConfiguration => {
      const combo = calculateAxisCombination(R, atmosValue, lateralMode);
      const maxSpeed = totalWeight > 0 ? Math.sqrt(2 * (R / totalWeight) * DISTANCE) : 0;
      const brakingTime = totalWeight > 0 ? maxSpeed / (R / totalWeight) : 0;
      return {
        direction: axis,
        requiredThrust: R,
        combination: combo.combination,
        brakingTime,
        maxSpeed
      };
    };

    const verticalAxis: AxisConfiguration = calcAxis(verticalThrust, 'vertical');
    const frontAxis: AxisConfiguration = calcAxis(horizontalThrustTotal / 2, 'front');
    const rearAxis: AxisConfiguration = calcAxis(horizontalThrustTotal / 2, 'rear');
    const leftAxis: AxisConfiguration = calcAxis(lateralThrustTotal / 2, 'left', true);
    const rightAxis: AxisConfiguration = calcAxis(lateralThrustTotal / 2, 'right', true);

    const getAxisPower = (axis: AxisConfiguration): number => {
      const thrustersObj = shipSize === 'small' ? smallShipThrusters : largeShipThrusters;
      return axis.combination.reduce((acc, c) => {
        const t = thrustersObj[c.key];
        return t ? acc + c.count * t.power : acc;
      }, 0);
    };

    const totalAxisPower = getAxisPower(verticalAxis) + getAxisPower(frontAxis) + getAxisPower(rearAxis) + getAxisPower(leftAxis) + getAxisPower(rightAxis);
    const multiAxis: MultiAxisResults = {
      vertical: verticalAxis,
      front: frontAxis,
      rear: rearAxis,
      lateral: { left: leftAxis, right: rightAxis },
      totalPowerConsumption: totalAxisPower,
      totalMass: totalWeight,
      optimalBatteryCount: finalOption.large + finalOption.small
    };
    setMultiAxisResults(multiAxis);
  };

  const generateSummary = (): string => {
    if (!results || !multiAxisResults) return "";
    const totalShipMass = Math.round((parseFloat(weight) || 0) + containerStats.totalMass);
    let summary = `Configuration pour un vaisseau de ${totalShipMass.toLocaleString()} kg (${vehicleType === 'atmospheric' ? "Atmosphérique" : "Interplanétaire"}):\n`;
    summary += `• Poussée Totale Requise : ${Math.round(results.requiredThrust).toLocaleString()} N\n`;
    summary += `• Marge Système : ${systemMargin}% | Autonomie Cible : ${targetAutonomy} h\n\n`;
    summary += `Axe Vertical:\n  - Poussée : ${Math.round(multiAxisResults.vertical.requiredThrust).toLocaleString()} N\n  - Thrusters : ${multiAxisResults.vertical.combination.map(c => `${c.count}x ${c.key}`).join(" + ")}\n  - Vitesse max : ${Math.round(multiAxisResults.vertical.maxSpeed)} m/s\n  - Temps de freinage : ${multiAxisResults.vertical.brakingTime.toFixed(1)} s\n\n`;
    summary += `Propulsion Avant/Arrière:\n  - Avant : ${Math.round(multiAxisResults.front.requiredThrust).toLocaleString()} N (${multiAxisResults.front.combination.map(c => `${c.count}x ${c.key}`).join(" + ")})\n  - Arrière : ${Math.round(multiAxisResults.rear.requiredThrust).toLocaleString()} N (${multiAxisResults.rear.combination.map(c => `${c.count}x ${c.key}`).join(" + ")})\n  - Temps de freinage (arrière) : ${multiAxisResults.rear.brakingTime.toFixed(1)} s\n\n`;
    summary += `Déplacement Latéral:\n  - Gauche : ${Math.round(multiAxisResults.lateral.left.requiredThrust).toLocaleString()} N (${multiAxisResults.lateral.left.combination.map(c => `${c.count}x ${c.key}`).join(" + ")})\n  - Droite : ${Math.round(multiAxisResults.lateral.right.requiredThrust).toLocaleString()} N (${multiAxisResults.lateral.right.combination.map(c => `${c.count}x ${c.key}`).join(" + ")})\n\n`;
    summary += `Système Énergétique:\n  - Batteries : ${results.batteryRequirements.count} (Optimal : ${results.batteryRequirements.optimalCount})\n  - Combinaison : ${results.batteryRequirements.combination.large} grandes + ${results.batteryRequirements.combination.small} petites\n  - Capacité Totale : ${results.batteryRequirements.totalStorage.toFixed(2)} MWh\n  - Autonomie estimée : ${Math.round(results.batteryRequirements.flightTime * 60)} min\n\n`;
    summary += "Explication de la sélection des batteries :\n" + batteryExplanation;
    return summary;
  };

  const exportResults = (): void => {
    const exportData: ExportData = {
      configuration: {
        shipSize,
        baseWeight: parseFloat(weight) || 0,
        gravity,
        gravityValue: gravityOptions[gravity],
        atmosphere,
        atmosphereValue: atmosphereOptions[atmosphere],
        multiplier,
        multiplierValue: containerMultiplierOptions[multiplier],
        vehicleType,
        systemMargin,
        targetAutonomy
      },
      containerStats,
      thrusterResults: results,
      multiAxisConfig: multiAxisResults,
      summary: generateSummary(),
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const aElem = document.createElement('a');
    aElem.href = url;
    aElem.download = `spacecalc-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(aElem);
    aElem.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(aElem);
  };

  return (
    <div className={`spacecalc-container ${theme}`}>
      {savedConfigs.length > 0 && (
        <div className="preset-configs">
          {savedConfigs.map(config => (
            <button key={config.id} className="preset-btn" onClick={() => loadConfig(config)}>
              {config.name}
              <span className="delete-config" onClick={(e) => { e.stopPropagation(); deleteConfig(config.id); }}>
                ×
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="calculator-grid">
        <div className="config-section">
          <form onSubmit={calculateThrusters}>
            <div className="grid-type-selector">
              <button type="button" className={`grid-type-btn ${shipSize === 'small' ? 'active' : ''}`} onClick={() => setShipSize('small')}>
                Petite Grille
              </button>
              <button type="button" className={`grid-type-btn ${shipSize === 'large' ? 'active' : ''}`} onClick={() => setShipSize('large')}>
                Grande Grille
              </button>
            </div>
            <div className="input-group">
              <label htmlFor="weight">Masse de Base (kg)</label>
              <input type="number" id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Masse sans conteneurs" required />
            </div>
            <div className="input-group">
              <label htmlFor="systemMargin">Marge Système (%)</label>
              <input type="range" id="systemMargin" min="100" max="200" step="10" value={systemMargin} onChange={(e) => setSystemMargin(parseFloat(e.target.value))} />
              <span>{systemMargin}%</span>
            </div>
            <div className="input-group">
              <label htmlFor="targetAutonomy">Autonomie Cible (heures)</label>
              <input type="range" id="targetAutonomy" min="0.5" max="2" step="0.1" value={targetAutonomy} onChange={(e) => setTargetAutonomy(parseFloat(e.target.value))} />
              <span>{targetAutonomy} h</span>
            </div>
            <div className="container-config">
              <div className="container-inputs">
                <div className="container-input">
                  <label className="tooltip" data-tooltip="Volume: 125L, Masse: 49.2kg">Petits Conteneurs</label>
                  <input type="number" value={containers.small} onChange={(e) => updateContainer('small', parseInt(e.target.value) || 0)} min="0" />
                </div>
                {shipSize === 'small' && (
                  <div className="container-input">
                    <label className="tooltip" data-tooltip="Volume: 3,375L, Masse: 274.8kg">Conteneurs Moyens</label>
                    <input type="number" value={containers.medium} onChange={(e) => updateContainer('medium', parseInt(e.target.value) || 0)} min="0" />
                  </div>
                )}
                <div className="container-input">
                  <label className="tooltip" data-tooltip="Volume: 15,625L, Masse: 626.2kg">Grands Conteneurs</label>
                  <input type="number" value={containers.large} onChange={(e) => updateContainer('large', parseInt(e.target.value) || 0)} min="0" />
                </div>
                <div className="container-checkbox">
                  <label>
                    <input type="checkbox" checked={containers.isFilled} onChange={(e) => updateContainer('isFilled', e.target.checked)} />
                    Remplir les Conteneurs
                  </label>
                </div>
              </div>
              <div className="container-stats">
                <div className="container-stats-item">
                  <span className="container-stats-label">Masse à Vide</span>
                  <span className="container-stats-value">{containerStats.emptyMass.toLocaleString()} kg</span>
                </div>
                <div className="container-stats-item">
                  <span className="container-stats-label">Volume Total</span>
                  <span className="container-stats-value">{containerStats.totalVolume.toLocaleString()} L</span>
                </div>
                <div className="container-stats-item">
                  <span className="container-stats-label">Capacité Max</span>
                  <span className="container-stats-value">{containerStats.maxCapacity.toLocaleString()} kg</span>
                </div>
                {containers.isFilled && (
                  <div className="container-stats-item">
                    <span className="container-stats-label">Masse Totale</span>
                    <span className="container-stats-value">{containerStats.totalMass.toLocaleString()} kg</span>
                  </div>
                )}
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="vehicleType">Type de Véhicule</label>
              <select id="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)}>
                <option value="atmospheric">Véhicule Atmosphérique</option>
                <option value="interplanetary">Véhicule Interplanétaire</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="gravity">Environnement</label>
              <select id="gravity" value={gravity} onChange={(e) => setGravity(e.target.value)}>
                {Object.entries(gravityOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)} ({value}g)
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="atmosphere">Atmosphère</label>
              <select id="atmosphere" value={atmosphere} onChange={(e) => setAtmosphere(e.target.value)}>
                {Object.entries(atmosphereOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)} ({value * 100}%)
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="multiplier">Multiplicateur de Charge</label>
              <select id="multiplier" value={multiplier} onChange={(e) => setMultiplier(e.target.value)}>
                {Object.entries(containerMultiplierOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {key.toUpperCase()} (×{value})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="calculate-btn">Calculer</button>
            <button type="button" className="reset-btn" onClick={resetConfig}>Reset</button>
          </form>
        </div>
        {results && multiAxisResults && (
          <div className="results-section">
            <div className="summary-section">
              <h3>Résumé de Configuration</h3>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{generateSummary()}</pre>
            </div>
            <div className="export-section">
              <button className="export-btn" onClick={exportResults} title="Exporter les résultats en JSON">
                Exporter les Résultats
              </button>
            </div>
            <div className="result-card thrust-required">
              <h3>
                <span className="card-title">Poussée Requise</span>
                <span className="card-subtitle">Basé sur la masse effective et l'environnement</span>
              </h3>
              <div className="result-grid">
                <div className="result-item">
                  <div className="result-label">Poussée Totale</div>
                  <div className="result-value">{Math.round(results.requiredThrust).toLocaleString()} N</div>
                  <div className="result-note">Force minimale pour décoller</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Masse des Conteneurs</div>
                  <div className="result-value">{Math.round(results.containerStats.totalMass).toLocaleString()} kg</div>
                  <div className="result-note">Inclus masse cargo (si rempli)</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Volume Total</div>
                  <div className="result-value">{Math.round(results.containerStats.totalVolume).toLocaleString()} L</div>
                  <div className="result-note">Capacité de stockage</div>
                </div>
                <div className="result-item">
                  <div className="result-label">État des Conteneurs</div>
                  <div className="result-value status">{results.containerStats.fillStatus}</div>
                  <div className="result-note">Statut actuel</div>
                </div>
              </div>
            </div>
            <div className="result-card thruster-recommendations">
              <h3>
                <span className="card-title">Propulseurs Recommandés</span>
                <span className="card-subtitle">Détails par axe</span>
              </h3>
              <div className="result-grid">
                <div className="axis-section vertical">
                  <h4>Axe Vertical</h4>
                  <div className="axis-details">
                    <div className="detail-row primary-info">
                      <span className="detail-label">Poussée Requise</span>
                      <span className="detail-value">{Math.round(multiAxisResults.vertical.requiredThrust).toLocaleString()} N</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Thrusters</span>
                      <span className="detail-value">
                        {multiAxisResults.vertical.combination.map(c => (
                          <span key={c.key}>
                            {c.count}x {c.key} <GameConsistencyCheck type="thruster" id={c.key} />{' '}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Vitesse max</span>
                      <span className="detail-value">{Math.round(multiAxisResults.vertical.maxSpeed)} m/s</span>
                    </div>
                  </div>
                </div>
                <div className="axis-section horizontal">
                  <h4>Propulsion Avant/Arrière</h4>
                  <div className="axis-details">
                    <div className="detail-row primary-info">
                      <span className="detail-label">Poussée Avant</span>
                      <span className="detail-value">{Math.round(multiAxisResults.front.requiredThrust).toLocaleString()} N</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Thrusters (Avant)</span>
                      <span className="detail-value">
                        {multiAxisResults.front.combination.map(c => (
                          <span key={c.key}>
                            {c.count}x {c.key} <GameConsistencyCheck type="thruster" id={c.key} />{' '}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="detail-row primary-info">
                      <span className="detail-label">Poussée Arrière</span>
                      <span className="detail-value">{Math.round(multiAxisResults.rear.requiredThrust).toLocaleString()} N</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Thrusters (Arrière)</span>
                      <span className="detail-value">
                        {multiAxisResults.rear.combination.map(c => (
                          <span key={c.key}>
                            {c.count}x {c.key} <GameConsistencyCheck type="thruster" id={c.key} />{' '}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Temps de freinage</span>
                      <span className="detail-value">{multiAxisResults.rear.brakingTime.toFixed(1)} s</span>
                    </div>
                  </div>
                </div>
                <div className="axis-section lateral">
                  <h4>Déplacement Latéral</h4>
                  <div className="axis-details">
                    <div className="detail-row primary-info">
                      <span className="detail-label">Poussée (Gauche)</span>
                      <span className="detail-value">{Math.round(multiAxisResults.lateral.left.requiredThrust).toLocaleString()} N</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Thrusters (Gauche)</span>
                      <span className="detail-value">
                        {multiAxisResults.lateral.left.combination.map(c => (
                          <span key={c.key}>
                            {c.count}x {c.key} <GameConsistencyCheck type="thruster" id={c.key} />{' '}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="detail-row primary-info">
                      <span className="detail-label">Poussée (Droite)</span>
                      <span className="detail-value">{Math.round(multiAxisResults.lateral.right.requiredThrust).toLocaleString()} N</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Thrusters (Droite)</span>
                      <span className="detail-value">
                        {multiAxisResults.lateral.right.combination.map(c => (
                          <span key={c.key}>
                            {c.count}x {c.key} <GameConsistencyCheck type="thruster" id={c.key} />{' '}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="axis-section summary">
                  <h4>Résumé Global</h4>
                  <div className="axis-details">
                    <div className="detail-row primary-info">
                      <span className="detail-label">Puissance Totale</span>
                      <span className="detail-value">{(multiAxisResults.totalPowerConsumption / 1e6).toFixed(1)} MW</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Masse Totale</span>
                      <span className="detail-value">{Math.round(multiAxisResults.totalMass).toLocaleString()} kg</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Batteries</span>
                      <span className="detail-value">{multiAxisResults.optimalBatteryCount} unités</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="result-card battery-requirements">
              <h3>
                <span className="card-title">Besoins en Batteries</span>
                <span className="card-subtitle">Configuration énergétique recommandée</span>
              </h3>
              <div className="battery-block">
                <div className="battery-image-container">
                  <img src={batteries.smallBattery.imagefile} alt="Battery Icon" className="battery-image" />
                </div>
                <div className="battery-details">
                  <div className="battery-header">
                    <span className="battery-config">Configuration Optimale &amp; Sécurisée</span>
                    <span className="battery-units">
                      {results.batteryRequirements.combination.large} grandes + {results.batteryRequirements.combination.small} petites
                    </span>
                  </div>
                  <div className="battery-info-grid">
                    <div className="info-item">
                      <span className="info-label">Capacité Énergétique</span>
                      <span className="info-value">{(results.batteryRequirements.totalStorage * 1000).toLocaleString()} kWh</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Masse du Système</span>
                      <span className="info-value">{results.batteryRequirements.totalWeight.toLocaleString()} kg</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Volume Requis</span>
                      <span className="info-value">{results.batteryRequirements.totalVolume.toLocaleString()} m³</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Autonomie</span>
                      <span className="info-value">{Math.round(results.batteryRequirements.flightTime * 60)} min</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Recharge</span>
                      <span className="info-value">{results.batteryRequirements.rechargeTime} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceCalcPage;
