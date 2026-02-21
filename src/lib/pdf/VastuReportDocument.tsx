import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { VastuAnalysis, RoomScore } from '../vastu/types';
import type { ReportContent } from '../llm/generate-report';
import type { ParsedRoom } from '../llm/parse-floorplan';

export interface VastuReportProps {
  overallScore: number;
  grade: string;
  facingDirection: string;
  createdAt: string;
  vastuAnalysis: VastuAnalysis;
  reportContent: ReportContent | null;
  rooms: ParsedRoom[];
}

const C = {
  primary: '#c2410c',
  secondary: '#1e3a5f',
  good: '#16a34a',
  attention: '#d97706',
  problem: '#dc2626',
  bgGood: '#f0fdf4',
  bgAttention: '#fffbeb',
  bgProblem: '#fef2f2',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone700: '#44403c',
  stone800: '#292524',
  stone900: '#1c1917',
  white: '#ffffff',
};

function scoreColor(s: number) { return s >= 80 ? C.good : s >= 50 ? C.attention : C.problem; }
function scoreBg(s: number) { return s >= 80 ? C.bgGood : s >= 50 ? C.bgAttention : C.bgProblem; }
function scoreLabel(s: number) { return s >= 80 ? 'Well Placed' : s >= 50 ? 'Needs Attention' : 'Vastu Dosha'; }

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: C.stone900, backgroundColor: C.white },

  // Header
  eyebrow: { fontSize: 7, color: C.primary, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.secondary, textAlign: 'center', marginBottom: 4 },
  headerLine: { width: 40, height: 1.5, backgroundColor: C.primary, alignSelf: 'center', marginBottom: 6 },
  dateLine: { fontSize: 8, color: C.stone400, textAlign: 'center', marginBottom: 20 },

  // Score section
  scoreRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 16 },
  scoreCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontSize: 24, fontFamily: 'Helvetica-Bold' },
  gradeCol: {},
  gradeLabel: { fontSize: 7, color: C.stone400, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  gradeValue: { fontSize: 32, fontFamily: 'Helvetica-Bold' },
  gradeDesc: { fontSize: 9, marginTop: 2 },
  summaryText: { fontSize: 9, color: C.stone500, textAlign: 'center', lineHeight: 1.5, marginBottom: 20, maxWidth: 400, alignSelf: 'center' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: C.stone200 },
  dividerLabel: { fontSize: 7, color: C.stone400, letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: 8 },

  // Interpretation
  bodyText: { fontSize: 9, color: C.stone700, lineHeight: 1.6, marginBottom: 12 },

  // Schematic grid
  gridWrap: { alignItems: 'center', marginBottom: 8 },
  gridRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  gridCell: { width: 110, height: 52, borderWidth: 1, borderRadius: 3, justifyContent: 'center', alignItems: 'center', padding: 3, position: 'relative' },
  gridDir: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.stone400, position: 'absolute', top: 2, left: 4 },
  gridName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.stone800, textAlign: 'center' },
  gridScore: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 1 },

  // Room cards
  roomCard: { marginBottom: 8, padding: 10, borderRadius: 6, borderWidth: 0.5 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roomName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.stone800 },
  roomBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  roomMeta: { fontSize: 7, color: C.stone500, marginBottom: 4 },
  roomBody: { fontSize: 8, color: C.stone700, lineHeight: 1.5, marginBottom: 4 },
  roomRemedyBox: { backgroundColor: C.white, borderWidth: 0.5, borderColor: C.stone200, borderRadius: 4, padding: 6, marginTop: 4 },
  roomRemedyLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.primary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  roomRemedyText: { fontSize: 8, color: C.stone700, lineHeight: 1.5 },

  // Lists
  listSection: { marginBottom: 10 },
  listTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.stone800, marginBottom: 6 },
  listItem: { flexDirection: 'row', marginBottom: 3, paddingRight: 8 },
  listBullet: { width: 14, fontSize: 9 },
  listText: { flex: 1, fontSize: 8, color: C.stone700, lineHeight: 1.5 },

  // Disclaimer
  disclaimer: { marginTop: 16, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: C.stone200 },
  disclaimerText: { fontSize: 6.5, color: C.stone400, textAlign: 'center', lineHeight: 1.4 },

  // Page footer
  pageFooter: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  pageFooterText: { fontSize: 6.5, color: C.stone400 },
});

const DIR_GRID = [['NW', 'N', 'NE'], ['W', 'CENTER', 'E'], ['SW', 'S', 'SE']];

function SchematicGrid({ rooms, scores }: { rooms: ParsedRoom[]; scores: RoomScore[] }) {
  const map: Record<string, { room: ParsedRoom; score?: RoomScore }> = {};
  rooms.forEach(r => { map[r.compass_direction] = { room: r, score: scores.find(sc => sc.room_name === r.name) }; });

  return (
    <View style={s.gridWrap}>
      {DIR_GRID.map((row, ri) => (
        <View key={ri} style={s.gridRow}>
          {row.map(dir => {
            const cell = map[dir];
            const sv = cell?.score?.score;
            return (
              <View key={dir} style={[s.gridCell, { backgroundColor: sv !== undefined ? scoreBg(sv) : C.stone50, borderColor: sv !== undefined ? scoreColor(sv) : C.stone200 }]}>
                <Text style={s.gridDir}>{dir}</Text>
                {cell && <Text style={s.gridName}>{cell.room.name.length > 14 ? cell.room.name.substring(0, 12) + '..' : cell.room.name}</Text>}
                {sv !== undefined && <Text style={[s.gridScore, { color: scoreColor(sv) }]}>{sv}</Text>}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function RoomCards({ scores, details }: { scores: RoomScore[]; details?: ReportContent['room_details'] }) {
  return (
    <View>
      {scores.map((rs, i) => {
        const detail = details?.find(d => d.room_name === rs.room_name);
        const bg = scoreBg(rs.score);
        const color = scoreColor(rs.score);
        return (
          <View key={i} style={[s.roomCard, { backgroundColor: bg, borderColor: color }]} wrap={false}>
            <View style={s.roomHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.roomName}>{rs.room_name}</Text>
                <Text style={[s.roomBadge, { backgroundColor: color + '20', color }]}>{scoreLabel(rs.score)}</Text>
              </View>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color }}>{rs.score}</Text>
            </View>
            <Text style={s.roomMeta}>
              Direction: {rs.actual_direction}{rs.ideal_directions.length > 0 ? `  |  Ideal: ${rs.ideal_directions.join(', ')}` : ''}
            </Text>
            {detail ? (
              <>
                <Text style={s.roomBody}>{detail.finding}</Text>
                {detail.impact && <Text style={s.roomBody}>{detail.impact}</Text>}
                {detail.remedy && (
                  <View style={s.roomRemedyBox}>
                    <Text style={s.roomRemedyLabel}>Remedy</Text>
                    <Text style={s.roomRemedyText}>{detail.remedy}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {rs.issues.map((issue, j) => <Text key={j} style={s.roomBody}>{issue}</Text>)}
                {rs.remedies.map((remedy, j) => (
                  <View key={j} style={s.roomRemedyBox}>
                    <Text style={s.roomRemedyLabel}>Remedy</Text>
                    <Text style={s.roomRemedyText}>{remedy}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function VastuReportDocument({
  overallScore, grade, facingDirection, createdAt, vastuAnalysis, reportContent, rooms,
}: VastuReportProps) {
  const dateStr = new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const gradeColor = scoreColor(overallScore);
  const summary = reportContent?.summary || vastuAnalysis.summary;
  const interpretation = reportContent?.overall_interpretation;
  const priorities = reportContent?.top_priorities || vastuAnalysis.critical_issues;
  const positives = reportContent?.positive_notes || vastuAnalysis.positive_aspects;
  const tips = reportContent?.general_tips;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header — editorial */}
        <Text style={s.eyebrow}>VASTU COMPLIANCE REPORT</Text>
        <Text style={s.title}>Your Vastu Analysis</Text>
        <View style={s.headerLine} />
        <Text style={s.dateLine}>{dateStr}  ·  Facing {facingDirection}</Text>

        {/* Score + Grade */}
        <View style={s.scoreRow}>
          <View style={[s.scoreCircle, { borderColor: gradeColor }]}>
            <Text style={[s.scoreNum, { color: gradeColor }]}>{overallScore}</Text>
          </View>
          <View style={s.gradeCol}>
            <Text style={s.gradeLabel}>Grade</Text>
            <Text style={[s.gradeValue, { color: gradeColor }]}>{grade}</Text>
            <Text style={[s.gradeDesc, { color: gradeColor }]}>
              {overallScore >= 80 ? 'Excellent' : overallScore >= 70 ? 'Good' : overallScore >= 55 ? 'Fair' : overallScore >= 40 ? 'Below Average' : 'Needs Work'}
            </Text>
          </View>
        </View>

        {summary && <Text style={s.summaryText}>{summary}</Text>}

        {/* Interpretation */}
        {interpretation && (
          <>
            <Text style={s.bodyText}>{interpretation}</Text>
          </>
        )}

        {/* Zone Map */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerLabel}>Zone Map</Text>
          <View style={s.dividerLine} />
        </View>
        <SchematicGrid rooms={rooms} scores={vastuAnalysis.room_scores} />

        {/* Room Analysis */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerLabel}>Room Analysis</Text>
          <View style={s.dividerLine} />
        </View>
        <RoomCards scores={vastuAnalysis.room_scores} details={reportContent?.room_details} />

        {/* Recommendations */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerLabel}>Recommendations</Text>
          <View style={s.dividerLine} />
        </View>

        {priorities && priorities.length > 0 && (
          <View style={s.listSection}>
            <Text style={s.listTitle}>Priority Actions</Text>
            {priorities.map((p, i) => (
              <View key={i} style={s.listItem}>
                <Text style={[s.listBullet, { color: C.problem }]}>{i + 1}.</Text>
                <Text style={s.listText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {positives && positives.length > 0 && (
          <View style={s.listSection}>
            <Text style={s.listTitle}>What&apos;s Working Well</Text>
            {positives.map((p, i) => (
              <View key={i} style={s.listItem}>
                <Text style={[s.listBullet, { color: C.good }]}>✓</Text>
                <Text style={s.listText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {tips && tips.length > 0 && (
          <View style={s.listSection}>
            <Text style={s.listTitle}>General Tips</Text>
            {tips.map((t, i) => (
              <View key={i} style={s.listItem}>
                <Text style={[s.listBullet, { color: C.primary }]}>•</Text>
                <Text style={s.listText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            This analysis follows commonly accepted Vastu Shastra principles and is for informational purposes only.
            Different Vastu traditions may offer different guidance. Generated by VastuNow.
          </Text>
        </View>

        {/* Page footer */}
        <View style={s.pageFooter} fixed>
          <Text style={s.pageFooterText}>VastuNow</Text>
          <Text style={s.pageFooterText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
