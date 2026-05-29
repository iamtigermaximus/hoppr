export const darkTheme: AppTheme = {
  name: "dark",
  colors: {
    bg: "#0a0a0a", surface: "#121212", card: "#1a1a1a", cardHover: "#1e1e1e",
    cardBorder: "#262626", primary: "#7c3aed", primaryHover: "#6d28d9",
    primaryLight: "#8b5cf6", primarySubtle: "#a78bfa",
    textPrimary: "#ffffff", textSecondary: "#a3a3a3", textMuted: "#737373",
    event: "#3b82f6", promo: "#10b981", pass: "#f59e0b", error: "#ef4444", online: "#10b981",
    headerBg: "#0a0a0a", headerBorder: "#262626",
    inputBg: "#1a1a1a", inputBorder: "#262626",
  },
  radius: { sm: "8px", md: "12px", lg: "14px", xl: "16px", full: "9999px" },
  spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
  fontSize: { xs: "10px", sm: "11px", md: "12px", base: "14px", lg: "16px", xl: "20px", xxl: "28px" },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  touchTarget: "44px",
};

export const lightTheme: AppTheme = {
  name: "light",
  colors: {
    bg: "#f8f9fa", surface: "#ffffff", card: "#ffffff", cardHover: "#f1f3f5",
    cardBorder: "#d1d5db", primary: "#6d28d9", primaryHover: "#5b21b6",
    primaryLight: "#7c3aed", primarySubtle: "#8b5cf6",
    textPrimary: "#000000", textSecondary: "#1f2937", textMuted: "#374151",
    event: "#2563eb", promo: "#059669", pass: "#d97706", error: "#dc2626", online: "#059669",
    headerBg: "#ffffff", headerBorder: "#dee2e6",
    inputBg: "#f1f3f5", inputBorder: "#ced4da",
  },
  radius: { sm: "8px", md: "12px", lg: "14px", xl: "16px", full: "9999px" },
  spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
  fontSize: { xs: "10px", sm: "11px", md: "12px", base: "14px", lg: "16px", xl: "20px", xxl: "28px" },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  touchTarget: "44px",
};

export interface AppTheme {
  name: string;
  colors: Record<string, string>;
  radius: Record<string, string>;
  spacing: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  touchTarget: string;
}
