/**
 * Écran Ajouter Parcelle
 * Formulaire complet pour créer une nouvelle parcelle de riz
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
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Components
import Button from '@/components/Button';
import Card from '@/components/Card';

// Store & Constants
import { useAppDispatch } from '@/store/hooks';
import { addField, setActiveField } from '@/store/slices/fieldsSlice';
import { fieldService } from '@/services/fieldService';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { RICE_VARIETIES, SOIL_TYPES } from '@/constants/config';

export default function AddFieldScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  // État du formulaire
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [variety, setVariety] = useState('');
  const [soilType, setSoilType] = useState('');
  const [sowingDate, setSowingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom de la parcelle est requis';
    }

    if (!area || parseFloat(area) <= 0) {
      newErrors.area = 'La superficie doit être supérieure à 0';
    }

    if (!variety) {
      newErrors.variety = 'Veuillez sélectionner une variété';
    }

    if (!soilType) {
      newErrors.soilType = 'Veuillez sélectionner un type de sol';
    }

    if (latitude && (parseFloat(latitude) < -90 || parseFloat(latitude) > 90)) {
      newErrors.latitude = 'Latitude invalide (-90 à 90)';
    }

    if (longitude && (parseFloat(longitude) < -180 || parseFloat(longitude) > 180)) {
      newErrors.longitude = 'Longitude invalide (-180 à 180)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer la soumission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      // Préparer les données pour le backend
      const fieldData = {
        name: name.trim(),
        area: parseFloat(area),
        crop_type: 'rice', // Type de culture fixe pour le riz
        variety,
        planting_date: sowingDate.toISOString(),
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        soil_type: soilType,
      };

      console.log('📤 Envoi de la parcelle au backend:', fieldData);

      // Créer la parcelle via l'API
      const createdField = await fieldService.createField(fieldData);
      
      console.log('✅ Parcelle créée avec succès:', createdField);

      // Ajouter la parcelle au store Redux
      const formattedField = {
        id: createdField.id,
        name: createdField.name,
        area: createdField.area,
        variety: createdField.variety || 'Non spécifié',
        sowingDate: createdField.planting_date || sowingDate.toISOString(),
        currentStage: 'germination',
        healthStatus: createdField.status || 'good',
        location: createdField.latitude && createdField.longitude 
          ? { latitude: createdField.latitude, longitude: createdField.longitude }
          : undefined,
        soilType: createdField.soil_type,
        notes: undefined,
      };

      dispatch(addField(formattedField));
      dispatch(setActiveField(formattedField.id));

      Alert.alert(
        'Succès',
        'La parcelle a été créée avec succès !',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erreur création parcelle:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer la parcelle');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSowingDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
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
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nouvelle parcelle</Text>
          <Text style={styles.headerSubtitle}>
            Renseignez les informations de votre parcelle de riz
          </Text>
        </View>

        {/* Informations de base */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations de base</Text>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nom de la parcelle <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ex: Parcelle Nord"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors({ ...errors, name: '' });
              }}
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Superficie */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Superficie (hectares) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.area && styles.inputError]}
              placeholder="Ex: 2.5"
              value={area}
              onChangeText={(text) => {
                // Accepter seulement nombres et point décimal
                const cleaned = text.replace(/[^0-9.]/g, '');
                setArea(cleaned);
                setErrors({ ...errors, area: '' });
              }}
              keyboardType="decimal-pad"
              maxLength={10}
            />
            {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
          </View>
        </Card>

        {/* Culture */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🌾 Culture</Text>

          {/* Variété */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Variété de riz <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              {RICE_VARIETIES.map((v) => (
                <Pressable
                  key={v.id}
                  style={[
                    styles.pickerOption,
                    variety === v.name && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setVariety(v.name);
                    setErrors({ ...errors, variety: '' });
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      variety === v.name && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {v.name}
                  </Text>
                  <Text style={styles.pickerOptionDetail}>
                    {v.cycle} jours • {v.type}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.variety && <Text style={styles.errorText}>{errors.variety}</Text>}
          </View>

          {/* Date de semis */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Date de semis <Text style={styles.required}>*</Text>
            </Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.dateButtonText}>{formatDate(sowingDate)}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={sowingDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        </Card>

        {/* Sol */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>🏞️ Type de sol</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Type de sol <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              {SOIL_TYPES.map((soil) => (
                <Pressable
                  key={soil.id}
                  style={[
                    styles.pickerOption,
                    soilType === soil.name && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setSoilType(soil.name);
                    setErrors({ ...errors, soilType: '' });
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      soilType === soil.name && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {soil.name}
                  </Text>
                  <Text style={styles.pickerOptionDetail}>{soil.description}</Text>
                </Pressable>
              ))}
            </View>
            {errors.soilType && <Text style={styles.errorText}>{errors.soilType}</Text>}
          </View>
        </Card>

        {/* Localisation (optionnel) */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Localisation (optionnel)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={[styles.input, errors.latitude && styles.inputError]}
              placeholder="Ex: 5.3600"
              value={latitude}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9.-]/g, '');
                setLatitude(cleaned);
                setErrors({ ...errors, latitude: '' });
              }}
              keyboardType="decimal-pad"
            />
            {errors.latitude && <Text style={styles.errorText}>{errors.latitude}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={[styles.input, errors.longitude && styles.inputError]}
              placeholder="Ex: -4.0083"
              value={longitude}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9.-]/g, '');
                setLongitude(cleaned);
                setErrors({ ...errors, longitude: '' });
              }}
              keyboardType="decimal-pad"
            />
            {errors.longitude && <Text style={styles.errorText}>{errors.longitude}</Text>}
          </View>

          <Button
            title="Utiliser ma position"
            onPress={() => {
              // TODO: Implémenter géolocalisation
              Alert.alert('Info', 'Fonctionnalité à venir');
            }}
            variant="outline"
            icon="location"
            size="small"
          />
        </Card>

        {/* Notes (optionnel) */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notes (optionnel)</Text>

          <TextInput
            style={styles.textArea}
            placeholder="Ajoutez des notes sur cette parcelle..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{notes.length}/500</Text>
        </Card>

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <Button
            title="Annuler"
            onPress={() => navigation.goBack()}
            variant="outline"
            fullWidth
            disabled={loading}
          />
          <Button
            title="Créer la parcelle"
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
  header: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
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
  pickerContainer: {
    gap: SPACING.sm,
  },
  pickerOption: {
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  pickerOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  pickerOptionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pickerOptionTextSelected: {
    color: COLORS.primary,
  },
  pickerOptionDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
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
  actions: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.xs,
  },
});
