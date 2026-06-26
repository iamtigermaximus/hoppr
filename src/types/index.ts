// ── Venue / Bar ──────────────────────────────────

export interface Venue {
  id: string;
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  district: string;
  phone?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  description?: string;
  priceRange?: string;
  coverCharge?: number | null;
  musicTags?: string[];
  followerCount?: number;
  capacity?: number;
  amenities: string[];
  hours?: Record<string, string>;
  imageUrl?: string;
  imageUrls: string[];
  logoUrl?: string;
  isVerified: boolean;
  qualityScore?: number;
  cityName?: string;
  crowdLevel?: string;
  crowdReportedAt?: string;
  promotions: Promotion[];
  passes: VenuePass[];
  menu: MenuItem[];
}

// ── Promotions ───────────────────────────────────

export interface Promotion {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  description?: string;
  type: string;
  validFrom: string;
  validTo: string;
  imageUrl?: string;
}

// ── Passes ───────────────────────────────────────

export interface VenuePass {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  price: number;
  type: string;
  validUntil: string;
  benefits: string[];
}

// ── Menu ─────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
}

// ── Events ───────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  description?: string;
  venueId: string;
  venueName: string;
  startTime: string;
  endTime?: string;
  chatRoom?: { id: string };
  participants?: EventParticipant[];
  creator?: { id: string };
}

export interface EventParticipant {
  user: {
    id: string;
    username?: string;
    name?: string;
    image?: string;
  };
}

// ── Chat ─────────────────────────────────────────

export interface ChatMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username?: string;
    image?: string;
  };
  createdAt: string;
}

// ── Feed ─────────────────────────────────────────

export interface FeedItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ── User / Profile ───────────────────────────────

export interface UserProfile {
  id: string;
  username?: string;
  name?: string;
  image?: string;
  bio?: string;
  interests?: string[];
}

// ── Notifications ────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ── Crowd ────────────────────────────────────────

export interface CrowdPresence {
  totalPresent: number;
  timestamp: number;
}

// ── Campaigns ────────────────────────────────────

export interface Campaign {
  id: string;
  barId: string;
  type: string;
  title: string;
}

// ── API helpers ──────────────────────────────────

export type ApiResponse<T> = T | { error: string };
