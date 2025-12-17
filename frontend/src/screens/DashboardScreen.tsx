/**
 * Écran Dashboard (Accueil)
 * - Affiche la parcelle active
 * - Stade phénologique
 * - Besoin en irrigation
 * - Status santé
 * - Météo preview
 * - Alertes
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Components
import Card from '@/components/Card';
import Button from '@/components/Button';
import HealthBadge from '@/components/HealthBadge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';

// Store & Services
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setFields, setActiveField } from '@/store/slices/fieldsSlice';
import { fieldService } from '@/services/fieldService';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { PHENOLOGICAL_STAGES } from '@/constants/config';
import { getDaysSinceSowing, getCycleProgress } from '@/services/cropwat';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { fields, activeFieldId, isLoading } = useAppSelector(state => state.fields);
  const { alerts, unreadCount } = useAppSelector(state => state.alerts);
  const { user } = useAppSelector(state => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Récupérer la parcelle active
  const activeField = fields && fields.length > 0 
    ? (fields.find(f => f.id === activeFieldId) || fields[0])
    : null;

  useEffect(() => {
    // Charger les données au montage
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Chargement des données du dashboard...');
      setError('');
      
      // Charger les parcelles depuis le backend
      const fieldsData = await fieldService.getFields();
      console.log(`✅ ${fieldsData.length} parcelle(s) chargée(s)`);
      
      // Convertir les données backend au format frontend
      const formattedFields = fieldsData.map(field => {
        console.log('📦 Parcelle brute:', field);
        return {
          id: field.id,
          name: field.name,
          area: field.area,
          variety: field.variety || 'Non spécifié',
          sowingDate: field.planting_date || new Date().toISOString(), // Utiliser date du jour si manquante
          currentStage: 'germination', // Valeur par défaut, sera calculée selon la date
          healthStatus: field.status || 'good',
          location: field.latitude && field.longitude 
            ? { latitude: field.latitude, longitude: field.longitude }
            : undefined,
          soilType: field.soil_type,
          notes: undefined,
        };
      });
      
      dispatch(setFields(formattedFields));
      
      // Définir la première parcelle comme active si aucune n'est définie
      if (formattedFields.length > 0 && !activeFieldId) {
        dispatch(setActiveField(formattedFields[0].id));
      }
      
    } catch (err: any) {
      console.error('❌ Erreur chargement dashboard:', err.message);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading || isLoading) {
    return <Loading fullScreen message="Chargement du tableau de bord..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle"
          title="Erreur de chargement"
          message={error}
          actionLabel="Réessayer"
          onAction={loadDashboardData}
        />
      </View>
    );
  }

  if (!activeField) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="leaf-outline"
          title="Aucune parcelle"
          message="Commencez par créer votre première parcelle de riz pour suivre l'irrigation."
          actionLabel="Créer une parcelle"
          onAction={() => navigation.navigate('AddField' as never)}
        />
      </View>
    );
  }

  // Vérifier que la date de semis existe
  if (!activeField.sowingDate) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle"
          title="Données incomplètes"
          message="Cette parcelle n'a pas de date de semis. Veuillez modifier la parcelle."
          actionLabel="Modifier"
          onAction={() => navigation.navigate('EditField' as never, { fieldId: activeField.id })}
        />
      </View>
    );
  }

  const daysSinceSowing = getDaysSinceSowing(activeField.sowingDate);
  const cycleProgress = getCycleProgress(daysSinceSowing);
  
  // Convertir le stade en majuscules pour correspondre aux clés de PHENOLOGICAL_STAGES
  const stageKey = activeField.currentStage?.toUpperCase() || 'LEVEE';
  const currentStageInfo = PHENOLOGICAL_STAGES[stageKey as keyof typeof PHENOLOGICAL_STAGES] || PHENOLOGICAL_STAGES.LEVEE;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Header utilisateur */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>{user?.name} 👋</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Settings' as never)}>
          <Ionicons name="notifications" size={28} color={COLORS.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Parcelle active */}
      <Card style={styles.fieldCard}>
        <View style={styles.fieldHeader}>
          <View style={styles.fieldInfo}>
            <Text style={styles.fieldName}>{activeField.name}</Text>
            <Text style={styles.fieldDetail}>
              {activeField.area} ha • {activeField.variety}
            </Text>
          </View>
          <HealthBadge status={activeField.healthStatus} size="large" />
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.fieldStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{daysSinceSowing}</Text>
            <Text style={styles.statLabel}>Jours depuis semis</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{cycleProgress}%</Text>
            <Text style={styles.statLabel}>Cycle complété</Text>
          </View>
        </View>
      </Card>

      {/* Stade phénologique */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{currentStageInfo.icon}</Text>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Stade actuel</Text>
            <Text style={styles.stageName}>{currentStageInfo.name}</Text>
          </View>
          {currentStageInfo.critical && (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>CRITIQUE</Text>
            </View>
          )}
        </View>
        
        {/* Barre de progression */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${cycleProgress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Jour {currentStageInfo.dayStart}-{currentStageInfo.dayEnd} / 120 jours
        </Text>
      </Card>

      {/* Besoin irrigation */}
      <Card style={styles.irrigationCard}>
        <View style={styles.irrigationHeader}>
          <Ionicons name="water" size={32} color={COLORS.info} />
          <View style={styles.irrigationInfo}>
            <Text style={styles.irrigationTitle}>Besoin en eau</Text>
            <Text style={styles.irrigationValue}>8.5 mm</Text>
            <Text style={styles.irrigationSubtitle}>Irrigation recommandée: 11.3 mm</Text>
          </View>
        </View>
        
        <Button
          title="Enregistrer irrigation"
          onPress={() => navigation.navigate('AddOperation' as never, { fieldId: activeField.id })}
          variant="primary"
          icon="add-circle"
          fullWidth
          style={styles.irrigationButton}
        />
      </Card>

      {/* Météo 7 jours */}
      <Card>
        <View style={styles.sectionHeader}>
          <Ionicons name="partly-sunny" size={24} color={COLORS.secondary} />
          <Text style={styles.sectionTitle}>Météo 7 jours</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weatherScroll}>
          {[...Array(7)].map((_, i) => (
            <View key={i} style={styles.weatherDay}>
              <Text style={styles.weatherDate}>
                {i === 0 ? "Auj." : `J+${i}`}
              </Text>
              <Text style={styles.weatherIcon}>⛅</Text>
              <Text style={styles.weatherTemp}>28°C</Text>
              <Text style={styles.weatherRain}>💧 5mm</Text>
            </View>
          ))}
        </ScrollView>
      </Card>

      {/* Alertes récentes */}
      {alerts.length > 0 && (
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            <Text style={styles.sectionTitle}>Alertes urgentes</Text>
          </View>
          
          {alerts.slice(0, 3).map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage} numberOfLines={2}>
                  {alert.message}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          ))}
        </Card>
      )}

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <Button
          title="Météo détaillée"
          onPress={() => navigation.navigate('Weather' as never)}
          variant="outline"
          icon="partly-sunny"
          fullWidth
        />
        <Button
          title="Évapotranspiration"
          onPress={() => navigation.navigate('Evapotranspiration' as never)}
          variant="outline"
          icon="thermometer"
          fullWidth
          style={styles.actionButton}
        />
      </View>

      <View style={styles.quickActions}>
        <Button
          title="Voir toutes les alertes"
          onPress={() => navigation.navigate('Alerts' as never)}
          variant="outline"
          icon="notifications"
          fullWidth
        />
        <Button
          title="Carte satellite"
          onPress={() => navigation.navigate('Map' as never)}
          variant="outline"
          icon="map"
          fullWidth
          style={styles.actionButton}
        />
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  
  // Parcelle active
  fieldCard: {
    backgroundColor: COLORS.primary,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  fieldDetail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    opacity: 0.9,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.textLight,
    opacity: 0.2,
    marginVertical: SPACING.base,
  },
  fieldStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textLight,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  
  // Section commune
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionIcon: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    marginRight: SPACING.sm,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
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
  
  // Barre de progression
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
  
  // Irrigation
  irrigationCard: {
    backgroundColor: `${COLORS.info}10`,
  },
  irrigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  irrigationInfo: {
    marginLeft: SPACING.base,
    flex: 1,
  },
  irrigationTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  irrigationValue: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.info,
  },
  irrigationSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  irrigationButton: {
    marginTop: SPACING.md,
  },
  
  // Météo
  weatherScroll: {
    marginTop: SPACING.md,
  },
  weatherDay: {
    alignItems: 'center',
    marginRight: SPACING.base,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    minWidth: 80,
  },
  weatherDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  weatherIcon: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    marginVertical: SPACING.xs,
  },
  weatherTemp: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  weatherRain: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.info,
    marginTop: SPACING.xs,
  },
  
  // Alertes
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  alertMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  
  // Actions rapides
  quickActions: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    marginTop: SPACING.md,
  },
});
