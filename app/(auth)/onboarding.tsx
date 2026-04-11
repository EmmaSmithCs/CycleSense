// app/(auth)/onboarding.tsx

import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { auth, db } from '../../firebase/config';
import { saveDailyLog } from '../../firebase/dailyLogs';

const TOTAL_STEPS = 4;

export default function Onboarding() {
    const router = useRouter();
    
    const [step, setStep] = useState(0);

    const [name, setName] = useState('');
    const [birthday, setBirthday] = useState(new Date(2000, 0, 1)); // default to Jan 1, 2000
    const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
    
    const [cycleLength, setCycleLength] = useState(28);
    const [periodDuration, setPeriodDuration] = useState(5);

    const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
    const [showLastPeriodPicker, setShowLastPeriodPicker] = useState(false);

    const [agreed, setAgreed] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle Nav

    const handleNext = () => {
        setError(null);
        if (step === 0 && !name.trim()) {
            setError('Please enter your name to continue.');
            return;
        }
        if (step === 2 && (!lastPeriodDate)) {
            setError('Please select the date of your last period to continue.');
            return;
        }
        setStep((s) => s + 1);
    };

    const handleBack = () => {
        setError(null);
        setStep((s) => s - 1);
    };

    // Submit data

    const handleSubmit = async () => {
        if (!agreed) return;
        
        setLoading(true);
        setError(null);
        try {
            if (!auth.currentUser) throw new Error("No authenticated user");
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, {
                name: name.trim(),
                birthday: birthday.toISOString(),
                cycleLength,
                periodDuration,
                lastPeriodDate: lastPeriodDate?.toISOString() ?? null,
                onboarded: true,
            });

            // Seed daily log for last period start date to ensure notifications work immediately
            const seedPromises = Array.from({ length: periodDuration }, (_, i) => {
                const date = addDays(lastPeriodDate!, i);
                return saveDailyLog(auth.currentUser!.uid, date, {
                    bleeding: "Medium",
                    symptoms: [],
                });
            });
            await Promise.all(seedPromises);

            router.replace('/(tabs)');
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };
    
    // Step helper

    const Stepper = ({
        value,
        onChange,
        min,
        max,
        hint,
    } : {
        value: number;
        onChange: (val: number) => void;
        min: number;
        max: number;
        hint: string;
    }) => (
        <View style={styles.stepperWrap}>
            <View style={styles.stepper}>
                <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => onChange(Math.max(min, value - 1))}
                >
                    <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <View style={styles.stepperValue}>
                    <Text style={styles.stepperValueText}>{value}</Text>
                </View>
                <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => onChange(Math.min(max, value + 1))}
                >
                    <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.stepperHint}>{hint}</Text>
        </View>
    );
    
    // Progress dots

    const ProgressDots = () => (
        <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        i < step && styles.dotDone,
                        i === step && styles.dotActive,
                        i > step && styles.dotInactive,
                    ]}
                />
            ))}
        </View>
    );
    
    // Step taglines

    const taglines = [
        "Let\'s get to know you",
        "Tell us about your cycle",
        "When did your last period start?",
        "One important note",
    ];
    
    // Step content

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <>
                        <Text style={styles.title}>Welcome!</Text>
                        <Text style={styles.subtitle}>Tell us a little about yourself to get started.</Text>
                    
                        <Text style={styles.label}>Your name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Emma"
                            placeholderTextColor="#ccc"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Date of birth</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowBirthdayPicker(true)}
                        >
                            <Text style={styles.dateButtonText}>
                                🎂  {birthday.toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </Text>
                        </TouchableOpacity>

                        {showBirthdayPicker && (
                            <DateTimePicker
                                value={birthday}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                                onChange={(_, date) => {
                                    setShowBirthdayPicker(Platform.OS === 'ios');
                                    if (date) setBirthday(date);
                                }}
                                maximumDate={new Date()}
                            />
                        )}

                        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
                            <Text style={styles.continueButtonText}>Continue →</Text>
                        </TouchableOpacity>
                    </>
                );

            case 1: 
                return (
                    <>
                        <Text style={styles.title}>Your cycle</Text>
                        <Text style={styles.subtitle}>Help us understand your cycle patterns. You can update this information at any time in the settings</Text>

                        <Text style={styles.label}>Average cycle length</Text>
                        <Stepper
                            value={cycleLength}
                            onChange={setCycleLength}
                            min={18}
                            max={45}
                            hint="Most cycles are between 21-35 days, but anywhere from 18-45 can be normal!"
                        />

                        <Text style={styles.label}>Average period duration</Text>
                        <Stepper
                            value={periodDuration}
                            onChange={setPeriodDuration}
                            min={1}
                            max={10}
                            hint="Most periods last between 3-7 days, but anything from 1-10 can be normal!"
                        />

                        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
                            <Text style={styles.continueButtonText}>Continue →</Text>
                        </TouchableOpacity>
                    </>
                );

            case 2:
                return (
                    <>
                        <Text style={styles.title}>Last period date</Text>
                        <Text style={styles.subtitle}>Select the first day of your last period. This lets us calculate where you are in your cycle right now. </Text>

                        <Text style={styles.label}>Start date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowLastPeriodPicker(true)}
                        >
                            <Text style={styles.dateButtonText}>
                                📅  {lastPeriodDate ? lastPeriodDate.toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                }) : 'Select date'}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperHint}>If you can\'t remember, just make your best guess!</Text>
                        

                        {showLastPeriodPicker && (
                            <DateTimePicker
                                value={lastPeriodDate ?? new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                                onChange={(_, date) => {
                                    setShowLastPeriodPicker(Platform.OS === 'ios');
                                    if (date) setLastPeriodDate(date);
                                }}
                                maximumDate={new Date()}
                            />
                        )}

                        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
                            <Text style={styles.continueButtonText}>Continue →</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                    </>
                );

            case 3:
                return (
                    <>
                        <Text style={styles.title}>One important note</Text>
                        <Text style={styles.subtitle}>Please read before you start.</Text>

                        <View style={styles.disclaimerBox}>
                            <Text style={styles.disclaimerHeading}>
                                CycleSense is not a medical device
                            </Text>
                            <Text style={styles.disclaimerText}>
                                This app is desgined to help you track your menstrual cycle and identify period
                                patterns over time. It does not provide medical diagnoses, adn predictions may
                                not be accraute for everyone.{'\n\n'}
                                Do not use this app as a method of contraception or as a substitute for professional
                                medical advice. If you have concerns about your health, please consult a healthcare provider.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.checkRow}
                            activeOpacity={0.7}
                            onPress={() => setAgreed(a => !a)}
                        >
                            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                                {agreed && <Text style={styles.checkBoxIcon}>✓</Text>}
                            </View>
                            <Text style={styles.checkLabel}>I understand that this app is not a medical device and does not provide medical advice.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.continueButton, !agreed && styles.continueButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={!agreed || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.continueButtonText}>Start using CycleSense →</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                    </>
                );
        }
    }


    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.appName}>CycleSense</Text>
                    <Text style={styles.tagline}>{taglines[step]}</Text>
                </View>

                <ProgressDots />

                <View style={styles.card}>
                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                    {renderStep()}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const PINK = '#f06292';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff0f5',
    },

    inner: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },

    header: {
        alignItems: 'center',
        marginBottom: 20,
    },

    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: PINK,
        letterSpacing: 0.5,
    },

    tagline: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 4,
    },

    progressRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 8,
    },

    dot: {
        height: 6,
        borderRadius: 3,
    },

    dotActive: {
        width: 24,
        backgroundColor: PINK,
    },

    dotDone: {
        width: 10,
        backgroundColor: PINK,
        opacity: 0.4,
    },

    dotInactive: {
        width: 10,
        backgroundColor: '#e0e0e0',
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: PINK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 6,
    },

    subtitle: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 20,
        lineHeight: 20,
    },  

    errorBox: {
        backgroundColor: '#fce4ec',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },

    errorText: {
        color: '#c62828',
        fontSize: 13,
    },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
        marginBottom: 6,
        marginTop: 12,
    },

    input: {
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#fafafa',
    },

    dateButton: {
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#fafafa',
    },

    dateButtonText: {
        fontSize: 15,
        color: '#333',
    },

    stepperWrap: {
        marginBottom: 8,
    },  

    stepper: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        overflow: 'hidden',
    },

    stepperBtn: {
        width: 48,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
    },

    stepperBtnText: {
        fontSize: 22,
        color: '#555',
        lineHeight: 26,
    },

    stepperValue: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1.5,
        borderRightWidth: 1.5,
        borderColor: '#f0f0f0',
        backgroundColor: '#fff',
    },

    stepperValueText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },

    stepperHint: {
        fontSize: 12,
        color: '#bbb',
        marginTop: 6,
        marginBottom: 4,
    },

    disclaimerBox: { 
        backgroundColor: '#fff9fb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1, 
        borderColor: '#fce4ec',
    },

    disclaimerHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },

    disclaimerText: {
        fontSize: 13,
        color: '#888',
        lineHeight: 20,
    },

    checkRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 16,
    },

    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        flexShrink: 0,
    },

    checkboxChecked: {
        borderColor: PINK,
        backgroundColor: PINK,
    },

    checkBoxIcon: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    checkLabel: {
        flex: 1,
        fontSize: 13,
        color: '#888',
        lineHeight: 20,
    },

    continueButton: {
        backgroundColor: PINK,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },

    continueButtonDisabled: {
        opacity: 0.45,
    },

    continueButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    backButton: {
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
    },

    backButtonText: {
        color: '#aaa',
        fontSize: 15,
        fontWeight: '600',
    },

});