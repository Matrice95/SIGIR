/**
 * Écran Journal de Bord - Version améliorée
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Image, Alert } from 'react-native';
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

  const [filter, setFilter] = useState<'all' | '7d' | '30d'>('7d');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOperations = operations.filter(op => {
    if (!activeField) return false;
    if (op.fieldId !== activeField.id) return false;
    
    // Filtre de recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const operationType = OPERATION_TYPES[op.type as keyof typeof OPERATION_TYPES];
      const matchName = operationType?.name.toLowerCase().includes(query);
      const matchDescription = op.description?.toLowerCase().includes(query);
      const matchNotes = (op as any).notes?.toLowerCase().includes(query);
      if (!matchName && !matchDescription && !matchNotes) return false;
    }
    
    // Filtre temporel
    if (filter === '7d') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(op.date) >= weekAgo;
    }
    if (filter === '30d') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return new Date(op.date) >= monthAgo;
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
      {/* En-tête avec recherche */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Rechercher entrée..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Filtres temporels */}
        <View style={styles.filtersRow}>
          <Text style={styles.filterLabel}>Filtrer:</Text>
          <View style={styles.filters}>
            <Pressable
              style={[styles.filterButton, filter === '7d' && styles.filterActive]}
              onPress={() => setFilter('7d')}
            >
              <Text style={[styles.filterText, filter === '7d' && styles.filterTextActive]}>
                📅 7 jours
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
            <Pressable
              style={[styles.filterButton, filter === 'all' && styles.filterActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                Tous
              </Text>
            </Pressable>
          </View>
        </View>
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
            const operationType = OPERATION_TYPES[item.type as keyof typeof OPERATION_TYPES];
            const operationDate = new Date(item.date);
            const itemData = item as any;
            
            return (
              <View style={styles.operationContainer}>
                {/* Date de l'entrée */}
                <Text style={styles.entryDate}>
                  {format(operationDate, 'dd MMMM yyyy, HH:mm', { locale: fr }).toUpperCase()}
                </Text>
                
                <Card style={styles.operationCard} onPress={() => navigation.navigate('OperationDetails' as never, { operationId: item.id })}>
                  {/* En-tête avec icône et type */}
                  <View style={styles.operationHeader}>
                    <Text style={styles.operationIcon}>{operationType?.icon || '📝'}</Text>
                    <Text style={styles.operationName}>{operationType?.name || item.type}</Text>
                  </View>
                  
                  {/* Détails spécifiques selon le type */}
                  {item.type === 'irrigation' && (
                    <View style={styles.operationDetails}>
                      {itemData.waterAmount && (
                        <Text style={styles.detailText}>Volume: {itemData.waterAmount} mm{itemData.duration && ` (${itemData.duration} heures)`}</Text>
                      )}
                      {itemData.method && <Text style={styles.detailText}>Méthode: {itemData.method}</Text>}
                    </View>
                  )}
                  
                  {item.type === 'fertilization' && (
                    <View style={styles.operationDetails}>
                      {itemData.fertilizerType && <Text style={styles.detailText}>Type: {itemData.fertilizerType}</Text>}
                      {itemData.amount && <Text style={styles.detailText}>Quantité: {itemData.amount} kg/ha</Text>}
                    </View>
                  )}
                  
                  {item.type === 'treatment' && (
                    <View style={styles.operationDetails}>
                      {itemData.treatmentType && <Text style={styles.detailText}>Traitement: {itemData.treatmentType}</Text>}
                      {itemData.product && <Text style={styles.detailText}>Produit: {itemData.product}</Text>}
                      {itemData.dosage && <Text style={styles.detailText}>Dosage: {itemData.dosage}</Text>}
                    </View>
                  )}
                  
                  {/* Notes */}
                  {itemData.notes && (
                    <Text style={styles.operationNotes} numberOfLines={3}>
                      Notes: {itemData.notes}
                    </Text>
                  )}
                  
                  {/* Photos */}
                  {item.photos && item.photos.length > 0 && (
                    <View style={styles.photosContainer}>
                      <Text style={styles.photosLabel}>📸 {item.photos.length} photo(s)</Text>
                    </View>
                  )}
                  
                  {/* Footer avec date de création et statut sync */}
                  <View style={styles.operationFooter}>
                    <Text style={styles.createdAt}>
                      Créé à: {format(new Date(item.createdAt || item.date), 'dd MMM HH:mm', { locale: fr })}
                    </Text>
                    {item.isSynced ? (
                      <View style={styles.syncStatus}>
                        <Text style={styles.syncedText}>Synchronisé ✓</Text>
                      </View>
                    ) : (
                      <View style={styles.syncStatus}>
                        <Ionicons name="time" size={14} color={COLORS.warning} />
                        <Text style={styles.pendingText}>En attente</Text>
                      </View>
                    )}
                  </View>
                </Card>
              </View>
            );
          }}
        />
      )}

      {/* Boutons d'action en bas */}
      <View style={styles.actionsFooter}>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddOperation' as never, { fieldId: activeField.id })}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>➕ AJOUTER{'\n'}ENTRÉE</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => Alert.alert('Rapport', 'Fonctionnalité à venir')}
        >
          <Ionicons name="stats-chart" size={24} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>📊 RAPPORT{'\n'}MENSUEL</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    height: '100%',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filters: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: SPACING.xs,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  filterTextActive: {
    color: COLORS.textLight,
  },
  list: {
    padding: SPACING.base,
    paddingBottom: 100,
  },
  operationContainer: {
    marginBottom: SPACING.lg,
  },
  entryDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  operationCard: {
    backgroundColor: COLORS.white,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  operationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  operationIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  operationName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  operationDetails: {
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.base,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    marginBottom: 4,
  },
  operationNotes: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  photosContainer: {
    marginBottom: SPACING.sm,
  },
  photosLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  operationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  createdAt: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  pendingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning,
  },
  actionsFooter: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
});
