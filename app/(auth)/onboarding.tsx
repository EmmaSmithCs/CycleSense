// app/(auth)/onboarding.tsx

/*
    This file defines the Onboarding component, which is a multi-step onboarding flow for new users of the CycleSense app.
    The onboarding process collects important information from the user such as their:
    - Name and birthday
    - Average cycle length and period duration
    - Date of their last period

    The onboarding flow consists of 4 steps, each with its own screen and input fields. 
    The user can navigate through the steps using "Continue" and "Back" buttons
    Their progress is indicated by a row of dots at the top of the screen.
    The final step includes a disclaimer that the user must agree to before they can start using the app.

    Key features:
    - Multi-step onboarding process that collects important user information for personalized cycle tracking.
    - Validation of user input at each step to ensure that necessary information is provided before advancing.
    - Progress indicators to show the user how far along they are in the onboarding process.
    - Final disclaimer that the user must agree to before they can start using the app, which is important for setting expectations about the app's limitations and ensuring informed use.

*/

// Imports
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { auth, db } from '../../firebase/config';
import { saveDailyLog } from '../../firebase/dailyLogs';

// Total number of steps in the onboarding process, used for rendering progress dots and managing navigation between steps
const TOTAL_STEPS = 4;

// Onboarding component that guides new users through a multi-step process to set up their profile 
export default function Onboarding() {
    
    // Router for navigation
    const router = useRouter();
    
    // State variables for managing the onboarding steps
    const [step, setStep] = useState(0);

    // State variables for user input during onboarding
    const [name, setName] = useState('');
    const [birthday, setBirthday] = useState(new Date(2000, 0, 1)); // default to Jan 1, 2000
    const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
    
    // Cycle information state variables
    const [cycleLength, setCycleLength] = useState(28);
    const [periodDuration, setPeriodDuration] = useState(5);
    const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
    const [showLastPeriodPicker, setShowLastPeriodPicker] = useState(false);

    // State variable to track whether the user has agreed to the disclaimer in the final step of onboarding, which is required before they can start using the app
    const [agreed, setAgreed] = useState(false);

    // State variables for managing loading state and error messages during the submission of onboarding data to the database
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handler for the "Continue" button on each step, which validates the input for the current step and advances to the next step if the input is valid
    const handleNext = () => {
        setError(null);
        if (step === 0 && !name.trim()) { 
            setError('Please enter your name to continue.'); // Validate that the name field is not empty 
            return;
        }
        if (step === 2 && (!lastPeriodDate)) {
            setError('Please select the date of your last period to continue.'); // Validate that the last period date has been selected in step 3
            return;
        }
        setStep((s) => s + 1);
    };

    // Handler for the "Back" button on steps 2 and 3, which simply goes back to the previous step without any validation since the user is just reviewing or changing their previous input
    const handleBack = () => {
        setError(null);
        setStep((s) => s - 1);
    };

    // Handler for the final submission of onboarding data
    const handleSubmit = async () => {

        // Validate that the user has agreed to the disclaimer before allowing submission
        if (!agreed) return;
        
        // Set loading state to true and clear any previous error messages before starting the submission process
        setLoading(true);
        setError(null);

        // Attempt to update the user's profile in the database with the onboarding information and seed daily logs
        try {
            if (!auth.currentUser) throw new Error("No authenticated user");
            const userRef = doc(db, "users", auth.currentUser.uid);
            
            // Update the user document with the onboarding information
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

            // After successful submission, navigate the user to the main part of the app
            router.replace('/(tabs)');
        } catch (e: any) {
            // If there is an error during submission, set the error message to be displayed to the user
            setError(e.message);
        }
        setLoading(false);
    };
    
    // Stepper component for selecting numeric values such as cycle length and period duration, which includes buttons to increment and decrement the value, and displays a hint below the stepper for additional guidance
    const Stepper = ({
        value, // The current value of the stepper, which is displayed in the center and updated when the user presses the increment or decrement buttons
        onChange, // Function to call when the value changes, which is triggered by the increment and decrement buttons to update the state in the parent component
        min, // The minimum allowed value for the stepper, which is used to prevent the user from decrementing below this value
        max, // The maximum allowed value for the stepper, which is used to prevent the user from incrementing above this value
        hint, // A hint or helper text that is displayed below the stepper to provide additional information or guidance to the user about the expected input or normal ranges for the value being selected
    } : {
        value: number;
        onChange: (val: number) => void;
        min: number;
        max: number;
        hint: string;
    }) => (
        <View style={styles.stepperWrap}>
            <View style={styles.stepper}>

                {/* Button to decrement the value */}
                <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => onChange(Math.max(min, value - 1))}
                >
                    <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>

                {/* Display the current value in the center of the stepper */}
                <View style={styles.stepperValue}>
                    <Text style={styles.stepperValueText}>{value}</Text>
                </View>

                {/* Button to increment the value */}
                <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => onChange(Math.min(max, value + 1))}
                >
                    <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Hint text below the stepper */}
            <Text style={styles.stepperHint}>{hint}</Text>
        </View>
    );
    
    // Component to render the progress dots at the top of the onboarding screens
    const ProgressDots = () => (
        <View style={styles.progressRow}>
            {/* Render a dot for each step in the onboarding process, with different styles based on whether the step is completed, active, or inactive */}
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot, // Base style for all dots
                        i < step && styles.dotDone, // Style for completed steps
                        i === step && styles.dotActive, // Style for the active step
                        i > step && styles.dotInactive, // Style for incomplete steps
                    ]}
                />
            ))}
        </View>
    );
    
    // Taglines for each step of the onboarding process
    const taglines = [
        "Let\'s get to know you",
        "Tell us about your cycle",
        "When did your last period start?",
        "One important note",
    ];
    
    // Function to render the content for the current step of the onboarding process
    const renderStep = () => {
        switch (step) {
            // The first step collects the user's name and birthday
            case 0:
                return (
                    <>
                        {/* Title and subtitle for the first step */ }
                        <Text style={styles.title}>Welcome!</Text>
                        <Text style={styles.subtitle}>Tell us a little about yourself to get started.</Text>
                    
                        {/* Input field for the user's name */ }
                        <Text style={styles.label}>Your first name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Emma"
                            placeholderTextColor="#ccc"
                            value={name}
                            onChangeText={setName}
                        />

                        {/* Date picker for the user's birthday, which is hidden until the user presses the button to show it */ }
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

                        {/* Show the date picker for the birthday when the user presses the button, and update the birthday state when a date is selected */ }
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

                        {/* Continue button to go to the next step, which triggers validation and advances the onboarding process */ }
                        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
                            <Text style={styles.continueButtonText}>Continue →</Text>
                        </TouchableOpacity>
                    </>
                );

            // The second step collects information about the user's cycle, including average cycle length and period duration
            case 1: 
                return (
                    <>
                        {/* Title and subtitle for the second step */ }
                        <Text style={styles.title}>Your cycle</Text>
                        <Text style={styles.subtitle}>Help us understand your cycle patterns. You can update this information at any time in the settings</Text>

                        {/* Stepper for selecting average cycle length */ }
                        <Text style={styles.label}>Average cycle length</Text>
                        <Stepper
                            value={cycleLength}
                            onChange={setCycleLength}
                            min={18}
                            max={45}
                            hint="Most cycles are between 21-35 days, but anywhere from 18-45 can be normal!"
                        />

                        {/* Stepper for selecting average period duration */ }
                        <Text style={styles.label}>Average period duration</Text>
                        <Stepper
                            value={periodDuration}
                            onChange={setPeriodDuration}
                            min={1}
                            max={10}
                            hint="Most periods last between 3-7 days, but anything from 1-10 can be normal!"
                        />

                        {/* Continue button to go to the next step */ }
                        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
                            <Text style={styles.continueButtonText}>Continue →</Text>
                        </TouchableOpacity>
                    </>
                );

            // The third step asks the user to select the date of their last period, which is important for calculating where they are in their cycle and providing accurate predictions from the start of using the app
            case 2:
                return (
                    <>
                        {/* Title and subtitle for the third step */ }
                        <Text style={styles.title}>Last period date</Text>
                        <Text style={styles.subtitle}>Select the first day of your last period. This lets us calculate where you are in your cycle right now. </Text>

                        {/* Button to show the date picker for selecting the last period date */ }
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

                        {/* A hint to guide the user */ }
                        <Text style={styles.stepperHint}>If you can't remember, just make your best guess!</Text>
                        
                        {/* Show the date picker for the last period date when the user presses the button, and update the lastPeriodDate state when a date is selected */ }
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

                        {/* Continue button to go to the next step */ }
                        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
                            <Text style={styles.continueButtonText}>Continue →</Text>
                        </TouchableOpacity>

                        {/* Back button to go to the previous step, which allows the user to review or change their previous input */ }
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                    </>
                );
            
            // The fourth and final step displays a disclaimer to the user, which they must agree to before they can start using the app
            case 3:
                return (
                    <>
                        {/* Title and subtitle for the final step */ }
                        <Text style={styles.title}>One important note</Text>
                        <Text style={styles.subtitle}>Please read before you start.</Text>

                        {/* Disclaimer box containing important information about the app's limitations and a warning  */ }
                        <View style={styles.disclaimerBox}>
                            <Text style={styles.disclaimerHeading}>
                                CycleSense is not a medical device
                            </Text>
                            <Text style={styles.disclaimerText}>
                                This app is designed to help you track your menstrual cycle and identify period
                                patterns over time. It does not provide medical diagnoses, and predictions may
                                not be accurate for everyone.{'\n\n'}
                                Do not use this app as a method of contraception or as a substitute for professional
                                medical advice. If you have concerns about your health, please consult a healthcare provider.
                            </Text>
                        </View>

                        {/* Checkbox for the user to agree to the disclaimer, which must be checked before they can submit and start using the app */ }
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

                        {/* Continue button to submit the onboarding information and start using the app, which is disabled until the user agrees to the disclaimer */ }
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

                        {/* Back button to go to the previous step, which allows the user to review or change their previous input */ }
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                    </>
                );
        }
    }

    // Render the onboarding component
    return (
        // Use KeyboardAvoidingView to ensure the keyboard does not cover input fields on iOS, and ScrollView to allow scrolling when the keyboard is open
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                {/* Header section with the app name and tagline that changes based on the current step of onboarding */ }
                <View style={styles.header}>
                    <Text style={styles.appName}>CycleSense</Text>
                    <Text style={styles.tagline}>{taglines[step]}</Text>
                </View>

                {/* Progress dots to indicate the user's progress through the onboarding steps */ }
                <ProgressDots />

                {/* Card containing the content for the current step, which is rendered by the renderStep function, with error handling */ }
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

// Pink color used throughout the onboarding screens
const PINK = '#f06292';

// Styles
const styles = StyleSheet.create({

    // Style for the container for the entire onboarding screen
    container: {
        flex: 1,
        backgroundColor: '#fff0f5',
    },

    // Style for the inner container for the ScrollView content
    inner: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },

    // Style for the header section containing the app name and tagline
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },

    // Style for the app name in the header
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: PINK,
        letterSpacing: 0.5,
    },

    // Style for the tagline in the header, which changes based on the current step of onboarding
    tagline: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 4,
    },

    // Style for the row of progress dots that indicate the user's progress through the onboarding steps
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 8,
    },

    // Base style for the progress dots
    dot: {
        height: 6,
        borderRadius: 3,
    },

    // Style for the active progress dot representing the current step
    dotActive: {
        width: 24,
        backgroundColor: PINK,
    },

    // Style for the completed progress dots representing steps that have been completed
    dotDone: {
        width: 10,
        backgroundColor: PINK,
        opacity: 0.4,
    },

    // Style for the inactive progress dots representing steps that have not yet been completed
    dotInactive: {
        width: 10,
        backgroundColor: '#e0e0e0',
    },

    // Style for the card that contains the content for each onboarding step
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

    // Style for the title text in each onboarding step
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 6,
    },

    // Style for the subtitle text in each onboarding step
    subtitle: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 20,
        lineHeight: 20,
    },  

    // Style for the error message box that appears when there is an error during submission of onboarding data to the database
    errorBox: {
        backgroundColor: '#fce4ec',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },

    // Style for the error message text within the error box
    errorText: {
        color: '#c62828',
        fontSize: 13,
    },

    // Style for the label text above each input field and stepper in the onboarding steps
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
        marginBottom: 6,
        marginTop: 12,
    },

    // Style for the text input fields in the onboarding steps
    input: {
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#fafafa',
    },

    // Style for the button that shows the date picker for selecting dates 
    dateButton: {
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#fafafa',
    },

    // Style for the text inside the date picker button
    dateButtonText: {
        fontSize: 15,
        color: '#333',
    },

    // Style for the wrapper around the stepper component
    stepperWrap: {
        marginBottom: 8,
    },  

    // Style for the stepper component 
    stepper: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        overflow: 'hidden',
    },

    // Style for the buttons on either side of the stepper to increment and decrement the value
    stepperBtn: {
        width: 48,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
    },

    // Style for the text inside the stepper buttons
    stepperBtnText: {
        fontSize: 22,
        color: '#555',
        lineHeight: 26,
    },

    // Style for the center part of the stepper that displays the current value
    stepperValue: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1.5,
        borderRightWidth: 1.5,
        borderColor: '#f0f0f0',
        backgroundColor: '#fff',
    },

    // Style for the text that displays the current value in the center of the stepper
    stepperValueText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },

    // Style for the hint text that appears below the stepper to provide additional guidance to the user about the expected input or normal ranges for the value being selected
    stepperHint: {
        fontSize: 12,
        color: '#bbb',
        marginTop: 6,
        marginBottom: 4,
    },

    // Style for the disclaimer box in the final step of onboarding
    disclaimerBox: { 
        backgroundColor: '#fff9fb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1, 
        borderColor: '#fce4ec',
    },

    // Style for the heading text in the disclaimer box
    disclaimerHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },

    // Style for the main text in the disclaimer box
    disclaimerText: {
        fontSize: 13,
        color: '#888',
        lineHeight: 20,
    },

    // Style for the row containing the checkbox and label for agreeing to the disclaimer in the final step of onboarding
    checkRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 16,
    },

    // Style for the checkbox used to agree to the disclaimer, which changes appearance when checked to indicate that the user has agreed
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

    // Style for the checkbox when it is checked to indicate that the user has agreed to the disclaimer
    checkboxChecked: {
        borderColor: PINK,
        backgroundColor: PINK,
    },

    // Style for the checkmark icon inside the checkbox when it is checked
    checkBoxIcon: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    // Style for the label text next to the checkbox for agreeing to the disclaimer
    checkLabel: {
        flex: 1,
        fontSize: 13,
        color: '#888',
        lineHeight: 20,
    },

    // Style for the continue button
    continueButton: {
        backgroundColor: PINK,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },

    // Style for the continue button when it is disabled 
    continueButtonDisabled: {
        opacity: 0.45,
    },

    // Style for the text inside the continue button
    continueButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    // Style for the back button that appears on steps 2, 3, and 4 to allow the user to go back to the previous step
    backButton: {
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: '#f0f0f0',
        borderRadius: 12,
    },

    // Style for the text inside the back button
    backButtonText: {
        color: '#aaa',
        fontSize: 15,
        fontWeight: '600',
    },

});