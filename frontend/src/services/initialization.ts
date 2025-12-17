/**
 * Service d'initialisation de l'application
 * Configure les permissions, notifications, etc.
 */

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
// import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Configuration des notifications
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initialise tous les services au démarrage
 */
export async function initializeServices(): Promise<void> {
  try {
    // 1. Demander permissions localisation
    await requestLocationPermissions();
    
    // 2. Configurer notifications
    await setupNotifications();
    
    // 3. Écouter changements de connexion
    setupNetworkListener();
    
    console.log('✅ Services initialisés avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation services:', error);
  }
}

/**
 * Demande les permissions de localisation
 */
async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      console.warn('Permission de localisation refusée');
      return false;
    }
    
    // Pour iOS, demander aussi permission background si nécessaire
    if (Platform.OS === 'ios') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Permission localisation en arrière-plan refusée');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erreur permissions localisation:', error);
    return false;
  }
}

/**
 * Configure le système de notifications
 */
async function setupNotifications(): Promise<void> {
  if (!Device.isDevice) {
    console.warn('Les notifications ne fonctionnent pas sur simulateur');
    return;
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Permission notifications refusée');
      return;
    }
    
    // Configurer canal Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Alertes SIGIR',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E7D32',
      });
      
      await Notifications.setNotificationChannelAsync('irrigation', {
        name: 'Alertes Irrigation',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
      });
    }
    
    console.log('✅ Notifications configurées');
  } catch (error) {
    console.error('Erreur configuration notifications:', error);
  }
}

/**
 * Écoute les changements de connexion réseau
 */
function setupNetworkListener(): void {
  NetInfo.addEventListener(state => {
    console.log('État réseau:', state.isConnected ? 'En ligne' : 'Hors ligne');
    // Le store Redux sera mis à jour par le syncMiddleware
  });
}

/**
 * Obtient la position actuelle de l'utilisateur
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Permission localisation non accordée');
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    
    return location;
  } catch (error) {
    console.error('Erreur obtention position:', error);
    return null;
  }
}

/**
 * Planifie une notification locale
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Date | 'immediate',
  data?: any
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger === 'immediate' ? null : trigger,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Erreur planification notification:', error);
    return null;
  }
}

/**
 * Annule une notification planifiée
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Erreur annulation notification:', error);
  }
}
