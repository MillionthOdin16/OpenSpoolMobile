import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const [ipAddress, setIpAddress] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const ip = await AsyncStorage.getItem('@printer_ip');
        if (ip !== null) {
          setIpAddress(ip);
        }
        const serial = await AsyncStorage.getItem('@printer_serial');
        if (serial !== null) {
          setSerialNumber(serial);
        }
        const code = await AsyncStorage.getItem('@printer_code');
        if (code !== null) {
          setAccessCode(code);
        }
      } catch (e) {
        Alert.alert('Failed to load settings');
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('@printer_ip', ipAddress);
      await AsyncStorage.setItem('@printer_serial', serialNumber);
      await AsyncStorage.setItem('@printer_code', accessCode);
      Alert.alert('Settings saved successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed to save settings');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Printer Settings</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>IP Address</Text>
          <TextInput
            style={styles.input}
            value={ipAddress}
            onChangeText={setIpAddress}
            placeholder="192.168.1.100"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Serial Number</Text>
          <TextInput
            style={styles.input}
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="0123456789"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>LAN Access Code</Text>
          <TextInput
            style={styles.input}
            value={accessCode}
            onChangeText={setAccessCode}
            placeholder="********"
            placeholderTextColor="#999"
            secureTextEntry
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={saveSettings}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  card: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Orbitron-Regular',
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderColor: '#404040',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#363636',
    color: '#ffffff',
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#363636',
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
  },
});

export default SettingsScreen;
