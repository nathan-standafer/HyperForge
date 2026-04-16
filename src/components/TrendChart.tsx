import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import type { SessionPoint } from '../services/progress-service';

export type ChartMetric = 'weight' | '1rm' | 'volume';

interface Props {
  points: SessionPoint[];
  metric: ChartMetric;
  onPointPress?: (p: SessionPoint) => void;
  width?: number;
  height?: number;
}

const PADDING = 32;
const DOT_RADIUS = 5;

function metricValue(p: SessionPoint, metric: ChartMetric): number | null {
  if (metric === 'weight') return p.topWeight || null;
  if (metric === '1rm') return p.estimatedOneRm;
  return p.totalVolume;
}

export function TrendChart({
  points,
  metric,
  onPointPress,
  width = 320,
  height = 220,
}: Props) {
  if (points.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>
          Log more workouts to see your trend.
        </Text>
      </View>
    );
  }

  const values: (number | null)[] = points.map((p) => metricValue(p, metric));
  const numeric = values.filter((v): v is number => v !== null && isFinite(v));
  if (numeric.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>No {metric} data in this range.</Text>
      </View>
    );
  }

  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const range = max - min || 1;
  const innerW = width - PADDING * 2;
  const innerH = height - PADDING * 2;

  const positions = points.map((_, i) => {
    const v = values[i];
    const x =
      points.length === 1
        ? PADDING + innerW / 2
        : PADDING + (i / (points.length - 1)) * innerW;
    const y =
      v === null
        ? null
        : PADDING + innerH - ((v - min) / range) * innerH;
    return { x, y, value: v };
  });

  const linePoints = positions
    .filter((p): p is { x: number; y: number; value: number } => p.y !== null)
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <SvgLine
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={height - PADDING}
          stroke="#94a3b8"
          strokeWidth={1}
        />
        <SvgLine
          x1={PADDING}
          y1={height - PADDING}
          x2={width - PADDING}
          y2={height - PADDING}
          stroke="#94a3b8"
          strokeWidth={1}
        />
        <SvgText x={8} y={PADDING + 4} fontSize={10} fill="#475569">
          {max.toFixed(0)}
        </SvgText>
        <SvgText x={8} y={height - PADDING + 4} fontSize={10} fill="#475569">
          {min.toFixed(0)}
        </SvgText>
        {points.length > 1 && linePoints.length > 0 && (
          <Polyline
            points={linePoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
          />
        )}
        {positions.map((p, i) =>
          p.y === null ? null : (
            <Circle
              key={points[i].sessionId}
              cx={p.x}
              cy={p.y}
              r={DOT_RADIUS}
              fill="#2563eb"
            />
          ),
        )}
      </Svg>
      <View style={styles.overlay} pointerEvents="box-none">
        {positions.map((p, i) =>
          p.y === null ? null : (
            <Pressable
              key={points[i].sessionId}
              onPress={() => onPointPress?.(points[i])}
              style={[
                styles.hit,
                {
                  left: p.x - 16,
                  top: p.y - 16,
                },
              ]}
              accessibilityLabel={`Session ${points[i].date}`}
            />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  hit: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
});
