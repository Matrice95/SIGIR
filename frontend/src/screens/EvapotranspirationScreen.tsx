/**
 * Écran Évapotranspiration (ETP)
 * Calcul et suivi de l'évapotranspiration pour irrigation optimale
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

// Components
import Card from '@/components/Card';
import Button from '@/components/Button';

// Store & Constants
import { useAppSelector } from '@/store/hooks';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { getDaysSinceSowing } from '@/services/cropwat';

const screenWidth = Dimensions.get('window').width;

export default function EvapotranspirationScreen() {
  const { activeFieldId, fields } = useAppSelector(state => state.fields);
  const activeField = fields.find(f => f.id === activeFieldId) || fields[0];

  const [refreshing, setRefreshing] = useState(false);

  // Données ETP simulées (à remplacer par calcul réel avec CROPWAT)
  const etpData = {
    labels: ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'J-1', 'Auj.'],
    datasets: [
      {
        data: [5.2, 5.8, 6.1, 5.5, 5.9, 6.3, 5.7],
        color: (opacity = 1) => `rgba(26, 188, 156, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const currentETP = 5.7; // mm/jour
  const cropCoefficient = 1.15; // Kc pour stade actuel
  const waterRequirement = (currentETP * cropCoefficient).toFixed(1);
  const irrigationEfficiency = 0.75; // 75% d'efficience
  const recommendedIrrigation = (parseFloat(waterRequirement) / irrigationEfficiency).toFixed(1);

  const daysSinceSowing = activeField?.planting_date ? getDaysSinceSowing(activeField.planting_date) : 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Recalculer ETP avec données météo
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: COLORS.success,
    },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Parcelle active */}
      {activeField && (
        <Card style={styles.fieldCard}>
          <Text style={styles.fieldName}>🌾 {activeField.name}</Text>
          <Text style={styles.fieldDetail}>
            {activeField.variety} • Jour {daysSinceSowing} du cycle
          </Text>
        </Card>
      )}

      {/* ETP actuelle */}
      <Card style={styles.etpCard}>
        <View style={styles.etpHeader}>
          <Ionicons name="thermometer" size={40} color={COLORS.success} />
          <View style={styles.etpValues}>
            <Text style={styles.etpLabel}>ETP du jour</Text>
            <Text style={styles.etpValue}>{currentETP} mm</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.coefficientRow}>
          <Text style={styles.coefficientLabel}>Coefficient cultural (Kc)</Text>
          <Text style={styles.coefficientValue}>{cropCoefficient}</Text>
        </View>
      </Card>

      {/* Graphique ETP 7 jours */}
      <Card>
        <Text style={styles.sectionTitle}>📊 Évolution ETP (7 jours)</Text>
        <LineChart
          data={etpData}
          width={screenWidth - SPACING.base * 4}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
        />
        <Text style={styles.chartNote}>
          * Évapotranspiration de référence (ET₀)
        </Text>
      </Card>

      {/* Besoins en eau */}
      <Card style={styles.requirementCard}>
        <Text style={styles.sectionTitle}>💧 Besoins en irrigation</Text>

        <View style={styles.requirementItem}>
          <View style={styles.requirementInfo}>
            <Text style={styles.requirementLabel}>Besoin théorique (ETc)</Text>
            <Text style={styles.requirementFormula}>ETc = ET₀ × Kc</Text>
          </View>
          <Text style={styles.requirementValue}>{waterRequirement} mm</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.requirementItem}>
          <View style={styles.requirementInfo}>
            <Text style={styles.requirementLabel}>Irrigation recommandée</Text>
            <Text style={styles.requirementFormula}>
              Efficience {(irrigationEfficiency * 100).toFixed(0)}%
            </Text>
          </View>
          <Text style={[styles.requirementValue, styles.recommendedValue]}>
            {recommendedIrrigation} mm
          </Text>
        </View>

        <Button
          title="Enregistrer irrigation"
          onPress={() => console.log('Add irrigation')}
          variant="primary"
          icon="water"
          fullWidth
          style={styles.actionButton}
        />
      </Card>

      {/* Facteurs d'influence */}
      <Card>
        <Text style={styles.sectionTitle}>🌡️ Facteurs d'influence</Text>

        <View style={styles.factorsList}>
          <View style={styles.factorItem}>
            <Ionicons name="sunny" size={20} color={COLORS.warning} />
            <View style={styles.factorInfo}>
              <Text style={styles.factorLabel}>Rayonnement solaire</Text>
              <Text style={styles.factorValue}>Élevé</Text>
            </View>
          </View>

          <View style={styles.factorItem}>
            <Ionicons name="thermometer" size={20} color={COLORS.error} />
            <View style={styles.factorInfo}>
              <Text style={styles.factorLabel}>Température</Text>
              <Text style={styles.factorValue}>28-32°C</Text>
            </View>
          </View>

          <View style={styles.factorItem}>
            <Ionicons name="water" size={20} color={COLORS.info} />
            <View style={styles.factorInfo}>
              <Text style={styles.factorLabel}>Humidité relative</Text>
              <Text style={styles.factorValue}>75%</Text>
            </View>
          </View>

          <View style={styles.factorItem}>
            <Ionicons name="speedometer" size={20} color={COLORS.secondary} />
            <View style={styles.factorInfo}>
              <Text style={styles.factorLabel}>Vitesse du vent</Text>
              <Text style={styles.factorValue}>12 km/h</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Information méthodologie */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ À propos du calcul ETP</Text>
        <Text style={styles.infoText}>
          L'évapotranspiration potentielle (ETP) est calculée selon la méthode Penman-Monteith 
          recommandée par la FAO. Elle représente la quantité d'eau qui serait perdue par 
          évaporation du sol et transpiration des plantes dans des conditions optimales.
        </Text>
        <Text style={styles.infoText}>
          Le besoin réel de la culture (ETc) est obtenu en multipliant l'ETP par un coefficient 
          cultural (Kc) qui varie selon le stade phénologique du riz.
        </Text>
      </Card>

      {/* Recommandations */}
      <Card>
        <Text style={styles.sectionTitle}>💡 Recommandations</Text>
        <View style={styles.recommendation}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.recommendationText}>
            Irriguer de préférence tôt le matin ou en fin d'après-midi pour réduire 
            les pertes par évaporation
          </Text>
        </View>
        <View style={styles.recommendation}>
          <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
          <Text style={styles.recommendationText}>
            Vérifier l'humidité du sol avant d'irriguer, surtout si des pluies sont prévues
          </Text>
        </View>
      </Card>
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
    paddingBottom: SPACING.xxxl,
  },
  fieldCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primaryLight,
  },
  fieldName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fieldDetail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  etpCard: {
    marginBottom: SPACING.md,
  },
  etpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etpValues: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  etpLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  etpValue: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  coefficientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coefficientLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  coefficientValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chart: {
    marginVertical: SPACING.md,
    borderRadius: 16,
  },
  chartNote: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  requirementCard: {
    marginBottom: SPACING.md,
  },
  requirementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  requirementInfo: {
    flex: 1,
  },
  requirementLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  requirementFormula: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  requirementValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  recommendedValue: {
    color: COLORS.info,
  },
  actionButton: {
    marginTop: SPACING.md,
  },
  factorsList: {
    gap: SPACING.md,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  factorInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  factorLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  factorValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  infoCard: {
    backgroundColor: `${COLORS.info}10`,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  recommendationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
    lineHeight: 20,
  },
});
