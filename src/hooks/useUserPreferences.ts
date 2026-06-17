import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
    
    // Subscribe to realtime changes
    const uniqueChannelName = `user_preferences_channel_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(uniqueChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_preferences' }, () => {
        fetchPreferences();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPreferences() {
    try {
      const { data, error } = await supabase.from('user_preferences').select('settings').single();
      if (data) setPreferences(data.settings);
    } catch (e) {
      console.error('Error fetching preferences:', e);
    } finally {
      setLoading(false);
    }
  }

  async function updatePreference(key: string, value: any) {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await supabase.from('user_preferences').upsert({ settings: newPrefs });
  }

  return { preferences, updatePreference, loading };
}
