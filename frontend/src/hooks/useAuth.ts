import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    return await supabase.auth.signInWithPassword({ email, password: pass });
  };

  const signUp = async (email: string, pass: string, name: string) => {
    return await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: name }
      }
    });
  };

  const signOut = () => supabase.auth.signOut();

  return { user, signIn, signUp, signOut };
}
