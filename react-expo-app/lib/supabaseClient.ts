import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual credentials
const supabaseUrl = 'https://rupapbncwfhbhemuzzab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGFwYm5jd2ZoYmhlbXV6emFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxOTAxMDAsImV4cCI6MjA3NTc2NjEwMH0.VFBpXI2IboYmDK4KYuHbnB6Ke2_CVjGDR6j3VaVw9cw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
