/**
 * Écran Détails Opération
 * Affiche les détails complets d'une opération agricole
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// Components
import Card from '@/components/Card';
import Button from '@/components/Button';

// Store & Constants
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { deleteOperation } from '@/store/slices/operationsSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function OperationDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();

  const { operationId } = route.params as { operationId: string };
  const { operations } = useAppSelector(state => state.operations);
  const { fields } = useAppSelector(state => state.fields);

  const operation = operations.find(op => op.id === operationId);
  const field = operation ? fields.find(f => f.id === operation.fieldId) : null;

  if (!operation) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Opération non trouvée</Text>
        <Button
          title="Retour"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'opération',
      'Êtes-vous sûr de vouloir supprimer cette opération ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteOperation(operationId));
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    Alert.alert('Info', 'Fonctionnalité d\'édition à venir');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOperationIcon = () => {
    switch (operation.type) {
      case 'irrigation':
        return 'water';
      case 'fertilization':
        return 'leaf';
      case 'treatment':
        return 'medkit';
      default:
        return 'eye';
    }
  };

  const getOperationTitle = () => {
    switch (operation.type) {
      case 'irrigation':
        return 'Irrigation';
      case 'fertilization':
        return 'Fertilisation';
      case 'treatment':
        return 'Traitement';
      default:
        return 'Observation';
    }
  };

  const getOperationColor = () => {
    switch (operation.type) {
      case 'irrigation':
        return COLORS.info;
      case 'fertilization':
        return COLORS.success;
      case 'treatment':
        return COLORS.warning;
      default:
        return COLORS.secondary;
    }
  };

  const renderTypeSpecificInfo = () => {
    const op = operation as any;

    switch (operation.type) {
      case 'irrigation':
        return (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quantité d'eau</Text>
              <Text style={styles.infoValue}>{op.waterAmount} mm</Text>
            </View>
            {op.duration && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Durée</Text>
                <Text style={styles.infoValue}>{op.duration} heures</Text>
              </View>
            )}
            {op.method && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Méthode</Text>
                <Text style={styles.infoValue}>{op.method}</Text>
              </View>
            )}
          </>
        );

      case 'fertilization':
        return (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type d'engrais</Text>
              <Text style={styles.infoValue}>{op.fertilizerType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quantité</Text>
              <Text style={styles.infoValue}>{op.amount} kg/ha</Text>
            </View>
          </>
        );

      case 'treatment':
        return (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type de traitement</Text>
              <Text style={styles.infoValue}>{op.treatmentType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Produit</Text>
              <Text style={styles.infoValue}>{op.product}</Text>
            </View>
            {op.dosage && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dosage</Text>
                <Text style={styles.infoValue}>{op.dosage}</Text>
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête avec icône */}
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getOperationColor()}20` },
            ]}
          >
            <Ionicons
              name={getOperationIcon() as any}
              size={48}
              color={getOperationColor()}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.operationType}>{getOperationTitle()}</Text>
            <Text style={styles.operationDate}>{formatDate(operation.date)}</Text>
          </View>
        </View>
      </Card>

      {/* Parcelle */}
      {field && (
        <Card>
          <Text style={styles.cardTitle}>🌾 Parcelle</Text>
          <Pressable
            style={styles.fieldInfo}
            onPress={() => navigation.navigate('FieldDetails' as never, { fieldId: field.id })}
          >
            <View>
              <Text style={styles.fieldName}>{field.name}</Text>
              <Text style={styles.fieldDetail}>
                {field.area} ha • {field.variety}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </Pressable>
        </Card>
      )}

      {/* Détails spécifiques */}
      <Card>
        <Text style={styles.cardTitle}>📊 Détails</Text>
        {renderTypeSpecificInfo()}
      </Card>

      {/* Notes */}
      {operation.notes && (
        <Card>
          <Text style={styles.cardTitle}>📝 Notes</Text>
          <Text style={styles.notesText}>{operation.notes}</Text>
        </Card>
      )}

      {/* Photos */}
      {operation.photos && operation.photos.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>📷 Photos ({operation.photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {operation.photos.map((photo, index) => (
                <Pressable key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Card>
      )}

      {/* Métadonnées */}
      <Card>
        <Text style={styles.cardTitle}>ℹ️ Informations</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Créée le</Text>
          <Text style={styles.infoValue}>
            {new Date(operation.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
        {operation.updatedAt !== operation.createdAt && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Modifiée le</Text>
            <Text style={styles.infoValue}>
              {new Date(operation.updatedAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Modifier"
          onPress={handleEdit}
          variant="outline"
          icon="create"
          fullWidth
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
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  headerCard: {
    marginBottom: SPACING.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  operationType: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  operationDate: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  fieldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  fieldName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fieldDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
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
  notesText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    lineHeight: 24,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  photoWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: 150,
    height: 150,
    backgroundColor: COLORS.border,
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
});
