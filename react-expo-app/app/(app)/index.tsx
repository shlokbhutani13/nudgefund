import React, { useState, useCallback } from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient'; 
import { useFocusEffect } from 'expo-router';

// Define the precise structure needed for the calculation
type PurchaseRecord = {
  amount: number;
  final_amount: number;
};

export default function HomeScreen() {
  const { session, user } = useAuth();
  const [totalSaved, setTotalSaved] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING (Unchanged) ---
  const fetchSavingsData = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from('Purchases')
      .select('amount, final_amount')
      .eq('userId', session.user.id);

    if (!error && data) {
      const savedAmount = data.reduce((sum, record: PurchaseRecord) => {
        const saved = record.amount - record.final_amount;
        return sum + (saved > 0 ? saved : 0); 
      }, 0);

      setTotalSaved(savedAmount);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchSavingsData();
      return () => { };
    }, [session])
  );

  return (
    <View style={styles.container}>
      
      {/* 1. Header and Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.email.split('@')[0]}!</Text>
        <Text style={styles.tagline}>
          Your financial intelligence dashboard.
        </Text>
      </View>

      {/* 2. Main Savings Card (The prominent display) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Wealth Saved</Text>
        <Text style={styles.cardDescription}>
          The cumulative amount you redirected from impulse buys to savings.
        </Text>
        
        <View style={styles.savingsDisplay}>
          {loading ? (
            <ActivityIndicator size="large" color="#FFD700" />
          ) : (
            <Text style={styles.savedAmount}>
              ${totalSaved === null 
                ? '0.00' 
                : totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
            </Text>
          )}
        </View>
        <Text style={styles.cardFooter}>
            Tap 'Invest' to see this money work for you.
        </Text>
      </View>

      {/* 3. Footer/Guidance Area */}
      <View style={styles.guidanceArea}>
          <Text style={styles.guidanceText}>
              Navigate using the menu at the bottom.
          </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    // Sophisticated: Off-white background
    backgroundColor: '#F5F5F5', 
    padding: 25,
  },
  header: {
    paddingVertical: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800', // Extra bold for impact
    color: '#2C3E50', // Deep Charcoal/Navy
  },
  tagline: {
    fontSize: 16,
    color: '#7F8C8D', // Soft Gray
    marginTop: 5,
    fontWeight: '500',
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Slightly less rounded for sophistication
    padding: 25,
    // Subtle, focused shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05, // Very light shadow
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
    marginBottom: 40,
    borderLeftColor: '#FFD700', // Gold accent line
    borderLeftWidth: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 5,
    textTransform: 'uppercase', // Sophisticated style
    letterSpacing: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    marginBottom: 15,
  },
  savingsDisplay: {
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
  },
  savedAmount: {
    fontSize: 48,
    fontWeight: '900', // Black font weight
    color: '#FFD700', // Gold/Accent color
    // Subtle shadow on text to make it pop
    textShadowColor: 'rgba(0, 0, 0, 0.1)', 
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardFooter: {
    marginTop: 15,
    fontSize: 13,
    color: '#95A5A6',
    fontStyle: 'italic',
  },

  // Footer/Guidance Styles
  guidanceArea: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1', // Very light gray separator
  },
  guidanceText: {
      fontSize: 14,
      textAlign: 'center',
      color: '#34495E', // Muted dark color
      fontWeight: '500',
  }
});
