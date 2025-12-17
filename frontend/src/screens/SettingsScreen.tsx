/**
 * Écran Paramètres
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '@/constants/theme';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { updateNotificationSettings, setLanguage } from '@/store/slices/settingsSlice';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { user } = useAppSelector(state => state.auth);
  const { notifications, language, storageUsed } = useAppSelector(state => state.settings);
  const { status: syncStatus } = useAppSelector(state => state.sync);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, value, onValueChange }: any) => (
    <Pressable
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
    >
      <Ionicons name={icon} size={24} color={COLORS.primary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onValueChange ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={value ? COLORS.primary : COLORS.textSecondary}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      )}
    </Pressable>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profil */}
      <Card style={styles.profileCard}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profilePhone}>{user?.phone}</Text>
            <Text style={styles.profileRole}>Agent d'extension</Text>
          </View>
        </View>
      </Card>

      {/* Mes parcelles */}
      <Card>
        <Text style={styles.sectionTitle}>Mes parcelles</Text>
        <SettingItem
          icon="leaf"
          title="Gérer mes parcelles"
          subtitle="Ajouter, modifier ou supprimer"
          onPress={() => console.log('Manage fields')}
        />
      </Card>

      {/* Langue */}
      <Card>
        <Text style={styles.sectionTitle}>Langue</Text>
        <SettingItem
          icon="language"
          title="Français"
          subtitle="Dioula disponible en V2"
          onPress={() => {}}
        />
      </Card>

      {/* Notifications */}
      <Card>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon="water"
          title="Alertes irrigation"
          value={notifications.irrigationAlerts}
          onValueChange={(value: boolean) =>
            dispatch(updateNotificationSettings({ irrigationAlerts: value }))
          }
        />
        <SettingItem
          icon="calendar"
          title="Rappels stades critiques"
          value={notifications.criticalStageReminders}
          onValueChange={(value: boolean) =>
            dispatch(updateNotificationSettings({ criticalStageReminders: value }))
          }
        />
        <SettingItem
          icon="rainy"
          title="Alertes pluie"
          value={notifications.rainAlerts}
          onValueChange={(value: boolean) =>
            dispatch(updateNotificationSettings({ rainAlerts: value }))
          }
        />
      </Card>

      {/* Synchronisation */}
      <Card>
        <Text style={styles.sectionTitle}>Synchronisation</Text>
        <SettingItem
          icon="sync"
          title="Dernière sync"
          subtitle={
            syncStatus.lastSyncAt
              ? new Date(syncStatus.lastSyncAt).toLocaleString('fr-FR')
              : 'Jamais'
          }
        />
        <SettingItem
          icon="cloud-upload"
          title="Opérations en attente"
          subtitle={`${syncStatus.pendingOperations} opération(s)`}
        />
        <Button
          title="Synchroniser maintenant"
          onPress={() => console.log('Sync now')}
          variant="outline"
          icon="cloud-upload"
          fullWidth
          style={styles.syncButton}
        />
      </Card>

      {/* Stockage */}
      <Card>
        <Text style={styles.sectionTitle}>Stockage</Text>
        <SettingItem
          icon="phone-portrait"
          title="Espace utilisé"
          subtitle={`${storageUsed} MB / 500 MB`}
        />
        <Button
          title="Télécharger cartes offline"
          onPress={() => console.log('Download maps')}
          variant="outline"
          icon="download"
          fullWidth
          style={styles.syncButton}
        />
      </Card>

      {/* À propos */}
      <Card>
        <Text style={styles.sectionTitle}>À propos</Text>
        <SettingItem
          icon="information-circle"
          title="Version"
          subtitle="1.0.0"
        />
        <SettingItem
          icon="help-circle"
          title="Aide & Support"
          onPress={() => console.log('Help')}
        />
      </Card>

      {/* Déconnexion */}
      <Button
        title="Déconnexion"
        onPress={handleLogout}
        variant="danger"
        icon="log-out"
        fullWidth
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
  },
  
  // Profil
  profileCard: {
    backgroundColor: COLORS.primary,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textLight,
  },
  profileInfo: {
    marginLeft: SPACING.base,
    flex: 1,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textLight,
  },
  profilePhone: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  profileRole: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  
  // Section
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  
  // Setting item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  
  syncButton: {
    marginTop: SPACING.md,
  },
  logoutButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxxl,
  },
});
