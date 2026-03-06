// mods.js
// Centralized modifier logic for SoundSpace-V2

// Load saved modifiers from localStorage
export function loadModifiers() {
    return JSON.parse(localStorage.getItem("modifiers") || "{}");
}

// Save modifiers back to storage
export function saveModifiers(mods) {
    localStorage.setItem("modifiers", JSON.stringify(mods));
}

// Apply modifiers to the game state
// gameState = { hitWindow, noteSpeed, health, maxHealth, failOnMiss, botEnabled, coinGain }
export function applyMods(gameState, mods) {

    // ------------------------------
    // EASY (EZ)
    // ------------------------------
    if (mods.Easy) {
        gameState.hitWindow *= 1.5;     // easier timing
        gameState.noteSpeed *= 0.9;     // slower notes
    }

    // ------------------------------
    // HARDROCK (HR)
    // ------------------------------
    if (mods.HardRock) {
        gameState.hitWindow *= 0.75;    // tighter timing
        gameState.noteSpeed *= 1.15;    // faster notes
    }

    // ------------------------------
    // SUDDEN DEATH (SD)
    // ------------------------------
    if (mods.SuddenDeath) {
        gameState.failOnMiss = true;    // 1 miss = fail
    }

    // ------------------------------
    // PERFECT (PF)
    // ------------------------------
    if (mods.Perfect) {
        gameState.failOnMiss = true;    // same as SD
        gameState.onlyPerfect = true;   // anything below perfect = fail
    }

    // ------------------------------
    // HIDDEN (HD)
    // ------------------------------
    if (mods.Hidden) {
        gameState.hidden = true;        // notes fade out early
    }

    // ------------------------------
    // BOT (AP)
    // ------------------------------
    if (mods.Bot) {
        gameState.botEnabled = true;
        gameState.coinGain = 0;         // bot NEVER earns coins
    }

    return gameState;
}
