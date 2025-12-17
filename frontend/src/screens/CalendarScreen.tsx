/**
 * Écran Calendrier Cultural
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import Card from '@/components/Card';
import { PHENOLOGICAL_STAGES } from '@/constants/config';
import { useAppSelector } from '@/store/hooks';
import EmptyState from '@/components/EmptyState';

export default function CalendarScreen() {
  const { fields, activeFieldId } = useAppSelector(state => state.fields);
  const activeField = fields && fields.length > 0 
    ? (fields.find(f => f.id === activeFieldId) || fields[0])
    : null;

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Timeline WITA 9 (120 jours)</Text>
      
      {Object.entries(PHENOLOGICAL_STAGES).map(([key, stage]) => {
        const currentStageKey = activeField.currentStage?.toUpperCase() || 'LEVEE';
        const isActive = currentStageKey === key;
        const currentStageInfo = PHENOLOGICAL_STAGES[currentStageKey as keyof typeof PHENOLOGICAL_STAGES] || PHENOLOGICAL_STAGES.LEVEE;
        const isPast = currentStageInfo.dayStart > stage.dayStart;
        
        return (
          <Card
            key={key}
            style={[
              styles.stageCard,
              isActive && styles.activeCard,
              isPast && styles.completedCard,
            ]}
          >
            <View style={styles.stageHeader}>
              <Text style={styles.stageIcon}>{stage.icon}</Text>
              <View style={styles.stageInfo}>
                <Text style={[styles.stageName, isActive && styles.activeText]}>
                  {stage.name}
                </Text>
                <Text style={styles.stageDays}>
                  Jour {stage.dayStart}-{stage.dayEnd} ({stage.duration} jours)
                </Text>
              </View>
              {stage.critical && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalText}>⚠️</Text>
                </View>
              )}
            </View>
          </Card>
        );
      })}
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
  header: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  stageCard: {
    marginBottom: SPACING.md,
  },
  activeCard: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  completedCard: {
    opacity: 0.6,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageIcon: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    marginRight: SPACING.md,
  },
  stageInfo: {
    flex: 1,
  },
  stageName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  activeText: {
    color: COLORS.primary,
  },
  stageDays: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  criticalBadge: {
    backgroundColor: COLORS.warning,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
});
