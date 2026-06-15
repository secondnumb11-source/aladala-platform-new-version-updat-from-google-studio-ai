import { supabase } from './supabase';

/**
 * StateSyncBridge: unifies app state synchronization between Supabase,
 * LocalStorage, and in-memory React states.
 */
export const StateSyncBridge = {
  syncState: async (userId: string, stateKey: string, localState: any, setStateFn: (val: any) => void) => {
    if (!userId) return;
    try {
      // Create standard cache key
      const localKey = `adalah-sync-${userId}-${stateKey}`;
      
      // Load local cache immediately to prevent layout shifts
      const cached = localStorage.getItem(localKey);
      if (cached) {
        try {
          setStateFn(JSON.parse(cached));
        } catch (e) {
          console.warn('Failed to parse local cache', e);
        }
      }

      // Initial fetch from Supabase
      const fetchState = async () => {
        const { data, error } = await supabase
          .from('user_states')
          .select('payload')
          .eq('user_id', userId)
          .eq('state_key', stateKey)
          .maybeSingle();
        
        if (data && data.payload) {
          localStorage.setItem(localKey, JSON.stringify(data.payload));
          setStateFn(data.payload);
        }
      };

      fetchState();

      // Real-time listener for remote updates
      const channel = supabase.channel(`user-state-${userId}-${stateKey}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'user_states', 
          filter: `user_id=eq.${userId}` 
        }, (payload: any) => {
          if (payload.new && payload.new.state_key === stateKey) {
            const remoteData = payload.new.payload;
            localStorage.setItem(localKey, JSON.stringify(remoteData));
            setStateFn(remoteData);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn(`[StateSyncBridge] Error syncing ${stateKey}:`, err);
    }
  },

  updateState: async (userId: string, stateKey: string, newState: any) => {
    if (!userId) return;
    try {
      const localKey = `adalah-sync-${userId}-${stateKey}`;
      localStorage.setItem(localKey, JSON.stringify(newState));
      
      const { error } = await supabase
        .from('user_states')
        .upsert({ 
          user_id: userId, 
          state_key: stateKey, 
          payload: newState, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id,state_key' });
      
      if (error) throw error;
    } catch (err) {
      console.warn(`[StateSyncBridge] Error updating ${stateKey}:`, err);
    }
  }
};
