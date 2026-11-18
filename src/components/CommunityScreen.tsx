import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, Check, ChevronDown, Clock3, Loader2, Search, ShieldCheck, Users, UserX, Waves } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CommunityMemberSpace } from './CommunityMemberSpace';
import { CommunityPostModeration } from './CommunityPostModeration';
import type { Paper, PaperNote } from '../types';

type CommunityRole = 'admin' | 'member' | 'disabled';
type CommunityUser = {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string;
  role?: CommunityRole;
};
type AdminMemberDirectoryItem = { user_id: string; role: CommunityRole; created_at: string; display_name: string; username: string; };
type ReportEntry = { id:string; reporter_id:string; target_type:string; target_id:string; reason:string; status:string; created_at:string; };
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

export const CommunityScreen: React.FC<{ userId: string | null; avatarUrl?: string | null; notes: PaperNote[]; pendingPaper?: Paper | null; onPendingPaperHandled?: () => void }> = ({ userId, avatarUrl, notes, pendingPaper, onPendingPaperHandled }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [selectedConnectionUsers, setSelectedConnectionUsers] = useState<Set<string>>(new Set());
  const [memberDirectory, setMemberDirectory] = useState<AdminMemberDirectoryItem[]>([]);
  const [showMemberDirectory, setShowMemberDirectory] = useState(false);
  const [memberDirectoryQuery, setMemberDirectoryQuery] = useState('');
  const [selectedConnectionAccounts, setSelectedConnectionAccounts] = useState<Record<string, CommunityUser>>({});
  const [memberships, setMemberships] = useState<Record<string, CommunityRole>>({});
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adminUsingCommunity, setAdminUsingCommunity] = useState(false);

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
        const [memberRows, auditRows, reportRows] = await Promise.all([
          supabase.from('community_memberships').select('user_id, role, created_at').order('created_at', { ascending: false }).limit(1000),
          supabase.from('community_admin_audit').select('id, actor_id, action, target_user_id, details, created_at').order('created_at', { ascending: false }).limit(30),
          supabase.from('community_reports').select('id,reporter_id,target_type,target_id,reason,status,created_at').order('created_at',{ascending:false}).limit(50)
        ]);
        if (memberRows.error) throw memberRows.error;
        if (auditRows.error) throw auditRows.error;
        if (reportRows.error) throw reportRows.error;
        const next: Record<string, CommunityRole> = {};
        (memberRows.data || []).forEach((row: any) => { next[row.user_id] = row.role as CommunityRole; });
        setMemberships(next);
        const activeMemberRows = (memberRows.data || []).filter((row: any) => row.role === 'member');
        const memberIds = activeMemberRows.map((row: any) => row.user_id);
        if (memberIds.length) {
          const { data: profileRows, error: profileError } = await supabase
            .from('community_profiles')
            .select('user_id, display_name, username')
            .in('user_id', memberIds);
          if (profileError) throw profileError;
          const profileMap = new Map((profileRows || []).map((profile: any) => [profile.user_id, profile]));
          setMemberDirectory(activeMemberRows.map((row: any) => {
            const profile = profileMap.get(row.user_id) as any;
            return { user_id: row.user_id, role: row.role as CommunityRole, created_at: row.created_at, display_name: profile?.display_name || '', username: profile?.username || '' };
          }));
        } else {
          setMemberDirectory([]);
        }
        setAudit((auditRows.data || []) as AuditEntry[]);
        setReports((reportRows.data || []) as ReportEntry[]);
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
      const found=(data||[]) as CommunityUser[];
      const ids=found.map(row=>row.user_id);
      let roleMap:Record<string,CommunityRole>={};
      if(ids.length){
        const {data:roleRows,error:roleError}=await supabase.from('community_memberships').select('user_id,role').in('user_id',ids);
        if(roleError)throw roleError;
        (roleRows||[]).forEach((row:any)=>roleMap[row.user_id]=row.role as CommunityRole);
        setMemberships(prev=>({...prev,...roleMap}));
      }
      setUsers(found.map(row=>({...row,role:roleMap[row.user_id]||memberships[row.user_id]})));
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

  const createAdminConnection = async () => {
    if (!supabase || selectedConnectionUsers.size !== 2) return;
    const [userA,userB] = [...selectedConnectionUsers];
    setBusy(true);setError('');setNotice('');
    try {
      const {error:connectionError}=await supabase.rpc('community_admin_connect_users',{p_user_a:userA,p_user_b:userB});
      if(connectionError)throw connectionError;
      setNotice('Seçtiğin iki üye arasında onaylı bağlantı kuruldu. Artık birbirlerine doğrudan mesaj gönderebilirler.');
      setSelectedConnectionUsers(new Set());
      setSelectedConnectionAccounts({});
    } catch(e) {
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
    return <div className="flex flex-1 items-center justify-center overflow-y-auto p-6"><div className="w-full max-w-lg rounded-3xl border border-sky-200 bg-white p-8 text-center shadow-sm dark:border-sky-900 dark:bg-[#071828]"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><ShieldCheck size={28} /></div><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-700 dark:text-sky-300">Abstract · Kapalı beta</p><h2 className="mt-3 text-2xl font-bold">Bilimsel topluluk</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Topluluk erişimi şu anda hesabında etkin değil. Hesabına yeniden erişim vermek için yöneticiyle iletişime geçebilirsin.</p><div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-900/60">Erişim durumu: Yetkilendirme bekleniyor</div></div></div>;
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg)] px-4 py-5 sm:px-7 sm:py-7">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-sky-700 dark:text-sky-300"><Waves size={15} /> Abstract / Topluluk</div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">{isAdmin ? 'Topluluk yönetimi' : 'Bilimsel topluluk'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--mu)]">{isAdmin ? 'Üyeleri ve erişim izinlerini buradan yönet. Yeni hesaplar otomatik olarak topluluğa üye olur; bireysel erişim kararları sende kalır.' : 'Akademik topluluk alanı hazırlanıyor. Paylaşım ve iletişim özellikleri henüz etkin değil.'}</p>
            {isAdmin && enabled && <button type="button" onClick={() => setAdminUsingCommunity(true)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white">Topluluk alanını görüntüle</button>}
          </div>
          <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-semibold ${enabled ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'}`}>
            <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {enabled ? 'Topluluk açık' : 'Topluluk kapalı'}
          </div>
        </header>

        {showMemberDirectory && isAdmin && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" onClick={() => setShowMemberDirectory(false)}><section role="dialog" aria-modal="true" aria-labelledby="community-member-directory-title" onClick={e => e.stopPropagation()} className="flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[var(--ln)] bg-[var(--sf)] shadow-2xl"><header className="flex items-start justify-between gap-3 border-b border-[var(--ln)] p-4 sm:p-5"><div><h2 id="community-member-directory-title" className="text-lg font-bold text-[var(--ink)]">Kayıtlı üyeler</h2><p className="mt-1 text-xs text-[var(--mu)]">Topluluğa katılan üyeler ve katılım tarihleri</p></div><button type="button" onClick={() => setShowMemberDirectory(false)} aria-label="Pencereyi kapat" className="rounded-xl p-2 text-xl leading-none text-[var(--mu)] hover:bg-[var(--bg)]">×</button></header><div className="border-b border-[var(--ln)] p-3 sm:p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mu)]"/><input autoFocus value={memberDirectoryQuery} onChange={e => setMemberDirectoryQuery(e.target.value)} placeholder="Üye adı veya kullanıcı adı ara…" className="h-10 w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] pl-10 pr-3 text-sm text-[var(--ink)] outline-none focus:border-sky-500"/></div><div className="mt-2 text-[11px] text-[var(--mu)]">{memberDirectory.filter(member => `${member.display_name} ${member.username}`.toLocaleLowerCase('tr-TR').includes(memberDirectoryQuery.trim().toLocaleLowerCase('tr-TR'))).length} üye listeleniyor</div></div><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4"><div className="space-y-2">{memberDirectory.filter(member => `${member.display_name} ${member.username}`.toLocaleLowerCase('tr-TR').includes(memberDirectoryQuery.trim().toLocaleLowerCase('tr-TR'))).map(member => <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ln)] bg-[var(--bg)] p-3"><div className="min-w-0"><div className="truncate text-sm font-semibold text-[var(--ink)]">{member.display_name || 'İsimsiz üye'}</div><div className="truncate text-xs text-[var(--mu)]">{member.username ? `@${member.username}` : 'Kullanıcı adı yok'}</div></div><div className="shrink-0 text-right"><div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mu)]">Katılım tarihi</div><time className="mt-0.5 block text-xs font-semibold text-[var(--ink)]">{member.created_at ? new Date(member.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Tarih bilgisi yok'}</time></div></div>)}{!memberDirectory.length && <p className="rounded-xl bg-[var(--bg)] p-4 text-center text-sm text-[var(--mu)]">Henüz kayıtlı üye bulunmuyor.</p>}{memberDirectory.length > 0 && !memberDirectory.some(member => `${member.display_name} ${member.username}`.toLocaleLowerCase('tr-TR').includes(memberDirectoryQuery.trim().toLocaleLowerCase('tr-TR'))) && <p className="rounded-xl bg-[var(--bg)] p-4 text-center text-sm text-[var(--mu)]">Aramayla eşleşen üye bulunamadı.</p>}</div></div><footer className="border-t border-[var(--ln)] p-3 text-right"><button type="button" onClick={() => setShowMemberDirectory(false)} className="rounded-xl bg-sky-700 px-4 py-2.5 text-xs font-bold text-white">Kapat</button></footer></section></div>}

        {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
        {notice && <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><Check size={17} className="mt-0.5 shrink-0" />{notice}</div>}

        {isAdmin && !adminUsingCommunity && <CommunityPostModeration />}
        {isAdmin && !adminUsingCommunity ? (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => { setMemberDirectoryQuery(''); setShowMemberDirectory(true); }} aria-haspopup="dialog" className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-4 text-left transition hover:border-sky-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs text-[var(--mu)]"><Users size={15} /> Kayıtlı üyeler</div><span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300">Listeyi görüntüle →</span></div><div className="mt-2 text-3xl font-bold text-[var(--ink)]">{memberCount}</div></button>
              <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-4"><div className="flex items-center gap-2 text-xs text-[var(--mu)]"><ShieldCheck size={15} /> Yöneticiler</div><div className="mt-2 text-3xl font-bold text-[var(--ink)]">{adminCount}</div></div>
              <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-4"><div className="flex items-center gap-2 text-xs text-[var(--mu)]"><Activity size={15} /> Son yönetim kaydı</div><div className="mt-2 text-sm font-semibold text-[var(--ink)]">{audit[0] ? new Date(audit[0].created_at).toLocaleString('tr-TR') : 'Henüz kayıt yok'}</div></div>
            </section>

            <section className="rounded-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-lg font-bold text-[var(--ink)]">Genel erişim kontrolü</h2><p className="mt-1 text-xs leading-5 text-[var(--mu)]">Bu anahtar topluluk modülünü tüm üyeler için açar veya kapatır. Kullanıcı erişimini ayrıca aşağıdaki bölümden kişi bazında yönetebilirsin.</p></div>
                <button
                  type="button"
                  onClick={() => void toggleCommunity()}
                  disabled={busy}
                  aria-pressed={enabled}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200' : 'bg-sky-700 text-white hover:bg-sky-800'}`}
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : enabled ? <UserX size={16} /> : <Check size={16} />}
                  {busy ? 'İşleniyor…' : enabled ? 'Topluluğu kapat' : 'Topluluğu etkinleştir'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-sm sm:p-6">
              <div><h2 className="text-lg font-bold text-[var(--ink)]">Kullanıcı erişimi</h2><p className="mt-1 text-xs leading-5 text-[var(--mu)]">E-posta, görünen ad veya kullanıcı UID'siyle ara. E-posta yalnızca bu yönetici ekranında kullanılır; topluluk profillerinde gösterilmez.</p></div>
              <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={e => { e.preventDefault(); void searchUsers(); }}>
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mu)]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="E-posta, ad veya UID…" className="h-11 w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] pl-10 pr-3 text-sm text-[var(--ink)] outline-none focus:border-sky-500" /></div>
                <button type="submit" disabled={busy || query.trim().length < 2} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Ara</button>
              </form>
              <div className="mt-4 space-y-2">
                {(users.length > 0 || selectedConnectionUsers.size > 0) && <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/20">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div><div className="text-sm font-bold text-sky-950 dark:text-sky-100">Bağlantı için seçilen hesaplar</div><p className="mt-0.5 text-xs leading-5 text-sky-900 dark:text-sky-200">Yeni arama yaptığında seçimlerin korunur. En fazla iki hesap seçebilirsin. ({selectedConnectionUsers.size}/2)</p></div>
                    <button type="button" disabled={busy||selectedConnectionUsers.size!==2} onClick={()=>void createAdminConnection()} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-700 px-3 text-xs font-semibold text-white disabled:opacity-50">{busy?<Loader2 size={14} className="animate-spin"/>:<Users size={14}/>} Seçilen iki hesabı bağla</button>
                  </div>
                  {selectedConnectionUsers.size>0 && <div className="mt-3 flex flex-wrap gap-2">{[...selectedConnectionUsers].map(id=>{const account=selectedConnectionAccounts[id];return <span key={id} className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-100">{account?.display_name||account?.email||id.slice(0,8)}<button type="button" aria-label="Seçimi kaldır" onClick={()=>{setSelectedConnectionUsers(prev=>{const n=new Set(prev);n.delete(id);return n;});setSelectedConnectionAccounts(prev=>{const n={...prev};delete n[id];return n;});}} className="rounded-full p-0.5 hover:bg-sky-100 dark:hover:bg-sky-900"><span aria-hidden="true">×</span></button></span>;})}</div>}
                </div>}
                {users.map(account => {
                  const role = memberships[account.user_id] || account.role;
                  const pairSelected = selectedConnectionUsers.has(account.user_id);
                  return <div key={account.user_id} className="flex flex-col gap-3 rounded-2xl border border-[var(--ln)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3"><input type="checkbox" aria-label={account.display_name + ' bağlantı için seç'} checked={pairSelected} disabled={!pairSelected&&selectedConnectionUsers.size>=2} onChange={e=>{const checked=e.target.checked;setSelectedConnectionUsers(prev=>{const next=new Set(prev);checked?next.add(account.user_id):next.delete(account.user_id);return next;});setSelectedConnectionAccounts(prev=>{const next={...prev};if(checked)next[account.user_id]=account;else delete next[account.user_id];return next;});}} className="mt-1 h-4 w-4 shrink-0 accent-sky-700"/><div className="min-w-0"><div className="truncate text-sm font-semibold text-[var(--ink)]">{account.display_name || 'İsimsiz hesap'}</div><div className="truncate text-xs text-[var(--mu)]">{account.email || 'E-posta yok'}</div><div className="mt-1 break-all font-mono text-[10px] text-[var(--mu)]">{account.user_id}</div></div></div>
                    <div className="flex shrink-0 flex-col gap-1.5 sm:items-end"><span className="text-[10px] font-bold uppercase tracking-wide text-[var(--mu)]">Atanmış rol / erişim</span><div className="flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${role==='admin'?'border-violet-200 bg-violet-50 text-violet-800':role==='member'?'border-emerald-200 bg-emerald-50 text-emerald-800':role==='disabled'?'border-rose-200 bg-rose-50 text-rose-800':'border-amber-200 bg-amber-50 text-amber-800'}`}>{role ? roleLabels[role] : 'Henüz yetki yok'}</span><div className="relative"><select aria-label={account.display_name+' için erişim rolü ata'} disabled={busy || account.user_id === userId && role === 'admin' && adminCount <= 1} value={role || 'none'} onChange={e => { if (e.target.value !== 'none') void changeRole(account.user_id, e.target.value as CommunityRole); }} className="h-10 max-w-[170px] appearance-none rounded-xl border border-[var(--ln)] bg-[var(--bg)] py-2 pl-3 pr-8 text-xs font-semibold text-[var(--ink)] disabled:opacity-50"><option value="none">Rol ata…</option><option value="member">Üye erişimi ver</option><option value="admin">Yönetici yetkisi ver</option><option value="disabled">Erişimi kapat</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mu)]" /></div></div><span className="text-[10px] text-[var(--mu)]">Üye: topluluk özellikleri · Yönetici: tüm yönetim yetkileri · Kapalı: erişemez</span></div>
                  </div>;
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-[var(--ink)]">Üye bildirimleri</h2><span className="text-xs text-[var(--mu)]">{reports.filter(r=>r.status==='open').length} açık</span></div>
              <div className="mt-4 space-y-2">{reports.map(report=><div key={report.id} className="rounded-xl border border-[var(--ln)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-[var(--ink)]">{report.target_type} · {report.status}</span><time className="text-[10px] text-[var(--mu)]">{new Date(report.created_at).toLocaleString('tr-TR')}</time></div><p className="mt-2 whitespace-pre-wrap text-xs text-[var(--mu)]">{report.reason}</p><div className="mt-2 break-all font-mono text-[9px] text-[var(--mu)]">Hedef: {report.target_id} · Bildiren: {report.reporter_id}</div>{report.status!=='resolved'&&report.status!=='dismissed'&&<div className="mt-3 flex gap-2"><button className="rounded-lg border border-[var(--ln)] px-3 py-2 text-xs font-semibold" onClick={async()=>{const {error}=await supabase!.rpc('community_admin_review_report',{p_report_id:report.id,p_status:'reviewing'});if(error)setError(friendlyError(error));else await loadConsole();}}>İnceleniyor</button><button className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white" onClick={async()=>{const {error}=await supabase!.rpc('community_admin_review_report',{p_report_id:report.id,p_status:'resolved'});if(error)setError(friendlyError(error));else await loadConsole();}}>Çözüldü</button><button className="rounded-lg border border-[var(--ln)] px-3 py-2 text-xs font-semibold" onClick={async()=>{const {error}=await supabase!.rpc('community_admin_review_report',{p_report_id:report.id,p_status:'dismissed'});if(error)setError(friendlyError(error));else await loadConsole();}}>Reddet</button></div>}</div>)}{!reports.length&&<p className="text-sm text-[var(--mu)]">Henüz bildirim yok.</p>}</div>
            </section>

            <section className="rounded-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2"><Clock3 size={17} className="text-sky-700 dark:text-sky-300" /><h2 className="text-lg font-bold text-[var(--ink)]">Yönetim geçmişi</h2></div>
              <div className="mt-4 space-y-2">
                {audit.length ? audit.map(entry => <div key={entry.id} className="flex flex-col gap-1 rounded-xl bg-[var(--bg)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="text-xs font-semibold text-[var(--ink)]">{entry.action}</div><div className="truncate text-[10px] text-[var(--mu)]">Hedef: {entry.target_user_id || 'Genel topluluk ayarı'} · İşlemi yapan: {entry.actor_id || 'Bilinmiyor'}</div></div><time className="shrink-0 text-[10px] text-[var(--mu)]">{new Date(entry.created_at).toLocaleString('tr-TR')}</time></div>) : <p className="text-sm text-[var(--mu)]">Henüz yönetim işlemi kaydedilmemiş.</p>}
              </div>
            </section>
          </>
        ) : (
          <CommunityMemberSpace userId={userId} avatarUrl={avatarUrl} notes={notes} pendingPaper={pendingPaper} onPendingPaperHandled={onPendingPaperHandled} onReturnToAdmin={isAdmin ? () => setAdminUsingCommunity(false) : undefined} />
        )}
      </div>
    </div>
  );
};
