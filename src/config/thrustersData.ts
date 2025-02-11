export interface ThrusterData {
    name: string;
    weight: number;
    thrust: number;
    power: number; // en Watts
    fuel: number | null;
    imagefile: string;
    efficiency: number;
    atmosphere: {
        minEfficiency: number;
        maxEfficiency: number;
    } | null;
    spaceEfficiency: number;
    powerToThrustRatio: number; // en W/N
}

export interface CargoData {
    size: number;
    mass: number;
    volume: number;
    dimensions: string;
}

export interface ItemData {
    name: string;
    type: string;
    subtype: string;
    mass: number;
    volume: number;
}

export interface BatteryData {
    name: string;
    maxStoredPower: number; // en MWh
    maxOutput: number; // en MW
    weight: number; // en kg
    rechargeTime: number; // minutes
    volume: number; // en m³
    imagefile: string;
}

export interface OreData {
    name: string;
    mass: number; // kg/L
    volume: number; // L
    baseValue: number; // Space Credits
}

export const gravityOptions: Record<string, number> = {
    "earth": 1,
    "mars": 0.9,
    "alien": 1.1,
    "moon": 0.25,
    "europa": 0.25,
    "triton": 0.25,
    "space": 0,
    "asteroid": 0.05
};

export const atmosphereOptions: Record<string, number> = {
    "none": 0,
    "thin": 0.5,
    "normal": 1,
    "dense": 1.5
};

export const containerMultiplierOptions: Record<string, number> = {
    "realistic": 1,
    "x3": 3,
    "x5": 5,
    "x10": 10
};

export const smallShipThrusters: Record<string, ThrusterData> = {
    largeIon: {
        name: "Large Ion Thruster",
        weight: 721,
        thrust: 172800,
        power: 2400000, // 2.4 MW = 2400000 W
        fuel: null,
        imagefile: 'large_ion_thruster.png',
        efficiency: 1,
        atmosphere: null,
        spaceEfficiency: 1,
        powerToThrustRatio: 2400000 / 172800 // ≈13.89 W/N
    },
    smallIon: {
        name: "Small Ion Thruster",
        weight: 121,
        thrust: 14400,
        power: 200000, // 0.2 MW = 200000 W
        fuel: null,
        imagefile: 'ion_thruster.png',
        efficiency: 1,
        atmosphere: null,
        spaceEfficiency: 1,
        powerToThrustRatio: 200000 / 14400 // ≈13.89 W/N
    },
    largeHydrogen: {
        name: "Large Hydrogen Thruster",
        weight: 1222,
        thrust: 480000,
        power: 600000, // 0.6 MW = 600000 W
        fuel: 386, // selon vos données
        imagefile: 'large_hydrogen_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0.5,
            maxEfficiency: 1
        },
        spaceEfficiency: 1,
        powerToThrustRatio: 600000 / 480000 // ≈1.25 W/N
    },
    smallHydrogen: {
        name: "Small Hydrogen Thruster",
        weight: 334,
        thrust: 98400,
        power: 125000, // 0.125 MW = 125000 W (corrigé)
        fuel: 80 * 1.25, // soit 100
        imagefile: 'hydrogen_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0.5,
            maxEfficiency: 1
        },
        spaceEfficiency: 1,
        powerToThrustRatio: 125000 / 98400 // ≈1.27 W/N
    },
    largeAtmospheric: {
        name: "Large Atmospheric Thruster",
        weight: 2948,
        thrust: 576000,
        power: 2400000, // 2.4 MW = 2400000 W
        fuel: null,
        imagefile: 'large_atmospheric_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0,
            maxEfficiency: 1
        },
        spaceEfficiency: 0,
        powerToThrustRatio: 2400000 / 576000 // ≈4.17 W/N
    },
    smallAtmospheric: {
        name: "Small Atmospheric Thruster",
        weight: 699,
        thrust: 96000,
        power: 600000, // 0.6 MW = 600000 W
        fuel: null,
        imagefile: 'atmospheric_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0,
            maxEfficiency: 1
        },
        spaceEfficiency: 0,
        powerToThrustRatio: 600000 / 96000 // ≈6.25 W/N
    },
    // Nouveau propulseur ajouté pour small grid
    largeFlatAtmospheric: {
        name: "Large Flat Atmospheric Thruster",
        weight: 850,
        thrust: 230000,
        power: 1000000, // 1.0 MW = 1000000 W
        fuel: null,
        imagefile: 'large_flat_atmospheric_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0,
            maxEfficiency: 1
        },
        spaceEfficiency: 0,
        powerToThrustRatio: 1000000 / 230000 // ≈4.35 W/N
    }
};

export const largeShipThrusters: Record<string, ThrusterData> = {
    largeIon: {
        name: "Large Ion Thruster",
        weight: 43200,
        thrust: 4320000,
        power: 33600000, // 33.6 MW = 33600000 W
        fuel: null,
        imagefile: 'large_ion_thruster.png',
        efficiency: 1,
        atmosphere: null,
        spaceEfficiency: 1,
        powerToThrustRatio: 33600000 / 4320000 // ≈7.78 W/N
    },
    smallIon: {
        name: "Small Ion Thruster",
        weight: 4380,
        thrust: 345600,
        power: 3360000, // 3.36 MW = 3360000 W
        fuel: null,
        imagefile: 'ion_thruster.png',
        efficiency: 1,
        atmosphere: null,
        spaceEfficiency: 1,
        powerToThrustRatio: 3360000 / 345600 // ≈9.72 W/N
    },
    largeHydrogen: {
        name: "Large Hydrogen Thruster",
        weight: 6940,
        thrust: 7200000,
        power: 7500000, // 7.5 MW = 7500000 W (corrigé)
        fuel: 4820,
        imagefile: 'large_hydrogen_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0.5,
            maxEfficiency: 1
        },
        spaceEfficiency: 1,
        powerToThrustRatio: 7500000 / 7200000 // ≈1.04 W/N
    },
    smallHydrogen: {
        name: "Small Hydrogen Thruster",
        weight: 1420,
        thrust: 1080000,
        power: 1250000, // 1.25 MW = 1250000 W (corrigé)
        fuel: 803,
        imagefile: 'hydrogen_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0.5,
            maxEfficiency: 1
        },
        spaceEfficiency: 1,
        powerToThrustRatio: 1250000 / 1080000 // ≈1.16 W/N
    },
    largeAtmospheric: {
        name: "Large Atmospheric Thruster",
        weight: 32970,
        thrust: 6480000,
        power: 16800000, // 16.8 MW = 16800000 W
        fuel: null,
        imagefile: 'large_atmospheric_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0,
            maxEfficiency: 1
        },
        spaceEfficiency: 0,
        powerToThrustRatio: 16800000 / 6480000 // ≈2.59 W/N
    },
    smallAtmospheric: {
        name: "Small Atmospheric Thruster",
        weight: 4000,
        thrust: 648000,
        power: 2400000, // 2.4 MW = 2400000 W
        fuel: null,
        imagefile: 'atmospheric_thruster.png',
        efficiency: 1,
        atmosphere: {
            minEfficiency: 0,
            maxEfficiency: 1
        },
        spaceEfficiency: 0,
        powerToThrustRatio: 2400000 / 648000 // ≈3.70 W/N
    }
};

export const largeShipCargo: Record<string, CargoData> = {
    small: {
        size: 15625,
        mass: 648.4,
        volume: 15625,
        dimensions: "1,1,1"
    },
    large: {
        size: 421875,
        mass: 2593.6,
        volume: 421875,
        dimensions: "3,3,3"
    }
};

export const smallShipCargo: Record<string, CargoData> = {
    small: {
        size: 125,
        mass: 49.2,
        volume: 125,
        dimensions: "1,1,1"
    },
    medium: {
        size: 3375,
        mass: 274.8,
        volume: 3375,
        dimensions: "3,3,3"
    },
    large: {
        size: 15625,
        mass: 626.2,
        volume: 15625,
        dimensions: "5,5,5"
    }
};

export const itemData: Record<string, ItemData> = {
    "DisplayName_Item_StoneOre": {
        name: "Stone",
        type: "Ore",
        subtype: "Stone",
        mass: 1.0,
        volume: 0.37
    },
    // ... autres items ...
    "DisplayName_Item_UraniumIngot": {
        name: "Uranium Ingot",
        type: "Ingot",
        subtype: "Uranium",
        mass: 1.0,
        volume: 0.052
    }
};

export const batteries: Record<string, BatteryData> = {
    smallBattery: {
        name: "Petite Batterie",
        maxStoredPower: 0.05, // 50 kWh
        maxOutput: 0.2, // MW
        weight: 146.4,
        rechargeTime: 30,
        volume: 0.125,
        imagefile: '/assets/blocks/battery/Icon_Block_Small_Battery.webp'
    },
    largeBattery: {
        name: "Grande Batterie",
        maxStoredPower: 3.0, // 3 MWh
        maxOutput: 4.0, // MW
        weight: 1040.4,
        rechargeTime: 30,
        volume: 2.25,
        imagefile: '/assets/blocks/battery/Icon_Block_Big_Battery.webp'
    }
};

export const ores: Record<string, OreData> = {
    iron: {
        name: "Minerai de Fer",
        mass: 7.8,
        volume: 0.37,
        baseValue: 100
    },
    nickel: {
        name: "Minerai de Nickel",
        mass: 8.9,
        volume: 0.37,
        baseValue: 300
    },
    cobalt: {
        name: "Minerai de Cobalt",
        mass: 8.9,
        volume: 0.37,
        baseValue: 500
    },
    silicon: {
        name: "Minerai de Silicium",
        mass: 2.3,
        volume: 0.37,
        baseValue: 100
    },
    silver: {
        name: "Minerai d'Argent",
        mass: 10.5,
        volume: 0.37,
        baseValue: 800
    },
    gold: {
        name: "Minerai d'Or",
        mass: 19.3,
        volume: 0.37,
        baseValue: 1000
    },
    platinum: {
        name: "Minerai de Platine",
        mass: 21.45,
        volume: 0.37,
        baseValue: 1500
    },
    uranium: {
        name: "Minerai d'Uranium",
        mass: 19.1,
        volume: 0.37,
        baseValue: 2000
    },
    ice: {
        name: "Glace",
        mass: 0.92,
        volume: 0.37,
        baseValue: 100
    },
    stone: {
        name: "Pierre",
        mass: 2.6,
        volume: 0.37,
        baseValue: 50
    }
};
