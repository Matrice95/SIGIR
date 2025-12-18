/**
 * Couleurs de l'application SIGIR
 * Thème agricole vert avec accents
 */
export const COLORS = {
  // Primaires
  primary: '#2E7D32',      // Vert agriculture
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  
  // Secondaires
  secondary: '#FF6F00',    // Orange alerte
  secondaryLight: '#FFA726',
  secondaryDark: '#E65100',
  
  // Status santé parcelles
  healthy: '#4CAF50',      // Sain 🟢
  warning: '#FFA726',      // Vigilance 🟡
  critical: '#F44336',     // Critique 🔴
  
  // Stades phénologiques
  stageCompleted: '#4CAF50',
  stageCurrent: '#2196F3',
  stageCritical: '#FF6F00',
  stageUpcoming: '#9E9E9E',
  
  // UI
  background: '#F5F5F5',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#FFFFFF',
  border: '#E0E0E0',
  
  // Status badges
  success: '#4CAF50',
  error: '#F44336',
  info: '#2196F3',
  
  // Carte NDVI
  ndviHigh: '#006400',     // NDVI > 0.6
  ndviMedium: '#90EE90',   // NDVI 0.3-0.6
  ndviLow: '#FFD700',      // NDVI 0.1-0.3
  ndviVeryLow: '#8B4513',  // NDVI < 0.1
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

/**
 * Typographie
 */
export const TYPOGRAPHY = {
  // Tailles de police
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 32,
  },
  
  // Épaisseurs
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Styles texte prédéfinis
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

/**
 * Espacements
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

/**
 * Dimensions
 */
export const SIZES = {
  // Boutons
  buttonHeight: {
    small: 32,
    medium: 44,
    large: 56,
  },
  
  // Icônes
  icon: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 32,
    xl: 48,
  },
  
  // Bordures
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  
  // Cards
  cardHeight: 120,
  minCardWidth: 150,
};

/**
 * Shadows
 */
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

/**
 * Durées d'animation
 */
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};
