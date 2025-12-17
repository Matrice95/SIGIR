/**
 * Écran Alertes
 * Affiche toutes les alertes et notifications
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Components
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';

// Store & Constants
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { markAlertAsRead, deleteAlert } from '@/store/slices/alertsSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function AlertsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { alerts, unreadCount } = useAppSelector(state => state.alerts);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read;
    if (filter === 'critical') return alert.priority === 'critical';
    return true;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Recharger les alertes
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAlertPress = (alertId: string) => {
    dispatch(markAlertAsRead(alertId));
    // TODO: Navigation selon le type d'alerte
  };

  const handleDeleteAlert = (alertId: string) => {
    dispatch(deleteAlert(alertId));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'irrigation':
        return 'water';
      case 'weather':
        return 'rainy';
      case 'pest':
        return 'bug';
      case 'fertilization':
        return 'leaf';
      case 'system':
        return 'information-circle';
      default:
        return 'alert-circle';
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return COLORS.critical;
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      default:
        return COLORS.info;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
    }
  };

  const renderAlert = ({ item }: any) => (
    <Card style={[styles.alertCard, !item.read && styles.unreadCard]}>
      <Pressable onPress={() => handleAlertPress(item.id)}>
        <View style={styles.alertHeader}>
          <View
            style={[
              styles.alertIconContainer,
              { backgroundColor: `${getAlertColor(item.priority)}20` },
            ]}
          >
            <Ionicons
              name={getAlertIcon(item.type) as any}
              size={24}
              color={getAlertColor(item.priority)}
            />
          </View>
          <View style={styles.alertContent}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.alertMessage}>{item.message}</Text>
            <Text style={styles.alertDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDeleteAlert(item.id)}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>
      </Pressable>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* En-tête avec statistiques */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alertes</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Filtres */}
      <View style={styles.filters}>
        <Pressable
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Toutes ({alerts.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === 'unread' && styles.filterActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Non lues ({unreadCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === 'critical' && styles.filterActive]}
          onPress={() => setFilter('critical')}
        >
          <Text style={[styles.filterText, filter === 'critical' && styles.filterTextActive]}>
            Critiques
          </Text>
        </Pressable>
      </View>

      {/* Liste des alertes */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon="checkmark-circle"
          title="Aucune alerte"
          message={
            filter === 'unread'
              ? "Vous avez lu toutes vos alertes !"
              : "Aucune alerte pour le moment"
          }
        />
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={item => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  badgeText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  filters: {
    flexDirection: 'row',
    padding: SPACING.base,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textLight,
  },
  list: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  alertCard: {
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border,
  },
  unreadCard: {
    backgroundColor: `${COLORS.primary}05`,
    borderLeftColor: COLORS.primary,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  alertMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  alertDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
