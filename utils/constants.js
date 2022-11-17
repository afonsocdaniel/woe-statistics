const JOB = {
    HIGH_PRIEST: 4009,
    HIGH_WIZARD: 4010,
    SNIPER: 4012,
    PALADIN: 4015,
    PROFESSOR: 4017,
    CREATOR:  4019,     
    GYPSY:  4021,     
}

const SKILL = {
    //HIGH WIZARD
    METEOR_STORM: 83,
    //SNIPER
    SHARPSHOOT: 382,
    //CREATOR
    ACID_DEMOSTRATION: 490,
    SLIM_POTION_PITCHER: 478,
    //PALADIN
    SACRIFICE: 255,
    PROVOKE: 6,
    ENDURE: 8,
    PROVIDENCE: 256,
    PRESSURE: 367,
    //PROFESSOR
    DISPEL: 289,
    MIND_BREAKER: 402,
    FIBER_LOCK: 405,
    LAND_PROTECTOR: 288,
    //HP
    BLESSING: 34,
    AGI: 29,
    RECOVERY: 72,
    LEX_AETHERNA: 78,
    PNEUMA: 25,
    SUFFRAGIUM: 67,
    IMPOSITIO: 66,
    GLORIA: 88,
}

const rankURL = "https://playxro.net/rankings/woe?page=";
const playerURL = "https://playxro.net/rankings/woe-profile/";
const prefix = "!";

exports.JOB = JOB;
exports.SKILL = SKILL;
exports.rankURL = rankURL;
exports.playerURL = playerURL;
exports.prefix = prefix;