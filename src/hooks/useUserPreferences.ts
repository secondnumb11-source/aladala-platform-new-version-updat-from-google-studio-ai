import { useState, useEffect, useCallback } from 'react';
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
      const local = localStorage.getItem('adalah_user_preferences');
      if (local) {
        try {
          setPreferences(JSON.parse(local));
        } catch (e) {}
      }

      const { data, error } = await supabase.from('user_preferences').select('settings').single();
      if (data && data.settings) {
        setPreferences(data.settings);
        localStorage.setItem('adalah_user_preferences', JSON.stringify(data.settings));
      }
    } catch (e) {
      console.error('Error fetching preferences:', e);
    } finally {
      setLoading(false);
    }
  }

  const updatePreference = useCallback((key: string, value: any) => {
    setPreferences((prevPrefs: any) => {
      const newPrefs = { ...prevPrefs, [key]: value };
      localStorage.setItem('adalah_user_preferences', JSON.stringify(newPrefs));
      
      // Fire-and-forget database upsert
      (async () => {
        try {
          const { error } = await supabase.from('user_preferences').upsert({ settings: newPrefs });
          if (error) {
            console.error('Error updating preference in database:', error.message);
          }
        } catch (e) {
          console.error('Error updating preference in database:', e);
        }
      })();
        
      return newPrefs;
    });
  }, []);

  return { preferences, updatePreference, loading };
}
