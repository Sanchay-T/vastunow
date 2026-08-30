import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ImageIcon, FileText, Upload, Compass, ArrowRight } from '@/components/ui/icons';
import { COLORS } from '@/constants/colors';
import { FONTS, directionLabel } from '@/constants/theme';
import Button from '@/components/ui/Button';
import ProgressStepper from '@/components/ui/ProgressStepper';
import AnalyzingView from '@/components/ui/AnalyzingView';
import CompassDial, { type Direction } from '@/components/ui/Compass';
import DashedBox from '@/components/ui/DashedBox';
import { analyzeFloorPlan } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vastuData';

type PickedFile = { uri: string; name: string; type: string; size?: number };

export default function AnalyzeScreen() {
  const { t } = useTranslation();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [direction, setDirection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFile(null);
    setDirection('');
    setError(null);
    setLoading(false);
  }, []);

  /** North is the neutral starting point, as on the website's dial. */
  const selectFile = (picked: PickedFile) => {
    setFile(picked);
    setError(null);
    setDirection((current) => current || 'N');
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant media library permissions to upload floor plans.');
      return false;
    }
    return true;
  };

  const showOptions = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert('Select Floor Plan', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
      { text: 'Choose PDF', onPress: pickPDF },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        selectFile({ uri: asset.uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg', size: asset.fileSize });
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        selectFile({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        });
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        selectFile({ uri: asset.uri, name: asset.name, type: 'application/pdf', size: asset.size ?? undefined });
      }
    } catch {
      Alert.alert('Error', 'Failed to pick PDF. Please try again.');
    }
  };

  const handleAnalyze = async () => {
    if (!file || !direction) return;
    setLoading(true);
    setError(null);

    try {
      const data = await analyzeFloorPlan(file, direction);
      // Keep the local copy too, so Review can show the plan without a round trip.
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...data, local_uri: file.uri, local_type: file.type, local_name: file.name }),
      );
      router.push('/review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AnalyzingView step={2} stepper={1} />;
  }

  const isPdf = file?.type.includes('pdf');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepperWrap}>
        <ProgressStepper currentStep={1} />
      </View>

      {file ? (
        <View style={styles.fileCard}>
          <View style={styles.fileIcon}>
            {isPdf
              ? <FileText size={20} color={COLORS.primary} strokeWidth={1.8} />
              : <ImageIcon size={20} color={COLORS.primary} strokeWidth={1.8} />}
          </View>
          <View style={styles.fileMeta}>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.fileSub}>
              {isPdf ? 'PDF document' : 'Image'}{file.size ? ` · ${formatSize(file.size)}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setFile(null); setDirection(''); }}
            style={styles.removeBtn}
            accessibilityRole="button"
            accessibilityLabel="Remove the selected file"
          >
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={showOptions}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Choose a floor plan to upload"
          style={styles.dropzoneOuter}
        >
          <DashedBox style={styles.dropzone}>
            <View style={styles.dropIcon}>
              <Upload size={22} color={COLORS.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.dropTitle}>Upload Floor Plan</Text>
            <Text style={styles.dropHint}>{t('accepted_formats')} · {t('max_file_size')}</Text>
          </DashedBox>
        </TouchableOpacity>
      )}

      {file && (
        <>
          <View style={styles.headings}>
            <Text style={styles.title}>Select Facing Direction</Text>
            <Text style={styles.hint}>Tap the dial, or pick a direction below</Text>
          </View>

          <View style={styles.dialWrap}>
            <CompassDial value={direction} onChange={(d: Direction) => setDirection(d)} size={248} />
          </View>

          <View style={styles.chipWrap}>
            <View style={styles.chip}>
              <Compass size={14} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.chipText}>
                Entrance faces {directionLabel(direction) ?? '—'}
              </Text>
            </View>
          </View>
        </>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Button
          title={t('analyze_button')}
          onPress={handleAnalyze}
          disabled={!file || !direction}
          icon={<ArrowRight size={17} color={COLORS.white} strokeWidth={2} />}
        />
        <Text style={styles.privacy}>Your floor plan is used only to generate this report.</Text>
      </View>
    </ScrollView>
  );
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 28 },
  stepperWrap: { paddingTop: 18, paddingBottom: 14 },

  fileCard: {
    marginHorizontal: 20, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  fileIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(110,17,38,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  fileMeta: { flex: 1, gap: 2 },
  fileName: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.foreground },
  fileSub: { fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.5)' },
  removeBtn: {
    height: 44, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: 'rgba(110,17,38,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  removeText: { fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.primary },

  dropzoneOuter: { marginHorizontal: 20 },
  dropzone: {
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 34, paddingHorizontal: 16, alignItems: 'center', gap: 10,
  },
  dropIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(110,17,38,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  dropTitle: { fontFamily: FONTS.serifBold, fontSize: 16, color: COLORS.primary },
  dropHint: { fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.55)', textAlign: 'center' },

  headings: { paddingHorizontal: 20, paddingTop: 22, alignItems: 'center', gap: 4 },
  title: { fontFamily: FONTS.serifBold, fontSize: 21, color: COLORS.secondary },
  hint: { fontFamily: FONTS.body, fontSize: 12, color: 'rgba(45,41,38,0.6)', textAlign: 'center' },

  dialWrap: { alignItems: 'center', paddingTop: 18 },
  chipWrap: { alignItems: 'center', paddingTop: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, paddingHorizontal: 16,
    borderRadius: 999, backgroundColor: 'rgba(110,17,38,0.07)',
    borderWidth: 1, borderColor: 'rgba(110,17,38,0.18)',
  },
  chipText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },

  errorBox: {
    marginHorizontal: 20, marginTop: 18, backgroundColor: '#fef2f2',
    borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12,
  },
  errorText: { fontFamily: FONTS.body, fontSize: 13, color: '#dc2626', textAlign: 'center' },

  footer: { paddingHorizontal: 20, paddingTop: 24, gap: 10 },
  privacy: { fontFamily: FONTS.body, fontSize: 10, color: 'rgba(45,41,38,0.45)', textAlign: 'center' },
});
