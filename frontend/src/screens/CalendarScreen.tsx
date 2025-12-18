/**
 * CalendarScreen - Calendrier Cultural Professionnel
 * Timeline phénologique avec dates clés et opérations
 */

import React, { useState, useEffect } from 'react';
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
import { PHENOLOGICAL_STAGES } from '@/constants/config';
import { useAppSelector } from '@/store/hooks';
import EmptyState from '@/components/EmptyState';
import InfoCard from '@/components/InfoCard';
import ProgressBar from '@/components/ProgressBar';

interface KeyDate {
  id: string;
  date: Date;
  dayNumber: number;
  title: string;
  stage: string;
  isCritical: boolean;
  status: 'done' | 'upcoming' | 'critical';
  description: string;
  daysUntil: number;
}

interface Operation {
  id: string;
  title: string;
  date: string;
  dayNumber: number;
  completed: boolean;
}

export default function CalendarScreen() {
  const navigation = useNavigation();
  const { fields, activeFieldId } = useAppSelector(state => state.fields);
  const activeField = fields && fields.length > 0 
    ? (fields.find(f => f.id === activeFieldId) || fields[0])
    : null;

  const [keyDates, setKeyDates] = useState<KeyDate[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [harvestDate, setHarvestDate] = useState<Date | null>(null);

  useEffect(() => {
    if (activeField) {
      calculateCalendar();
    }
  }, [activeField]);

  const calculateCalendar = () => {
    const fieldData: any = activeField;
    const plantingDate = fieldData.planting_date ? new Date(fieldData.planting_date) : 
                        fieldData.sowingDate ? new Date(fieldData.sowingDate) : null;

    if (!plantingDate) return;

    const now = new Date();
    const daysSincePlanting = Math.floor((now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));
    setCurrentDay(daysSincePlanting);

    // Calculer la date de récolte
    const harvest = new Date(plantingDate);
    harvest.setDate(harvest.getDate() + 120);
    setHarvestDate(harvest);

    // Générer les dates clés basées sur les stades phénologiques
    const dates: KeyDate[] = [
      {
        id: 'semis',
        date: plantingDate,
        dayNumber: 0,
        title: 'SEMIS',
        stage: 'SEMIS',
        isCritical: false,
        status: 'done',
        description: 'Date confirmée',
        daysUntil: 0 - daysSincePlanting,
      },
      {
        id: 'germination',
        date: addDays(plantingDate, 7),
        dayNumber: 7,
        title: 'LEVÉE',
        stage: 'LEVEE',
        isCritical: false,
        status: daysSincePlanting >= 7 ? 'done' : 'upcoming',
        description: 'Émergence des plantules',
        daysUntil: 7 - daysSincePlanting,
      },
      {
        id: 'fertilizer_n',
        date: addDays(plantingDate, 30),
        dayNumber: 30,
        title: 'APPORT AZOTE (N)',
        stage: 'TALLAGE',
        isCritical: true,
        status: getCriticalStatus(daysSincePlanting, 30),
        description: 'Apport engrais azoté - Critique',
        daysUntil: 30 - daysSincePlanting,
      },
      {
        id: 'tallage',
        date: addDays(plantingDate, 35),
        dayNumber: 35,
        title: 'TALLAGE ACTIF',
        stage: 'TALLAGE',
        isCritical: false,
        status: daysSincePlanting >= 35 ? 'done' : 'upcoming',
        description: 'Multiplication des tiges',
        daysUntil: 35 - daysSincePlanting,
      },
      {
        id: 'panicule',
        date: addDays(plantingDate, 55),
        dayNumber: 55,
        title: 'INITIATION PANICULE',
        stage: 'INITIATION_PANICULE',
        isCritical: true,
        status: getCriticalStatus(daysSincePlanting, 55),
        description: 'CRITIQUE - Besoin eau élevé',
        daysUntil: 55 - daysSincePlanting,
      },
      {
        id: 'floraison',
        date: addDays(plantingDate, 80),
        dayNumber: 80,
        title: 'FLORAISON',
        stage: 'FLORAISON',
        isCritical: true,
        status: getCriticalStatus(daysSincePlanting, 80),
        description: 'EXTRÊMEMENT CRITIQUE - Humidité sol > 80%',
        daysUntil: 80 - daysSincePlanting,
      },
      {
        id: 'maturation',
        date: addDays(plantingDate, 95),
        dayNumber: 95,
        title: 'MATURATION',
        stage: 'MATURATION',
        isCritical: false,
        status: daysSincePlanting >= 95 ? 'done' : 'upcoming',
        description: 'Remplissage des grains',
        daysUntil: 95 - daysSincePlanting,
      },
      {
        id: 'harvest',
        date: harvest,
        dayNumber: 120,
        title: 'RÉCOLTE',
        stage: 'RECOLTE',
        isCritical: false,
        status: daysSincePlanting >= 120 ? 'done' : 'upcoming',
        description: 'Grains secs - Récolte prévue',
        daysUntil: 120 - daysSincePlanting,
      },
    ];

    setKeyDates(dates);

    // Opérations à cocher (exemples)
    const ops: Operation[] = [
      { id: '1', title: 'Semis', date: formatDate(plantingDate), dayNumber: 0, completed: true },
      { id: '2', title: 'Germination observée', date: formatDate(addDays(plantingDate, 7)), dayNumber: 7, completed: daysSincePlanting >= 7 },
      { id: '3', title: 'Levée confirmée', date: formatDate(addDays(plantingDate, 12)), dayNumber: 12, completed: daysSincePlanting >= 12 },
      { id: '4', title: 'Apport engrais N', date: formatDate(addDays(plantingDate, 30)), dayNumber: 30, completed: false },
      { id: '5', title: 'Traitement ravageurs', date: formatDate(addDays(plantingDate, 35)), dayNumber: 35, completed: false },
      { id: '6', title: 'Contrôle maladies', date: formatDate(addDays(plantingDate, 50)), dayNumber: 50, completed: false },
      { id: '7', title: 'Apport engrais P-K', date: formatDate(addDays(plantingDate, 60)), dayNumber: 60, completed: false },
    ];

    setOperations(ops);
  };

  const toggleOperation = (id: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, completed: !op.completed } : op
    ));
  };

  if (!activeField) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="calendar-outline"
          title="Aucune parcelle"
          message="Créez une parcelle pour voir le calendrier cultural."
        />
      </View>
    );
  }

  const fieldData: any = activeField;
  const plantingDate = fieldData.planting_date ? new Date(fieldData.planting_date) : 
                      fieldData.sowingDate ? new Date(fieldData.sowingDate) : null;

  if (!plantingDate) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="calendar-outline"
          title="Date de semis manquante"
          message="Ajoutez la date de semis pour générer le calendrier."
        />
      </View>
    );
  }

  const progress = Math.min(100, (currentDay / 120) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 CALENDRIER CULTURAL</Text>
        <Text style={styles.headerSubtitle}>
          VARIÉTÉ: {activeField.variety || 'WITA 9'} (120 jours)
        </Text>
        <Text style={styles.headerDate}>
          SEMIS: {formatDate(plantingDate)}
        </Text>
        {harvestDate && (
          <Text style={styles.headerDate}>
            RÉCOLTE: {formatDate(harvestDate)}
          </Text>
        )}
      </View>

      {/* Timeline phénologique */}
      <InfoCard title="TIMELINE PHÉNOLOGIQUE" icon="git-branch" iconColor="#8b5cf6">
        <ProgressBar
          progress={progress}
          color={progress < 33 ? '#3b82f6' : progress < 66 ? '#10b981' : '#f97316'}
          height={16}
          label={`Jour ${currentDay} / 120`}
          showPercentage={false}
        />

        <View style={styles.timelineMarkers}>
          <Text style={styles.markerText}>0j</Text>
          <Text style={styles.markerText}>30j</Text>
          <Text style={styles.markerText}>60j</Text>
          <Text style={styles.markerText}>90j</Text>
          <Text style={styles.markerText}>120j</Text>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Levée/Tallage</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Init. Panicule</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
            <Text style={styles.legendText}>Floraison (CRIT)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
            <Text style={styles.legendText}>Maturation</Text>
          </View>
        </View>
      </InfoCard>

      {/* Dates clés */}
      <InfoCard title="DATES CLÉS" icon="calendar" iconColor="#10b981">
        {keyDates.map(date => (
          <View key={date.id} style={styles.keyDateCard}>
            <View style={styles.keyDateHeader}>
              <View style={styles.keyDateLeft}>
                <Text style={[styles.keyDateIcon, { fontSize: 20 }]}>
                  {getStatusIcon(date.status)}
                </Text>
                <View>
                  <Text style={[styles.keyDateTitle, date.isCritical && styles.criticalText]}>
                    {date.title}
                  </Text>
                  <Text style={styles.keyDateDay}>
                    Jour {date.dayNumber} / {date.daysUntil > 0 ? `dans ${date.daysUntil} jours` : date.daysUntil === 0 ? "aujourd'hui" : `il y a ${Math.abs(date.daysUntil)} jours`}
                  </Text>
                </View>
              </View>
              <Text style={styles.keyDateDate}>{formatShortDate(date.date)}</Text>
            </View>

            <Text style={[styles.keyDateDesc, date.isCritical && styles.criticalDesc]}>
              {date.description}
            </Text>

            {date.isCritical && date.status !== 'done' && (
              <View style={styles.criticalBadge}>
                <Ionicons name="warning" size={16} color="#f97316" />
                <Text style={styles.criticalBadgeText}>
                  {date.daysUntil <= 3 && date.daysUntil > 0 ? 'DANS 3 JOURS' : 'CRITIQUE'}
                </Text>
              </View>
            )}
          </View>
        ))}
      </InfoCard>

      {/* Opérations à cocher */}
      <InfoCard title="OPÉRATIONS À COCHER" icon="checkbox" iconColor="#3b82f6">
        {operations.map(op => (
          <Pressable
            key={op.id}
            style={styles.operationItem}
            onPress={() => toggleOperation(op.id)}
          >
            <Ionicons
              name={op.completed ? 'checkbox' : 'square-outline'}
              size={24}
              color={op.completed ? '#10b981' : COLORS.textSecondary}
            />
            <View style={styles.operationInfo}>
              <Text style={[styles.operationTitle, op.completed && styles.operationCompleted]}>
                {op.title}
              </Text>
              <Text style={styles.operationDate}>
                {op.date} (Jour {op.dayNumber})
              </Text>
            </View>
          </Pressable>
        ))}
      </InfoCard>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => Alert.alert('Alertes', 'Fonctionnalité à venir')}
        >
          <Ionicons name="notifications" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>ALERTES{'\n'}PERSONNELS</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddOperation' as never)}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>AJOUTER{'\n'}OPÉRATION</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// Helpers
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function getCriticalStatus(currentDay: number, targetDay: number): 'done' | 'upcoming' | 'critical' {
  if (currentDay >= targetDay) return 'done';
  if (targetDay - currentDay <= 3) return 'critical';
  return 'upcoming';
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'done': return '✓';
    case 'critical': return '⚠️';
    case 'upcoming': return '⏳';
    default: return '○';
  }
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
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  headerDate: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  timelineMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  markerText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  legendText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
  },
  keyDateCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  keyDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  keyDateLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  keyDateIcon: {
    marginRight: SPACING.sm,
  },
  keyDateTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  criticalText: {
    color: '#f97316',
  },
  keyDateDay: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  keyDateDate: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '600',
  },
  keyDateDesc: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginLeft: 32,
  },
  criticalDesc: {
    color: '#f97316',
    fontWeight: '600',
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    padding: SPACING.xs,
    borderRadius: 4,
    marginTop: SPACING.xs,
    marginLeft: 32,
    alignSelf: 'flex-start',
  },
  criticalBadgeText: {
    ...TYPOGRAPHY.small,
    color: '#f97316',
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  operationInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  operationTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  operationCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  operationDate: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  actionText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
