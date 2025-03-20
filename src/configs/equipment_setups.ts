import { Game, ItemData, LocateItemFilters, PingCompensatedCharacter, SlotType, WeaponType } from "alclient";
import { EnsureEquipped, EquipInSlot } from "../strategies/base_attack_strategy";


export const FILTER_HIGHEST: LocateItemFilters = { returnHighestLevel: true };

export const UNEQUIP: EquipInSlot = {
    name: undefined,
    unequip: true
};

export const BLASTER: EnsureEquipped = {
    mainhand: { name: "gstaff", filters: FILTER_HIGHEST },
    offhand: UNEQUIP
};

export const WARRIOR_DPS: EnsureEquipped = {
    mainhand: { name: "fireblade", filters: FILTER_HIGHEST },
    offhand: { name: "fireblade", filters: FILTER_HIGHEST },
    earring1: { name: "molesteeth", filters: FILTER_HIGHEST },
    earring2: { name: "molesteeth", filters: FILTER_HIGHEST }
};

export const WARRIOR_AOE: EnsureEquipped = {
    mainhand: { name: "ololipop", filters: FILTER_HIGHEST },
    offhand: { name: "ololipop", filters: FILTER_HIGHEST },
    earring1: { name: "strearring", filters: FILTER_HIGHEST },
    earring2: { name: "strearring", filters: FILTER_HIGHEST }
};

export const MAGE_FAST: EnsureEquipped = {
    mainhand: { name: "pinkie", filters: FILTER_HIGHEST },
    offhand: { name: "exoarm", filters: FILTER_HIGHEST }
};

export const MAGE_DPS: EnsureEquipped = {
    mainhand: { name: "firestaff", filters: FILTER_HIGHEST },
    offhand: { name: "exoarm", filters: FILTER_HIGHEST }
};

export const MAGE_AOE: EnsureEquipped = BLASTER;

export const PRIEST_TANKY: EnsureEquipped = {
    offhand: { name: "exoarm", filters: FILTER_HIGHEST},
    helmet: { name: "hhelmet", filters: FILTER_HIGHEST},
    chest: { name: "harmor", filters: FILTER_HIGHEST},
    pants: { name: "hpants", filters: FILTER_HIGHEST},
    gloves: { name: "mittens", filters: FILTER_HIGHEST},
    shoes: { name: "wingedboots", filters: FILTER_HIGHEST},
    elixir: { name: "elixirluck", filters: { returnLowestQuantity: true }}
}

export const PRIEST_MF: EnsureEquipped = {
    offhand: { name: "mshield", filters: FILTER_HIGHEST},
    helmet: { name: "wcap", filters: FILTER_HIGHEST},
    chest: { name: "wattire", filters: FILTER_HIGHEST},
    pants: { name: "wbreeches", filters: FILTER_HIGHEST},
    gloves: { name: "wgloves", filters: FILTER_HIGHEST},
    shoes: { name: "wshoes", filters: FILTER_HIGHEST},
    elixir: { name: "elixirluck", filters: { returnLowestQuantity: true }}
};

export const PRIEST_GF: EnsureEquipped = {
    offhand: { name: "mshield", filters: FILTER_HIGHEST},
    helmet: { name: "wcap", filters: FILTER_HIGHEST},
    chest: { name: "wattire", filters: FILTER_HIGHEST},
    pants: { name: "wbreeches", filters: FILTER_HIGHEST},
    gloves: { name: "handofmidas", filters: FILTER_HIGHEST},
    shoes: { name: "wshoes", filters: FILTER_HIGHEST},
    elixir: { name: "elixirluck", filters: { returnLowestQuantity: true }}
};

export function generateEquipmentSetup(bot: PingCompensatedCharacter, override?: EnsureEquipped): EnsureEquipped {
    let ensureEquipped: EnsureEquipped = {};

    for (let currSlot in bot.slots) {
        let slotName: SlotType = (currSlot as SlotType);
        let slotInfo: ItemData = bot.slots[slotName];

        if (!slotInfo || slotName.startsWith("trade")) continue;
        let equipInSlot: EquipInSlot = { name: slotInfo.name, filters: FILTER_HIGHEST };
        ensureEquipped[slotName] = equipInSlot;
    }

    if (override) {
        for (let overrideSlot in override) {
            let slotName: SlotType = (overrideSlot as SlotType);
            let equipItem: EquipInSlot = override[slotName];

            // Unequip this slot
            if (equipItem.unequip) {
                ensureEquipped[slotName] = equipItem;
                continue;
            }
            
            // Dont have this item
            if (!bot.isEquipped(equipItem.name) && !bot.hasItem(equipItem.name, bot.items, equipItem.filters)) continue;

            ensureEquipped[slotName] = equipItem;
        }
    }

    // Swap slots if something is wrong
    for (let [slot1, slot2] of [["earring1", "earring2"], ["ring1", "ring2"], ["mainhand", "offhand"]]) {
        let slot1Current: ItemData = bot.slots[slot1];
        let slot2Current: ItemData = bot.slots[slot2];

        let slot1ToEquip: EquipInSlot = ensureEquipped[slot1];
        let slot2ToEquip: EquipInSlot = ensureEquipped[slot2];

        // Swap slots
        if (slot1Current && slot2Current
            && slot1ToEquip && slot2ToEquip
            && slot1ToEquip.name !== slot2ToEquip.name
            && slot1Current.name === slot2ToEquip.name
            && slot2Current.name === slot1ToEquip.name
        ) {
            let temp = ensureEquipped[slot1];
            ensureEquipped[slot1] = ensureEquipped[slot2];
            ensureEquipped[slot2] = temp;
        }
    }

    // Double hand logic
    let equippableDoublehand: WeaponType[] = Object.keys(Game.G.classes[bot.ctype].doublehand) as WeaponType[];
    if (ensureEquipped["mainhand"]) {
        let mainhandType = Game.G.items[ensureEquipped["mainhand"].name].wtype;
        if (equippableDoublehand.includes(mainhandType)) ensureEquipped["offhand"] = UNEQUIP;
    }

    return ensureEquipped;
}