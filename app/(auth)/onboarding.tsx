import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import  { auth, db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDataChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!auth.currentUser) throw new Error("User not logged in");
      
      const userRef = doc(db, 'users', auth.currentUser.uid);

      await updateDoc(userRef, {
        name,
        birthday: birthday.toISOString(),
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };



  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>Welcome! Tell us about you!</Text>

          <Text>Name:</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, width: '100%', marginBottom: 20 }}

          />

          <Text>Birthday:</Text>
          <Button
            title={birthday.toDateString()}
            onPress={() => setShowDatePicker(true)}
          />

          {showDatePicker && (
            <DateTimePicker
              value={birthday}
              mode="date"
              display="default"
              onChange={handleDataChange}
              maximumDate={new Date()}
            />
          )}

          <Button title="Continue" onPress={handleSubmit} />


        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
