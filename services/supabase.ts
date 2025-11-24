import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'supabase_config';

export const getStoredConfig = (): SupabaseConfig | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
};

export const saveConfig = (config: SupabaseConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const config = getStoredConfig();
  if (config && config.url && config.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
      return supabaseInstance;
    } catch (error) {
      console.error("Failed to initialize Supabase:", error);
      return null;
    }
  }
  return null;
};

export const resetSupabase = () => {
  supabaseInstance = null;
};

export const testConnection = async (url: string, key: string): Promise<boolean> => {
  try {
    const client = createClient(url, key);
    // Try to fetch something simple. Even if table doesn't exist, connection failure throws distinct error.
    // We'll check health by making a lightweight query (e.g., getting a non-existent row from a likely table)
    // or just checking if the client initializes without syntax error.
    // Best practice without guaranteed tables: Check if we can reach the server.
    const { error } = await client.from('classes').select('count', { count: 'exact', head: true });
    
    // If error is related to connection/url/key, it usually has specific codes or is a network error.
    // If error is "relation does not exist", the connection IS successful, but table is missing.
    if (error && (error.code === 'PGRST301' || error.message?.includes('fetch'))) {
       return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};