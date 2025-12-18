/**
 * IrrigationDetailScreen - Bilan hydrique détaillé
 * Calculs basés sur ETP, SMI, et données météo réelles
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';

// Components
import InfoCard from '@/components/InfoCard';
import ProgressBar from '@/components/ProgressBar';

// Services & Store
import { useAppSelector } from '@/store/hooks';
import backendService, { SMIData, WeatherData, ETPData, RainfallData } from '@/services/backendService';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { calculatePhenology } from '@/utils/dashboardUtils';

interface WaterBalanceData {
  et0: number; // Évapotranspiration de référence
  kc: number; // Coefficient cultural
  etc: number; // Besoin net réel (ET0 * Kc)
  effectiveRain7d: number; // Pluie effective 7 jours
  cumulativeDeficit: number; // Déficit cumulé
  irrigationRecommendation: 'DO_NOT_IRRIGATE' | 'MONITOR' | 'IRRIGATE_SOON' | 'IRRIGATE_NOW';
  nextCheckDate: Date;
  soilMoisture: number; // SMI en %
}

interface IrrigationEvent {
  date: string;
  amount: number; // mm
  type: 'rain' | 'manual' | 'auto';
}

export default function IrrigationDetailScreen() {
  const navigation = useNavigation();
  const { activeFieldId, fields } = useAppSelector(state => state.fields);
  const activeField = fields.find(f => f.id === activeFieldId);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [waterBalance, setWaterBalance] = useState<WaterBalanceData | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [irrigationHistory, setIrrigationHistory] = useState<IrrigationEvent[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [smiData, setSmiData] = useState<SMIData | null>(null);

  useEffect(() => {
    if (activeField) {
      loadIrrigationData();
    }
  }, [activeField?.id]);

  const loadIrrigationData = async () => {
    if (!activeField) return;

    try {
      setLoading(true);

      // Charger toutes les données en parallèle
      const [weather, rainfall, smi] = await Promise.all([
        backendService.getWeatherForecast(activeField.id),
        backendService.getRainfall(activeField.id, 30),
        backendService.getSMI(activeField.id),
      ]);

      setWeatherData(weather);
      setSmiData(smi);

      // Calculer le coefficient cultural basé sur le stade phénologique
      const fieldData: any = activeField;
      const phenology = fieldData.planting_date 
        ? calculatePhenology(fieldData.planting_date)
        : null;

      const kc = getKcFromStage(phenology?.stage || 'TALLAGE');

      // Calculer ET0 moyen des 7 derniers jours
      const et0_avg = weather.daily.slice(0, 7).reduce((sum, d) => sum + d.et0_fao_evapotranspiration, 0) / 7;
      
      // Besoin réel de la culture
      const etc = et0_avg * kc;

      // Pluie effective 7 derniers jours
      const rain7d = rainfall.slice(0, 7).reduce((sum, r) => sum + r.precipitation, 0);
      const effectiveRain = rain7d * 0.8; // 80% efficacité

      // Déficit cumulé (simplifié)
      const daysSincePlanting = phenology ? phenology.daysSincePlanting : 30;
      const totalNeeds = etc * daysSincePlanting;
      const totalRain = rainfall.slice(0, daysSincePlanting).reduce((sum, r) => sum + r.precipitation, 0) * 0.8;
      const deficit = Math.max(0, totalNeeds - totalRain);

      // Déterminer la recommandation
      let recommendation: WaterBalanceData['irrigationRecommendation'] = 'MONITOR';
      const smiPercent = smi ? smi.smi * 100 : 50;
      const futureRain = weather.daily.slice(0, 3).reduce((sum, d) => sum + d.precipitation_sum, 0);

      if (smiPercent < 20) {
        recommendation = 'IRRIGATE_NOW';
      } else if (smiPercent < 35 && futureRain < 10) {
        recommendation = 'IRRIGATE_SOON';
      } else if (futureRain > 20) {
        recommendation = 'DO_NOT_IRRIGATE';
      }

      const balance: WaterBalanceData = {
        et0: et0_avg,
        kc,
        etc,
        effectiveRain7d: effectiveRain,
        cumulativeDeficit: deficit,
        irrigationRecommendation: recommendation,
        nextCheckDate: getNextCheckDate(recommendation),
        soilMoisture: smiPercent,
      };

      setWaterBalance(balance);

      // Préparer données graphique (15 derniers jours)
      const last15Days = rainfall.slice(0, 15).reverse();
      const labels = last15Days.map((_, i) => i === 0 ? 'Auj' : i === 7 ? '-7j' : i === 14 ? '-15j' : '');
      const rainData = last15Days.map(r => r.precipitation);
      const needsData = last15Days.map(() => etc);

      setChartData({
        labels,
        datasets: [
          {
            data: rainData,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Bleu
            strokeWidth: 2,
          },
          {
            data: needsData,
            color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`, // Orange
            strokeWidth: 2,
          },
        ],
        legend: ['Pluie reçue', 'Besoin culture'],
      });

      // Historique irrigation (simulé - à remplacer par vraies données backend)
      const history: IrrigationEvent[] = rainfall.slice(0, 4).map(r => ({
        date: r.date,
        amount: r.precipitation,
        type: r.precipitation > 40 ? 'rain' : r.precipitation > 10 ? 'rain' : 'manual',
      }));
      setIrrigationHistory(history);

    } catch (error) {
      console.error('Erreur chargement irrigation:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadIrrigationData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Calcul du bilan hydrique...</Text>
      </View>
    );
  }

  if (!waterBalance) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Impossible de charger les données</Text>
      </View>
    );
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'DO_NOT_IRRIGATE': return '#10b981';
      case 'MONITOR': return '#f59e0b';
      case 'IRRIGATE_SOON': return '#f97316';
      case 'IRRIGATE_NOW': return '#dc2626';
      default: return COLORS.textSecondary;
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'DO_NOT_IRRIGATE': return '❌ NE PAS IRRIGUER';
      case 'MONITOR': return '👀 SURVEILLER';
      case 'IRRIGATE_SOON': return '⚠️ IRRIGUER BIENTÔT';
      case 'IRRIGATE_NOW': return '🚨 IRRIGUER MAINTENANT';
      default: return 'SURVEILLER';
    }
  };

  const getRecommendationDetails = () => {
    const { irrigationRecommendation, soilMoisture, cumulativeDeficit } = waterBalance;
    const futureRain = weatherData?.daily.slice(0, 3).reduce((sum, d) => sum + d.precipitation_sum, 0) || 0;

    switch (irrigationRecommendation) {
      case 'DO_NOT_IRRIGATE':
        return `Pluie prévue (${Math.round(futureRain)}mm). Sol humide (${Math.round(soilMoisture)}%). Attendre.`;
      case 'MONITOR':
        return `Situation acceptable. SMI: ${Math.round(soilMoisture)}%. Surveiller évolution.`;
      case 'IRRIGATE_SOON':
        return `Sol en déficit (${Math.round(soilMoisture)}%). Planifier irrigation dans 24-48h.`;
      case 'IRRIGATE_NOW':
        return `Situation critique! SMI ${Math.round(soilMoisture)}%. Irrigation urgente requise.`;
      default:
        return 'Surveiller la situation';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>💧 IRRIGATION DÉTAIL</Text>
      </View>

      {/* Bilan hydrique actuel */}
      <InfoCard title="BILAN HYDRIQUE ACTUEL" icon="water" iconColor="#3b82f6">
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Évapotranspiration réf. (ET₀):</Text>
          <Text style={styles.balanceValue}>{waterBalance.et0.toFixed(1)} mm/jour</Text>
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Coefficient culture (Kc):</Text>
          <Text style={styles.balanceValue}>{waterBalance.kc.toFixed(2)}</Text>
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Besoin net réel (ETc):</Text>
          <Text style={[styles.balanceValue, { fontWeight: '700', color: COLORS.primary }]}>
            {waterBalance.etc.toFixed(1)} mm/jour
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Pluie effective (7j):</Text>
          <Text style={styles.balanceValue}>
            {waterBalance.effectiveRain7d.toFixed(0)} mm
          </Text>
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Humidité sol (SMI):</Text>
          <Text style={[styles.balanceValue, { color: waterBalance.soilMoisture < 35 ? '#f97316' : '#10b981' }]}>
            {waterBalance.soilMoisture.toFixed(0)}%
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.deficitBox}>
          <Text style={styles.deficitLabel}>DÉFICIT CUMULÉ:</Text>
          <Text style={styles.deficitValue}>{waterBalance.cumulativeDeficit.toFixed(0)} mm</Text>
        </View>
      </InfoCard>

      {/* Graphique temps réel */}
      {chartData && (
        <InfoCard title="GRAPHIQUE 15 DERNIERS JOURS" icon="analytics" iconColor="#8b5cf6">
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 60}
            height={200}
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '3',
                strokeWidth: '2',
              },
            }}
            bezier
            style={styles.chart}
          />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>Pluie reçue</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
              <Text style={styles.legendText}>Besoin culture</Text>
            </View>
          </View>
        </InfoCard>
      )}

      {/* Recommandation */}
      <InfoCard title="RECOMMANDATION" icon="bulb" iconColor="#f59e0b">
        <View style={[styles.statusBadge, { backgroundColor: getRecommendationColor(waterBalance.irrigationRecommendation) + '20' }]}>
          <Text style={[styles.statusText, { color: getRecommendationColor(waterBalance.irrigationRecommendation) }]}>
            {getRecommendationText(waterBalance.irrigationRecommendation)}
          </Text>
        </View>

        <Text style={styles.recommendationDetail}>{getRecommendationDetails()}</Text>

        <View style={styles.separator} />

        <Text style={styles.conditionsTitle}>✅ IRRIGUER SI:</Text>
        <Text style={styles.conditionItem}>• Pas de pluie {'>'}  3 jours</Text>
        <Text style={styles.conditionItem}>• SMI descend sous 30%</Text>
        <Text style={styles.conditionItem}>• Déficit cumulé {'>'} 60 mm</Text>
        <Text style={styles.conditionItem}>• Stade critique (floraison)</Text>

        <View style={styles.separator} />

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>⏰ Prochaine vérification:</Text>
          <Text style={styles.balanceValue}>
            {waterBalance.nextCheckDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
          </Text>
        </View>
      </InfoCard>

      {/* Historique */}
      <InfoCard title="HISTORIQUE IRRIGATION (30 jours)" icon="list" iconColor="#10b981">
        {irrigationHistory.map((event, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={styles.historyDate}>
              <Ionicons
                name={event.type === 'rain' ? 'rainy' : 'water'}
                size={20}
                color={event.type === 'rain' ? '#3b82f6' : '#10b981'}
              />
              <Text style={styles.historyDateText}>
                {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
            <Text style={styles.historyAmount}>
              {event.amount.toFixed(0)} mm ({event.type === 'rain' ? 'pluie' : 'manuelle'})
            </Text>
          </View>
        ))}
      </InfoCard>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => {}}>
          <Ionicons name="calculator" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>DÉTAILS{'\n'}CALCULS</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Journal' as never)}>
          <Ionicons name="document-text" size={24} color={COLORS.primary} />
          <Text style={styles.actionText}>JOURNAL{'\n'}IRRIGATIONS</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// Helpers
function getKcFromStage(stage: string): number {
  const kcValues: Record<string, number> = {
    SEMIS: 0.3,
    LEVEE: 0.5,
    TALLAGE: 1.15,
    INITIATION_PANICULE: 1.2,
    FLORAISON: 1.2,
    MATURATION: 0.9,
  };
  return kcValues[stage] || 1.1;
}

function getNextCheckDate(recommendation: string): Date {
  const now = new Date();
  const daysToAdd = recommendation === 'IRRIGATE_NOW' ? 1 : recommendation === 'IRRIGATE_SOON' ? 2 : 3;
  now.setDate(now.getDate() + daysToAdd);
  return now;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl + 20,
    backgroundColor: COLORS.white,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  balanceLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  balanceValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  deficitBox: {
    backgroundColor: '#fff7ed',
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  deficitLabel: {
    ...TYPOGRAPHY.small,
    color: '#f97316',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  deficitValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f97316',
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.lg,
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
  statusBadge: {
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  recommendationDetail: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  conditionsTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  conditionItem: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  historyDateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  historyAmount: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
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
  },
  actionText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
