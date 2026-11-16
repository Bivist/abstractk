import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, Check, ChevronDown, Clock3, Loader2, Search, ShieldCheck, Users, UserX, Waves } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CommunityMemberSpace } from './CommunityMemberSpace';

type CommunityRole = 'admin' | 'member' | 'disabled';
type CommunityUser = {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string;
  role?: CommunityRole;
};
type AuditEntry = {
  id: number;
  actor_id: string | null;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

const roleLabels: Record<CommunityRole, string> = {
  admin: 'Yönetici',
  member: 'Üye',
  disabled: 'Erişimi kapalı'
};

function friendlyError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'İşlem tamamlanamadı. Lütfen tekrar dene.';
}

export const CommunityScreen: React.FC<{ userId: string | null }> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [memberships, setMemberships] = useState<Record<string, CommunityRole>>({});
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadConsole = useCallback(async () => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [adminResult, memberResult, enabledResult] = await Promise.all([
        supabase.rpc('community_is_admin'),
        supabase.rpc('community_is_member'),
        supabase.rpc('community_is_enabled')
      ]);
      if (adminResult.error) throw adminResult.error;
      if (memberResult.error) throw memberResult.error;
      if (enabledResult.error) throw enabledResult.error;

      const admin = Boolean(adminResult.data);
      setIsAdmin(admin);
      setIsMember(Boolean(memberResult.data));
      setEnabled(Boolean(enabledResult.data));

      if (admin) {
        const [memberRows, auditRows] = await Promise.all([
          supabase.from('community_memberships').select('user_id, role').order('updated_at', { ascending: false }).limit(200),
          supabase.from('community_admin_audit').select('id, actor_id, action, target_user_id, details, created_at').order('created_at', { ascending: false }).limit(30)
        ]);
        if (memberRows.error) throw memberRows.error;
        if (auditRows.error) throw auditRows.error;
        const next: Record<string, CommunityRole> = {};
        (memberRows.data || []).forEach((row: any) => { next[row.user_id] = row.role as CommunityRole; });
        setMemberships(next);
        setAudit((auditRows.data || []) as AuditEntry[]);
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void loadConsole(); }, [loadConsole]);

  const searchUsers = async () => {
    if (!supabase || query.trim().length < 2) {
      setError('Arama için en az iki karakter gir.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data, error: rpcError } = await supabase.rpc('community_admin_search_users', {
        p_query: query.trim(),
        p_limit: 25
      });
      if (rpcError) throw rpcError;
      setUsers((data || []).map((row: CommunityUser) => ({
        ...row,
        role: memberships[row.user_id]
      })));
      if (!data?.length) setNotice('Bu aramayla eşleşen hesap bulunamadı.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (targetUserId: string, role: CommunityRole) => {
    if (!supabase) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: rpcError } = await supabase.rpc('community_admin_set_member', {
        p_user_id: targetUserId,
        p_role: role
      });
      if (rpcError) throw rpcError;
      setNotice(`Kullanıcı durumu güncellendi: ${roleLabels[role]}.`);
      await loadConsole();
      await searchUsers();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleCommunity = async () => {
    if (!supabase) return;
    const next = !enabled;
    const confirmed = window.confirm(next
      ? 'Topluluğu etkinleştirmek istediğine emin misin? Yalnızca yetkilendirilmiş üyeler erişebilir.'
      : 'Topluluğu kapatmak istediğine emin misin? Topluluk verileri silinmeyecek.');
    if (!confirmed) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: rpcError } = await supabase.rpc('community_admin_set_enabled', { p_enabled: next });
      if (rpcError) throw rpcError;
      setEnabled(next);
      setNotice(next ? 'Topluluk etkinleştirildi.' : 'Topluluk kapatıldı. Veriler korundu.');
      await loadConsole();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const memberCount = useMemo(() => Object.values(memberships).filter(role => role === 'member').length, [memberships]);
  const adminCount = useMemo(() => Object.values(memberships).filter(role => role === 'admin').length, [memberships]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-sky-700 dark:text-sky-300"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Topluluk erişimi kontrol ediliyor…</div>;
  }

  if (!userId) {
    return <div className="flex flex-1 items-center justify-center p-6"><div className="max-w-md rounded-3xl border border-sky-200 bg-white p-7 text-center shadow-sm dark:border-sky-900 dark:bg-[#071828]"><ShieldCheck className="mx-auto mb-3 h-9 w-9 text-sky-600" /><h2 className="text-xl font-bold">Özel topluluk</h2><p className="mt-2 text-sm text-slate-500">Topluluk alanını görüntülemek için Abstract hesabına giriş yapmalısın.</p></div></div>;
  }

  if (!isAdmin && !isMember) {
    return <div className="flex flex-1 items-center justify-center overflow-y-auto p-6"><div className="w-full max-w-lg rounded-3xl border border-sky-200 bg-white p-8 text-center shadow-sm dark:border-sky-900 dark:bg-[#071828]"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><ShieldCheck size={28} /></div><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-700 dark:text-sky-300">Abstract · Kapalı beta</p><h2 className="mt-3 text-2xl font-bold">Bilimsel topluluk</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Bu alan yalnızca davet edilen üyelere açıktır. Hesabına henüz topluluk erişimi tanımlanmamış.</p><div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-900/60">Erişim durumu: Yetkilendirme bekleniyor</div></div></div>;
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg)] px-4 py-5 sm:px-7 sm:py-7">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-sky-700 dark:text-sky-300"><Waves size={15} /> Abstract / Topluluk</div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">{isAdmin ? 'Topluluk yönetimi' : 'Bilimsel topluluk'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--mu)]">{isAdmin ? 'Kapalı beta erişimini, üyeleri ve yönetim kayıtlarını buradan kontrol et.' : 'Akademik topluluk alanı hazırlanıyor. Paylaşım ve iletişim özellikleri henüz etkin değil.'}</p>
          </div>
          <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-semibold ${enabled ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'}`}>
            <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {enabled ? 'Topluluk açık' : 'Topluluk kapalı'}
          </div>
        </header>

        {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
        {notice && <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><Check size={17} className="mt-0.5 shrink-0" />{notice}</div>}

        {isAdmin ? (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-4"><div className="flex items-center gap-2 text-xs text-[var(--mu)]"><Users size={15} /> Kayıtlı üyeler</div><div className="mt-2 text-3xl font-bold text-[var(--ink)]">{memberCount}</div></div>
              <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-4"><div className="flex items-center gap-2 text-xs text-[var(--mu)]"><ShieldCheck size={15} /> Yöneticiler</div><div className="mt-2 text-3xl font-bold text-[var(--ink)]">{adminCount}</div></div>
              <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-4"><div className="flex items-center gap-2 text-xs text-[var(--mu)]"><Activity size={15} /> Son yönetim kaydı</div><div className="mt-2 text-sm font-semibold text-[var(--ink)]">{audit[0] ? new Date(audit[0].created_at).toLocaleString('tr-TR') : 'Henüz kayıt yok'}</div></div>
            </section>

            <section className="rounded-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-lg font-bold text-[var(--ink)]">Genel erişim kontrolü</h2><p className="mt-1 text-xs leading-5 text-[var(--mu)]">Bu anahtar yalnızca topluluk modülünü etkiler; Abstract'ın diğer bölümlerini kapatmaz.</p></div>
                <button type="button" disabled title="Topluluk akışı ve mesajlaşma tamamlanmadan genel erişim açılamaz." className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[var(--ln)] bg-[var(--bg)] px-4 text-sm font-bold text-[var(--mu)] opacity-80">Geliştirme tamamlanınca etkinleştirilecek</button>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-sm sm:p-6">
              <div><h2 className="text-lg font-bold text-[var(--ink)]">Kullanıcı erişimi</h2><p className="mt-1 text-xs leading-5 text-[var(--mu)]">E-posta, görünen ad veya kullanıcı UID'siyle ara. E-posta yalnızca bu yönetici ekranında kullanılır; topluluk profillerinde gösterilmez.</p></div>
              <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={e => { e.preventDefault(); void searchUsers(); }}>
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mu)]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="E-posta, ad veya UID…" className="h-11 w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] pl-10 pr-3 text-sm text-[var(--ink)] outline-none focus:border-sky-500" /></div>
                <button type="submit" disabled={busy || query.trim().length < 2} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Ara</button>
              </form>
              <div className="mt-4 space-y-2">
                {users.map(account => {
                  const role = memberships[account.user_id] || account.role;
                  return <div key={account.user_id} className="flex flex-col gap-3 rounded-2xl border border-[var(--ln)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><div className="truncate text-sm font-semibold text-[var(--ink)]">{account.display_name || 'İsimsiz hesap'}</div><div className="truncate text-xs text-[var(--mu)]">{account.email || 'E-posta yok'}</div><div className="mt-1 break-all font-mono text-[10px] text-[var(--mu)]">{account.user_id}</div></div>
                    <div className="flex shrink-0 items-center gap-2"><span className="text-[11px] text-[var(--mu)]">{role ? roleLabels[role] : 'Yetkisiz'}</span><div className="relative"><select aria-label="Kullanıcı rolü" disabled={busy || account.user_id === userId && role === 'admin' && adminCount <= 1} value={role || 'none'} onChange={e => { if (e.target.value !== 'none') void changeRole(account.user_id, e.target.value as CommunityRole); }} className="h-10 max-w-[155px] appearance-none rounded-xl border border-[var(--ln)] bg-[var(--bg)] py-2 pl-3 pr-8 text-xs font-semibold text-[var(--ink)] disabled:opacity-50"><option value="none">Erişim verme</option><option value="member">Üye yap</option><option value="admin">Yönetici yap</option><option value="disabled">Erişimi kapat</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mu)]" /></div></div>
                  </div>;
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2"><Clock3 size={17} className="text-sky-700 dark:text-sky-300" /><h2 className="text-lg font-bold text-[var(--ink)]">Yönetim geçmişi</h2></div>
              <div className="mt-4 space-y-2">
                {audit.length ? audit.map(entry => <div key={entry.id} className="flex flex-col gap-1 rounded-xl bg-[var(--bg)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="text-xs font-semibold text-[var(--ink)]">{entry.action}</div><div className="truncate text-[10px] text-[var(--mu)]">Hedef: {entry.target_user_id || 'Genel topluluk ayarı'} · İşlemi yapan: {entry.actor_id || 'Bilinmiyor'}</div></div><time className="shrink-0 text-[10px] text-[var(--mu)]">{new Date(entry.created_at).toLocaleString('tr-TR')}</time></div>) : <p className="text-sm text-[var(--mu)]">Henüz yönetim işlemi kaydedilmemiş.</p>}
              </div>
            </section>
          </>
        ) : (
          <CommunityMemberSpace userId={userId} />
        )}
      </div>
    </div>
  );
};
