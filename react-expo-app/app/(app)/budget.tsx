import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';

// ---------------------------------------------------------------
// 1. SUPABASE/AUTH IMPORTS
// ---------------------------------------------------------------
import { supabase } from '@/lib/supabaseClient'; 
import { useAuth } from '@/lib/AuthContext';    
// ---------------------------------------------------------------

// Define the type for the data structure coming from the 'Purchases' table
type PurchaseDecision = {
  id: string;
  name: string; // <-- INITIAL item name
  amount: number; // <-- INITIAL amount
  final_name: string; // <-- FINAL item name (to match what's in the DB now)
  final_amount: number; // <-- FINAL amount spent
  emotion: 'positive' | 'neutral' | 'negative'; // The Gemini verdict
  created_at: string; // The timestamp from Supabase
};

export default function BudgetScreen() {
  const { session } = useAuth();
  const [decisions, setDecisions] = useState<PurchaseDecision[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch data from Supabase
  const fetchDecisions = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('Purchases')
      // --- UPDATED SELECT QUERY ---
      .select('id, name, amount, final_name, final_amount, emotion, created_at')
      .eq('userId', session.user.id)
      .order('created_at', { ascending: false }); // Show newest first

    if (error) {
      console.error('Error fetching purchases:', error);
    } else if (data) {
      setDecisions(data as PurchaseDecision[]);
    }
    setLoading(false);
  };

  // Use useFocusEffect to run fetchDecisions whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDecisions();
      return () => { };
    }, [session])
  );
  
  // Helper to format Supabase data for the UI card
  const formatDecisionForRender = (item: PurchaseDecision) => {
      // Formatting the date
      const date = new Date(item.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });

      return {
          id: item.id,
          // Final Decision Info
          item: item.final_name, // Use final_name as the main title
          amount: item.final_amount,
          status: item.emotion,
          date: date,
          // Initial Plan Info
          initialName: item.name,
          initialAmount: item.amount,
      };
  };


  const renderItem = ({ item }: { item: PurchaseDecision }) => {
    // Format the Supabase item into a UI item
    const uiItem = formatDecisionForRender(item);
    
    // Determine the status styles based on the formatted status
    let statusStyle = styles.statusNeutral; 
    if (uiItem.status === 'positive') {
        statusStyle = styles.statusPositive;
    } else if (uiItem.status === 'negative') {
        statusStyle = styles.statusNegative;
    }
    
    return (
      <View style={styles.decisionCard}>
        
        {/* Initial Plan - NEW ELEMENT HERE */}
        <Text style={styles.initialPlanText}>
            Initial Plan: {uiItem.initialName} (${uiItem.initialAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
        </Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{uiItem.item}</Text>
          <Text style={styles.cardAmount}>
            ${uiItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{uiItem.date}</Text>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{uiItem.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* List of Previous Decisions */}
      <FlatList
        data={decisions} 
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <Text style={styles.listHeaderTitle}>Recent Purchase Analyses</Text>
        )}
        ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
                {loading 
                    ? <ActivityIndicator size="large" color="#007AFF" /> 
                    : <Text style={styles.emptyText}>No decisions recorded yet. Tap '+' to start.</Text>
                }
            </View>
        )}
      />

      {/* Floating Action Button (FAB) using Expo Router Link */}
      <Link href="/budget/new" asChild>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  listContent: {
    padding: 15,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginLeft: 5,
  },
  // --- CARD STYLES ---
  decisionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5E5', 
  },
  // --- NEW STYLE FOR INITIAL PLAN ---
  initialPlanText: {
    fontSize: 12,
    color: '#A0A0A0', // Subtle grey color
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Reduced marginBottom since we added initialPlanText
    marginBottom: 5, 
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 10, // Added space between main content and footer
  },
  cardDate: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  // --- STATUS BADGE STYLES (Unchanged) ---
  statusBadge: {
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusNeutral: {
    backgroundColor: '#FEF8E3', 
    color: '#FFB800', 
  },
  statusPositive: {
    backgroundColor: '#E6F7ED',
    color: '#00A86B',
  },
  statusNegative: {
    backgroundColor: '#FBEBEB',
    color: '#D80032',
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      textAlign: 'center',
      color: '#A0A0A0',
      fontStyle: 'italic',
  },
  // --- FAB STYLES (Unchanged) ---
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 25,
    bottom: 25,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
