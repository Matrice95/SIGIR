/**
 * Écran Journal de Bord
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { OPERATION_TYPES } from '@/constants/config';
import Card from '@/components/Card';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import { useAppSelector } from '@/store/hooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function JournalScreen() {
  const navigation = useNavigation();
  const { operations } = useAppSelector(state => state.operations);
  const { fields, activeFieldId } = useAppSelector(state => state.fields);
  const activeField = fields && fields.length > 0 
    ? (fields.find(f => f.id === activeFieldId) || fields[0])
    : null;

  const [filter, setFilter] = useState<'all' | '7d' | '30d'>('all');

  const filteredOperations = operations.filter(op => {
    if (!activeField) return false;
    if (op.fieldId !== activeField.id) return false;
    
    if (filter === '7d') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return op.date >= weekAgo;
    }
    if (filter === '30d') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return op.date >= monthAgo;
    }
    return true;
  });

  if (!activeField) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="book-outline"
          title="Aucune parcelle"
          message="Créez une parcelle pour commencer à enregistrer vos opérations."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filters}>
        <Pressable
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tous
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === '7d' && styles.filterActive]}
          onPress={() => setFilter('7d')}
        >
          <Text style={[styles.filterText, filter === '7d' && styles.filterTextActive]}>
            7 jours
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === '30d' && styles.filterActive]}
          onPress={() => setFilter('30d')}
        >
          <Text style={[styles.filterText, filter === '30d' && styles.filterTextActive]}>
            30 jours
          </Text>
        </Pressable>
      </View>

      {/* Liste des opérations */}
      {filteredOperations.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title="Aucune opération"
          message="Commencez à enregistrer vos activités agricoles."
          actionLabel="Ajouter une opération"
          onAction={() => navigation.navigate('AddOperation' as never, { fieldId: activeField.id })}
        />
      ) : (
        <FlatList
          data={filteredOperations}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const operationType = OPERATION_TYPES[item.type];
            
            return (
              <Card onPress={() => navigation.navigate('OperationDetails' as never, { operationId: item.id })}>
                <View style={styles.operationHeader}>
                  <View style={styles.operationInfo}>
                    <View style={styles.operationTitleRow}>
                      <Text style={styles.operationIcon}>{operationType.icon}</Text>
                      <Text style={styles.operationName}>{operationType.name}</Text>
                    </View>
                    <Text style={styles.operationDate}>
                      {format(item.date, 'dd MMMM yyyy', { locale: fr })}
                    </Text>
                    <Text style={styles.operationDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                  
                  <View style={styles.operationMeta}>
                    {item.isSynced ? (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    ) : (
                      <Ionicons name="time" size={20} color={COLORS.warning} />
                    )}
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* Bouton flottant */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddOperation' as never, { fieldId: activeField.id })}
      >
        <Ionicons name="add" size={32} color={COLORS.textLight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filters: {
    flexDirection: 'row',
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  filterTextActive: {
    color: COLORS.textLight,
  },
  list: {
    padding: SPACING.base,
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  operationInfo: {
    flex: 1,
  },
  operationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  operationIcon: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    marginRight: SPACING.sm,
  },
  operationName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  operationDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  operationDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
  },
  operationMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
