import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import {
  ChefHat, BedDouble, Bath, Sofa, DoorOpen, ChevronRight, ChevronDown,
  Plus, Trash2, ArrowRight, FileText,
} from '@/components/ui/icons';
import { COLORS } from '@/constants/colors';
import { FONTS, DIRECTION_NAMES, directionLabel } from '@/constants/theme';
import Button from '@/components/ui/Button';
import ProgressStepper from '@/components/ui/ProgressStepper';
import AnalyzingView from '@/components/ui/AnalyzingView';
import DashedBox from '@/components/ui/DashedBox';
import { DIRECTIONS, type Direction } from '@/components/ui/Compass';
import { scoreFloorPlan } from '@/services/api';
import { saveReport } from '@/lib/history';
import type { ParsedFloorPlan, ParsedRoom } from '@/lib/types/vastu';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vastuData';
const RESULT_KEY = 'vastuResult';

const ROOM_TYPES = [
  'kitchen', 'master_bedroom', 'bedroom', 'bathroom', 'living_room',
  'dining_room', 'pooja_room', 'balcony', 'storage', 'corridor',
  'study', 'utility', 'hall', 'drawing_room',
];

type StoredData = {
  parsed_floorplan: ParsedFloorPlan;
  image_url: string;
  facing_direction: string;
  confidence: string;
  local_uri?: string;
  local_type?: string;
  local_name?: string;
};

function roomIcon(type: string) {
  if (type === 'kitchen') return ChefHat;
  if (type === 'master_bedroom' || type === 'bedroom') return BedDouble;
  if (type === 'bathroom') return Bath;
  if (type === 'living_room' || type === 'hall' || type === 'drawing_room') return Sofa;
  return DoorOpen;
}

function prettyType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Short plain-language descriptions, as in the design. */
const ROOM_BLURB: Record<string, string> = {
  kitchen: 'Cooking area', master_bedroom: 'Primary bedroom', bedroom: 'Sleeping area',
  bathroom: 'Wet area', living_room: 'Common area', dining_room: 'Dining area',
  pooja_room: 'Prayer space', balcony: 'Open area', storage: 'Storage',
  corridor: 'Passage', study: 'Work area', utility: 'Utility area',
  hall: 'Common area', drawing_room: 'Sitting area',
};

export default function ReviewScreen() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<StoredData | null>(null);
  const [rooms, setRooms] = useState<ParsedRoom[]>([]);
  const [openRoom, setOpenRoom] = useState<number | null>(null);
  const [editEntrance, setEditEntrance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(3);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) { router.replace('/'); return; }
      const parsed = JSON.parse(stored);
      setData(parsed);
      setRooms([...parsed.parsed_floorplan.rooms]);
    } catch {
      router.replace('/');
    }
  };

  const handleRoomChange = (index: number, field: 'name' | 'type', value: string) => {
    setRooms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddRoom = () => {
    const newRoom: ParsedRoom = {
      name: 'New Room', type: 'utility', compass_direction: 'CENTER',
      grid_row: 1, grid_col: 1, size: 'small', has_window: true, has_door: false, user_added: true,
    };
    setRooms((prev) => [...prev, newRoom]);
    setOpenRoom(rooms.length);
  };

  const handleEntranceChange = (dir: Direction) => {
    setData((prev) => prev && ({
      ...prev,
      facing_direction: dir,
      parsed_floorplan: {
        ...prev.parsed_floorplan,
        entrance: { ...prev.parsed_floorplan.entrance, compass_direction: dir },
      },
    }));
    setEditEntrance(false);
  };

  const handleDeleteRoom = (index: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
    setOpenRoom(null);
  };

  const handleScore = async () => {
    if (!data) return;
    setLoading(true);
    setLoadingStep(3);
    try {
      const finalPlan = { ...data.parsed_floorplan, rooms, total_rooms: rooms.length };
      setLoadingStep(4);
      const result = await scoreFloorPlan({
        parsed_floorplan: finalPlan,
        image_url: data.image_url,
        facing_direction: data.facing_direction,
        language: i18n.language === 'hi' ? 'Hindi' : 'English',
      });
      await AsyncStorage.setItem(RESULT_KEY, JSON.stringify(result));
      await saveReport(result, {
        facing: data.facing_direction,
        rooms: rooms.length,
        thumbUri: data.local_uri,
      });
      // Clear the upload/review steps so back from the report goes home,
      // not back into a flow the user has already finished.
      router.dismissTo('/');
      router.push(`/report/${result.id}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <AnalyzingView step={2} title="Loading your plan" subtitle="One moment." />;

  if (loading) {
    return (
      <AnalyzingView
        step={loadingStep}
        stepper={2}
        title="Scoring your home"
        subtitle="Measuring each room against classical Vaastu rules."
      />
    );
  }

  const entrance = data.parsed_floorplan.entrance;
  const planUri = data.local_uri || data.image_url;
  const isPdf = (data.local_type || '').includes('pdf');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepperWrap}>
        <ProgressStepper currentStep={2} />
      </View>

      <View style={styles.headings}>
        <Text style={styles.title}>Review detected rooms</Text>
        <Text style={styles.subtitle}>
          We found {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} and your entrance. Tap any row to correct its
          name or type before we score it.
        </Text>
      </View>

      {/* Uploaded floor plan */}
      {planUri ? (
        <View style={styles.planCard}>
          <View style={styles.planHead}>
            <Text style={styles.planLabel}>Your Floor Plan</Text>
            <Text style={styles.planName} numberOfLines={1}>{data.local_name || 'Uploaded plan'}</Text>
          </View>
          <View style={styles.planFrame}>
            {isPdf ? (
              <View style={styles.pdfPlaceholder}>
                <FileText size={26} color={COLORS.primary} strokeWidth={1.6} />
                <Text style={styles.pdfText}>PDF uploaded</Text>
              </View>
            ) : (
              <Image source={{ uri: planUri }} style={styles.planImage} resizeMode="contain" />
            )}
          </View>
        </View>
      ) : null}

      {/* Entrance */}
      {entrance && (
        <View style={styles.entranceCard}>
          <View style={styles.entranceRow}>
            <View style={styles.entranceIcon}>
              <DoorOpen size={19} color={COLORS.gold} strokeWidth={1.8} />
            </View>
            <View style={styles.entranceCopy}>
              <Text style={styles.entranceLabel}>Main Entrance</Text>
              <Text style={styles.entranceValue}>
                Faces {directionLabel(entrance.compass_direction)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setEditEntrance((v) => !v)}
              style={styles.changeBtn}
              accessibilityRole="button"
              accessibilityLabel="Change the entrance direction"
            >
              <Text style={styles.changeText}>{editEntrance ? 'Done' : 'Change'}</Text>
            </TouchableOpacity>
          </View>

          {editEntrance && (
            <View style={styles.dirWrap}>
              {DIRECTIONS.map((dir) => {
                const active = entrance.compass_direction === dir;
                return (
                  <TouchableOpacity
                    key={dir}
                    onPress={() => handleEntranceChange(dir)}
                    style={[styles.dirChip, active && styles.dirChipOn]}
                    accessibilityRole="button"
                    accessibilityLabel={DIRECTION_NAMES[dir]}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.dirChipText, active && styles.dirChipTextOn]}>{dir}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Rooms */}
      <View style={styles.roomList}>
        {rooms.map((room, index) => {
          const Icon = roomIcon(room.type);
          const open = openRoom === index;

          return (
            <View key={index} style={styles.roomCard}>
              <TouchableOpacity
                onPress={() => setOpenRoom(open ? null : index)}
                style={styles.roomRow}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${room.name}`}
              >
                <View style={styles.roomIcon}>
                  <Icon size={18} color={COLORS.primary} strokeWidth={1.7} />
                </View>
                <View style={styles.roomCopy}>
                  <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
                  <Text style={styles.roomType}>{ROOM_BLURB[room.type] ?? prettyType(room.type)}</Text>
                </View>
                <View style={styles.dirPill}>
                  <Text style={styles.dirText}>{room.compass_direction}</Text>
                </View>
                {open
                  ? <ChevronDown size={16} color={COLORS.gray400} strokeWidth={2} />
                  : <ChevronRight size={16} color={COLORS.gray400} strokeWidth={2} />}
              </TouchableOpacity>

              {open && (
                <View style={styles.editor}>
                  <Text style={styles.editorLabel}>Room name</Text>
                  <TextInput
                    style={styles.input}
                    value={room.name}
                    onChangeText={(text) => handleRoomChange(index, 'name', text)}
                    placeholder="Room name"
                    placeholderTextColor={COLORS.gray400}
                  />

                  <Text style={styles.editorLabel}>Room type</Text>
                  <View style={styles.typeWrap}>
                    {ROOM_TYPES.map((type) => {
                      const active = room.type === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() => handleRoomChange(index, 'type', type)}
                          style={[styles.typeChip, active && styles.typeChipOn]}
                          accessibilityRole="button"
                          accessibilityLabel={`Set type to ${prettyType(type)}`}
                          accessibilityState={{ selected: active }}
                        >
                          <Text style={[styles.typeChipText, active && styles.typeChipTextOn]}>
                            {prettyType(type)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteRoom(index)}
                    style={styles.deleteBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${room.name}`}
                  >
                    <Trash2 size={14} color="#dc2626" strokeWidth={2} />
                    <Text style={styles.deleteText}>Remove this room</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          onPress={handleAddRoom}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add a missing room"
        >
          <DashedBox style={styles.addRoom}>
            <Plus size={15} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.addRoomText}>Add a missing room</Text>
          </DashedBox>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          title="Confirm & Generate Report"
          onPress={handleScore}
          icon={<ArrowRight size={17} color={COLORS.white} strokeWidth={2} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 28 },
  stepperWrap: { paddingTop: 18, paddingBottom: 16 },

  headings: { paddingHorizontal: 20, gap: 5 },
  title: { fontFamily: FONTS.serifBold, fontSize: 21, color: COLORS.secondary },
  subtitle: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 19, color: 'rgba(45,41,38,0.6)' },

  planCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: COLORS.cardBg,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, gap: 10,
  },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  planLabel: {
    fontFamily: FONTS.semibold, fontSize: 9, color: COLORS.gold,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  planName: { flex: 1, textAlign: 'right', fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.45)' },
  planFrame: {
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#ece7dd',
    borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center',
  },
  planImage: { width: '100%', height: 200 },
  pdfPlaceholder: { height: 120, alignItems: 'center', justifyContent: 'center', gap: 8 },
  pdfText: { fontFamily: FONTS.medium, fontSize: 12, color: 'rgba(45,41,38,0.6)' },

  entranceCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: COLORS.cardBg,
    borderWidth: 1, borderColor: 'rgba(234,156,51,0.45)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  entranceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  changeBtn: {
    height: 44, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  changeText: { fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.secondary },
  dirWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dirChip: {
    minWidth: 44, height: 44, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  dirChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dirChipText: { fontFamily: FONTS.bold, fontSize: 11, color: 'rgba(45,41,38,0.7)' },
  dirChipTextOn: { color: COLORS.white },
  entranceIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(234,156,51,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  entranceCopy: { flex: 1, gap: 2 },
  entranceLabel: {
    fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.gold,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  entranceValue: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.foreground },

  roomList: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  roomCard: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    overflow: 'hidden',
  },
  roomRow: {
    minHeight: 44, paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  roomIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(110,17,38,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  roomCopy: { flex: 1, gap: 2 },
  roomName: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.foreground },
  roomType: { fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.5)' },
  dirPill: {
    height: 26, paddingHorizontal: 10, borderRadius: 6, backgroundColor: 'rgba(40,49,113,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  dirText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.secondary, letterSpacing: 0.4 },

  editor: {
    paddingHorizontal: 14, paddingBottom: 14, gap: 8,
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12,
  },
  editorLabel: {
    fontFamily: FONTS.semibold, fontSize: 10, color: 'rgba(45,41,38,0.5)',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  input: {
    height: 44, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, fontFamily: FONTS.body, fontSize: 14, color: COLORS.foreground,
    backgroundColor: COLORS.background,
  },
  typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: {
    height: 44, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  typeChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontFamily: FONTS.medium, fontSize: 11, color: 'rgba(45,41,38,0.7)' },
  typeChipTextOn: { color: COLORS.white },
  deleteBtn: {
    height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
  },
  deleteText: { fontFamily: FONTS.semibold, fontSize: 12, color: '#dc2626' },

  addRoom: {
    height: 44, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 2,
  },
  addRoomText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },

  footer: { paddingHorizontal: 20, paddingTop: 18 },
});
