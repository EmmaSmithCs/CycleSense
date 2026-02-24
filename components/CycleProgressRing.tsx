import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
    cycleDay: number;
    avgLength: number;
};

export default function CycleProgressRing({ cycleDay, avgLength }: Props) {
    const progress = Math.min(cycleDay / avgLength, 1);

    const size = 220;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: progress,
            duration: 900,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start();
    }, [progress]);

    const strokeDashoffset = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                <Circle
                    stroke="#f5c6d6"
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />

                <AnimatedCircle
                    stroke="#f06292"
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation ="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>

            <View style={styles.centerText}>
                <Text style={styles.dayText}>Day {cycleDay}</Text>
                <Text style={styles.subText}>of {avgLength}</Text>
            </View>
        


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
        color: "#666",
    },
});