import React, { useState, useCallback, useMemo } from 'react';
import { Text, View, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker'; 
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient'; 
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';

// ... (Configuration, Types, and Helper Functions remain the same)

const INVESTMENT_PERIOD_YEARS = 20;
const CHART_WIDTH = Dimensions.get('window').width * 0.9;

const INVESTMENT_OPTIONS = [
  { label: 'S&P 500 Index Fund (10.0% ROI)', value: 'snp', roi: 0.10, color: '#007AFF' },
  { label: 'Low-Risk Government Bonds (4.0% ROI)', value: 'bonds', roi: 0.04, color: '#00A86B' },
  { label: 'High-Growth Tech Portfolio (15.0% ROI)', value: 'growth', roi: 0.15, color: '#FF3B30' },
  { label: 'Cash Savings (0.5% ROI)', value: 'cash', roi: 0.005, color: '#FF9500' },
];

type PurchaseRecord = {
  amount: number;
  final_amount: number;
};

const calculateFutureValue = (principal: number, rate: number, years: number) => {
  return principal * Math.pow(1 + rate, years);
};

// --- INVESTMENT PAGE COMPONENT ---
export default function InvestScreen() {
  const { session } = useAuth();
  const [totalSaved, setTotalSaved] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [open, setOpen] = useState(false);
  const [selectedInvestmentValue, setSelectedInvestmentValue] = useState(INVESTMENT_OPTIONS[0].value);
  const [items, setItems] = useState(INVESTMENT_OPTIONS);

  const selectedInvestment = useMemo(() => 
    items.find(opt => opt.value === selectedInvestmentValue) || items[0], 
  [selectedInvestmentValue, items]);


  // --- DATA FETCHING LOGIC (omitted for brevity, assume it works) ---
  const fetchSavingsData = async () => {
    // ... (Your fetch logic)
    if (!session?.user?.id) {
        setError("User session not found.");
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await supabase
        .from('Purchases')
        .select('amount, final_amount')
        .eq('userId', session.user.id);

    if (fetchError) {
        console.error('Error fetching savings data:', fetchError);
        setError(`Failed to fetch savings data: ${fetchError.message}`);
    } else if (data) {
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
  
  // --- CALCULATION LOGIC (omitted for brevity, assume it works) ---
  const { projectionLabels, projectionData, futureValue } = useMemo(() => {
    const principal = totalSaved ?? 0;
    
    if (principal <= 0) {
      return { projectionLabels: [], projectionData: [], futureValue: 0 };
    }

    const rate = selectedInvestment.roi;
    const labels: string[] = [];
    const dataPoints: number[] = [];
    
    for (let year = 0; year <= INVESTMENT_PERIOD_YEARS; year += 5) {
      labels.push(year === 0 ? 'Now' : `${year} Yr`);
      const value = calculateFutureValue(principal, rate, year);
      dataPoints.push(Math.round(value));
    }
    
    const finalValue = calculateFutureValue(principal, rate, INVESTMENT_PERIOD_YEARS);

    return { 
      projectionLabels: labels, 
      projectionData: dataPoints, 
      futureValue: finalValue
    };
  }, [totalSaved, selectedInvestment]); 

  // --- RENDER LOGIC ---

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Calculating total savings...</Text>
      </View>
    );
  }

  if (error || totalSaved === null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading data or session: {error || "Unknown"}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        // FIX 1: Allow nested scrolling (primarily for Android)
        nestedScrollEnabled={true} 
        showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Your Investment Potential</Text>
      
      {/* 1. SAVINGS SUMMARY CARD (Omitted for brevity) */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Saved from Nudged Decisions</Text>
        <Text style={styles.savedAmount}>
          ${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        
                <Text style={styles.summaryLabel}>You should invest this. You were going to spend it anyway!</Text>

      </View>


      {/* 2. INVESTMENT SELECTION (Dropdown) */}
      <View style={[styles.investmentSelection, { zIndex: 100 }]}> 
        <Text style={styles.label}>Select Investment Strategy</Text>
        
        <DropDownPicker
            open={open}
            value={selectedInvestmentValue}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedInvestmentValue}
            setItems={setItems}
            placeholder="Select an investment strategy..."
            style={styles.dropdownStyle}
            containerStyle={styles.dropdownContainer}
            textStyle={{ fontSize: 16, color: '#333' }}
            dropDownContainerStyle={styles.dropDownContainerStyle}
            // FIX 2: Use SCROLLVIEW for the list instead of the default FlatList/VirtualizedList
            listMode="SCROLLVIEW" 
        />
      </View>

      {/* 3. COMPOUND INTEREST PROJECTION (Omitted for brevity) */}
      {totalSaved > 0 ? (
        <>
          <Text style={styles.projectionTitle}>
            Projected Value in {INVESTMENT_PERIOD_YEARS} Years
          </Text>
          <Text style={styles.projectionValue}>
            ${futureValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          <View style={styles.chartWrapper}>
            <LineChart
              data={{
                labels: projectionLabels,
                datasets: [{ data: projectionData }]
              }}
              width={CHART_WIDTH}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0, 
                color: (opacity = 1) => `${selectedInvestment.color}F${Math.round(opacity * 9)}`, 
                labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "4", strokeWidth: "2", stroke: selectedInvestment.color }
              }}
              bezier
              style={styles.chartStyle}
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Start tracking purchases to see your investment potential!</Text>
        </View>
      )}
      
    </ScrollView>
  );
}

// ... (Styles remain the same)

const styles = StyleSheet.create({
    scrollContainer: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    contentContainer: {
      padding: 20,
      alignItems: 'center',
      zIndex: 1, 
    },
    centerContainer: {
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#F7F7F7'
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 20,
    },
    loadingText: {
      marginTop: 10,
      color: '#6B6B6B',
    },
    errorText: {
      color: '#D80032',
      textAlign: 'center',
      fontWeight: '600',
    },
    summaryCard: {
      width: '100%',
      backgroundColor: '#E6F7ED', 
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginBottom: 25,
      borderWidth: 1,
      borderColor: '#00A86B',
    },
    summaryLabel: {
      fontSize: 14,
      color: '#007A50',
      fontWeight: '600',
      marginBottom: 5,
    },
    savedAmount: {
      fontSize: 34,
      fontWeight: 'bold',
      color: '#00A86B',
    },
    investmentSelection: {
      width: '100%',
      marginBottom: 30,
      paddingHorizontal: 10,
      zIndex: 100, 
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 8,
    },
    dropdownContainer: {
      height: 50,
    },
    dropdownStyle: {
      backgroundColor: '#fff',
      borderColor: '#E5E5E5',
    },
    dropDownContainerStyle: {
      backgroundColor: '#fff',
      borderColor: '#E5E5E5',
    },
    projectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginBottom: 5,
    },
    projectionValue: {
      fontSize: 30,
      fontWeight: 'bold',
      color: '#007AFF', 
      marginBottom: 20,
    },
    chartWrapper: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    chartStyle: {
      marginVertical: 8,
      borderRadius: 16,
    },
    emptyContainer: {
      marginTop: 50,
      padding: 20,
      backgroundColor: '#fff',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E5E5E5',
    },
    emptyText: {
      fontSize: 16,
      color: '#6B6B6B',
      textAlign: 'center',
    },
});
