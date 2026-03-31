import { useState, useEffect, useRef, useCallback } from "react";

// Mulberry32 PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str, salt = "friend-2026-401") {
  const input = str + salt;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash;
}

const SPECIES = [
  { name: "duck", cn: "鸭鸭" },
  { name: "goose", cn: "大鹅" },
  { name: "blob", cn: "软泥怪" },
  { name: "cat", cn: "猫咪" },
  { name: "dragon", cn: "龙" },
  { name: "octopus", cn: "章鱼" },
  { name: "owl", cn: "猫头鹰" },
  { name: "penguin", cn: "企鹅" },
  { name: "turtle", cn: "龟龟" },
  { name: "snail", cn: "蜗牛" },
  { name: "ghost", cn: "幽灵" },
  { name: "axolotl", cn: "六角恐龙" },
  { name: "capybara", cn: "水豚" },
  { name: "cactus", cn: "仙人掌" },
  { name: "robot", cn: "机器人" },
  { name: "rabbit", cn: "兔兔" },
  { name: "mushroom", cn: "蘑菇" },
  { name: "chonk", cn: "胖墩" },
];

const RARITY = [
  { name: "Common", weight: 0.6, cn: "普通", color: "#9ca3af", glow: "none" },
  { name: "Uncommon", weight: 0.25, cn: "稀有", color: "#22c55e", glow: "0 0 12px rgba(34,197,94,0.4)" },
  { name: "Rare", weight: 0.1, cn: "珍稀", color: "#3b82f6", glow: "0 0 16px rgba(59,130,246,0.5)" },
  { name: "Epic", weight: 0.04, cn: "史诗", color: "#a855f7", glow: "0 0 20px rgba(168,85,247,0.6)" },
  { name: "Legendary", weight: 0.01, cn: "传说", color: "#f59e0b", glow: "0 0 24px rgba(245,158,11,0.7)" },
];

const SHINY_CHANCE = 0.01;
const STATS = ["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"];
const STAT_CN = { DEBUGGING: "调试", PATIENCE: "耐心", CHAOS: "混沌", WISDOM: "智慧", SNARK: "毒舌" };
const STAT_EMOJI = { DEBUGGING: "🔧", PATIENCE: "⏳", CHAOS: "🌀", WISDOM: "📖", SNARK: "😏" };

const HATS = [
  { name: "crown", cn: "皇冠" },
  { name: "tophat", cn: "高帽" },
  { name: "propeller", cn: "螺旋帽" },
  { name: "halo", cn: "光环" },
  { name: "wizard", cn: "巫师帽" },
  { name: "beanie", cn: "毛线帽" },
  { name: "tinyduck", cn: "小鸭帽" },
  { name: "none", cn: "无" },
];

const EYE_TYPES = ["dot", "round", "star", "x", "big", "at", "circle"];

function generateBuddy(userId) {
  const seed = hashString(userId);
  const rng = mulberry32(seed);
  const speciesIndex = Math.floor(rng() * SPECIES.length);
  const species = SPECIES[speciesIndex];
  const rarityRoll = rng();
  let cumulative = 0;
  let rarity = RARITY[0];
  for (const r of RARITY) {
    cumulative += r.weight;
    if (rarityRoll < cumulative) { rarity = r; break; }
  }
  const isShiny = rng() < SHINY_CHANCE;
  const stats = {};
  for (const s of STATS) stats[s] = Math.floor(rng() * 20) + 1;
  const hatRoll = rng();
  const hat = hatRoll < 0.7 ? HATS[HATS.length - 1] : HATS[Math.floor(rng() * (HATS.length - 1))];
  const eyeIndex = Math.floor(rng() * EYE_TYPES.length);
  const eyes = EYE_TYPES[eyeIndex];
  return { species, rarity, isShiny, stats, hat, eyes };
}

// ===== PIXEL ART SPRITE DEFINITIONS =====
// Each sprite is a 16x16 grid, values map to palette indices
const PALETTES = {
  duck: { body: "#f6d44e", dark: "#d4a017", light: "#fff7b0", beak: "#e8760a", eye: "#1a1a2e", blush: "#f4a0a0", feet: "#e8760a" },
  goose: { body: "#f0ece4", dark: "#c4bfb3", light: "#ffffff", beak: "#e8760a", eye: "#1a1a2e", blush: "#f4a0a0", feet: "#e8760a" },
  blob: { body: "#7cdf64", dark: "#4ba83d", light: "#b8f5a0", beak: "#4ba83d", eye: "#1a1a2e", blush: "#f4a0a0", feet: "#4ba83d" },
  cat: { body: "#f5a623", dark: "#d4820a", light: "#ffd580", beak: "#ffb6c1", eye: "#1a1a2e", blush: "#f4a0a0", feet: "#d4820a" },
  dragon: { body: "#6366f1", dark: "#4338ca", light: "#a5b4fc", beak: "#f59e0b", eye: "#fbbf24", blush: "#c084fc", feet: "#4338ca" },
  octopus: { body: "#ec4899", dark: "#be185d", light: "#f9a8d4", beak: "#be185d", eye: "#1a1a2e", blush: "#fda4af", feet: "#be185d" },
  owl: { body: "#92683a", dark: "#6b4423", light: "#c9a96e", beak: "#f5a623", eye: "#fbbf24", blush: "#e8b4a0", feet: "#6b4423" },
  penguin: { body: "#1e293b", dark: "#0f172a", light: "#f8fafc", beak: "#f59e0b", eye: "#1a1a2e", blush: "#f4a0a0", feet: "#f59e0b" },
  turtle: { body: "#22c55e", dark: "#15803d", light: "#86efac", beak: "#15803d", eye: "#1a1a2e", blush: "#fda4af", feet: "#92683a" },
  snail: { body: "#c084fc", dark: "#7e22ce", light: "#e9d5ff", beak: "#7e22ce", eye: "#1a1a2e", blush: "#fda4af", feet: "#a855f7" },
  ghost: { body: "#e2e8f0", dark: "#94a3b8", light: "#ffffff", beak: "#94a3b8", eye: "#1a1a2e", blush: "#c7d2fe", feet: "#cbd5e1" },
  axolotl: { body: "#fda4af", dark: "#e11d48", light: "#ffe4e6", beak: "#e11d48", eye: "#1a1a2e", blush: "#fb7185", feet: "#fda4af" },
  capybara: { body: "#a0845c", dark: "#78633a", light: "#c9b896", beak: "#1a1a2e", eye: "#1a1a2e", blush: "#e8b4a0", feet: "#78633a" },
  cactus: { body: "#22c55e", dark: "#15803d", light: "#86efac", beak: "#15803d", eye: "#1a1a2e", blush: "#fda4af", feet: "#92683a" },
  robot: { body: "#94a3b8", dark: "#64748b", light: "#e2e8f0", beak: "#3b82f6", eye: "#ef4444", blush: "#60a5fa", feet: "#64748b" },
  rabbit: { body: "#fce7f3", dark: "#f9a8d4", light: "#ffffff", beak: "#f9a8d4", eye: "#1a1a2e", blush: "#fda4af", feet: "#f9a8d4" },
  mushroom: { body: "#ef4444", dark: "#b91c1c", light: "#fca5a5", beak: "#f5f5dc", eye: "#1a1a2e", blush: "#fda4af", feet: "#f5f5dc" },
  chonk: { body: "#d4a574", dark: "#a0845c", light: "#f0dcc0", beak: "#1a1a2e", eye: "#1a1a2e", blush: "#f4a0a0", feet: "#a0845c" },
};

// Sprite data: 0=transparent, 1=body, 2=dark, 3=light, 4=beak/accent, 5=eye, 6=blush
const SPRITES = {
  duck: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,3,3,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,3,3,3,3,1,1,0,0,0,0,0],
    [0,0,0,1,5,3,3,6,3,3,1,0,0,0,0,0],
    [0,0,0,1,1,3,3,3,3,1,1,4,4,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,4,4,4,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,1,1,1,3,1,1,1,1,3,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,4,4,0,0,4,4,0,0,0,0,0,0],
    [0,0,0,0,4,4,0,0,4,4,0,0,0,0,0,0],
  ],
  cat: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,1,2,1,0,0,0,0,1,2,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,1,1,3,3,1,1,1,3,3,1,1,1,0,0,0],
    [0,1,5,3,5,1,3,1,5,3,5,1,1,0,0,0],
    [0,1,1,3,1,6,1,6,1,3,1,1,0,0,0,0],
    [0,0,1,1,1,4,4,4,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,1,1,3,1,1,1,1,1,3,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,2,1,0,1,2,1,0,0,0,0,0,0],
    [0,0,0,1,2,1,0,1,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  dragon: [
    [0,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0],
    [0,0,0,0,1,4,1,1,4,1,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,3,3,1,1,3,3,1,1,0,0,0,0],
    [0,0,1,5,3,5,1,1,5,3,5,1,0,0,0,0],
    [0,0,1,1,3,1,1,1,1,3,1,1,0,0,0,0],
    [0,0,0,1,1,1,4,4,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,2,0,1,3,1,1,1,1,3,1,0,2,0,0,0],
    [0,2,2,1,1,1,1,1,1,1,1,2,2,0,0,0],
    [0,0,2,1,1,1,1,1,1,1,1,2,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,2,1,0,0,1,2,0,0,0,0,0,0],
    [0,0,0,0,2,2,0,0,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  ghost: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,3,3,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,3,3,3,3,1,1,0,0,0,0,0],
    [0,0,1,1,3,3,3,3,3,3,1,1,0,0,0,0],
    [0,0,1,5,3,5,3,5,3,5,3,1,0,0,0,0],
    [0,0,1,1,3,1,3,1,3,1,3,1,0,0,0,0],
    [0,0,1,3,3,3,3,3,3,3,3,1,0,0,0,0],
    [0,0,1,3,3,3,4,4,3,3,3,1,0,0,0,0],
    [0,0,1,1,3,3,3,3,3,3,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,1,0,1,1,0,0,1,1,0,1,0,0,0,0],
    [0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  octopus: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,5,3,1,1,5,3,1,1,0,0,0,0],
    [0,0,1,1,1,1,6,6,1,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,4,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,1,2,1,2,1,1,1,1,2,1,2,1,0,0,0],
    [0,1,0,1,0,1,2,2,1,0,1,0,1,0,0,0],
    [1,0,0,1,0,0,1,1,0,0,1,0,0,1,0,0],
    [1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  penguin: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,3,3,1,1,3,3,1,1,0,0,0,0],
    [0,0,1,5,3,5,1,1,5,3,5,1,0,0,0,0],
    [0,0,1,1,3,1,6,6,1,3,1,1,0,0,0,0],
    [0,0,0,1,1,1,4,4,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,3,3,3,3,1,1,0,0,0,0,0],
    [0,0,1,1,3,3,3,3,3,3,1,1,0,0,0,0],
    [0,0,1,1,3,3,3,3,3,3,1,1,0,0,0,0],
    [0,0,0,1,1,3,3,3,3,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,4,4,0,0,4,4,0,0,0,0,0,0],
    [0,0,0,0,4,4,0,0,4,4,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  rabbit: [
    [0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,1,1,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,3,1,1,3,1,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,3,1,1,3,1,1,0,0,0,0,0],
    [0,0,1,1,5,3,1,1,5,3,1,1,0,0,0,0],
    [0,0,1,1,1,6,1,1,6,1,1,1,0,0,0,0],
    [0,0,0,1,1,4,1,4,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,3,1,1,1,1,3,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,2,1,0,0,1,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  mushroom: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,3,1,1,1,3,1,1,1,0,0,0,0],
    [0,1,1,3,3,1,1,1,3,3,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0],
    [0,0,0,0,4,5,4,4,5,4,0,0,0,0,0,0],
    [0,0,0,0,4,4,6,6,4,4,0,0,0,0,0,0],
    [0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0],
    [0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0],
    [0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  axolotl: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,2,2,0,0,0,0,0,0,0,0,2,2,0,0,0],
    [2,2,0,0,1,1,1,1,1,1,0,0,2,2,0,0],
    [2,0,0,1,1,1,1,1,1,1,1,0,0,2,0,0],
    [0,0,1,1,3,3,1,1,3,3,1,1,0,0,0,0],
    [0,0,1,5,3,5,1,1,5,3,5,1,0,0,0,0],
    [0,0,1,1,3,1,6,6,1,3,1,1,0,0,0,0],
    [0,0,0,1,1,1,4,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,3,1,1,3,1,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,2,1,0,0,1,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  capybara: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,1,1,5,3,1,1,1,5,3,1,1,1,0,0,0],
    [0,1,1,1,1,1,6,6,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,4,4,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,2,2,0,0,0,0,2,2,0,0,0,0,0],
    [0,0,0,2,2,0,0,0,0,2,2,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  chonk: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],
    [0,0,0,1,2,1,1,1,1,2,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,1,1,5,3,1,1,1,5,3,1,1,1,0,0,0],
    [0,1,1,1,1,6,1,6,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,4,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,2,2,2,0,0,2,2,2,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  owl: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,2,1,1,1,1,1,1,2,1,0,0,0,0],
    [0,1,2,1,1,1,1,1,1,1,1,2,1,0,0,0],
    [0,1,1,3,3,1,1,1,3,3,1,1,1,0,0,0],
    [0,1,5,3,5,1,1,1,5,3,5,1,1,0,0,0],
    [0,1,1,3,1,1,1,1,1,3,1,1,1,0,0,0],
    [0,0,1,1,1,1,4,4,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,3,1,1,1,1,3,1,1,0,0,0,0],
    [0,0,1,2,1,1,1,1,1,1,2,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,2,2,0,0,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  turtle: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,1,5,3,1,5,3,0,0,0,0,0,0,0],
    [0,0,0,1,1,6,1,6,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,4,1,0,0,0,0,0,0,0,0],
    [0,0,0,2,2,2,2,2,2,2,0,0,0,0,0,0],
    [0,0,2,1,1,2,1,1,2,1,2,0,0,0,0,0],
    [0,2,1,1,1,1,2,1,1,1,1,2,0,0,0,0],
    [0,2,1,2,1,1,1,1,1,2,1,2,0,0,0,0],
    [0,0,2,1,1,2,1,1,2,1,2,0,0,0,0,0],
    [0,0,0,2,2,2,2,2,2,2,0,0,0,0,0,0],
    [0,0,7,7,0,0,0,0,0,7,7,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  snail: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,5,0,0,5,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,0,2,2,2,2,0,0,0,0,0],
    [0,1,5,3,5,1,2,1,1,1,1,2,0,0,0,0],
    [0,1,1,6,1,1,2,1,2,2,1,2,0,0,0,0],
    [0,1,1,4,1,1,2,1,1,1,1,2,0,0,0,0],
    [0,0,1,1,1,1,1,2,2,2,2,1,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  cactus: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,3,3,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,5,5,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,6,6,1,0,0,0,0,0,0,0],
    [0,0,1,1,0,1,4,1,0,1,1,0,0,0,0,0],
    [0,0,1,3,1,1,1,1,1,3,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,0,1,1,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,2,1,2,0,0,0,0,0,0,0,0],
    [0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  robot: [
    [0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0],
    [0,0,0,1,5,3,2,2,5,3,1,0,0,0,0,0],
    [0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,0],
    [0,0,0,1,2,4,4,4,4,2,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,0],
    [0,0,2,2,1,1,1,1,1,2,2,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,6,1,6,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0],
    [0,0,0,2,2,0,0,0,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  goose: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,3,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,1,3,3,3,1,1,0,0,0,0,0,0],
    [0,0,0,1,5,3,6,3,3,1,4,4,4,0,0,0],
    [0,0,0,1,1,3,3,3,1,4,4,4,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,1,1,3,1,3,1,1,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,4,4,0,4,4,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  blob: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,3,3,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,3,3,3,3,1,1,0,0,0,0,0],
    [0,0,1,1,5,3,3,5,3,3,1,1,0,0,0,0],
    [0,1,1,1,1,3,6,3,6,1,1,1,1,0,0,0],
    [0,1,3,1,1,1,4,1,1,1,1,3,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [1,3,1,1,1,1,1,1,1,1,1,1,3,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// Hat overlays (drawn on top)
const HAT_SPRITES = {
  crown: { color: "#fbbf24", dark: "#d97706", pixels: [[5,0],[6,0],[7,0],[8,0],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1]] },
  tophat: { color: "#1a1a2e", dark: "#0a0a15", pixels: [[5,-2],[6,-2],[7,-2],[8,-2],[4,-1],[5,-1],[6,-1],[7,-1],[8,-1],[9,-1],[5,0],[6,0],[7,0],[8,0],[3,0],[10,0]] },
  wizard: { color: "#6366f1", dark: "#4338ca", pixels: [[6,-3],[7,-3],[5,-2],[6,-2],[7,-2],[8,-2],[5,-1],[6,-1],[7,-1],[8,-1],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0]] },
  halo: { color: "#fde68a", dark: "#fbbf24", pixels: [[5,-2],[6,-2],[7,-2],[8,-2],[4,-1],[9,-1]] },
  propeller: { color: "#ef4444", dark: "#b91c1c", pixels: [[6,-2],[7,-2],[4,-1],[5,-1],[6,-1],[7,-1],[8,-1],[9,-1],[6,0],[7,0]] },
  beanie: { color: "#a855f7", dark: "#7e22ce", pixels: [[6,-1],[7,-1],[5,0],[6,0],[7,0],[8,0],[4,0],[9,0]] },
  tinyduck: { color: "#f6d44e", dark: "#d4a017", pixels: [[6,-2],[7,-2],[5,-1],[6,-1],[7,-1],[8,-1]] },
};

// Draw sprite to canvas
function drawSprite(ctx, spriteData, palette, pixelSize, offsetX, offsetY, hatName, frame) {
  if (!spriteData) return;
  const colorMap = {
    1: palette.body,
    2: palette.dark,
    3: palette.light,
    4: palette.beak,
    5: palette.eye,
    6: palette.blush,
    7: palette.feet || palette.dark,
  };

  // Find topmost pixel row for hat placement
  let topRow = 16;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (spriteData[y][x] !== 0 && y < topRow) topRow = y;
    }
  }

  // Blink effect: occasionally close eyes (frame-based)
  const isBlinking = frame % 40 >= 38;

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const val = spriteData[y][x];
      if (val === 0) continue;
      let color = colorMap[val] || palette.body;
      // Blink: replace eye color with body
      if (val === 5 && isBlinking) color = palette.body;
      ctx.fillStyle = color;
      ctx.fillRect(
        offsetX + x * pixelSize,
        offsetY + y * pixelSize,
        pixelSize,
        pixelSize
      );
    }
  }

  // Draw hat
  if (hatName && hatName !== "none" && HAT_SPRITES[hatName]) {
    const hat = HAT_SPRITES[hatName];
    for (const [hx, hy] of hat.pixels) {
      const drawY = topRow + hy;
      if (drawY < 0) continue;
      ctx.fillStyle = (hy === 0) ? hat.dark : hat.color;
      ctx.fillRect(
        offsetX + hx * pixelSize,
        offsetY + drawY * pixelSize,
        pixelSize,
        pixelSize
      );
    }
  }
}

// Pixel sprite canvas component
const PixelBuddy = ({ species, hat, isShiny, rarity }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const [bobY, setBobY] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 240;
    canvas.width = size;
    canvas.height = size;
    const pixelSize = Math.floor(size / 16);

    let animId;
    const animate = () => {
      frameRef.current++;
      const frame = frameRef.current;

      ctx.clearRect(0, 0, size, size);

      // Idle bob
      const bob = Math.sin(frame * 0.06) * 3;

      // Fidget offset
      const fidgetX = (frame % 120 > 110) ? Math.sin(frame * 0.5) * 1.5 : 0;

      const spriteData = SPRITES[species] || SPRITES.chonk;
      const palette = PALETTES[species] || PALETTES.chonk;

      // Shiny glow
      if (isShiny) {
        const glowIntensity = 0.15 + Math.sin(frame * 0.04) * 0.1;
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 15 + Math.sin(frame * 0.05) * 5;
      } else if (rarity && rarity.name !== "Common") {
        ctx.shadowColor = rarity.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }

      drawSprite(ctx, spriteData, palette, pixelSize, fidgetX, bob, hat, frame);

      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [species, hat, isShiny, rarity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "180px",
        height: "180px",
        imageRendering: "pixelated",
      }}
    />
  );
};

const StatBar = ({ label, value, delay }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth((value / 20) * 100), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
      <span style={{ fontSize: "13px", width: "18px", textAlign: "center" }}>{STAT_EMOJI[label]}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "#8b9eb7",
        width: "30px",
      }}>{STAT_CN[label]}</span>
      <div style={{
        flex: 1,
        height: "6px",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "3px",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${width}%`,
          height: "100%",
          borderRadius: "3px",
          transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
          background: value >= 16 ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
            : value >= 10 ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
            : "linear-gradient(90deg, #6b7280, #9ca3af)",
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        color: value >= 16 ? "#fbbf24" : value >= 10 ? "#60a5fa" : "#6b7280",
        width: "20px",
        textAlign: "right",
        fontWeight: 600,
      }}>{value}</span>
    </div>
  );
};

// Speech bubble
const SpeechBubble = ({ species }) => {
  const [msg, setMsg] = useState("");
  const messages = {
    duck: ["嘎嘎！", "想吃面包...", "水塘在哪？", "嘎？"],
    goose: ["嘎嘎嘎嘎嘎！！", "让开！", "这是我的！", "和平从不是选项"],
    blob: ["......", "zzz", "*缓慢蠕动*", "。"],
    cat: ["...哼", "摸我", "别摸我", "给我罐头"],
    dragon: ["呼...", "今天不烧", "宝藏在哪", "翅膀有点痒"],
    octopus: ["泡泡~", "八只手不够用", "墨汁没了", "游~"],
    owl: ["咕咕", "智慧时间", "你该睡了", "书在哪"],
    penguin: ["好冷好开心", "鱼！", "滑~", "南极想你了"],
    turtle: ["...慢慢来", "不急", "壳好重", "又一百年"],
    snail: ["到了吗...", "还没", "trail~", "黏黏的"],
    ghost: ["嘘...", "BOO!", "穿墙中", "你看不到我"],
    axolotl: ["再生中~", "粉粉的", "嘿嘿", "水好舒服"],
    capybara: ["...", "随便", "都行", "躺平了"],
    cactus: ["别碰我", "渴了", "刺好看吗", "沙漠真热"],
    robot: ["01101", "系统正常", "需要充电", "beep boop"],
    rabbit: ["蹦！", "胡萝卜！", "耳朵痒", "快跑！"],
    mushroom: ["潮湿~", "孢子飘飘", "别踩我", "我有毒吗"],
    chonk: ["肚子饿", "坐下了", "圆是一种美德", "滚过去"],
  };

  useEffect(() => {
    const msgs = messages[species] || messages.chonk;
    setMsg(msgs[0]);
    const interval = setInterval(() => {
      setMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    }, 4000);
    return () => clearInterval(interval);
  }, [species]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      padding: "6px 14px",
      fontFamily: "'Outfit', sans-serif",
      fontSize: "13px",
      color: "#94a3b8",
      marginTop: "4px",
      minHeight: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
    }}>
      💬 {msg}
    </div>
  );
};

export default function BuddyRevealV2() {
  const [userId, setUserId] = useState("");
  const [buddy, setBuddy] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [hatching, setHatching] = useState(false);

  const handleReveal = () => {
    if (!userId.trim()) return;
    setHatching(true);
    setRevealed(false);
    setBuddy(null);
    setTimeout(() => {
      const b = generateBuddy(userId.trim());
      setBuddy(b);
      setTimeout(() => {
        setRevealed(true);
        setHatching(false);
      }, 500);
    }, 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #080c14 0%, #0f1523 40%, #0c1018 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;600;700;800&display=swap');
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-12deg) scale(1.05); }
          40% { transform: rotate(10deg) scale(1.05); }
          60% { transform: rotate(-8deg) scale(1.02); }
          80% { transform: rotate(6deg) scale(1.02); }
        }
        @keyframes crack {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes popIn {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.08) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #374151; }
      `}</style>

      {/* Scanline overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        pointerEvents: "none",
        zIndex: 100,
      }} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px", zIndex: 1 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.3em",
          color: "#374151",
          textTransform: "uppercase",
        }}>
          claude code · buddy system · build 2.1.88
        </div>
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "32px",
          fontWeight: 800,
          margin: "6px 0 0",
          background: "linear-gradient(135deg, #e2e8f0, #64748b)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          /buddy reveal
        </h1>
      </div>

      {/* Input */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "28px",
        zIndex: 1,
        width: "100%",
        maxWidth: "400px",
      }}>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReveal()}
          placeholder="userId / 邮箱 / 任意字符串"
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "8px",
            color: "#e2e8f0",
            fontSize: "13px",
            fontFamily: "'JetBrains Mono', monospace",
            outline: "none",
          }}
          onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
        />
        <button
          onClick={handleReveal}
          disabled={hatching || !userId.trim()}
          style={{
            padding: "10px 18px",
            background: hatching ? "rgba(99,102,241,0.15)" : "linear-gradient(135deg, #6366f1, #4f46e5)",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "13px",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
            cursor: hatching || !userId.trim() ? "not-allowed" : "pointer",
            opacity: !userId.trim() ? 0.35 : 1,
          }}
        >
          {hatching ? "🥚 孵化中..." : "🥚 孵化"}
        </button>
      </div>

      {/* Hatching egg */}
      {hatching && (
        <div style={{
          fontSize: "80px",
          animation: "wobble 0.4s ease-in-out infinite",
          marginBottom: "20px",
          filter: "drop-shadow(0 0 20px rgba(251,191,36,0.3))",
        }}>
          🥚
          <div style={{
            position: "absolute",
            fontSize: "20px",
            animation: "crack 0.5s ease-out 1.2s forwards",
            opacity: 0,
          }}>✨</div>
        </div>
      )}

      {/* Result */}
      {buddy && revealed && (
        <div style={{
          animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          background: "rgba(255,255,255,0.02)",
          border: `1px solid ${buddy.rarity.name === "Common" ? "rgba(255,255,255,0.06)" : buddy.rarity.color + "30"}`,
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "360px",
          width: "100%",
          position: "relative",
          boxShadow: buddy.rarity.glow !== "none" ? buddy.rarity.glow : "0 2px 20px rgba(0,0,0,0.4)",
        }}>
          {buddy.isShiny && (
            <div style={{
              position: "absolute", top: "10px", right: "10px",
              fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              color: "#fbbf24", background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
              padding: "2px 8px", borderRadius: "20px",
            }}>✨ SHINY</div>
          )}

          {/* Pixel sprite */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "16px",
          }}>
            <PixelBuddy
              species={buddy.species.name}
              hat={buddy.hat.name}
              isShiny={buddy.isShiny}
              rarity={buddy.rarity}
            />
            <SpeechBubble species={buddy.species.name} />
          </div>

          {/* Info */}
          <div style={{
            textAlign: "center",
            marginBottom: "16px",
            animation: "slideUp 0.4s ease-out 0.3s both",
          }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#e2e8f0",
            }}>{buddy.species.cn}</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "#4b5563",
              marginBottom: "8px",
            }}>{buddy.species.name}</div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              fontWeight: 600,
              color: buddy.rarity.color,
              background: buddy.rarity.color + "12",
              border: `1px solid ${buddy.rarity.color}25`,
              padding: "2px 10px",
              borderRadius: "20px",
            }}>
              {buddy.rarity.cn} · {buddy.rarity.name}
            </span>
            {buddy.hat.name !== "none" && (
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "11px",
                color: "#4b5563",
                marginTop: "6px",
              }}>
                佩戴: {buddy.hat.cn}
              </div>
            )}
          </div>

          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            margin: "12px 0",
          }} />

          {/* Stats */}
          <div style={{ animation: "slideUp 0.4s ease-out 0.5s both" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.2em",
              color: "#374151",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}>stats</div>
            {STATS.map((s, i) => (
              <StatBar key={s} label={s} value={buddy.stats[s]} delay={400 + i * 100} />
            ))}
          </div>

          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px",
            color: "#1f2937",
            textAlign: "center",
            marginTop: "12px",
          }}>
            seed: {hashString(userId.trim())} · mulberry32 · friend-2026-401
          </div>
        </div>
      )}

      {/* Footer hint */}
      {!buddy && !hatching && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          color: "#1f2937",
          textAlign: "center",
          lineHeight: 1.8,
          zIndex: 1,
        }}>
          像素精灵 · 会眨眼 · 会说话 · 会发呆<br />
          18个物种 · 5种稀有度 · 1%传说 · 1%闪光
        </div>
      )}
    </div>
  );
}
