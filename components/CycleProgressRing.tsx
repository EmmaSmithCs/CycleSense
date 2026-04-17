// app/components/CycleProgressRing.tsx

/*
    This file defines the CycleProgressRing component.
    The CycleProgressRing component visually represents the user's current position in their menstrual cycle using a circular progress ring.

    Key features:
    - Displays a circular progress ring divided into segments representing different phases of the menstrual cycle (Period, Follicular, Ovulation, Luteal).
    - Shows a dot on the ring indicating the current day in the cycle, with the color corresponding to the current phase.
    - Includes a legend to explain the colors of the different phases in the progress ring.
    - Uses theme colors from context for consistent styling across the app.

*/

// Imports
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

// Type for the props expected by the CycleProgressRing component
type Props = {
  cycleDay: number; // Current day in the cycle (1-based index)
  avgLength: number; // Average length of the cycle in days
  periodLength: number; // Length of the period phase in days
  isBleedingToday: boolean; // Whether the user is currently bleeding
};

// Main component that renders a circular progress ring representing the user's current position in their menstrual cycle
export default function CycleProgressRing({ cycleDay, avgLength, periodLength, isBleedingToday }: Props) {

    // Get theme colors from context for consistent styling of the progress ring and text
    const { theme } = useTheme();
    const c = theme.colors;

    // Define dimensions and calculations for the progress ring
    const size = 220; // Size of the SVG container for the progress ring
    const strokeWidth = 15; // Thickness of the progress ring
    const radius = (size - strokeWidth) / 2; // Radius of the progress ring
    const center = size / 2; // Center point of the progress ring

    // Phase lengths
    const ovulationLength = 2; 
    const lutealLength = 14;
    const follicularLength = Math.max(
        avgLength - periodLength - ovulationLength - lutealLength,
        0
    );

    // Define the different phases of the cycle with their respective lengths and colors for the progress ring
    const phases = [
        { name: "Period", length: periodLength, color: c.primary }, // When bleeding
        { name: "Follicular", length: follicularLength, color: "#ffd54f" }, // Pre-ovulation phase
        { name: "Ovulation", length: ovulationLength, color: "#ff9800" }, // Ovulation phase
        { name: "Luteal", length: lutealLength, color: "#9575cd" }, // Post-ovulation phase
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

    // Color for the current phase, used for the dot that indicates today's position in the cycle
    const currentPhaseColor =
        phases.find(p => p.name === currentPhase)?.color || c.text;

    // Render the progress ring using SVG
    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                <G origin={`${center}, ${center}`}>
                {/* Render each phase as an arc in the progress ring */ }
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

    // Helper component for rendering a legend item with a colored dot and label
    function LegendDot({ color, label, textColor }: { color: string; label: string; textColor: string }) {
        return (
            <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: color }]} />
            <Text style={[styles.legendLabel, { color: textColor }]}>{label}</Text>
            </View>
        );
    }


const styles = StyleSheet.create({
    // Container for the entire progress ring component
    container: {
        justifyContent: "center",
        alignItems: "center",
    },

    // Style for the text that is centered within the progress ring, which displays the current day, phase, and other relevant information
    centerText: {
        position: "absolute",
        alignItems: "center",
    },

    // Style for the main day text in the center of the progress ring
    dayText: {
        fontSize: 22,
        fontWeight: "bold",
    },

    // Style for the subtext below the main day text
    subText: {
        fontSize: 14,
    },

    phaseText: {
        fontSize: 12,
    },

    // Style for the bold text that indicates the current phase of the cycle
    phaseBold: {
        fontSize: 14,
        fontWeight: "bold",
    },

    // Container for the legend that explains the colors of the different phases in the progress ring
    legend: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: 220,
        marginTop: 12,
    },

    // Style for each item in the legend
    legendItem: {
        alignItems: "center",
    },

    // Style for the colored dot in each legend item, which corresponds to a specific phase in the progress ring
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginBottom: 4,
    },

    // Style for the label text in each legend item
    legendLabel: {
        fontSize: 11,
    },

});