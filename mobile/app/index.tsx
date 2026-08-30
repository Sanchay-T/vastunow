import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Alert, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Plus, ChevronRight, ImageIcon, Upload, Compass, ChartColumn } from '@/components/ui/icons';
import { COLORS } from '@/constants/colors';
import { FONTS, directionLabel, scoreBand } from '@/constants/theme';
import Medallion from '@/components/ui/Medallion';
import { FadeSlideIn, PressScale } from '@/components/ui/motion';
import { listHistory, deleteReport, relativeDate, type HistoryEntry } from '@/lib/history';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const loaded = history !== null;

  // Refresh on every visit so a report just finished appears immediately.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      listHistory().then((entries) => { if (active) setHistory(entries); });
      return () => { active = false; };
    }, []),
  );

  const confirmDelete = (entry: HistoryEntry) => {
    Alert.alert('Remove this report?', 'It will be deleted from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteReport(entry.id);
          setHistory(await listHistory());
        },
      },
    ]);
  };

  const entries = history ?? [];
  const hasHistory = entries.length > 0;
  const showEmptyState = loaded && !hasHistory;
  const best = hasHistory ? Math.max(...entries.map((e) => e.score)) : 0;
  const ctaWidth = width - 40;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <FadeSlideIn>
        <View style={styles.hero}>
          <Medallion size={148} />
          <Text style={styles.headline}>
            {showEmptyState ? 'Check your home’s Vaastu' : 'Welcome back'}
          </Text>
          <Text style={styles.heroCopy}>
            {showEmptyState
              ? 'Upload a floor plan and get a room-by-room Vaastu score in about a minute.'
              : 'Open a past report, or analyse another floor plan.'}
          </Text>
        </View>
      </FadeSlideIn>

      {/* Summary strip */}
      {hasHistory && (
        <FadeSlideIn delay={70}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>{entries.length === 1 ? 'Report' : 'Reports'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: scoreBand(best).color }]}>{best}</Text>
              <Text style={styles.statLabel}>Best score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{scoreBand(best).label.split(' ')[0]}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </FadeSlideIn>
      )}

      {/* Primary action */}
      <FadeSlideIn delay={110}>
        <PressScale
          onPress={() => router.push('/analyze')}
          style={styles.cta}
          accessibilityLabel="Start a new Vaastu analysis"
        >
          <Svg style={StyleSheet.absoluteFill} width={ctaWidth} height={78}>
            <Defs>
              <LinearGradient id="ctaGrad" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={ctaWidth} y2={78}>
                <Stop offset="0" stopColor="#6E1126" />
                <Stop offset="0.6" stopColor="#4a0c1a" />
                <Stop offset="1" stopColor="#283171" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={ctaWidth} height={78} fill="url(#ctaGrad)" />
          </Svg>

          <View style={styles.ctaIcon}>
            <Plus size={20} color={COLORS.white} strokeWidth={2.5} />
          </View>
          <View style={styles.ctaCopy}>
            <Text style={styles.ctaTitle}>New Vaastu analysis</Text>
            <Text style={styles.ctaSub}>Photo or PDF of your floor plan</Text>
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.75)" strokeWidth={2} />
        </PressScale>
      </FadeSlideIn>

      {!loaded ? null : hasHistory ? (
        <View style={styles.section}>
          <FadeSlideIn delay={160}>
            <Text style={styles.sectionLabel}>Your reports</Text>
          </FadeSlideIn>

          {entries.map((entry, i) => {
            const band = scoreBand(entry.score);
            const circumference = 2 * Math.PI * 20;
            const offset = circumference - (entry.score / 100) * circumference;

            return (
              <FadeSlideIn key={entry.id} delay={200 + i * 70}>
                <PressScale
                  onPress={() => router.push(`/report/${entry.id}`)}
                  onLongPress={() => confirmDelete(entry)}
                  style={styles.card}
                  accessibilityLabel={`Report scored ${entry.score} out of 100, grade ${entry.grade}, ${relativeDate(entry.createdAt)}`}
                  accessibilityHint="Press and hold to remove"
                  accessibilityActions={[{ name: 'delete', label: 'Remove report' }]}
                  onAccessibilityAction={(e) => {
                    if (e.nativeEvent.actionName === 'delete') confirmDelete(entry);
                  }}
                >
                  <View style={styles.thumb}>
                    <ImageIcon size={18} color={COLORS.gray400} strokeWidth={1.6} />
                    {entry.thumbUri ? (
                      <Image source={{ uri: entry.thumbUri }} style={styles.thumbImage} resizeMode="cover" />
                    ) : null}
                  </View>

                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {directionLabel(entry.facing)
                        ? `${directionLabel(entry.facing)}-facing`
                        : 'Floor plan'}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {entry.rooms} {entry.rooms === 1 ? 'room' : 'rooms'} · {relativeDate(entry.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.ring}>
                    <Svg width={48} height={48} viewBox="0 0 48 48">
                      <Circle cx="24" cy="24" r="20" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                      <Circle
                        cx="24" cy="24" r="20" fill="none" stroke={band.color} strokeWidth="4"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" transform="rotate(-90 24 24)"
                      />
                    </Svg>
                    <View style={styles.ringCenter}>
                      <Text style={[styles.ringScore, { color: band.color }]}>{entry.score}</Text>
                    </View>
                  </View>
                </PressScale>
              </FadeSlideIn>
            );
          })}

          <FadeSlideIn delay={240 + entries.length * 70}>
            <Text style={styles.hint}>Press and hold a report to remove it.</Text>
          </FadeSlideIn>
        </View>
      ) : (
        /* First run: show the three steps rather than an empty list. */
        <View style={styles.section}>
          <FadeSlideIn delay={160}>
            <Text style={styles.sectionLabel}>How it works</Text>
          </FadeSlideIn>

          {[
            { Icon: Upload, tint: COLORS.primary, title: t('step_1_title'), desc: t('step_1_desc') },
            { Icon: Compass, tint: COLORS.gold, title: t('step_2_title'), desc: t('step_2_desc') },
            { Icon: ChartColumn, tint: COLORS.secondary, title: t('step_3_title'), desc: t('step_3_desc') },
          ].map(({ Icon, tint, title, desc }, i) => (
            <FadeSlideIn key={title} delay={200 + i * 70}>
              <View style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: withAlpha(tint, 0.09) }]}>
                  <Icon size={17} color={tint} strokeWidth={1.8} />
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{title}</Text>
                  <Text style={styles.stepDesc}>{desc}</Text>
                </View>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
            </FadeSlideIn>
          ))}

          <FadeSlideIn delay={410}>
            <Text style={styles.hint}>Your reports are saved on this device.</Text>
          </FadeSlideIn>
        </View>
      )}
    </ScrollView>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 },

  hero: { alignItems: 'center', gap: 12 },
  headline: {
    fontFamily: FONTS.serifBold, fontSize: 27, lineHeight: 33,
    color: COLORS.primary, textAlign: 'center', marginTop: 4,
  },
  heroCopy: {
    fontFamily: FONTS.body, fontSize: 13, lineHeight: 21,
    color: 'rgba(45,41,38,0.65)', textAlign: 'center',
  },

  stats: {
    marginTop: 20, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.secondary },
  statLabel: {
    fontFamily: FONTS.medium, fontSize: 10, color: 'rgba(45,41,38,0.5)',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  cta: {
    marginTop: 18, height: 78, borderRadius: 14, overflow: 'hidden',
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  ctaIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaCopy: { flex: 1, gap: 2 },
  ctaTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.white },
  ctaSub: { fontFamily: FONTS.body, fontSize: 12, color: 'rgba(255,255,255,0.72)' },

  section: { marginTop: 26, gap: 10 },
  sectionLabel: {
    fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.secondary,
    letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 2,
  },

  card: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  thumb: {
    width: 52, height: 52, borderRadius: 8, backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: '#ece7dd', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', borderRadius: 8,
  },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.foreground },
  cardMeta: { fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.5)' },
  ring: { width: 48, height: 48 },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringScore: { fontFamily: FONTS.bold, fontSize: 14 },
  hint: {
    fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.62)',
    textAlign: 'center', marginTop: 4,
  },

  stepCard: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  stepIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepCopy: { flex: 1, gap: 2 },
  stepTitle: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.secondary },
  stepDesc: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 17, color: 'rgba(45,41,38,0.6)' },
  stepNum: {
    fontFamily: FONTS.serifBold, fontSize: 22, color: 'rgba(110,17,38,0.14)',
  },
});
