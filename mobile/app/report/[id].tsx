import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Linking, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Check, Download, RefreshCw } from '@/components/ui/icons';
import { COLORS } from '@/constants/colors';
import { FONTS, DEITIES, directionLabel, scoreBand, zoneColor, zoneFill } from '@/constants/theme';
import Button from '@/components/ui/Button';
import AnalyzingView from '@/components/ui/AnalyzingView';
import Eyebrow, { SectionLabel } from '@/components/ui/Eyebrow';
import { regenerateReport, fetchAnalysis, reportPdfUrl } from '@/services/api';
import { loadReport as loadSavedReport } from '@/lib/history';
import type { AnalysisResult, RoomScore } from '@/lib/types/vastu';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vastuResult';
const GRID: string[][] = [
  ['NW', 'N', 'NE'],
  ['W', 'CENTER', 'E'],
  ['SW', 'S', 'SE'],
];

function useCountUp(target: number, duration = 1200): number {
  const [current, setCurrent] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      setCurrent(Math.round((1 - Math.pow(1 - progress, 3)) * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return current;
}

function severityColor(severity: string): string {
  if (severity === 'positive') return COLORS['score-good'];
  if (severity === 'warning') return COLORS['score-attention'];
  if (severity === 'critical') return COLORS['score-problem'];
  return COLORS.gray400;
}

export default function ReportScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  // Hooks stay above every early return so the order never changes between renders.
  const displayScore = useCountUp(result?.overall_score ?? 0);

  useEffect(() => { loadReport(); }, [params.id]);

  const loadReport = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id === params.id) { setResult(parsed); setLoading(false); return; }
      }
      const saved = await loadSavedReport(params.id);
      if (saved) { setResult(saved); setLoading(false); return; }

      const apiData = await fetchAnalysis(params.id);
      if (apiData?.analysis) {
        const a = apiData.analysis;
        setResult({
          id: a.id, overall_score: a.overall_score, grade: a.grade,
          room_scores: a.vastu_analysis.room_scores,
          critical_issues: a.vastu_analysis.critical_issues,
          positive_aspects: a.vastu_analysis.positive_aspects,
          report: a.report_content, report_available: !!a.report_content,
          image_url: a.image_url,
          schematic_data: {
            rooms: a.parsed_floorplan.rooms, entrance: a.parsed_floorplan.entrance,
            facing: a.facing_direction, scores: a.vastu_analysis.room_scores,
          },
        });
      }
    } catch {
      /* fall through to the not-found state */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = async (lng: string) => {
      if (!result) return;
      setRegenerating(true);
      try {
        const map: Record<string, 'English' | 'Hindi'> = { en: 'English', hi: 'Hindi' };
        const data = await regenerateReport(result.id, map[lng] ?? 'English');
        if (data.report) {
          setResult((prev) => prev ? { ...prev, report: data.report as AnalysisResult['report'], report_available: true } : prev);
        }
      } catch {
        /* keep the report we already have */
      } finally {
        setRegenerating(false);
      }
    };
    i18n.on('languageChanged', handler);
    return () => { i18n.off('languageChanged', handler); };
  }, [i18n, result]);

  const handleDownloadPdf = async () => {
    if (!result) return;
    const url = reportPdfUrl(result.id);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert('Unable to open', 'Your device could not open the report link.');
    }
  };

  if (loading) {
    return <AnalyzingView step={4} stepper={3} title="Preparing your report" subtitle="Almost there." />;
  }

  if (!result) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>We could not find that analysis.</Text>
        <Button title="Start a new analysis" onPress={() => router.dismissTo('/')} variant="outline" />
      </View>
    );
  }

  const band = scoreBand(result.overall_score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (result.overall_score / 100) * circumference;

  const schematic = result.schematic_data;
  const byDirection: Record<string, { name: string; score?: number }> = {};
  schematic?.rooms?.forEach((room) => {
    const match = schematic.scores?.find((s: RoomScore) => s.room_name === room.name);
    byDirection[room.compass_direction] = { name: room.name, score: match?.score };
  });
  if (schematic?.entrance && !byDirection[schematic.entrance.compass_direction]) {
    const match = schematic.scores?.find((s: RoomScore) => s.room_name === 'Main Entrance');
    byDirection[schematic.entrance.compass_direction] = { name: 'Main Entrance', score: match?.score };
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.titleBlock}>
        <Eyebrow label={t('report_title')} />
        <Text style={styles.title}>Your Home&rsquo;s Vaastu Score</Text>
        {schematic?.facing ? (
          <Text style={styles.meta}>Entrance faces {directionLabel(schematic.facing)}</Text>
        ) : null}
      </View>

      {/* Score */}
      <View style={styles.scoreWrap}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.gauge}>
              <Svg width={120} height={120} viewBox="0 0 120 120">
                <Circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="6" />
                <Circle
                  cx="60" cy="60" r={radius} fill="none" stroke={band.color} strokeWidth="6"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  strokeLinecap="round" transform="rotate(-90 60 60)"
                />
              </Svg>
              <View style={styles.gaugeCenter}>
                <Text style={[styles.gaugeNumber, { color: band.color }]}>{displayScore}</Text>
              </View>
            </View>

            <View style={styles.gradeBlock}>
              <Text style={styles.gradeLabel}>{t('grade')}</Text>
              <Text style={[styles.gradeLetter, { color: band.color }]}>{result.grade}</Text>
              <Text style={[styles.gradeBand, { color: band.color }]}>{band.label}</Text>
            </View>
          </View>

          {result.report?.summary ? (
            <Text style={styles.summary}>{result.report.summary}</Text>
          ) : null}
        </View>
      </View>

      {regenerating && (
        <View style={styles.notice}>
          <RefreshCw size={13} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.noticeText}>Rewriting your report…</Text>
        </View>
      )}

      {!result.report_available && !regenerating && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{t('partial_results')}</Text>
        </View>
      )}

      {/* Zone map */}
      <View style={styles.section}>
        <SectionLabel label="Zone Map" />
        <View style={styles.grid}>
          {GRID.map((row, r) => (
            <View key={r} style={styles.gridRow}>
              {row.map((dir) => {
                const cell = byDirection[dir];
                const color = zoneColor(cell?.score);
                return (
                  <View
                    key={dir}
                    style={[
                      styles.cell,
                      { borderColor: color, backgroundColor: zoneFill(cell?.score), borderWidth: cell ? 2 : 1 },
                    ]}
                  >
                    <Text style={styles.cellDir}>{dir}</Text>
                    <Text style={styles.cellDeity}>{DEITIES[dir] ?? ''}</Text>
                    <View style={styles.cellBody}>
                      {cell ? (
                        <>
                          <Text style={styles.cellRoom} numberOfLines={2}>{cell.name}</Text>
                          {cell.score !== undefined && (
                            <Text style={[styles.cellScore, { color }]}>{cell.score}</Text>
                          )}
                        </>
                      ) : dir === 'CENTER' ? (
                        <Text style={styles.cellEmpty}>Keep{'\n'}open</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          {[
            { c: COLORS['score-good'], l: 'Ideal' },
            { c: COLORS['score-attention'], l: 'Acceptable' },
            { c: COLORS['score-problem'], l: 'Needs remedy' },
          ].map(({ c, l }) => (
            <View key={l} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c }]} />
              <Text style={styles.legendText}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Room analysis */}
      <View style={styles.section}>
        <SectionLabel label="Room Analysis" />
        <View style={styles.roomList}>
          {result.room_scores?.map((rs, i) => {
            const color = severityColor(rs.severity);
            return (
              <View key={i} style={[styles.roomCard, { borderLeftColor: color }]}>
                <View style={styles.roomHead}>
                  <Text style={styles.roomName}>{rs.room_name}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: withAlpha(color, 0.12) }]}>
                    <Text style={[styles.scoreBadgeText, { color }]}>{rs.score}/100</Text>
                  </View>
                </View>
                <Text style={styles.roomDirs}>
                  Actual: {rs.actual_direction} · Ideal: {rs.ideal_directions.join(', ')}
                </Text>
                {rs.issues?.map((issue, k) => (
                  <Text key={k} style={styles.roomIssue}>{issue}</Text>
                ))}
                {rs.remedies?.length > 0 && rs.remedies[0] ? (
                  <View style={styles.remedy}>
                    <Text style={styles.remedyLabel}>Remedy</Text>
                    <Text style={styles.remedyText}>{rs.remedies[0]}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <SectionLabel label="Recommendations" />

        {result.critical_issues?.length > 0 && (
          <View style={styles.recGroup}>
            <Text style={styles.recTitle}>{t('priority_actions')}</Text>
            {result.critical_issues.map((issue, i) => (
              <View key={i} style={styles.recRow}>
                <View style={[styles.recDot, { backgroundColor: COLORS['score-problem'] }]} />
                <Text style={styles.recText}>{issue}</Text>
              </View>
            ))}
          </View>
        )}

        {result.positive_aspects?.length > 0 && (
          <View style={styles.recGroup}>
            <Text style={styles.recTitle}>{t('whats_working')}</Text>
            {result.positive_aspects.map((item, i) => (
              <View key={i} style={styles.recRow}>
                <Check size={13} color={COLORS['score-good']} strokeWidth={3} style={styles.recCheck} />
                <Text style={styles.recText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {result.report?.general_tips && result.report.general_tips.length > 0 && (
          <View style={styles.recGroup}>
            <Text style={styles.recTitle}>{t('general_tips')}</Text>
            {result.report.general_tips.map((tip, i) => (
              <View key={i} style={styles.recRow}>
                <View style={[styles.recDot, { backgroundColor: COLORS.gold }]} />
                <Text style={styles.recText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.disclaimer}>{t('disclaimer')}</Text>

      <View style={styles.actions}>
        <Button
          title={t('download_pdf')}
          onPress={handleDownloadPdf}
          iconLeft={<Download size={17} color={COLORS.white} strokeWidth={2} />}
        />
        <Button title={t('analyze_another')} onPress={() => router.dismissTo('/')} variant="outline" size="md" />
      </View>
    </ScrollView>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, backgroundColor: COLORS.background },
  emptyText: { fontFamily: FONTS.body, fontSize: 14, color: 'rgba(45,41,38,0.6)', textAlign: 'center' },

  titleBlock: { paddingHorizontal: 20, paddingTop: 24, alignItems: 'center', gap: 10 },
  title: { fontFamily: FONTS.serifBold, fontSize: 25, color: COLORS.primary, textAlign: 'center' },
  meta: { fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.5)' },

  scoreWrap: { paddingHorizontal: 20, paddingTop: 22 },
  scoreCard: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 22, alignItems: 'center', gap: 16,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  gauge: { width: 120, height: 120 },
  gaugeCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  gaugeNumber: { fontFamily: FONTS.bold, fontSize: 32 },
  gradeBlock: { gap: 3 },
  gradeLabel: {
    fontFamily: FONTS.body, fontSize: 10, color: '#a8a29e',
    letterSpacing: 1.6, textTransform: 'uppercase',
  },
  gradeLetter: { fontFamily: FONTS.bold, fontSize: 46, lineHeight: 50 },
  gradeBand: { fontFamily: FONTS.semibold, fontSize: 13 },
  summary: {
    fontFamily: FONTS.body, fontSize: 12, lineHeight: 21,
    color: 'rgba(45,41,38,0.65)', textAlign: 'center',
  },

  notice: {
    marginHorizontal: 20, marginTop: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, backgroundColor: 'rgba(234,156,51,0.1)',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
  },
  noticeText: { fontFamily: FONTS.medium, fontSize: 11, color: 'rgba(45,41,38,0.7)' },

  section: { paddingHorizontal: 20, paddingTop: 26, gap: 12 },

  grid: { gap: 6 },
  gridRow: { flexDirection: 'row', gap: 6 },
  cell: { flex: 1, height: 100, borderRadius: 8, padding: 7 },
  cellDir: { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.gray500 },
  cellDeity: { fontFamily: FONTS.body, fontSize: 7, color: COLORS.gray400 },
  cellBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  cellRoom: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.foreground, textAlign: 'center' },
  cellScore: { fontFamily: FONTS.bold, fontSize: 10 },
  cellEmpty: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.gray400, textAlign: 'center' },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontFamily: FONTS.body, fontSize: 10, color: 'rgba(45,41,38,0.55)' },

  roomList: { gap: 10 },
  roomCard: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
    borderLeftWidth: 3, borderRadius: 12, padding: 14, gap: 6,
  },
  roomHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  roomName: { flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: COLORS.foreground },
  scoreBadge: { height: 24, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  scoreBadgeText: { fontFamily: FONTS.bold, fontSize: 11 },
  roomDirs: { fontFamily: FONTS.body, fontSize: 11, color: 'rgba(45,41,38,0.55)' },
  roomIssue: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 19, color: 'rgba(45,41,38,0.7)' },
  remedy: { backgroundColor: 'rgba(243,239,230,0.8)', borderRadius: 8, padding: 10, gap: 3 },
  remedyLabel: {
    fontFamily: FONTS.bold, fontSize: 9, color: COLORS.primary,
    letterSpacing: 1.8, textTransform: 'uppercase',
  },
  remedyText: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 19, color: 'rgba(45,41,38,0.75)' },

  recGroup: { gap: 8 },
  recTitle: { fontFamily: FONTS.serifBold, fontSize: 15, color: COLORS.primary },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  recDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  recCheck: { marginTop: 3 },
  recText: { flex: 1, fontFamily: FONTS.body, fontSize: 12, lineHeight: 19, color: 'rgba(45,41,38,0.75)' },

  disclaimer: {
    paddingHorizontal: 20, paddingTop: 24,
    fontFamily: FONTS.body, fontSize: 10, lineHeight: 16,
    color: 'rgba(45,41,38,0.4)', textAlign: 'center',
  },
  actions: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },
});
