export interface Venue {
  id: string; name: string; type: string; address: string; district: string;
  lat: number; lng: number; imageUrl?: string; phone?: string; website?: string;
  hours?: Record<string, string>;
}

export interface Promotion {
  id: string; venueId: string; venueName: string; title: string;
  description: string; type: string; validFrom: string; validTo: string;
  imageUrl?: string; accentColor?: string;
}

export interface Pass {
  id: string; venueId: string; venueName: string; title: string;
  price: number; originalPrice?: number; type: string;
  validUntil: string; benefits: string[];
}

export const mockVenues: Venue[] = [
  { id: "v1", name: "Bar Loose", type: "PUB", address: "Annankatu 21, Helsinki", lat: 60.1675, lng: 24.9400, district: "Kamppi", phone: "+358 9 1234 567" },
  { id: "v2", name: "The Cocktail", type: "COCKTAIL_LOUNGE", address: "Erottajankatu 4, Helsinki", lat: 60.1670, lng: 24.9440, district: "Kaartinkaupunki", phone: "+358 9 2345 678" },
  { id: "v3", name: "Club X", type: "CLUB", address: "Mannerheimintie 12, Helsinki", lat: 60.1700, lng: 24.9380, district: "Kluuvi", phone: "+358 9 3456 789" },
  { id: "v4", name: "Sports Bar 99", type: "SPORTS_BAR", address: "Hameentie 15, Helsinki", lat: 60.1800, lng: 24.9500, district: "Kallio", phone: "+358 9 4567 890" },
  { id: "v5", name: "Karaoke Star", type: "KARAOKE_BAR", address: "Vaasankatu 10, Helsinki", lat: 60.1820, lng: 24.9520, district: "Kallio", phone: "+358 9 5678 901" },
  { id: "v6", name: "Viiinibaari", type: "WINE_BAR", address: "Bulevardi 8, Helsinki", lat: 60.1645, lng: 24.9370, district: "Kamppi", phone: "+358 9 6789 012" },
  { id: "v7", name: "BrewDog Helsinki", type: "BREWERY_TAPROOM", address: "Tarkk'ampujankatu 20, Helsinki", lat: 60.1600, lng: 24.9300, district: "Punavuori", phone: "+358 9 7890 123" },
  { id: "v8", name: "The Old Pub", type: "PUB", address: "Kaisaniemenkatu 3, Helsinki", lat: 60.1720, lng: 24.9470, district: "Kluuvi", phone: "+358 9 8901 234" },
  { id: "v9", name: "Apollo Live Club", type: "LIVE_MUSIC", address: "Mannerheimintie 4, Helsinki", lat: 60.1690, lng: 24.9405, district: "Kamppi", phone: "+358 9 9012 345" },
  { id: "v10", name: "Roasberg", type: "COCKTAIL_LOUNGE", address: "Mikonkatu 13, Helsinki", lat: 60.1710, lng: 24.9455, district: "Kluuvi", phone: "+358 9 0123 456" },
  { id: "v11", name: "Kaarle XII", type: "PUB", address: "Kasarmikatu 40, Helsinki", lat: 60.1640, lng: 24.9490, district: "Kaartinkaupunki" },
  { id: "v12", name: "Tiger", type: "CLUB", address: "Urho Kekkosen katu 1, Helsinki", lat: 60.1685, lng: 24.9410, district: "Kamppi" },
  { id: "v13", name: "O'Malley's", type: "SPORTS_BAR", address: "Yrjonkatu 8, Helsinki", lat: 60.1678, lng: 24.9418, district: "Kamppi" },
  { id: "v14", name: "Loose", type: "PUB", address: "Annankatu 21, Helsinki", lat: 60.1675, lng: 24.9400, district: "Kamppi" },
  { id: "v15", name: "Teerenpeli", type: "BREWERY_TAPROOM", address: "Olavinkatu 2, Helsinki", lat: 60.1689, lng: 24.9425, district: "Kamppi" },
];

export const mockPromotions: Promotion[] = [
  { id: "p1", venueId: "v8", venueName: "The Old Pub", title: "Happy Hour — €4 Pints", description: "All draft beers €4 during happy hour", type: "HAPPY_HOUR", validFrom: "2026-05-29T16:00:00Z", validTo: "2026-05-29T19:00:00Z", accentColor: "#064e3b" },
  { id: "p2", venueId: "v3", venueName: "Club X", title: "Ladies Night — Free Entry", description: "Free entry for ladies until midnight", type: "LADIES_NIGHT", validFrom: "2026-05-29T22:00:00Z", validTo: "2026-05-30T04:00:00Z", accentColor: "#601010" },
  { id: "p3", venueId: "v2", venueName: "The Cocktail", title: "2-for-1 Cocktails", description: "Buy one get one free on all signature cocktails", type: "DRINK_SPECIAL", validFrom: "2026-05-30T20:00:00Z", validTo: "2026-05-30T23:00:00Z", accentColor: "#2d1060" },
  { id: "p4", venueId: "v1", venueName: "Bar Loose", title: "Student Night — 20% Off", description: "Show your student ID for 20% off all drinks", type: "STUDENT_DISCOUNT", validFrom: "2026-05-29T18:00:00Z", validTo: "2026-05-30T02:00:00Z", accentColor: "#1a0533" },
  { id: "p5", venueId: "v7", venueName: "BrewDog Helsinki", title: "New Beer Tasting Flight", description: "Sample 4 new seasonal brews for €12", type: "DRINK_SPECIAL", validFrom: "2026-05-29T14:00:00Z", validTo: "2026-05-31T22:00:00Z", accentColor: "#0a1a2e" },
  { id: "p6", venueId: "v4", venueName: "Sports Bar 99", title: "Game Day Specials", description: "€5 pints during all live matches", type: "DRINK_SPECIAL", validFrom: "2026-05-29T16:00:00Z", validTo: "2026-05-29T23:00:00Z", accentColor: "#1a1a0a" },
  { id: "p7", venueId: "v9", venueName: "Apollo Live Club", title: "Live Music Thursdays", description: "Live band + free cover before 9 PM", type: "THEME_NIGHT", validFrom: "2026-06-01T20:00:00Z", validTo: "2026-06-02T02:00:00Z", accentColor: "#2d1060" },
  { id: "p8", venueId: "v12", venueName: "Tiger", title: "Weekend Warm-up", description: "Premium spirits at standard prices until 11 PM", type: "HAPPY_HOUR", validFrom: "2026-05-30T20:00:00Z", validTo: "2026-05-30T23:00:00Z", accentColor: "#1a0533" },
];

export const mockPasses: Pass[] = [
  { id: "pass1", venueId: "v3", venueName: "Club X", title: "Skip Line Pass", price: 10, originalPrice: 15, type: "SKIP_LINE", validUntil: "2026-06-30T04:00:00Z", benefits: ["Skip the queue", "Priority entry"] },
  { id: "pass2", venueId: "v12", venueName: "Tiger", title: "VIP Entry + Drink", price: 20, type: "PREMIUM_ENTRY", validUntil: "2026-06-15T04:00:00Z", benefits: ["Skip line", "One free drink", "VIP area access"] },
  { id: "pass3", venueId: "v3", venueName: "Club X", title: "Cover Included Pass", price: 8, originalPrice: 12, type: "COVER_INCLUDED", validUntil: "2026-06-30T04:00:00Z", benefits: ["Cover fee included", "Express entry"] },
  { id: "pass4", venueId: "v9", venueName: "Apollo Live Club", title: "Drink Package", price: 25, type: "DRINK_PACKAGE", validUntil: "2026-06-30T04:00:00Z", benefits: ["3 drink tokens", "Skip line", "Cloakroom included"] },
  { id: "pass5", venueId: "v1", venueName: "Bar Loose", title: "Weekend Fast Track", price: 5, type: "SKIP_LINE", validUntil: "2026-06-30T04:00:00Z", benefits: ["Priority entry on weekends"] },
];
