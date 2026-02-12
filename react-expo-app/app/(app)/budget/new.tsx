import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Button,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

// ---------------------------------------------------------------
// 1. GEMINI & SUPABASE/AUTH IMPORTS
// ---------------------------------------------------------------
import { GoogleGenAI } from '@google/genai'; // <-- New Import
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

// ⚠️ WARNING: DO NOT USE THIS API KEY IN PRODUCTION ⚠️
const GEMINI_API_KEY = 'AIzaSyAwzZjKIn_4XRBmYLcFGHidupEdnCyDRd4';
// ---------------------------------------------------------------

// Mock list of categories
const CATEGORIES = ['Groceries', 'Dining Out', 'Shopping', 'Travel', 'Bills', 'Miscellaneous'];
type Verdict = 'positive' | 'neutral' | 'negative' | null;

// --- Initialize Gemini Client ---
const useGemini = () => {
  return useMemo(() => new GoogleGenAI({ apiKey: GEMINI_API_KEY }), []);
};

export default function NewPurchaseModal() {
  const ai = useGemini(); // Initialize Gemini Client
  const { session } = useAuth();

  // 1. Core Data State
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [finalName, setFinalName] = useState('');
  const [finalAmount, setFinalAmount] = useState('');

  // 2. Flow/Analysis State
  const [currentStep, setCurrentStep] = useState(1);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // 3. UI State
  const [loading, setLoading] = useState(false);

  // Helper to safely parse JSON from Gemini's text response
  const safeParseJson = (text: string, type: 'array' | 'object') => {
    const regex = type === 'array' ? /\[[\s\S]*?\]/ : /\{[\s\S]*?\}/;
    const jsonText = text.match(regex)?.[0];
    if (!jsonText) return null;
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse JSON:', jsonText, e);
      return null;
    }
  };

  // --- Step 1 Handlers: Collect Input and GENERATE QUESTIONS ---
  const handleProceedToQuestions = async () => {
    if (!item.trim() || !amount.trim() || !category) {
      Alert.alert('Missing Info', 'Please enter item, amount, and category.');
      return;
    }

    setLoading(true);

    const prompt = `You are a financial coach. The user is considering buying "${item!}" for $${amount!} in the "${category!}" category.
    Generate exactly 3 specific, open-ended questions that challenge the user's need for this purchase and its financial impact.
    Format your response as a simple JSON array of strings. Do NOT include any text or markdown outside the JSON block.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawParsed = safeParseJson(response.text!, 'array');

      if (!rawParsed) {
        throw new Error('Failed to parse AI response into JSON.');
      }

      if (!Array.isArray(rawParsed)) {
        throw new Error('AI response was not an array.');
      }

      if (rawParsed.length !== 3 || rawParsed.some((item) => typeof item !== 'string')) {
        throw new Error('Invalid response format from AI. Expected array of 3 strings.');
      }

      const parsedQuestions: string[] = rawParsed;

      setQuestions(parsedQuestions);
      setLoading(false);
      setCurrentStep(2);
    } catch (error) {
      setLoading(false);
      console.error('Gemini Question Generation Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown AI error occurred.';
      Alert.alert('AI Error', `Failed to generate questions: ${errorMessage}`);
    }
  };

  // --- Step 2 Handlers: Answer Questions and GENERATE VERDICT ---
  const handleGenerateVerdict = async () => {
    if (answers.some((a) => !a.trim())) {
      Alert.alert('Incomplete', 'Please provide an answer for all three questions.');
      return;
    }

    setLoading(true);

    const prompt = `You are a strict financial analysis AI. The user is considering "${item}" for $${amount} (Category: ${category}).
    Their answers to the three challenging questions are:
    1. ${answers[0]}
    2. ${answers[1]}
    3. ${answers[2]}

    Based *only* on the item, amount, and their answers, determine a final verdict:
    - 'positive' (purchase is wise, low impact, or high value)
    - 'neutral' (requires more thought, moderate impact)
    - 'negative' (purchase is ill-advised, high impact, or low value)

    Then, generate a brief, firm suggestion (1-2 sentences) justifying the verdict.
    
    Format your entire response as a single JSON object. Do NOT include any text or markdown outside the JSON block.
    
    Example format:
    {"verdict": "positive", "suggestion": "The $${amount} purchase aligns with your savings and shows high value. Proceed."}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const result = safeParseJson(response.text!, 'object') as { verdict: Verdict; suggestion: string };

      if (!result || !['positive', 'neutral', 'negative'].includes(result.verdict as string)) {
        throw new Error('Invalid verdict format from AI.');
      }

      setVerdict(result.verdict);
      setSuggestion(result.suggestion);
      setLoading(false);
      setCurrentStep(3);
    } catch (error) {
      setLoading(false);
      console.error('Gemini Verdict Generation Error:', error);
      Alert.alert('AI Error', 'Failed to generate a verdict. Check your prompt and API key.');
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  // --- Step 3 Handler: Final Save to Supabase ---
  const handleFinalSave = async () => {
    if (!finalName.trim() || !finalAmount.trim() || !verdict || !session?.user?.id) {
      Alert.alert('Missing Data', 'Please enter your final outcome and amount, and ensure you are logged in.');
      return;
    }

    setLoading(true);

    const purchaseData = {
      name: item,
      amount: parseFloat(amount),
      category: category,
      emotion: verdict,
      final_name: finalName,
      final_amount: parseFloat(finalAmount),
      userId: session.user.id,
    };

    const { error } = await supabase.from('Purchases').insert([purchaseData]);

    setLoading(false);

    if (error) {
      console.error('Supabase Insert Error:', error);
      Alert.alert('Save Failed', `Could not record purchase: ${error.message}`);
    } else {
      Alert.alert('Decision Saved!', 'Your purchase analysis has been recorded.');
      setItem('');
      setAmount('');
      setCategory('');
      setFinalName('');
      setFinalAmount('');
      setQuestions([]);
      setAnswers(['', '', '']);
      setVerdict(null);
      setSuggestion(null);
      setCurrentStep(1);
      router.back();
    }
  };

  // --- UI Rendering Helpers ---
  const getVerdictStyle = (v: Verdict) => {
    if (v === 'positive') return { backgroundColor: '#E0FFEB', borderColor: '#00A86B', color: '#00A86B' };
    if (v === 'negative') return { backgroundColor: '#FFE0E0', borderColor: '#D80032', color: '#D80032' };
    return { backgroundColor: '#F0F0F0', borderColor: '#AAAAAA', color: '#333' };
  };

  const renderStep1Input = () => (
    <>
      <Text style={styles.label}>Item Name</Text>
      <TextInput style={styles.input} placeholder="e.g., Chipotle" value={item} onChangeText={setItem} />

      <Text style={styles.label}>Initial Amount ($)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        value={amount}
        onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryTags}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tag, category === cat && styles.tagSelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.tagText, category === cat && styles.tagTextSelected]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonSpacer}>
        <Button
          title="Analyze Purchase"
          onPress={handleProceedToQuestions}
          color="#007AFF"
          disabled={loading || !category || !item || !amount}
        />
      </View>
    </>
  );

  const renderStep2Questions = () => (
    <>
      <Text style={styles.subtitle}>Gemini Analysis: Answer these questions honestly.</Text>
      {questions.map((q, index) => (
        <View key={index} style={{ marginBottom: 15 }}>
          <Text style={styles.questionText}>{q}</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Your answer..."
            value={answers[index]}
            onChangeText={(text) => handleQuestionChange(index, text)}
            multiline
            textAlignVertical="top"
          />
        </View>
      ))}
      <View style={styles.buttonSpacer}>
        <Button
          title="Get Decision"
          onPress={handleGenerateVerdict}
          color="#007AFF"
          disabled={loading || answers.some((a) => !a.trim())}
        />
      </View>
    </>
  );

  const renderStep3Verdict = () => {
    const verdictStyle = getVerdictStyle(verdict);

    return (
      <>
        <Text style={styles.subtitle}>Gemini Verdict for {item}</Text>

        <View
          style={[
            styles.verdictBox,
            { borderColor: verdictStyle.borderColor, backgroundColor: verdictStyle.backgroundColor },
          ]}
        >
          <Text style={[styles.verdictText, { color: verdictStyle.color }]}>{verdict?.toUpperCase()}</Text>
        </View>

        <Text style={styles.suggestionText}>{suggestion}</Text>

        <Text style={styles.finalQuestion}>What was your *final* purchase/decision?</Text>
        <TextInput
          style={styles.input}
          placeholder={`e.g. I bought it, or 'I decided against it.'`}
          value={finalName}
          onChangeText={setFinalName}
        />

        <Text style={styles.label}>Final Amount Spent ($)</Text>
        <TextInput
          style={styles.input}
          placeholder={`0.00`}
          value={finalAmount}
          onChangeText={(text) => setFinalAmount(text.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
        />

        <View style={styles.buttonSpacer}>
          <Button title="Finalize and Save" onPress={handleFinalSave} color="#00A86B" disabled={loading} />
        </View>
      </>
    );
  };

  // --- Main Component Render ---
  return (
    <KeyboardAvoidingView
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: `Step ${currentStep} of 3`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          ),
          headerShown: true,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputPanel}>
          {loading && <ActivityIndicator size="large" color="#007AFF" style={{ padding: 20 }} />}

          {!loading && currentStep === 1 && renderStep1Input()}
          {!loading && currentStep === 2 && renderStep2Questions()}
          {!loading && currentStep === 3 && renderStep3Verdict()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Styles (Unchanged) ---
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { padding: 20, paddingBottom: 40 },
  inputPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 15,
  },
  categoryTags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#EAEAEA',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  tagSelected: { backgroundColor: '#E0EEFF', borderColor: '#007AFF' },
  tagText: { fontSize: 13, color: '#555' },
  tagTextSelected: { color: '#007AFF', fontWeight: '600' },
  buttonSpacer: { marginTop: 20 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1A1A1A' },
  questionText: { fontSize: 15, fontWeight: '500', marginBottom: 5, color: '#333' },
  verdictBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 20,
  },
  verdictText: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  suggestionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 30,
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  finalQuestion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
});
