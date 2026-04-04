import { Text, View, TextInput, Button, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp } = useAuth();

  const handleSignUp = () => {
    signUp(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
    />
    <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
    />
      <Button title="Sign Up" onPress={handleSignUp} />

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Log In
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
  },
  link: { marginTop: 15, color: 'blue', textAlign: 'center' },
});
