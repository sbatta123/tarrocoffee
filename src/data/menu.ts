/**
 * Coffee shop menu from PRD — exact items, prices, and options.
 */

export type MenuCategory = "coffee" | "tea" | "pastries" | "addons" | "customization";

export interface DrinkItem {
  id: string;
  name: string;
  category: "coffee" | "tea";
  temp?: "Hot/Iced" | "Iced";
  priceSmall: string;
  priceLarge: string;
}

export interface PastryItem {
  id: string;
  name: string;
  category: "pastries";
  price: string;
}

export interface AddOnItem {
  id: string;
  name: string;
  category: "addons";
  price: string; // e.g. "$0.00" or "+$0.50"
}

export interface CustomizationOption {
  id: string;
  label: string;
  options: string[];
}

// Coffee (Small 12oz / Large 16oz)
export const COFFEE_ITEMS: DrinkItem[] = [
  { id: "americano", name: "Americano", category: "coffee", temp: "Hot/Iced", priceSmall: "$3.00", priceLarge: "$4.00" },
  { id: "latte", name: "Latte", category: "coffee", temp: "Hot/Iced", priceSmall: "$4.00", priceLarge: "$5.00" },
  { id: "cold-brew", name: "Cold Brew", category: "coffee", temp: "Iced", priceSmall: "$4.00", priceLarge: "$5.00" },
  { id: "mocha", name: "Mocha", category: "coffee", temp: "Hot/Iced", priceSmall: "$4.50", priceLarge: "$5.50" },
  { id: "coffee-frappuccino", name: "Coffee Frappuccino", category: "coffee", temp: "Iced", priceSmall: "$5.50", priceLarge: "$6.00" },
];

// Tea (Small 12oz / Large 16oz)
export const TEA_ITEMS: DrinkItem[] = [
  { id: "black-tea", name: "Black Tea", category: "tea", temp: "Hot/Iced", priceSmall: "$3.00", priceLarge: "$3.75" },
  { id: "jasmine-tea", name: "Jasmine Tea", category: "tea", temp: "Hot/Iced", priceSmall: "$3.00", priceLarge: "$3.75" },
  { id: "lemon-green-tea", name: "Lemon Green Tea", category: "tea", temp: "Hot/Iced", priceSmall: "$3.50", priceLarge: "$4.25" },
  { id: "matcha-latte", name: "Matcha Latte", category: "tea", temp: "Hot/Iced", priceSmall: "$4.50", priceLarge: "$5.25" },
];

// Pastries
export const PASTRY_ITEMS: PastryItem[] = [
  { id: "plain-croissant", name: "Plain Croissant", category: "pastries", price: "$3.50" },
  { id: "chocolate-croissant", name: "Chocolate Croissant", category: "pastries", price: "$4.00" },
  { id: "chocolate-chip-cookie", name: "Chocolate Chip Cookie", category: "pastries", price: "$2.50" },
  { id: "banana-bread", name: "Banana Bread (Slice)", category: "pastries", price: "$3.00" },
];

// Add-Ons & Substitutions
export const ADDON_ITEMS: AddOnItem[] = [
  { id: "whole-milk", name: "Whole Milk", category: "addons", price: "$0.00" },
  { id: "skim-milk", name: "Skim Milk", category: "addons", price: "$0.00" },
  { id: "oat-milk", name: "Oat Milk", category: "addons", price: "+$0.50" },
  { id: "almond-milk", name: "Almond Milk", category: "addons", price: "+$0.75" },
  { id: "extra-espresso", name: "Extra Espresso Shot", category: "addons", price: "+$1.50" },
  { id: "extra-matcha", name: "Extra Matcha Shot", category: "addons", price: "+$1.50" },
  { id: "caramel-syrup", name: "1 Pump Caramel Syrup", category: "addons", price: "+$0.50" },
  { id: "hazelnut-syrup", name: "1 Pump Hazelnut Syrup", category: "addons", price: "+$0.50" },
];

// Customization Options (No Charge)
export const CUSTOMIZATION_OPTIONS: CustomizationOption[] = [
  { id: "sweetness", label: "Sweetness Levels", options: ["No Sugar", "Less Sugar", "Extra Sugar"] },
  { id: "ice", label: "Ice Levels", options: ["No Ice", "Less Ice", "Extra Ice"] },
];

export const MENU_SIZES = "Small 12oz / Large 16oz";

// --- Modifier rules for chat/voice (what applies to which items) ---
// Names as they appear in cart or user message (lowercase)
export const TEA_ITEM_NAMES = TEA_ITEMS.map((i) => i.name.toLowerCase());
export const COFFEE_ITEM_NAMES = COFFEE_ITEMS.map((i) => i.name.toLowerCase());
export const FRAPPUCCINO_ITEM_NAMES = COFFEE_ITEMS.filter((i) => i.temp === "Iced").map((i) => i.name.toLowerCase()); // iced-only drinks
export const PASTRY_ITEM_NAMES = PASTRY_ITEMS.map((i) => i.name.toLowerCase());

/** Allowed modifiers by context (for validation):
 * - Hot drinks: hot, extra hot. No ice level.
 * - Iced drinks: iced, less ice, no ice, extra ice.
 * - Frappuccino: iced only (no hot).
 * - Coffee (non-tea): extra espresso (max 4). No espresso in tea.
 * - Syrup pumps: max 4 per drink.
 * - Pastries: no drink modifiers (no shots, syrup, milk sub, ice, etc.).
 */
export const MODIFIER_RULES = {
  maxSyrupPumps: 12,
  maxEspressoShots: 6,
  iceLevelOnlyForIced: true,
  espressoOnlyForCoffee: true,
  noModifiersForPastries: true,
} as const;
