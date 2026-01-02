import { Game, ItemData, LocateItemFilters, PingCompensatedCharacter, SlotType, WeaponType } from "alclient";
import { EquipmentSet, EquipInSlot } from "../strategies/base_attack_strategy";


export const FILTER_HIGHEST: LocateItemFilters = { returnHighestLevel: true };

export const UNEQUIP: EquipInSlot = {
    name: undefined,
    unequip: true
};

export const WARRIOR_DPS: EquipmentSet = {
    mainhand: { name: "fireblade", filters: FILTER_HIGHEST },
    offhand: { name: "fireblade", filters: FILTER_HIGHEST }
};

export const WARRIOR_AOE: EquipmentSet = {
    mainhand: { name: "ololipop", filters: FILTER_HIGHEST },
    offhand: { name: "ololipop", filters: FILTER_HIGHEST }
};

export const MAGE_FAST: EquipmentSet = {
    mainhand: { name: "pinkie", filters: FILTER_HIGHEST },
    offhand: { name: "exoarm", filters: FILTER_HIGHEST }
};

export const MAGE_DPS: EquipmentSet = {
    mainhand: { name: "firestaff", filters: FILTER_HIGHEST },
    offhand: { name: "exoarm", filters: FILTER_HIGHEST }
};

export const MAGE_AOE: EquipmentSet = {
    mainhand: { name: "gstaff", filters: FILTER_HIGHEST },
    offhand: UNEQUIP
};

export const PRIEST_TANKY: EquipmentSet = {
    offhand: { name: "exoarm", filters: FILTER_HIGHEST},
    helmet: { name: "hhelmet", filters: FILTER_HIGHEST},
    chest: { name: "harmor", filters: FILTER_HIGHEST},
    pants: { name: "hpants", filters: FILTER_HIGHEST},
    gloves: { name: "mittens", filters: FILTER_HIGHEST},
    shoes: { name: "wingedboots", filters: FILTER_HIGHEST},
    elixir: { name: "elixirluck", filters: { returnLowestQuantity: true }}
};

export const PRIEST_MF: EquipmentSet = {
    offhand: { name: "mshield", filters: FILTER_HIGHEST},
    helmet: { name: "wcap", filters: FILTER_HIGHEST},
    chest: { name: "wattire", filters: FILTER_HIGHEST},
    pants: { name: "wbreeches", filters: FILTER_HIGHEST},
    gloves: { name: "wgloves", filters: FILTER_HIGHEST},
    shoes: { name: "wshoes", filters: FILTER_HIGHEST},
    elixir: { name: "elixirluck", filters: { returnLowestQuantity: true }}
};

export const PRIEST_GF: EquipmentSet = {
    offhand: { name: "mshield", filters: FILTER_HIGHEST},
    helmet: { name: "wcap", filters: FILTER_HIGHEST},
    chest: { name: "wattire", filters: FILTER_HIGHEST},
    pants: { name: "wbreeches", filters: FILTER_HIGHEST},
    gloves: { name: "handofmidas", filters: FILTER_HIGHEST},
    shoes: { name: "wshoes", filters: FILTER_HIGHEST},
    elixir: { name: "elixirluck", filters: { returnLowestQuantity: true }}
};

export function generateEquipmentSetup(bot: PingCompensatedCharacter, override?: EquipmentSet): EquipmentSet {
    let currentSet: EquipmentSet = {};

    for (let currSlot in bot.slots) {
        let slotName: SlotType = (currSlot as SlotType);
        let slotInfo: ItemData = bot.slots[slotName];

        if (!slotInfo || slotName.startsWith("trade")) continue;
        let equipInSlot: EquipInSlot = { name: slotInfo.name, filters: FILTER_HIGHEST };
        currentSet[slotName] = equipInSlot;
    }

    if (override) {
        for (let overrideSlot in override) {
            let slotName: SlotType = (overrideSlot as SlotType);
            let equipItem: EquipInSlot = override[slotName];

            // Unequip this slot
            if (equipItem.unequip) {
                currentSet[slotName] = equipItem;
                continue;
            }
            
            // Dont have this item
            if (!bot.isEquipped(equipItem.name) && !bot.hasItem(equipItem.name, bot.items, equipItem.filters)) continue;

            currentSet[slotName] = equipItem;
        }
    }

    // Swap slots if something is wrong
    for (let [slot1, slot2] of [["earring1", "earring2"], ["ring1", "ring2"], ["mainhand", "offhand"]]) {
        let slot1Current: ItemData = bot.slots[slot1];
        let slot2Current: ItemData = bot.slots[slot2];

        let slot1ToEquip: EquipInSlot = currentSet[slot1];
        let slot2ToEquip: EquipInSlot = currentSet[slot2];

        // Swap slots
        if (slot1Current && slot2Current
            && slot1ToEquip && slot2ToEquip
            && slot1ToEquip.name !== slot2ToEquip.name
            && slot1Current.name === slot2ToEquip.name
            && slot2Current.name === slot1ToEquip.name
        ) {
            let temp = currentSet[slot1];
            currentSet[slot1] = currentSet[slot2];
            currentSet[slot2] = temp;
        }
    }

    // Double hand logic
    let equippableDoublehand: WeaponType[] = Object.keys(Game.G.classes[bot.ctype].doublehand) as WeaponType[];
    if (currentSet["mainhand"]) {
        let mainhandType = Game.G.items[currentSet["mainhand"].name].wtype;
        if (equippableDoublehand.includes(mainhandType)) currentSet["offhand"] = UNEQUIP;
    }

    return currentSet;
};