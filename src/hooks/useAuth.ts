import { useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  /** Kayıtlı oturum kontrolü bitti mi? (false iken "giriş yapılmamış" varsayma) */
  ready: boolean;
  /** Kullanıcı şifre yenileme bağlantısıyla geldi; yeni şifre belirlemesi gerekir. */
  recovery: boolean;
  clearRecovery: () => void;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState<boolean>(!supabase);
  const [recovery, setRecovery] = useState(false);
  const authEventSeen = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    // INITIAL_SESSION / SIGNED_IN olayları, getSession cevabından sonra gelirse
    // eski bir oturum cevabının yeni Google oturumunu ezmesini engelle.
    
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      authEventSeen.current = true;
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') setRecovery(false);
      setReady(true);
    });

    // Bazı istemci başlangıçlarında INITIAL_SESSION olayı gelmeyebilir;
    // getSession yalnızca henüz auth olayı alınmadıysa başlangıç yedeğidir.
    void supabase.auth.getSession().then(({ data }) => {
      if (!active || authEventSeen.current) return;
      setSession(data.session);
      setReady(true);
    }).catch(() => {
      if (active && !authEventSeen.current) setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user: session?.user ?? null, ready, recovery, clearRecovery: () => setRecovery(false) };
}
