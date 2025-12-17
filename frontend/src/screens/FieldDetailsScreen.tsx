/**
 * Écran Détails Parcelle
 * Affiche toutes les informations d'une parcelle avec historique
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// Components
import Card from '@/components/Card';
import Button from '@/components/Button';
import HealthBadge from '@/components/HealthBadge';

// Store & Constants
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setActiveField, deleteField } from '@/store/slices/fieldsSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { PHENOLOGICAL_STAGES } from '@/constants/config';
import { getDaysSinceSowing, getCycleProgress } from '@/services/cropwat';

export default function FieldDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();

  const { fieldId } = route.params as { fieldId: string };
  const { fields } = useAppSelector(state => state.fields);
  const { operations } = useAppSelector(state => state.operations);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const field = fields.find(f => f.id === fieldId);

  if (!field) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Parcelle non trouvée</Text>
        <Button
          title="Retour"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    );
  }

  const daysSinceSowing = getDaysSinceSowing(field.sowingDate);
  const cycleProgress = getCycleProgress(daysSinceSowing);
  const currentStageInfo = PHENOLOGICAL_STAGES[field.currentStage];

  // Opérations pour cette parcelle
  const fieldOperations = operations
    .filter(op => op.fieldId === fieldId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Recharger les données depuis Realm
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSetActive = () => {
    dispatch(setActiveField(fieldId));
    Alert.alert('Succès', `"${field.name}" est maintenant la parcelle active`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la parcelle',
      `Êtes-vous sûr de vouloir supprimer "${field.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteField(fieldId));
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    // TODO: Navigation vers écran d'édition
    Alert.alert('Info', 'Fonctionnalité à venir');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderInfoTab = () => (
    <View>
      {/* Statut général */}
      <Card>
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <Text style={styles.fieldName}>{field.name}</Text>
            <Text style={styles.fieldArea}>{field.area} hectares</Text>
          </View>
          <HealthBadge status={field.healthStatus} size="large" />
        </View>
      </Card>

      {/* Stade phénologique */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.stageIcon}>{currentStageInfo.icon}</Text>
          <View style={styles.stageInfo}>
            <Text style={styles.stageLabel}>Stade actuel</Text>
            <Text style={styles.stageName}>{currentStageInfo.name}</Text>
          </View>
          {currentStageInfo.critical && (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>CRITIQUE</Text>
            </View>
          )}
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${cycleProgress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {daysSinceSowing} jours depuis le semis • {cycleProgress}% complété
        </Text>
      </Card>

      {/* Informations culture */}
      <Card>
        <Text style={styles.cardTitle}>🌾 Culture</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Variété</Text>
          <Text style={styles.infoValue}>{field.variety}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date de semis</Text>
          <Text style={styles.infoValue}>{formatDate(field.sowingDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type de sol</Text>
          <Text style={styles.infoValue}>{field.soilType}</Text>
        </View>
      </Card>

      {/* Localisation */}
      {field.location && (
        <Card>
          <Text style={styles.cardTitle}>📍 Localisation</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Latitude</Text>
            <Text style={styles.infoValue}>{field.location.latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Longitude</Text>
            <Text style={styles.infoValue}>{field.location.longitude.toFixed(6)}</Text>
          </View>
          <Button
            title="Voir sur la carte"
            onPress={() => navigation.navigate('Map' as never, { fieldId })}
            variant="outline"
            icon="map"
            size="small"
            style={styles.mapButton}
          />
        </Card>
      )}

      {/* Notes */}
      {field.notes && (
        <Card>
          <Text style={styles.cardTitle}>📝 Notes</Text>
          <Text style={styles.notesText}>{field.notes}</Text>
        </Card>
      )}

      {/* Statistiques */}
      <Card>
        <Text style={styles.cardTitle}>📊 Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{fieldOperations.length}</Text>
            <Text style={styles.statLabel}>Opérations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {fieldOperations.filter(op => op.type === 'irrigation').length}
            </Text>
            <Text style={styles.statLabel}>Irrigations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {fieldOperations.filter(op => op.type === 'fertilization').length}
            </Text>
            <Text style={styles.statLabel}>Fertilisations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {fieldOperations.filter(op => op.type === 'treatment').length}
            </Text>
            <Text style={styles.statLabel}>Traitements</Text>
          </View>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Définir comme active"
          onPress={handleSetActive}
          variant="primary"
          icon="star"
          fullWidth
        />
        <Button
          title="Modifier"
          onPress={handleEdit}
          variant="outline"
          icon="create"
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="Supprimer"
          onPress={handleDelete}
          variant="outline"
          icon="trash"
          fullWidth
          style={[styles.actionButton, styles.deleteButton]}
        />
      </View>
    </View>
  );

  const renderHistoryTab = () => (
    <View>
      {fieldOperations.length === 0 ? (
        <Card>
          <View style={styles.emptyHistory}>
            <Ionicons name="documents-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune opération</Text>
            <Text style={styles.emptyMessage}>
              L'historique des opérations apparaîtra ici
            </Text>
          </View>
        </Card>
      ) : (
        fieldOperations.map((operation) => (
          <Card key={operation.id} style={styles.operationCard}>
            <Pressable
              onPress={() =>
                navigation.navigate('OperationDetails' as never, { operationId: operation.id })
              }
            >
              <View style={styles.operationHeader}>
                <View style={styles.operationIcon}>
                  <Ionicons
                    name={
                      operation.type === 'irrigation'
                        ? 'water'
                        : operation.type === 'fertilization'
                        ? 'leaf'
                        : 'medkit'
                    }
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.operationInfo}>
                  <Text style={styles.operationType}>
                    {operation.type === 'irrigation'
                      ? 'Irrigation'
                      : operation.type === 'fertilization'
                      ? 'Fertilisation'
                      : 'Traitement'}
                  </Text>
                  <Text style={styles.operationDate}>{formatDate(operation.date)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </View>
              {operation.notes && (
                <Text style={styles.operationNotes} numberOfLines={2}>
                  {operation.notes}
                </Text>
              )}
            </Pressable>
          </Card>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Informations
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historique
          </Text>
        </Pressable>
      </View>

      {/* Contenu */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        {activeTab === 'info' ? renderInfoTab() : renderHistoryTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fieldArea: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stageIcon: {
    fontSize: 48,
    marginRight: SPACING.md,
  },
  stageInfo: {
    flex: 1,
  },
  stageLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  stageName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  criticalBadge: {
    backgroundColor: COLORS.critical,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  criticalText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  mapButton: {
    marginTop: SPACING.md,
  },
  notesText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actions: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  actionButton: {
    marginTop: 0,
  },
  deleteButton: {
    borderColor: COLORS.error,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  operationCard: {
    marginBottom: SPACING.md,
  },
  operationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  operationInfo: {
    flex: 1,
  },
  operationType: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  operationDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  operationNotes: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    marginTop: SPACING.md,
    paddingLeft: 60,
  },
});
