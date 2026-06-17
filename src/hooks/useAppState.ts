import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAppState() {
    const [state, setState] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStates();

        // Use a unique channel name or store it in a cleanup to avoid duplicate sub errors
        const channelName = `user_states_${Math.random().toString(36).substring(7)}`;
        const channel = supabase.channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_states' }, () => {
                fetchStates();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchStates() {
        try {
            const { data, error } = await supabase.from('user_states').select('state_key, state_data');
            if (data) {
                const stateObj: any = {};
                data.forEach(item => {
                    stateObj[item.state_key] = item.state_data;
                });
                setState(stateObj);
            }
        } catch (e) {
            console.error('Error fetching states:', e);
        } finally {
            setLoading(false);
        }
    }

    async function setStateData(key: string, value: any) {
        setState(prev => ({ ...prev, [key]: value }));
        await supabase.from('user_states').upsert({ state_key: key, state_data: value });
    }

    return { state, setStateData, loading };
}
