/**
 * ManageFieldsScreen - Gestion des parcelles
 * Liste des parcelles avec options de modification/suppression
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '@/constants/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { deleteField, setActiveField } from '@/store/slices/fieldsSlice';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import InfoCard from '@/components/InfoCard';

export default function ManageFieldsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { fields, activeFieldId } = useAppSelector(state => state.fields);

  const handleDeleteField = (fieldId: string, fieldName: string) => {
    Alert.alert(
      'Supprimer la parcelle',
      `Êtes-vous sûr de vouloir supprimer "${fieldName}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteField(fieldId));
            Alert.alert('Succès', 'La parcelle a été supprimée.');
          },
        },
      ]
    );
  };

  const handleSetActive = (fieldId: string) => {
    dispatch(setActiveField(fieldId));
    Alert.alert('Succès', 'Parcelle active mise à jour.');
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!fields || fields.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Parcelles</Text>
          <Text style={styles.headerSubtitle}>
            Gérez vos parcelles de riz
          </Text>
        </View>

        <EmptyState
          icon="leaf-outline"
          title="Aucune parcelle"
          message="Créez votre première parcelle pour commencer le suivi."
        />

        <View style={styles.actions}>
          <Button
            title="Créer une parcelle"
            onPress={() => navigation.navigate('AddField' as never)}
            icon="add-circle"
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Parcelles</Text>
        <Text style={styles.headerSubtitle}>
          {fields.length} parcelle{fields.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Bouton ajouter */}
      <Button
        title="Créer une nouvelle parcelle"
        onPress={() => navigation.navigate('AddField' as never)}
        icon="add-circle"
        fullWidth
        style={styles.addButton}
      />

      {/* Liste des parcelles */}
      {fields.map((field: any) => {
        const isActive = field.id === activeFieldId;
        const plantingDate = field.planting_date || field.sowingDate;

        return (
          <View key={field.id} style={styles.fieldCard}>
            {/* Badge Active */}
            {isActive && (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}

            {/* Infos principales */}
            <View style={styles.fieldHeader}>
              <View style={styles.fieldIcon}>
                <Ionicons name="leaf" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.fieldInfo}>
                <Text style={styles.fieldName}>{field.name}</Text>
                <Text style={styles.fieldDetail}>
                  {field.variety || 'WITA 9'} • {field.area || '0'} ha
                </Text>
                {plantingDate && (
                  <Text style={styles.fieldDate}>
                    📅 Semis: {formatDate(plantingDate)}
                  </Text>
                )}
              </View>
            </View>

            {/* Statistiques */}
            <View style={styles.fieldStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Stade</Text>
                <Text style={styles.statValue}>
                  {field.currentStage || 'Levée'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>État</Text>
                <Text style={[
                  styles.statValue,
                  { color: field.healthStatus === 'good' ? '#10b981' : '#f97316' }
                ]}>
                  {field.healthStatus === 'good' ? 'Bon' : 
                   field.healthStatus === 'warning' ? 'Attention' : 'Critique'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sol</Text>
                <Text style={styles.statValue}>
                  {field.soilType || 'Argileux'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.fieldActions}>
              {!isActive && (
                <Pressable
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => handleSetActive(field.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Définir active</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => (navigation as any).navigate('FieldDetails', { fieldId: field.id })}
              >
                <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Voir détails</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.dangerButton]}
                onPress={() => handleDeleteField(field.id, field.name)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.dangerButtonText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* Info */}
      <InfoCard title="💡 CONSEIL" icon="bulb" iconColor="#f59e0b">
        <Text style={styles.infoText}>
          La parcelle active est celle affichée sur le tableau de bord et utilisée pour les calculs d'irrigation.
        </Text>
      </InfoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  addButton: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    marginLeft: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  fieldIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  fieldDetail: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  fieldDate: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  fieldStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  fieldActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  secondaryButton: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    ...TYPOGRAPHY.small,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actions: {
    padding: SPACING.lg,
  },
});
