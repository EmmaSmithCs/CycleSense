import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

type Props = {
  cycleDay: number;
  avgLength: number;
  periodLength: number;
  isBleedingToday: boolean;
};

export default function CycleProgressRing({ cycleDay, avgLength, periodLength, isBleedingToday }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const size = 220;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Phase lengths
  const ovulationLength = 2;
  const lutealLength = 14;
  const follicularLength = Math.max(
    avgLength - periodLength - ovulationLength - lutealLength,
    0
  );

  const phases = [
    { name: "Period", length: periodLength, color: c.primary },
    { name: "Follicular", length: follicularLength, color: "#ffd54f" },
    { name: "Ovulation", length: ovulationLength, color: "#ff9800" },
    { name: "Luteal", length: lutealLength, color: "#9575cd" },
  ];

  // Build arcs
  let startAngle = -Math.PI / 2;
  const phaseArcs = phases.map(phase => {
    const angle = (phase.length / avgLength) * 2 * Math.PI;
    const arc = { ...phase, startAngle, endAngle: startAngle + angle };
    startAngle += angle;
    return arc;
  });

  // Dot position
  const dayFraction = Math.min(cycleDay / avgLength, 1);
  const dotAngle = -Math.PI / 2 + dayFraction * 2 * Math.PI;
  const dotX = center + radius * Math.cos(dotAngle);
  const dotY = center + radius * Math.sin(dotAngle);

  // Current phase
  let running = 0;
  const currentPhase =
    phases.find(phase => {
      running += phase.length;
      return cycleDay <= running;
    })?.name || "Luteal";

  const currentPhaseColor =
    phases.find(p => p.name === currentPhase)?.color || c.text;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G origin={`${center}, ${center}`}>
          {phaseArcs.map((arc, idx) => {
            const x1 = center + radius * Math.cos(arc.startAngle);
            const y1 = center + radius * Math.sin(arc.startAngle);
            const x2 = center + radius * Math.cos(arc.endAngle);
            const y2 = center + radius * Math.sin(arc.endAngle);
            const largeArc = (arc.endAngle - arc.startAngle) > Math.PI ? 1 : 0;

            return (
              <Path
                key={idx}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                stroke={arc.color}
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* Today dot */}
          <Circle
            cx={dotX}
            cy={dotY}
            r={8}
            fill={currentPhaseColor}
            stroke={c.card}
            strokeWidth={2}
          />
        </G>
      </Svg>

      {/* Center text */}
      <View style={styles.centerText}>
        <Text style={[styles.dayText, { color: c.text }]}>Day {cycleDay}</Text>
        <Text style={[styles.subText, { color: c.textSecondary }]}>of {avgLength}</Text>
        <Text style={[styles.phaseText, { color: c.textSecondary }]}>You're in your</Text>
        <Text style={[styles.phaseBold, { color: currentPhaseColor }]}>
          {currentPhase}
        </Text>
        <Text style={[styles.phaseText, { color: c.textSecondary }]}>phase</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendDot color={c.primary} label="Period" textColor={c.textSecondary} />
        <LegendDot color="#ffd54f" label="Follicular" textColor={c.textSecondary} />
        <LegendDot color="#ff9800" label="Ovulation" textColor={c.textSecondary} />
        <LegendDot color="#9575cd" label="Luteal" textColor={c.textSecondary} />
      </View>
    </View>
  );
}

function LegendDot({ color, label, textColor }: { color: string; label: string; textColor: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },

  centerText: {
    position: "absolute",
    alignItems: "center",
  },

  dayText: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subText: {
    fontSize: 14,
  },

  phaseText: {
    fontSize: 12,
  },

  phaseBold: {
    fontSize: 14,
    fontWeight: "bold",
  },

  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    marginTop: 12,
  },

  legendItem: {
    alignItems: "center",
  },

  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },

  legendLabel: {
    fontSize: 11,
  },

});