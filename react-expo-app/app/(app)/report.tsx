import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { GoogleGenAI } from '@google/genai'; // ✅ Match new.tsx usage

// ---------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------
const GEMINI_API_KEY = 'AIzaSyAwzZjKIn_4XRBmYLcFGHidupEdnCyDRd4'; // ⚠️ Replace this key or store in env
const useGemini = () => useMemo(() => new GoogleGenAI({ apiKey: GEMINI_API_KEY }), []);

// ---------------------------------------------------------------
// TYPE DEFINITION
// ---------------------------------------------------------------
type PurchaseDecision = {
  id: string;
  created_at: string;
  name: string;
  amount: number;
  category: string;
  emotion: 'positive' | 'neutral' | 'negative';
  final_name: string;
  final_amount: number;
  userId: string;
};

// ---------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------
export default function ReportScreen() {
  const ai = useGemini();
  const { session } = useAuth();

  const [data, setData] = useState<PurchaseDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------
  // FETCH PURCHASES FROM SUPABASE
  // ---------------------------------------------------------------
  const fetchAllData = async () => {
    if (!session?.user?.id) {
      setError('User session not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('Purchases')
      .select('id, created_at, name, amount, category, emotion, final_name, final_amount, userId')
      .eq('userId', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching report data:', error);
      setError(`Failed to fetch data: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data) {
      setData(data as PurchaseDecision[]);
      generateAllMonthlyReports(data as PurchaseDecision[]);
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
      return () => {};
    }, [session])
  );

  // ---------------------------------------------------------------
  // GROUP DATA BY MONTH
  // ---------------------------------------------------------------
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, PurchaseDecision[]> = {};
    data.forEach((item) => {
      const date = new Date(item.created_at);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(item);
    });
    return groups;
  }, [data]);

  // ---------------------------------------------------------------
  // GENERATE AI INSIGHTS
  // ---------------------------------------------------------------
  const generateAllMonthlyReports = async (allData: PurchaseDecision[]) => {
    const monthlyGroups: Record<string, PurchaseDecision[]> = {};
    allData.forEach((item) => {
      const date = new Date(item.created_at);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = [];
      monthlyGroups[monthKey].push(item);
    });

    const insights: Record<string, string> = {};

    for (const [month, list] of Object.entries(monthlyGroups)) {
      const totalSpent = list.reduce((a, b) => a + (b.final_amount || 0), 0);
      const negative = list.filter((x) => x.emotion === 'negative');
      const potentialSave = negative.reduce((a, b) => a + (b.final_amount || 0), 0);
      const topCategory = [...new Set(list.map((x) => x.category))].join(', ');

      const prompt = `
      You are a financial coach analyzing ${month}'s spending:
      - Total spent: $${totalSpent.toFixed(2)}
      - Negative purchases (avoidable): $${potentialSave.toFixed(2)}
      - Categories: ${topCategory}
      - Positive: ${list.filter(x => x.emotion === 'positive').length}
      - Neutral: ${list.filter(x => x.emotion === 'neutral').length}
      - Negative: ${list.filter(x => x.emotion === 'negative').length}

      Write a 3–4 sentence report that:
      1. Summarizes spending habits quantitatively.
      2. Suggests how much could be saved next month.
      3. Ends with a motivational financial nudge.
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const resultText = response.text ?? 'AI could not generate insight.';
        insights[month] = resultText.trim();
      } catch (err) {
        console.error('Gemini error for', month, err);
        insights[month] = 'AI could not generate insights for this month.';
      }
    }

    setAiInsights(insights);
  };

  // ---------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------
  const formatMoney = (num: number) =>
    `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const getEmotionStyle = (e: string) =>
    e === 'positive'
      ? { bg: '#E6F7ED', color: '#00A86B' }
      : e === 'negative'
      ? { bg: '#FBEBEB', color: '#D80032' }
      : { bg: '#FEF8E3', color: '#FFB800' };

  // ---------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your monthly reports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>📊 Monthly Spending Reports</Text>

      {Object.keys(groupedByMonth).length === 0 && (
        <View style={styles.centerContent}>
          <Ionicons name="document-text-outline" size={60} color="#999" />
          <Text style={styles.emptyText}>No purchase data found.</Text>
        </View>
      )}

      {Object.entries(groupedByMonth).map(([month, list]) => {
        const total = list.reduce((sum, d) => sum + (d.final_amount || 0), 0);
        const positive = list.filter((d) => d.emotion === 'positive').length;
        const neutral = list.filter((d) => d.emotion === 'neutral').length;
        const negative = list.filter((d) => d.emotion === 'negative').length;

        return (
          <View key={month} style={styles.monthBlock}>
            <Text style={styles.monthTitle}>{month}</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>💰 Total Spent: {formatMoney(total)}</Text>
              <Text style={styles.summaryText}>
                🟢 {positive} | ⚪ {neutral} | 🔴 {negative}
              </Text>
            </View>

            {list.map((item) => {
              const s = getEmotionStyle(item.emotion);
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.itemTitle}>{item.final_name || item.name}</Text>
                    <Text style={[styles.emotionTag, { backgroundColor: s.bg, color: s.color }]}>
                      {item.emotion.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.amountText}>{formatMoney(item.final_amount)}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.metaText}>{item.category}</Text>
                    <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
              );
            })}

            {aiInsights[month] && (
              <View style={styles.aiBox}>
                <Text style={styles.aiHeader}>🤖 AI Insight</Text>
                <Text style={styles.aiText}>{aiInsights[month]}</Text>
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity onPress={fetchAllData} style={styles.refreshButton}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.refreshText}>Regenerate Reports</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F9FAFB', paddingBottom: 100 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 15 },
  monthBlock: { marginBottom: 30 },
  monthTitle: { fontSize: 20, fontWeight: '700', color: '#007AFF', marginBottom: 8 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  summaryText: { fontSize: 15, color: '#333', marginBottom: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  amountText: { fontSize: 16, fontWeight: '700', color: '#007AFF', marginVertical: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 13, color: '#777' },
  emotionTag: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  aiBox: {
    backgroundColor: '#EAF2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  aiHeader: { fontWeight: '700', color: '#007AFF', marginBottom: 4 },
  aiText: { color: '#333', lineHeight: 20 },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 20,
  },
  refreshText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6B6B6B', marginTop: 10 },
  emptyText: { fontSize: 15, color: '#999', marginTop: 10 },
  errorText: { color: '#D80032', fontWeight: '600', textAlign: 'center', margin: 20 },
});
