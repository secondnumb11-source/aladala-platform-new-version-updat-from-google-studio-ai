import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<any>(() => {
    // Initialize with local storage if available
    const localPrefs = localStorage.getItem('user_preferences');
    return localPrefs ? JSON.parse(localPrefs) : {};
  });
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
      if (data && data.settings) {
        setPreferences(data.settings);
        localStorage.setItem('user_preferences', JSON.stringify(data.settings));
      }
    } catch (e) {
      console.error('Error fetching preferences:', e);
    } finally {
      setLoading(false);
    }
  }

  async function updatePreference(key: string, value: any) {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem('user_preferences', JSON.stringify(newPrefs));
    try {
      await supabase.from('user_preferences').upsert({ settings: newPrefs });
    } catch (err) {
      console.error('Failed to update preferences in Supabase', err);
    }
  }

  // الدالة الجديدة لحفظ طريقة العرض (قائمة أو كروت)
  async function updateViewMode(viewMode: 'grid' | 'table') {
    await updatePreference('cases_view_mode', viewMode);
  }

  return { preferences, updatePreference, updateViewMode, loading };
}
