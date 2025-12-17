/**
 * Écran Ajouter Opération
 * Formulaire pour enregistrer irrigation, fertilisation, traitement
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Components
import Button from '@/components/Button';
import Card from '@/components/Card';

// Store & Constants
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addOperation } from '@/store/slices/operationsSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

type OperationType = 'irrigation' | 'fertilization' | 'treatment' | 'observation';

const OPERATION_TYPES = [
  { id: 'irrigation', name: 'Irrigation', icon: 'water', color: COLORS.info },
  { id: 'fertilization', name: 'Fertilisation', icon: 'leaf', color: COLORS.success },
  { id: 'treatment', name: 'Traitement', icon: 'medkit', color: COLORS.warning },
  { id: 'observation', name: 'Observation', icon: 'eye', color: COLORS.secondary },
];

export default function AddOperationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();

  const { fieldId } = route.params as { fieldId?: string };
  const { fields, activeFieldId } = useAppSelector(state => state.fields);

  // État du formulaire
  const [type, setType] = useState<OperationType>('irrigation');
  const [selectedFieldId, setSelectedFieldId] = useState(fieldId || activeFieldId || '');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Champs spécifiques
  const [waterAmount, setWaterAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [method, setMethod] = useState('');
  
  const [fertilizerType, setFertilizerType] = useState('');
  const [fertilizerAmount, setFertilizerAmount] = useState('');
  
  const [treatmentType, setTreatmentType] = useState('');
  const [product, setProduct] = useState('');
  const [dosage, setDosage] = useState('');
  
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedFieldId) {
      newErrors.field = 'Veuillez sélectionner une parcelle';
    }

    if (type === 'irrigation') {
      if (!waterAmount || parseFloat(waterAmount) <= 0) {
        newErrors.waterAmount = 'Quantité d\'eau requise';
      }
    } else if (type === 'fertilization') {
      if (!fertilizerType.trim()) {
        newErrors.fertilizerType = 'Type d\'engrais requis';
      }
      if (!fertilizerAmount || parseFloat(fertilizerAmount) <= 0) {
        newErrors.fertilizerAmount = 'Quantité d\'engrais requise';
      }
    } else if (type === 'treatment') {
      if (!treatmentType.trim()) {
        newErrors.treatmentType = 'Type de traitement requis';
      }
      if (!product.trim()) {
        newErrors.product = 'Produit requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const baseOperation = {
        id: `op_${Date.now()}`,
        fieldId: selectedFieldId,
        type,
        date: date.toISOString(),
        notes: notes.trim(),
        photos,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let operation: any = { ...baseOperation };

      // Ajouter les champs spécifiques
      if (type === 'irrigation') {
        operation = {
          ...operation,
          waterAmount: parseFloat(waterAmount),
          duration: duration ? parseFloat(duration) : undefined,
          method: method || undefined,
        };
      } else if (type === 'fertilization') {
        operation = {
          ...operation,
          fertilizerType,
          amount: parseFloat(fertilizerAmount),
        };
      } else if (type === 'treatment') {
        operation = {
          ...operation,
          treatmentType,
          product,
          dosage: dosage || undefined,
        };
      }

      dispatch(addOperation(operation));

      // TODO: Sauvegarder dans Realm
      console.log('✅ Opération créée:', operation);

      Alert.alert(
        'Succès',
        'L\'opération a été enregistrée avec succès !',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Erreur création opération:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'opération');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const renderTypeSpecificFields = () => {
    switch (type) {
      case 'irrigation':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Quantité d'eau (mm) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.waterAmount && styles.inputError]}
                placeholder="Ex: 25"
                value={waterAmount}
                onChangeText={(text) => {
                  setWaterAmount(text.replace(/[^0-9.]/g, ''));
                  setErrors({ ...errors, waterAmount: '' });
                }}
                keyboardType="decimal-pad"
              />
              {errors.waterAmount && <Text style={styles.errorText}>{errors.waterAmount}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Durée (heures)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 3"
                value={duration}
                onChangeText={(text) => setDuration(text.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Méthode</Text>
              <View style={styles.methodButtons}>
                {['Submersion', 'Aspersion', 'Goutte à goutte'].map((m) => (
                  <Pressable
                    key={m}
                    style={[
                      styles.methodButton,
                      method === m && styles.methodButtonActive,
                    ]}
                    onPress={() => setMethod(m)}
                  >
                    <Text
                      style={[
                        styles.methodButtonText,
                        method === m && styles.methodButtonTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        );

      case 'fertilization':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Type d'engrais <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.fertilizerType && styles.inputError]}
                placeholder="Ex: NPK 15-15-15"
                value={fertilizerType}
                onChangeText={(text) => {
                  setFertilizerType(text);
                  setErrors({ ...errors, fertilizerType: '' });
                }}
              />
              {errors.fertilizerType && <Text style={styles.errorText}>{errors.fertilizerType}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Quantité (kg/ha) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.fertilizerAmount && styles.inputError]}
                placeholder="Ex: 50"
                value={fertilizerAmount}
                onChangeText={(text) => {
                  setFertilizerAmount(text.replace(/[^0-9.]/g, ''));
                  setErrors({ ...errors, fertilizerAmount: '' });
                }}
                keyboardType="decimal-pad"
              />
              {errors.fertilizerAmount && <Text style={styles.errorText}>{errors.fertilizerAmount}</Text>}
            </View>
          </>
        );

      case 'treatment':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Type de traitement <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.methodButtons}>
                {['Herbicide', 'Insecticide', 'Fongicide'].map((t) => (
                  <Pressable
                    key={t}
                    style={[
                      styles.methodButton,
                      treatmentType === t && styles.methodButtonActive,
                    ]}
                    onPress={() => {
                      setTreatmentType(t);
                      setErrors({ ...errors, treatmentType: '' });
                    }}
                  >
                    <Text
                      style={[
                        styles.methodButtonText,
                        treatmentType === t && styles.methodButtonTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.treatmentType && <Text style={styles.errorText}>{errors.treatmentType}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Produit utilisé <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.product && styles.inputError]}
                placeholder="Nom du produit"
                value={product}
                onChangeText={(text) => {
                  setProduct(text);
                  setErrors({ ...errors, product: '' });
                }}
              />
              {errors.product && <Text style={styles.errorText}>{errors.product}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dosage</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 2L/ha"
                value={dosage}
                onChangeText={setDosage}
              />
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type d'opération */}
        <Card>
          <Text style={styles.sectionTitle}>Type d'opération</Text>
          <View style={styles.typeGrid}>
            {OPERATION_TYPES.map((op) => (
              <Pressable
                key={op.id}
                style={[
                  styles.typeCard,
                  type === op.id && styles.typeCardActive,
                ]}
                onPress={() => setType(op.id as OperationType)}
              >
                <Ionicons
                  name={op.icon as any}
                  size={32}
                  color={type === op.id ? op.color : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.typeText,
                    type === op.id && styles.typeTextActive,
                  ]}
                >
                  {op.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Parcelle */}
        <Card>
          <Text style={styles.sectionTitle}>
            Parcelle <Text style={styles.required}>*</Text>
          </Text>
          {fields.length === 0 ? (
            <Text style={styles.noFieldsText}>
              Aucune parcelle disponible. Créez-en une d'abord.
            </Text>
          ) : (
            <View style={styles.fieldSelector}>
              {fields.map((field) => (
                <Pressable
                  key={field.id}
                  style={[
                    styles.fieldOption,
                    selectedFieldId === field.id && styles.fieldOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedFieldId(field.id);
                    setErrors({ ...errors, field: '' });
                  }}
                >
                  <Text
                    style={[
                      styles.fieldOptionText,
                      selectedFieldId === field.id && styles.fieldOptionTextActive,
                    ]}
                  >
                    {field.name}
                  </Text>
                  <Text style={styles.fieldOptionDetail}>
                    {field.area} ha • {field.variety}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {errors.field && <Text style={styles.errorText}>{errors.field}</Text>}
        </Card>

        {/* Date et heure */}
        <Card>
          <Text style={styles.sectionTitle}>Date et heure</Text>
          
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Text style={styles.label}>Date</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
                <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
              </Pressable>
            </View>

            <View style={styles.dateTimeItem}>
              <Text style={styles.label}>Heure</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color={COLORS.primary} />
                <Text style={styles.dateButtonText}>{formatTime(date)}</Text>
              </Pressable>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </Card>

        {/* Champs spécifiques au type */}
        <Card>{renderTypeSpecificFields()}</Card>

        {/* Notes */}
        <Card>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ajoutez des observations..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{notes.length}/500</Text>
        </Card>

        {/* Photos (placeholder) */}
        <Card>
          <Text style={styles.sectionTitle}>📷 Photos</Text>
          <Button
            title="Ajouter des photos"
            onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
            variant="outline"
            icon="camera"
            size="small"
          />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Annuler"
            onPress={() => navigation.goBack()}
            variant="outline"
            fullWidth
            disabled={loading}
          />
          <Button
            title="Enregistrer"
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            loading={loading}
            icon="checkmark-circle"
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  typeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  typeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  typeTextActive: {
    color: COLORS.primary,
  },
  fieldSelector: {
    gap: SPACING.sm,
  },
  fieldOption: {
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  fieldOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  fieldOptionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fieldOptionTextActive: {
    color: COLORS.primary,
  },
  fieldOptionDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  noFieldsText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateTimeItem: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
  },
  dateButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  methodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  methodButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  methodButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  methodButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  methodButtonTextActive: {
    color: COLORS.textLight,
  },
  textArea: {
    height: 100,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  charCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  actions: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.xs,
  },
});
