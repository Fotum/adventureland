const LOG_COLORS = {
    blue: "#2b97ff",
    red: "#cf5b5b"
};

const MY_CHARACTERS = ["Shalfey", "Nlami", "MagicFotum", "Momental"];

const BASE = {
    h: 8,
    v: 7,
    vn: 2
};

const DEFAULT_FARM_OPTIONS = {
    fast_spot: {
        Shalfey: {
            healer: null,
            looter: "Nlami",
            do_circle: true,
            use_taunt: false,
            use_agitate: true,
            use_cleave: true,
            use_explosion: true
        },
        Nlami: {
            looter: "Nlami",
            use_curse: false,
            use_mass_heal: true
        },
        MagicFotum: {
            looter: "Nlami",
            use_burst: true,
            energize: true,
            alter_weapon: true
        }
    },
    hard_spot: {
        Shalfey: {
            healer: "Nlami",
            looter: "Nlami",
            do_circle: true,
            use_taunt: true,
            use_agitate: false,
            use_cleave: true,
            use_explosion: true
        },
        Nlami: {
            looter: "Nlami",
            use_curse: true,
            use_mass_heal: true
        },
        MagicFotum: {
            looter: "Nlami",
            use_burst: false,
            energize: true,
            alter_weapon: false
        }
    }
};

const FARM_AREAS = {
    cave_first: {
        farm_area: {
            name: "cave_first",
            area: {x: 70, y: -1300, d: 550},
            position: {x: 377, y: -1075, map: "cave"},
            farm_monsters: ["bat"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: {
                healer: null,
                looter: "Nlami",
                do_circle: true,
                use_taunt: true,
                use_agitate: true,
                use_cleave: true,
                use_explosion: true
            },
            Nlami: DEFAULT_FARM_OPTIONS.hard_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: {x: 331, y: -831, map: "cave"}
            }
        }
    },
    cave_second: {
        farm_area: {
            name: "cave_second",
            area: {x: 1282, y: -19, d: 300},
            position: {x: 1282, y: -19, map: "cave"},
            farm_monsters: ["bat"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: {
                healer: null,
                looter: "Nlami",
                do_circle: true,
                use_taunt: true,
                use_agitate: true,
                use_cleave: true,
                use_explosion: true
            },
            Nlami: DEFAULT_FARM_OPTIONS.hard_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    stoneworm: {
        farm_area: {
            name: "stoneworm",
            area: {x: 860, y: -14, d: 250},
            position: {x: 795, y: -41, map: "spookytown"},
            farm_monsters: ["stoneworm"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: {
                healer: null,
                looter: "Nlami",
                do_circle: true,
                use_taunt: true,
                use_agitate: true,
                use_cleave: true,
                use_explosion: true
            },
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    booboo: {
        farm_area: {
            name: "booboo",
            area: {x: 400, y: -700, d: 200},
            position: {x: 155, y: -556, map: "spookytown"},
            farm_monsters: ["booboo"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.hard_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    bees: {
        farm_area: {
            name: "bees",
            area: {x: 547, y: 1064, d: 150},
            position: {x: 547, y: 1064, map: "main"},
            farm_monsters: ["bee"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    crabs: {
        farm_area: {
            name: "crabs",
            area: {x: -1202, y: -66, d: 200},
            position: {x: -1202, y: -66, map: "main"},
            farm_monsters: ["crab"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    crabxs: {
        farm_area: {
            name: "crabxs",
            area: {x: -964, y: 1788, d: 250},
            position: {x: -964, y: 1788, map: "main"},
            farm_monsters: ["crabx"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    squigs: {
        farm_area: {
            name: "squigs",
            area: {x: -1150, y: 424, d: 300},
            position: {x: -1150, y: 424, map: "main"},
            farm_monsters: ["squig", "squigtoad", "frog"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    tortoise: {
        farm_area: {
            name: "tortoise",
            area: {x: -1105, y: 1138, d: 370},
            position: {x: -1105, y: 1138, map: "main"},
            farm_monsters: ["tortoise", "frog"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    croc: {
        farm_area: {
            name: "croc",
            area: {x: 780, y: 1714, d: 300},
            position: {x: 798, y: 1576, map: "main"},
            farm_monsters: ["croc"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    armadillo: {
        farm_area: {
            name: "armadillo",
            area: {x: 506, y: 1817, d: 200},
            position: {x: 506, y: 1817, map: "main"},
            farm_monsters: ["armadillo"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: {
                healer: "Nlami",
                looter: "Nlami",
                do_circle: true,
                use_taunt: false,
                use_agitate: true,
                use_cleave: true,
                use_explosion: true
            },
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    rats: {
        farm_area: {
            name: "rats",
            area: {x: -5, y: -173, d: 200},
            position: {x: -5, y: -173, map: "mansion"},
            farm_monsters: ["rat"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    moles: {
        farm_area: {
            name: "moles",
            area: {x: 0, y: -350, d: 350},
            position: {x: -1, y: -63, map: "tunnel"},
            farm_monsters: ["mole"],
            blacklist_monsters: ["wabbit"]
        },
        farm_options: {
            Shalfey: {
                healer: "Nlami",
                looter: "Nlami",
                do_circle: true,
                use_taunt: true,
                use_agitate: true,
                use_cleave: true,
                use_explosion: true
            },
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: {x: 242, y: -21, map: "tunnel"}
            }
        }
    },
    porcupine: {
        farm_area: {
            name: "porcupine",
            area: {x: -819, y: 179, d: 200},
            position: {x: -819, y: 179, map: "desertland"},
            farm_monsters: ["porcupine"],
            blacklist_monsters: ["plantoid"]
        },
        farm_options: {
            Shalfey: {
                healer: "Nlami",
                looter: "Nlami",
                do_circle: true,
                use_taunt: true,
                use_agitate: false,
                use_cleave: false,
                use_explosion: false
            },
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: {x: -585, y: 320, map: "desertland"}
            }
        }
    },
    goos: {
        farm_area: {
            name: "goos",
            area: {x: -62, y: 789, d: 250},
            position: {x: -62, y: 789, map: "main"},
            farm_monsters: ["goo"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: {x: -1, y: 648, map: "main"}
            }
        }
    },
    snakes: {
        farm_area: {
            name: "snakes",
            area: {x: -62, y: 1895, d: 200},
            position: {x: -62, y: 1895, map: "main"},
            farm_monsters: ["snake"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: {x: -234, y: 1751, map: "main"}
            }
        }
    },
    cgoo: {
        farm_area: {
            name: "cgoo",
            area: {x: 136, y: -126, d: 9999},
            position: {x: 136, y: -126, map: "arena"},
            farm_monsters: ["cgoo"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    iceroamer: {
        farm_area: {
            name: "iceroamer",
            area: {x: 863, y: -47, d: 370},
            position: {x: 534, y: 14, map: "winterland"},
            farm_monsters: ["iceroamer"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: null
            }
        }
    },
    osnake: {
        farm_area: {
            name: "osnake",
            area: {x: -530, y: -508, d: 300},
            position: {x: -519, y: -234, map: "halloween"},
            farm_monsters: ["osnake"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: {x: -519, y: -234, map: "halloween"}
            }
        }
    },
    minimush: {
        farm_area: {
            name: "minimush",
            area: {x: 19, y: 636, d: 300},
            position: {x: 14, y: 414, map: "halloween"},
            farm_monsters: ["minimush"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: DEFAULT_FARM_OPTIONS.fast_spot["Shalfey"],
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.fast_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: {x: 14, y: 414, map: "halloween"}
            }
        }
    },
    bigbird: {
        farm_area: {
            name: "bigbird",
            area: {x: 1345, y: 309, d: 250},
            position: {x: 1241, y: 457, map: "main"},
            farm_monsters: ["bigbird"],
            blacklist_monsters: []
        },
        farm_options: {
            Shalfey: {
                healer: "Nlami",
                looter: "Nlami",
                do_circle: true,
                use_taunt: true,
                use_agitate: true,
                use_cleave: true,
                use_explosion: true
            },
            Nlami: DEFAULT_FARM_OPTIONS.fast_spot["Nlami"],
            MagicFotum: DEFAULT_FARM_OPTIONS.hard_spot["MagicFotum"],
            Momental: {
                looter: "Nlami",
                position: {x: 1378, y: 418, map: "main"}
            }
        }
    }
};

const FARM_BOSSES = [
    "mvampire",
    "fvampire",
    "phoenix",
    "snowman",
    "goldenbat",
    "cutebee",
    "grinch",
    "dragold",
    "franky",
    "icegolem",
    // "crabxx",
    "jr",
    "greenjr",
    "pinkgoo",
    "bgoo",
    // "wabbit",

    // Crypt bosses
    "a7",
    "a3"
];

const BOSS_INFO = {
    // Global bosses
    global: {
        dragold: {
            id: -1,
            name: "dragold",
            targets: ["dragold"],
            wait_resp: false,
            summon: true,
            destination: {
                map: "cave",
                x: 1060,
                y: -746
            },
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: "Nlami",
                    do_circle: false,
                    use_taunt: false,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    looter: character.name,
                    do_circle: true,
                    use_curse: false,
                    use_mass_heal: true
                }
            },
            is_active: true
        },
        snowman: {
            id: -2,
            name: "snowman",
            targets: ["snowman"],
            wait_resp: false,
            summon: true,
            destination: {
                map: "winterland",
                x: 1220,
                y: -936
            },
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: null,
                    do_circle: false,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    looter: character.name,
                    do_circle: true,
                    use_curse: false,
                    use_mass_heal: true
                },
                MagicFotum: {
                    looter: character.name,
                    do_circle: true,
                    use_burst: false,
                    energize: true,
                    alter_weapon: true
                }
            },
            is_active: true
        },
        goobrawl: {
            id: -3,
            name: "goobrawl",
            targets: ["pinkgoo", "bgoo", "rgoo"],
            wait_resp: true,
            summon: false,
            destination: {to: "goobrawl"},
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: null,
                    do_circle: true,
                    use_taunt: true,
                    use_agitate: true,
                    use_cleave: true,
                    use_explosion: true
                },
                Nlami: {
                    looter: character.name,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    looter: character.name,
                    do_circle: true,
                    use_burst: false,
                    energize: true
                }
            },
            is_active: true
        },
        icegolem: {
            id: -4,
            name: "icegolem",
            targets: ["icegolem"],
            wait_resp: false,
            summon: false,
            destination: {to: "icegolem"},
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: null,
                    do_circle: false,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    looter: character.name,
                    do_circle: false,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    looter: character.name,
                    do_circle: false,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        }
    },

    // Field bosses
    field: {
        phoenix: {
            name: "phoenix",
            targets: ["phoenix", "frog"],
            last_check: null,
            respawn: 35,
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: null,
                    do_circle: false,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    looter: character.name,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    looter: character.name,
                    do_circle: true,
                    use_burst: false,
                    energize: true
                }
            },
            is_active: true
        },
        fvampire: {
            name: "fvampire",
            targets: ["fvampire"],
            last_check: null,
            respawn: 1440,
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: "Nlami",
                    do_circle: false,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    looter: character.name,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    looter: character.name,
                    do_circle: true,
                    use_burst: false,
                    energize: true
                }
            },
            is_active: true
        },
        mvampire: {
            name: "mvampire",
            targets: ["mvampire"],
            last_check: null,
            respawn: 1080,
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: null,
                    do_circle: false,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    looter: character.name,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    looter: character.name,
                    do_circle: true,
                    use_burst: false,
                    energize: true
                }
            },
            is_active: true
        },
        jr: {
            name: "jr",
            targets: ["jr"],
            last_check: null,
            respawn: 25920,
            characters: {
                MagicFotum: {
                    looter: character.name,
                    do_circle: true,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        },
        greenjr: {
            name: "greenjr",
            targets: ["greenjr"],
            last_check: null,
            respawn: 51840,
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: null,
                    do_circle: false,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    looter: character.name,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    looter: character.name,
                    do_circle: true,
                    use_burst: false,
                    energize: true
                }
            },
            is_active: true
        },
        skeletor: {
            name: "skeletor",
            targets: ["skeletor"],
            last_check: null,
            respawn: 960,
            characters: {
                Shalfey: {
                    looter: character.name,
                    healer: "Nlami",
                    do_circle: false,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    looter: character.name,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    looter: character.name,
                    do_circle: true,
                    use_burst: false,
                    energize: true
                }
            },
            is_active: true
        }
    }
};

const MONSTERHUNT_NPC_LOC = {x: 126, y: -413, map: "main"};
const MONSTERHUNT_AREAS = {
    porcupine: {
        spot: FARM_AREAS.porcupine,
        characters: ["MagicFotum"]
    },
    bee: {
        spot: FARM_AREAS.bees,
        characters: ["MagicFotum"]
    },
    goo: {
        spot: FARM_AREAS.goos,
        characters: ["MagicFotum"]
    },
    snake: {
        spot: FARM_AREAS.snakes,
        characters: ["MagicFotum"]
    },
    crab: {
        spot: FARM_AREAS.crabs,
        characters: ["MagicFotum"]
    },
    rat: {
        spot: FARM_AREAS.rats,
        characters: ["MagicFotum"]
    },
    squig: {
        spot: FARM_AREAS.squigs,
        characters: ["MagicFotum"]
    },
    // cgoo: {
    //     spot: FARM_AREAS.cgoo,
    //     characters: ["MagicFotum"]
    // },
    // stoneworm: {
    //     spot: FARM_AREAS.stoneworm,
    //     characters: ["MagicFotum"]
    // },
    crabx: {
        spot: FARM_AREAS.crabxs,
        characters: ["MagicFotum"]
    },
    osnake: {
        spot: FARM_AREAS.osnake,
        characters: ["MagicFotum"]
    },
    minimush: {
        spot: FARM_AREAS.minimush,
        characters: ["MagicFotum"]
    },
    bat: {
        spot: FARM_AREAS.cave_first,
        characters: ["MagicFotum"]
    }
    // iceroamer: {
    //     spot: FARM_AREAS.iceroamer,
    //     characters: ["MagicFotum"]
    // }
};

const BOSS_CHECK_ROUTE = [
    {name: "phoenix", map: "main", x: -1184,  y: 781}, // Beach
    {name: "phoenix", map: "main", x: 641,  y: 1803},  // Tunnel
    {name: "phoenix", map: "main", x: 1188,  y: -193}, // Scorps
    {name: "phoenix", map: "halloween", x: 8,  y: 631},
    {name: "greenjr", map: "halloween", x: -569,  y: -512},
    {name: "fvampire", map: "halloween", x: -406,  y: -1643},
    {name: "phoenix", map: "cave", x: -181,  y: -1164},
    {name: "mvampire", map: "cave", x: -181,  y: -1164},
    // {name: "mvampire", map: "cave", x: -191,  y: -1177}
    {name: "mvampire", map: "cave", x: 1244,  y: -23},
    {name: "jr", map: "spookytown", x: -784,  y: -301},
    {name: "skeletor", map: "arena", x: 191, y: -348}
];