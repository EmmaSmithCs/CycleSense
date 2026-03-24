// app/(auth)/onboarding.tsx

import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { auth, db } from '../../firebase/config';

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setBirthday(selectedDate);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!auth.currentUser) throw new Error('User not logged in');
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        birthday: birthday.toISOString(),
        onboarded: true,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
        setError(err.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>CycleSense</Text>
          <Text style={styles.tagline}>Let's get to know you</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Tell us a little about yourself to get started.</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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
              onPress={() => setShowDatePicker(true)}
          >
              <Text style={styles.dateButtonText}>
                  🎂  {birthday.toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                  })}
              </Text>
          </TouchableOpacity>

          {showDatePicker && (
              <DateTimePicker
                  value={birthday}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
              />
          )}

          <TouchableOpacity
              style={[styles.continueButton, loading && styles.continueButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
          >
              {loading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={styles.continueButtonText}>Let's go →</Text>
              )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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

    // header
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#f06292',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 4,
    },

    // card
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#f06292',
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
    },

    // error
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

    // inputs
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

    // date picker button
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

    // continue button
    continueButton: {
        backgroundColor: '#f06292',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    continueButtonDisabled: {
        opacity: 0.6,
    },
    continueButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});