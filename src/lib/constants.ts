export const DRINKING_ESTABLISHMENT_TYPES = [
  "PUB", "CLUB", "COCKTAIL_LOUNGE", "SPORTS_BAR", "KARAOKE_BAR",
  "WINE_BAR", "BREWERY_TAPROOM", "LIVE_MUSIC", "DIVE_BAR",
] as const;

export const DEFAULT_RADIUS_KM = 10;

export const TIME_FILTERS = [
  { value: "now", label: "Now" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Upcoming" },
] as const;

export const DRINK_PREFS = [
  { key: "CRAFT_BEER", label: "Craft Beer" },
  { key: "COCKTAILS", label: "Cocktails" },
  { key: "WINE", label: "Wine" },
  { key: "SPIRITS", label: "Spirits" },
  { key: "CIDER", label: "Cider" },
  { key: "NON_ALCOHOLIC", label: "Non-Alcoholic" },
  { key: "COFFEE", label: "Coffee" },
  { key: "CHAMPAGNE", label: "Champagne" },
] as const;

export const CATEGORIES = [
  { key: "PUB", label: "Pubs", icon: "Users" },
  { key: "COCKTAIL_LOUNGE", label: "Cocktails", icon: "Heart" },
  { key: "CLUB", label: "Clubs", icon: "MusicNotes" },
  { key: "SPORTS_BAR", label: "Sports", icon: "Clock" },
  { key: "KARAOKE_BAR", label: "Karaoke", icon: "Microphone" },
  { key: "WINE_BAR", label: "Wine Bar", icon: "Pen" },
  { key: "BREWERY_TAPROOM", label: "Brewery", icon: "BeerBottle" },
] as const;
