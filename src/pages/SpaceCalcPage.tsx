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
type BatteryConfig = 'compact' | 'flexible';

interface ContainerConfig {
    small: number;
    medium: number;
    large: number;
    isFilled: boolean;
}

interface CalculationResults {
    requiredThrust: number;
    recommendedThrusters: {
        type: string;
        count: number;
        totalWeight: number;
        totalPower: number;
        totalFuel: number | null;
        effectiveThrust: number;
        efficiency: number;
        flightTime: number;
        speedMS: number;
    }[];
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
    thrusters: {
        type: string;
        count: number;
        totalPower: number;
        efficiency: number;
    }[];
    brakingTime: number;
    maxSpeed: number;
}

interface MultiAxisResults {
    vertical: AxisConfiguration;
    forward: AxisConfiguration;
    backward: AxisConfiguration;
    lateral: AxisConfiguration;
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
        naturalMassRatio: number;
        safetyMargin: number;
        batteryConfig: BatteryConfig;
    };
    containerStats: ContainerStats;
    thrusterResults: CalculationResults | null;
    multiAxisConfig: MultiAxisResults | null;
    timestamp: string;
    version: string;
}

const CURRENT_VERSION = '1.0.0';
const DISTANCE = 100; // Distance de référence pour le calcul de la vitesse

const SpaceCalcPage: React.FC = () => {
    // Paramètres de base
    const [shipSize, setShipSize] = useState<'small' | 'large'>('small');
    const [weight, setWeight] = useState<string>(''); // Masse de base sans conteneurs
    const [gravity, setGravity] = useState<string>('earth');
    const [atmosphere, setAtmosphere] = useState<string>('normal');
    const [multiplier, setMultiplier] = useState<string>('realistic');
    const [vehicleType, setVehicleType] = useState<VehicleType>('atmospheric');
    // Nouveau paramètre pour la proportion de masse naturelle (100 = 100 % de la masse est soumise à la gravité naturelle)
    const [naturalMassRatio, setNaturalMassRatio] = useState<number>(100);
    // Nouveau paramètre de marge de sécurité (en % ; par défaut 120%)
    const [safetyMargin, setSafetyMargin] = useState<number>(120);
    const [batteryConfig, setBatteryConfig] = useState<BatteryConfig>(shipSize === 'small' ? 'flexible' : 'compact');
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
    const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
    const [theme] = useState<'retro' | 'modern'>('retro');

    // Gestion des configurations enregistrées
    const loadConfig = (config: SavedConfig): void => {
        setShipSize(config.shipSize);
        setWeight(config.weight);
        setGravity(config.gravity);
        setAtmosphere(config.atmosphere);
        setMultiplier(config.multiplier);
        setVehicleType(config.thrusterType === 'atmospheric' ? 'atmospheric' : 'interplanetary');
        setBatteryConfig(config.batteryType === 'compact' ? 'compact' : 'flexible');
    };

    const deleteConfig = (id: string): void => {
        const updatedConfigs = savedConfigs.filter(config => config.id !== id);
        setSavedConfigs(updatedConfigs);
        localStorage.setItem('spacecalc-configs', JSON.stringify(updatedConfigs));
    };

    const updateContainer = (type: keyof ContainerConfig, value: number | boolean): void => {
        setContainers(prev => ({
            ...prev,
            [type]: typeof value === 'number' ? Math.max(0, value) : value
        }));
    };

    useEffect(() => {
        const savedConfigsStr = localStorage.getItem('spacecalc-configs');
        if (savedConfigsStr) {
            setSavedConfigs(JSON.parse(savedConfigsStr));
        }
    }, []);

    useEffect(() => {
        const stats = calculateContainerStats();
        setContainerStats(stats);
    }, [containers, shipSize]);

    const calculateContainerStats = (): ContainerStats => {
        const cargoData = shipSize === 'small' ? smallShipCargo : largeShipCargo;
        let totalVolume = 0;
        let emptyMass = 0;
        let maxCapacity = 0;
        Object.entries(containers).forEach(([size, value]) => {
            if (size !== 'isFilled' && cargoData[size]) {
                const count = Number(value);
                emptyMass += cargoData[size].mass * count;
                totalVolume += cargoData[size].volume * count;
                maxCapacity += cargoData[size].volume * count * 7.8;
            }
        });
        const totalMass = containers.isFilled ? emptyMass + (totalVolume * ores.iron.mass) : emptyMass;
        return { 
            totalMass, 
            totalVolume,
            emptyMass,
            maxCapacity,
            fillStatus: containers.isFilled ? 'Remplis de minerai de fer' : 'Vides'
        };
    };

    const calculateThrusters = (e: React.FormEvent): void => {
        e.preventDefault();
        const stats = calculateContainerStats();
        setContainerStats(stats);
        const baseWeight = parseFloat(weight);
        const totalWeight = baseWeight + stats.totalMass;
        const gravityValue = gravityOptions[gravity];
        const atmosphereValue = atmosphereOptions[atmosphere];
        const multiplierValue = containerMultiplierOptions[multiplier];
        // On applique la marge de sécurité sur la poussée requise
        const effectiveMass = totalWeight * (naturalMassRatio / 100);
        const requiredThrust = effectiveMass * 9.81 * gravityValue * (safetyMargin / 100) / multiplierValue;
        
        const multiAxis = calculateMultiAxisConfiguration(totalWeight, gravity, atmosphereValue);
        setMultiAxisResults(multiAxis);

        // Sélection automatique des propulseurs en fonction du type de véhicule
        const effectiveThrusterType = vehicleType === 'atmospheric' ? "atmospheric" : "hydrogen";
        const thrusters = shipSize === 'small' ? smallShipThrusters : largeShipThrusters;
        const filteredThrusters = Object.fromEntries(
            Object.entries(thrusters).filter(([_, thruster]) => 
                thruster.name.toLowerCase().includes(effectiveThrusterType)
            )
        );

        const recommendedThrusters = Object.entries(filteredThrusters).map(([_, thruster]) => {
            const effectiveThrust = calculateEffectiveThrust(thruster, atmosphereValue);
            if (effectiveThrust <= 0) return null;
            const count = Math.ceil(requiredThrust / effectiveThrust);
            const efficiency = calculateThrusterEfficiency(thruster, atmosphereValue);
            const totalThrust = effectiveThrust * count;
            const acceleration = (totalThrust / totalWeight) - (9.81 * gravityValue);
            const speedMS = acceleration > 0 ? Math.sqrt(2 * acceleration * DISTANCE) : 0;
            const flightTime = acceleration > 0 ? Math.sqrt((2 * DISTANCE) / acceleration) : 0;
            return {
                type: thruster.name,
                count,
                totalWeight: count * thruster.weight,
                totalPower: count * thruster.power,
                totalFuel: thruster.fuel ? count * thruster.fuel : null,
                effectiveThrust: totalThrust,
                efficiency,
                speedMS,
                flightTime
            };
        }).filter(thruster => thruster !== null) as CalculationResults["recommendedThrusters"];

        if (recommendedThrusters.length === 0) {
            setResults(null);
            return;
        }

        // Calcul des batteries
        const battery = batteryConfig === 'flexible'
            ? batteries.smallBattery
            : batteries.largeBattery;
        const totalPower = recommendedThrusters.reduce((acc, curr) => acc + curr.totalPower, 0);
        // On applique la marge de sécurité sur l'énergie aussi :
        const optimalBatteryCount = Math.ceil((totalPower / 1000000) / battery.maxOutput);
        const recommendedBatteryCount = Math.ceil(optimalBatteryCount * (safetyMargin / 100));
        const totalStorage = recommendedBatteryCount * battery.maxStoredPower;
        const batteryFlightTime = (totalPower / 1000000) > 0 ? totalStorage / (totalPower / 1000000) : 0;
        const batteryReqs = {
            count: recommendedBatteryCount,
            optimalCount: optimalBatteryCount,
            totalWeight: recommendedBatteryCount * battery.weight,
            totalVolume: recommendedBatteryCount * battery.volume,
            totalStorage,
            rechargeTime: battery.rechargeTime,
            flightTime: batteryFlightTime
        };

        setResults({
            requiredThrust,
            recommendedThrusters,
            containerStats: stats,
            batteryRequirements: batteryReqs
        });
    };

    const calculateThrusterEfficiency = (thruster: ThrusterData, atmosphereLevel: number): number => {
        if (thruster.name.toLowerCase().includes('atmospheric')) {
            if (atmosphereLevel === 0) return 0;
            return Math.min(atmosphereLevel, 1);
        }
        if (thruster.name.toLowerCase().includes('hydrogen')) {
            return thruster.atmosphere 
                ? thruster.atmosphere.minEfficiency + (thruster.atmosphere.maxEfficiency - thruster.atmosphere.minEfficiency) * (1 - atmosphereLevel)
                : thruster.spaceEfficiency;
        }
        if (thruster.name.toLowerCase().includes('ion')) {
            return atmosphereLevel === 0 ? 1 : 0.8;
        }
        return thruster.spaceEfficiency;
    };

    const calculateEffectiveThrust = (thruster: ThrusterData, atmosphereLevel: number): number => {
        const efficiency = calculateThrusterEfficiency(thruster, atmosphereLevel);
        if (efficiency <= 0) return 0;
        return thruster.thrust * efficiency;
    };

    // On retire le paramètre 'atmosphere' pour éliminer l'avertissement
    const calculateMultiAxisConfiguration = (baseWeight: number, gravity: string, atmosphereValue: number): MultiAxisResults => {
        const gravityValue = gravityOptions[gravity];
        const totalWeight = baseWeight;
        const verticalThrust = totalWeight * 9.81 * gravityValue * 1.5;
        const forwardThrust = verticalThrust * 0.75;
        const backwardThrust = forwardThrust;
        const lateralThrust = verticalThrust * 0.5;
        const vertical = calculateAxisThrusters(verticalThrust, atmosphereValue, 'vertical', totalWeight);
        const forward = calculateAxisThrusters(forwardThrust, atmosphereValue, 'forward', totalWeight);
        const backward = calculateAxisThrusters(backwardThrust, atmosphereValue, 'backward', totalWeight);
        const lateral = calculateAxisThrusters(lateralThrust, atmosphereValue, 'lateral', totalWeight);
        const totalPower = vertical.thrusters.reduce((acc, t) => acc + t.totalPower, 0) +
                           forward.thrusters.reduce((acc, t) => acc + t.totalPower, 0) +
                           backward.thrusters.reduce((acc, t) => acc + t.totalPower, 0) +
                           lateral.thrusters.reduce((acc, t) => acc + t.totalPower, 0);
        return {
            vertical,
            forward,
            backward,
            lateral,
            totalPowerConsumption: totalPower,
            totalMass: baseWeight,
            optimalBatteryCount: Math.ceil(totalPower / (batteries.largeBattery.maxOutput * 1000000))
        };
    };

    const calculateAxisThrusters = (requiredThrust: number, atmosphereValue: number, axis: string, totalWeight: number): AxisConfiguration => {
        const thrusters = Object.entries(shipSize === 'small' ? smallShipThrusters : largeShipThrusters)
            .map(([_, thruster]) => {
                const efficiency = calculateThrusterEfficiency(thruster, atmosphereValue);
                const effectiveThrust = thruster.thrust * efficiency;
                const count = Math.ceil(requiredThrust / effectiveThrust);
                return {
                    type: thruster.name,
                    count,
                    totalPower: count * thruster.power,
                    efficiency
                };
            })
            .filter(t => t.efficiency > 0)
            .sort((a, b) => a.totalPower - b.totalPower);
        const bestThruster = thrusters[0];
        const a = requiredThrust / totalWeight;
        const maxSpeed = Math.sqrt(2 * a * DISTANCE);
        const brakingTime = a > 0 ? maxSpeed / a : 0;
        return {
            direction: axis,
            requiredThrust,
            thrusters: [bestThruster],
            brakingTime,
            maxSpeed
        };
    };

    // Résumé synthétique enrichi avec détails par axe et comparaison entre configurations de batterie
    const generateSummary = (): string => {
        if (!results || !multiAxisResults) return "";
        const totalShipMass = Math.round((parseFloat(weight) || 0) + containerStats.totalMass);
        let summary = `Pour un vaisseau de ${totalShipMass.toLocaleString()} kg (${vehicleType === 'atmospheric' ? "Atmosphérique" : "Interplanétaire"}):\n`;
        summary += `• Poussée Totale Requise: ${Math.round(results.requiredThrust).toLocaleString()} N\n`;
        summary += `• Vertical: ${multiAxisResults.vertical.thrusters[0].count}x ${multiAxisResults.vertical.thrusters[0].type} (Vmax ${Math.round(multiAxisResults.vertical.maxSpeed)} m/s)\n`;
        summary += `• Avant/Arrière: ${multiAxisResults.forward.thrusters[0].count}x ${multiAxisResults.forward.thrusters[0].type} (Freinage ${multiAxisResults.backward.brakingTime.toFixed(1)} s)\n`;
        summary += `• Latéral: ${multiAxisResults.lateral.thrusters[0].count}x ${multiAxisResults.lateral.thrusters[0].type}\n`;
        summary += `• Énergie Requise: ${results.batteryRequirements.count} `;
        summary += batteryConfig === 'flexible' ? "petites" : "grandes";
        summary += ` batteries (capacité totale ${results.batteryRequirements.totalStorage.toFixed(1)} MWh)\n`;
        if (batteryConfig === 'flexible') {
            // Comparaison : 20 petites batteries ≈ 1 grande batterie
            const totalSmallWeight = results.batteryRequirements.count * batteries.smallBattery.weight;
            summary += `(Note : 20 petites batteries fournissent environ la même capacité qu’1 grande batterie, mais pèsent environ ${totalSmallWeight.toLocaleString()} kg au total, contre ${batteries.largeBattery.weight} kg par grande batterie.)`;
        } else {
            // Pour configuration compacte, on peut indiquer le gain de masse
            summary += `(Note : Les grandes batteries offrent une configuration compacte et un poids réduit par capacité.)`;
        }
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
                naturalMassRatio,
                safetyMargin,
                batteryConfig
            },
            containerStats,
            thrusterResults: results,
            multiAxisConfig: multiAxisResults,
            timestamp: new Date().toISOString(),
            version: CURRENT_VERSION
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spacecalc-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className={`spacecalc-container ${theme}`}>
            {savedConfigs.length > 0 && (
                <div className="preset-configs">
                    {savedConfigs.map(config => (
                        <button
                            key={config.id}
                            className="preset-btn"
                            onClick={() => loadConfig(config)}
                        >
                            {config.name}
                            <span 
                                className="delete-config"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConfig(config.id);
                                }}
                            >
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
                            <button
                                type="button"
                                className={`grid-type-btn ${shipSize === 'small' ? 'active' : ''}`}
                                onClick={() => setShipSize('small')}
                            >
                                Petite Grille
                            </button>
                            <button
                                type="button"
                                className={`grid-type-btn ${shipSize === 'large' ? 'active' : ''}`}
                                onClick={() => setShipSize('large')}
                            >
                                Grande Grille
                            </button>
                        </div>
                        <div className="input-group">
                            <label htmlFor="weight">Masse de Base (kg)</label>
                            <input
                                type="number"
                                id="weight"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="Masse sans conteneurs"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="naturalMassRatio">Masse Naturelle (%)</label>
                            <input
                                type="number"
                                id="naturalMassRatio"
                                value={naturalMassRatio}
                                onChange={(e) => setNaturalMassRatio(parseFloat(e.target.value) || 100)}
                                placeholder="100"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="safetyMargin">Safety Margin (%)</label>
                            <input
                                type="number"
                                id="safetyMargin"
                                value={safetyMargin}
                                onChange={(e) => setSafetyMargin(parseFloat(e.target.value) || 120)}
                                placeholder="120"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="batteryConfig">Configuration Batterie</label>
                            <select
                                id="batteryConfig"
                                value={batteryConfig}
                                onChange={(e) => setBatteryConfig(e.target.value as BatteryConfig)}
                            >
                                <option value="compact">Compact (Grandes Batteries)</option>
                                <option value="flexible">Flexible (Petites Batteries)</option>
                            </select>
                        </div>
                        <div className="container-config">
                            <h3>Configuration des Conteneurs</h3>
                            <div className="container-inputs">
                                <div className="container-input">
                                    <label className="tooltip" data-tooltip="Volume: 125L, Masse: 49.2kg">
                                        Petits Conteneurs
                                    </label>
                                    <input
                                        type="number"
                                        value={containers.small}
                                        onChange={(e) => updateContainer('small', parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </div>
                                {shipSize === 'small' && (
                                    <div className="container-input">
                                        <label className="tooltip" data-tooltip="Volume: 3,375L, Masse: 274.8kg">
                                            Conteneurs Moyens
                                        </label>
                                        <input
                                            type="number"
                                            value={containers.medium}
                                            onChange={(e) => updateContainer('medium', parseInt(e.target.value) || 0)}
                                            min="0"
                                        />
                                    </div>
                                )}
                                <div className="container-input">
                                    <label className="tooltip" data-tooltip="Volume: 15,625L, Masse: 626.2kg">
                                        Grands Conteneurs
                                    </label>
                                    <input
                                        type="number"
                                        value={containers.large}
                                        onChange={(e) => updateContainer('large', parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </div>
                                <div className="container-checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={containers.isFilled}
                                            onChange={(e) => updateContainer('isFilled', e.target.checked)}
                                        />
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
                            <select
                                id="vehicleType"
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                            >
                                <option value="atmospheric">Véhicule Atmosphérique</option>
                                <option value="interplanetary">Véhicule Interplanétaire</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="gravity">Environnement</label>
                            <select
                                id="gravity"
                                value={gravity}
                                onChange={(e) => setGravity(e.target.value)}
                            >
                                {Object.entries(gravityOptions).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)} ({value}g)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="atmosphere">Atmosphère</label>
                            <select
                                id="atmosphere"
                                value={atmosphere}
                                onChange={(e) => setAtmosphere(e.target.value)}
                            >
                                {Object.entries(atmosphereOptions).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)} ({value * 100}%)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="multiplier">Multiplicateur de Charge</label>
                            <select
                                id="multiplier"
                                value={multiplier}
                                onChange={(e) => setMultiplier(e.target.value)}
                            >
                                {Object.entries(containerMultiplierOptions).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {key.toUpperCase()} (×{value})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="calculate-btn">
                            Calculer
                        </button>
                    </form>
                </div>
                {results && multiAxisResults && (
                    <div className="results-section">
                        <div className="summary-section">
                            <h3>Résumé de Configuration</h3>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{generateSummary()}</pre>
                        </div>
                        <div className="export-section">
                            <button 
                                className="export-btn"
                                onClick={exportResults}
                                title="Exporter les résultats en JSON"
                            >
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
                                            <span className="detail-label">Type</span>
                                            <span className="detail-value">{multiAxisResults.vertical.thrusters[0].type}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Quantité</span>
                                            <span className="detail-value">{multiAxisResults.vertical.thrusters[0].count}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Vmax</span>
                                            <span className="detail-value">{Math.round(multiAxisResults.vertical.maxSpeed)} m/s</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="axis-section horizontal">
                                    <h4>Propulsion</h4>
                                    <div className="axis-details">
                                        <div className="detail-row primary-info">
                                            <span className="detail-label">Poussée Requise</span>
                                            <span className="detail-value">{Math.round(multiAxisResults.forward.requiredThrust).toLocaleString()} N</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Type</span>
                                            <span className="detail-value">{multiAxisResults.forward.thrusters[0].type}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Quantité</span>
                                            <span className="detail-value">{multiAxisResults.forward.thrusters[0].count}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Temps Freinage</span>
                                            <span className="detail-value">{multiAxisResults.forward.brakingTime.toFixed(1)}s</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="axis-section lateral">
                                    <h4>Déplacement Latéral</h4>
                                    <div className="axis-details">
                                        <div className="detail-row primary-info">
                                            <span className="detail-label">Poussée Requise</span>
                                            <span className="detail-value">{Math.round(multiAxisResults.lateral.requiredThrust).toLocaleString()} N</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Type</span>
                                            <span className="detail-value">{multiAxisResults.lateral.thrusters[0].type}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Quantité</span>
                                            <span className="detail-value">{multiAxisResults.lateral.thrusters[0].count}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Efficacité</span>
                                            <span className="detail-value">{(multiAxisResults.lateral.thrusters[0].efficiency * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="axis-section summary">
                                    <h4>Résumé Global</h4>
                                    <div className="axis-details">
                                        <div className="detail-row primary-info">
                                            <span className="detail-label">Puissance Totale</span>
                                            <span className="detail-value">{(multiAxisResults.totalPowerConsumption / 1000000).toFixed(1)} MW</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Masse Totale</span>
                                            <span className="detail-value">{Math.round(multiAxisResults.totalMass).toLocaleString()} kg</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Batteries</span>
                                            <span className="detail-value">{multiAxisResults.optimalBatteryCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Section Batteries */}
                        <div className="result-card battery-requirements">
                            <h3>
                                <span className="card-title">Besoins en Batteries</span>
                                <span className="card-subtitle">Configuration énergétique recommandée</span>
                            </h3>
                            <div className="battery-block">
                                <div className="battery-image-container">
                                <img 
                                    src={batteryConfig === 'flexible' ? batteries.smallBattery.imagefile : batteries.largeBattery.imagefile} 
                                    alt="Battery Icon" 
                                    className="battery-image"
                                />
                                </div>
                                <div className="battery-details">
                                <div className="battery-header">
                                    <span className="battery-config">Configuration Optimale &amp; Sécurisée</span>
                                    <span className="battery-units">{results.batteryRequirements.count} unités</span>
                                </div>
                                <div className="battery-info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Capacité Énergétique</span>
                                        <span className="info-value">
                                            {(results.batteryRequirements.totalStorage * 1000).toLocaleString()} kWh
                                        </span>
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
                                    <div className="info-item">
                                        <span className="info-label">Redondance</span>
                                        <span className="info-value">
                                         +{((results.batteryRequirements.count / results.batteryRequirements.optimalCount - 1) * 100).toFixed(0)}%
                                        </span>
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
