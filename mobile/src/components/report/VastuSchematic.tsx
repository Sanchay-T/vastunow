import React from 'react';
import { View, Text as RNText, ScrollView, StyleSheet } from 'react-native';
import { Svg, Rect, G, Text, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type { AnalysisResult } from '@/lib/types/vastu';
import { DIRECTION_GRID, DIRECTION_METADATA } from '@/lib/types/vastu';

const CELL_SIZE = 85;
const GAP = 3;
const PADDING = 16;

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getGradientId(score: number | undefined): string {
  if (score === undefined) return 'grad-empty';
  if (score >= 80) return 'grad-green';
  if (score >= 50) return 'grad-amber';
  return 'grad-red';
}

export default function VastuSchematic({
  rooms,
  scores,
  entrance,
  facing,
}: Pick<AnalysisResult, 'schematic_data'> & { rooms?: any[]; scores?: any[]; entrance?: any; facing?: string }) {
  const { t } = useTranslation();
  const schematicRooms = rooms || [];
  const schematicScores = scores || [];

  const gridSize = CELL_SIZE * 3 + GAP * 2;
  const svgWidth = gridSize + PADDING * 2;
  const svgHeight = gridSize + PADDING * 2 + 40;

  const roomGrid: Record<string, { room: any; score: any }> = {};
  schematicRooms.forEach((room: any) => {
    const score = schematicScores.find((s: any) => s.room_name === room.name);
    roomGrid[room.compass_direction] = { room, score };
  });

  if (entrance) {
    const existing = roomGrid[entrance.compass_direction];
    if (!existing) {
      const entranceScore = schematicScores.find((s: any) => s.room_name === 'Main Entrance');
      roomGrid[entrance.compass_direction] = {
        room: { name: 'Main Entrance', compass_direction: entrance.compass_direction },
        score: entranceScore,
      };
    }
  }

  return (
    <ScrollView horizontal contentContainerStyle={styles.scrollContainer}>
      <View>
        <RNText style={styles.title}>{t('schematic_title')}</RNText>
        <RNText style={styles.subtitle}>Facing: {facing || '—'}</RNText>
        <Svg width={svgWidth} height={svgHeight} style={{ alignSelf: 'center' }}>
          <Defs>
            <LinearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#f0fdf4" />
              <Stop offset="100%" stopColor="#dcfce7" />
            </LinearGradient>
            <LinearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fffbeb" />
              <Stop offset="100%" stopColor="#fef3c7" />
            </LinearGradient>
            <LinearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fef2f2" />
              <Stop offset="100%" stopColor="#fee2e2" />
            </LinearGradient>
            <LinearGradient id="grad-empty" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#f9fafb" />
              <Stop offset="100%" stopColor="#f3f4f6" />
            </LinearGradient>
          </Defs>

          {/* North arrow */}
          <G transform={`translate(${svgWidth / 2}, 16)`}>
            <Text textAnchor="middle" y={-6} fontSize={11} fontWeight="bold" fill="#283171">
              N
            </Text>
          </G>

          {/* Decorative frame */}
          <Rect
            x={PADDING - 6}
            y={PADDING + 16 - 6}
            width={gridSize + 12}
            height={gridSize + 12}
            rx={12}
            fill="none"
            stroke="#6E1126"
            strokeWidth={1.5}
            opacity={0.3}
          />

          {/* Grid cells */}
          {DIRECTION_GRID.map((row, ri) =>
            row.map((dir, ci) => {
              const x = PADDING + ci * (CELL_SIZE + GAP);
              const y = PADDING + 16 + ri * (CELL_SIZE + GAP);
              const cell = roomGrid[dir];
              const score = cell?.score?.score;
              const scoreColor = score !== undefined ? getScoreColor(score) : '#d1d5db';

              return (
                <G key={dir}>
                  <Rect
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={8}
                    fill={`url(#${getGradientId(score)})`}
                    stroke={scoreColor}
                    strokeWidth={score !== undefined ? 2 : 1}
                  />

                  <Text x={x + 8} y={y + 16} fontSize={11} fontWeight="bold" fill="#6b7280">
                    {dir}
                  </Text>

                  {DIRECTION_METADATA[dir] && (
                    <Text x={x + 8} y={y + 28} fontSize={8} fill="#9ca3af">
                      {DIRECTION_METADATA[dir].deity.split('/')[0].split('(')[0].trim()}
                    </Text>
                  )}

                  {cell ? (
                    <>
                      <Text
                        x={x + CELL_SIZE / 2}
                        y={y + CELL_SIZE / 2 - 2}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight="bold"
                        fill="#1c1917"
                      >
                        {cell.room.name.length > 12
                          ? cell.room.name.substring(0, 10) + '..'
                          : cell.room.name}
                      </Text>
                      {score !== undefined && (
                        <G>
                          <Circle
                            cx={x + CELL_SIZE / 2}
                            cy={y + CELL_SIZE / 2 + 18}
                            r={14}
                            fill={scoreColor}
                            opacity={0.15}
                          />
                          <Text
                            x={x + CELL_SIZE / 2}
                            y={y + CELL_SIZE / 2 + 22}
                            textAnchor="middle"
                            fontSize={14}
                            fontWeight="bold"
                            fill={scoreColor}
                          >
                            {score}
                          </Text>
                        </G>
                      )}
                    </>
                  ) : (
                    <Text
                      x={x + CELL_SIZE / 2}
                      y={y + CELL_SIZE / 2 + 4}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#d1d5db"
                    >
                      {'—'}
                    </Text>
                  )}

                  {/* Entrance marker */}
                  {entrance && entrance.compass_direction === dir && (
                    <G transform={`translate(${x + CELL_SIZE - 16}, ${y + 10})`}>
                      <Circle cx={0} cy={0} r={7} fill="#6E1126" opacity={0.2} />
                      <Circle cx={0} cy={0} r={5} fill="#6E1126" />
                      <Text x={0} y={3} textAnchor="middle" fontSize={7} fill="white" fontWeight="bold">
                        D
                      </Text>
                    </G>
                  )}
                </G>
              );
            })
          )}

          {/* Legend */}
          <G transform={`translate(${svgWidth / 2}, ${svgHeight - 16})`}>
            <Circle cx={-120} cy={0} r={5} fill="#22c55e" />
            <Text x={-110} y={4} fontSize={10} fill="#6b7280">80+</Text>
            <Circle cx={-60} cy={0} r={5} fill="#f59e0b" />
            <Text x={-50} y={4} fontSize={10} fill="#6b7280">50-79</Text>
            <Circle cx={0} cy={0} r={5} fill="#ef4444" />
            <Text x={10} y={4} fontSize={10} fill="#6b7280">0-49</Text>
          </G>
        </Svg>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { paddingHorizontal: 4 },
  title: { fontSize: 14, fontWeight: '700', color: '#283171', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#6b7280', marginBottom: 12 },
});
