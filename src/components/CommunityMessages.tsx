import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, Paperclip, Send, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Profile = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio?: string;
  affiliation?: string;
  research_interests?: string[];
};
type Conversation = { id: string; kind: 'direct' | 'group'; title: string | null; updated_at: string };
type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_type: string | null;
  attachment: Record<string, unknown> | null;
  created_at: string;
};
type SharedNote = { id: string; owner_id: string; source_note_id: string; snapshot: Record<string, unknown>; shared_at: string };
type MessageRequest = { id: string; sender_id: string; body: string; attachment_type: string | null; attachment: Record<string, unknown> | null; created_at: string };

const card = 'rounded-2xl border border-[var(--ln)] bg-[var(--sf)]';
const field = 'w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky-500';
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

function safeHttpUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

const MemberAvatar: React.FC<{ profile?: Profile | null; label?: string; size?: 'sm' | 'md'; onClick?: () => void }> = ({ profile, label, size = 'md', onClick }) => {
  const dimension = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-11 w-11 text-sm';
  const name = (profile?.display_name || profile?.username || label || 'Kamara üyesi').trim();
  const initial = name.charAt(0).toLocaleUpperCase('tr-TR') || 'A';
  const content = (
    <span className={'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--ln)] bg-sky-100 font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200 ' + dimension}>
      <span>{initial}</span>
      {safeHttpUrl(profile?.avatar_url) && <img src={safeHttpUrl(profile?.avatar_url)!} alt="" className="absolute inset-0 h-full w-full rounded-full object-cover" onError={e => e.currentTarget.remove()} />}
    </span>
  );
  return onClick
    ? <button type="button" onClick={onClick} aria-label={name + ' profilini aç'} title={name + ' profilini aç'} className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-500">{content}</button>
    : content;
};

export const CommunityMessages: React.FC<{
  userId: string;
  initialConversationId?: string | null;
  onInitialConversationHandled?: () => void;
  onOpenProfile: (userId: string) => void;
}> = ({ userId, initialConversationId, onInitialConversationHandled, onOpenProfile }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [participants, setParticipants] = useState<Record<string, string[]>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [lastReadAt, setLastReadAt] = useState<Record<string, string | null>>({});
  const [latestMessages, setLatestMessages] = useState<Record<string, Message>>({});
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const activeConversationRef = useRef<string | null>(null);
  const initialConversationHandledRef = useRef<string | null>(null);
  activeConversationRef.current = activeConversation;
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [selectedSharedNoteId, setSelectedSharedNoteId] = useState('');
  const [extraAttachmentType, setExtraAttachmentType] = useState<'none' | 'citation' | 'collection' | 'research_summary'>('none');
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentContent, setAttachmentContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    if (!supabase) return;
    const { data: mine, error: mineError } = await supabase
      .from('community_conversation_members')
      .select('conversation_id,last_read_at')
      .eq('user_id', userId);
    if (mineError) throw mineError;
    const ids = (mine || []).map((row: any) => row.conversation_id as string);
    if (!ids.length) {
      setConversations([]);
      setParticipants({});
      setLastReadAt({});
      setLatestMessages({});
      setProfiles({});
      return;
    }

    const [conversationResult, memberResult, messageResult] = await Promise.all([
      supabase.from('community_conversations').select('id,kind,title,updated_at').in('id', ids).order('updated_at', { ascending: false }),
      supabase.from('community_conversation_members').select('conversation_id,user_id,last_read_at').in('conversation_id', ids),
      supabase.from('community_messages').select('id,conversation_id,sender_id,body,attachment_type,attachment,created_at').in('conversation_id', ids).order('created_at', { ascending: false }).limit(Math.min(250, Math.max(50, ids.length * 6)))
    ]);
    if (conversationResult.error) throw conversationResult.error;
    if (memberResult.error) throw memberResult.error;
    if (messageResult.error) throw messageResult.error;

    setConversations((conversationResult.data || []) as Conversation[]);
    const participantMap: Record<string, string[]> = {};
    const readMap: Record<string, string | null> = {};
    (memberResult.data || []).forEach((row: any) => {
      (participantMap[row.conversation_id] ||= []).push(row.user_id);
      if (row.user_id === userId) readMap[row.conversation_id] = row.last_read_at || null;
    });
    setParticipants(participantMap);
    setLastReadAt(readMap);

    const latestMap: Record<string, Message> = {};
    (messageResult.data || []).forEach((row: any) => {
      if (!latestMap[row.conversation_id]) latestMap[row.conversation_id] = row as Message;
    });
    setLatestMessages(latestMap);

    const otherIds = [...new Set((memberResult.data || []).map((row: any) => row.user_id).filter((id: string) => id !== userId))];
    if (otherIds.length) {
      const { data: profileRows, error: profileError } = await supabase
        .from('community_profiles')
        .select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests,profile_visibility,searchable')
        .in('user_id', otherIds);
      if (profileError) throw profileError;
      const visibleProfiles = (profileRows || []).filter((profile: any) => profile.profile_visibility === 'community' && profile.searchable !== false);
      setProfiles(Object.fromEntries(visibleProfiles.map((profile: any) => [profile.user_id, profile as Profile])));
    } else {
      setProfiles({});
    }
  }, [userId]);

  const loadRequests = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('community_message_requests')
      .select('id,sender_id,body,attachment_type,attachment,created_at')
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    const rows = (data || []) as MessageRequest[];
    setRequests(rows);
    const senderIds = [...new Set(rows.map(row => row.sender_id))];
    if (senderIds.length) {
      const { data: profileRows, error: profileError } = await supabase
        .from('community_profiles')
        .select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests')
        .in('user_id', senderIds);
      if (profileError) throw profileError;
      setProfiles(prev => ({ ...prev, ...Object.fromEntries((profileRows || []).map((profile: any) => [profile.user_id, profile as Profile])) }));
    }
  }, [userId]);

  const respondToRequest = async (requestId: string, accept: boolean) => {
    if (!supabase) return;
    setSending(true);
    setError('');
    try {
      const { data: conversationId, error } = await supabase.rpc('community_respond_message_request', {
        p_request_id: requestId,
        p_accept: accept
      });
      if (error) throw error;
      await loadRequests();
      if (accept && conversationId) {
        await loadConversations();
        setShowRequests(false);
        await openConversation(conversationId as string);
      }
    } catch (e) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Mesaj isteği işlenemedi.');
    } finally {
      setSending(false);
    }
  };

  const openConversation = useCallback(async (conversationId: string) => {
    if (!supabase) return;
    setActiveConversation(conversationId);
    setMessages([]);
    setLoadingMessages(true);
    setError('');
    try {
      const { data, error: messageError } = await supabase
        .from('community_messages')
        .select('id,conversation_id,sender_id,body,attachment_type,attachment,created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (messageError) throw messageError;
      setMessages((data || []) as Message[]);
      const readAt = new Date().toISOString();
      const { error: readError } = await supabase.rpc('community_mark_conversation_read', { p_conversation_id: conversationId });
      if (readError) throw readError;
      setLastReadAt(prev => ({ ...prev, [conversationId]: readAt }));
    } catch (e) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Mesajlar yüklenemedi.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        if (!supabase) return;
        const [notesResult] = await Promise.all([
          supabase.from('community_shared_notes').select('id,owner_id,source_note_id,snapshot,shared_at').is('revoked_at', null).order('shared_at', { ascending: false }).limit(30),
          loadConversations()
        ]);
        if (notesResult.error) throw notesResult.error;
        await loadRequests();
        if (active) setSharedNotes((notesResult.data || []) as SharedNote[]);
      } catch (e) {
        if (active) setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Sohbetler yüklenemedi.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadConversations, loadRequests]);

  useEffect(() => {
    if (!initialConversationId) {
      initialConversationHandledRef.current = null;
      return;
    }
    if (initialConversationHandledRef.current === initialConversationId) return;
    initialConversationHandledRef.current = initialConversationId;
    void openConversation(initialConversationId);
    onInitialConversationHandled?.();
  }, [initialConversationId, openConversation, onInitialConversationHandled]);

  // RLS, her mesaj olayını yalnızca o konuşmayı okuyabilen üyelere iletir.
  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    const channel = supabase.channel('community-messages-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_message_requests', filter: 'recipient_id=eq.' + userId }, () => {
        if (active) {
          setShowRequests(true);
          void loadRequests();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, payload => {
        if (!active) return;
        const incoming = payload.new as Message;
        if (!incoming?.id || !incoming.conversation_id) return;
        setLatestMessages(prev => ({ ...prev, [incoming.conversation_id]: incoming }));
        setConversations(prev => prev
          .map(conversation => conversation.id === incoming.conversation_id ? { ...conversation, updated_at: incoming.created_at } : conversation)
          .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)));
        if (activeConversationRef.current === incoming.conversation_id) {
          setMessages(prev => prev.some(message => message.id === incoming.id)
            ? prev
            : [...prev, incoming].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)));
          if (incoming.sender_id !== userId) {
            const readAt = new Date().toISOString();
            setLastReadAt(prev => ({ ...prev, [incoming.conversation_id]: readAt }));
            void supabase!.rpc('community_mark_conversation_read', { p_conversation_id: incoming.conversation_id });
          }
        }
        void loadConversations();
      })
      .subscribe(status => {
        // Reconcile the inbox after the socket is ready to cover any event that
        // may have arrived while the first snapshot was loading or reconnecting.
        if(status==='SUBSCRIBED'){
          void loadConversations();
          void loadRequests();
          const current=activeConversationRef.current;
          if(current)void openConversation(current);
        }
      });
    return () => {
      active = false;
      void supabase!.removeChannel(channel);
    };
  }, [userId, loadConversations, loadRequests, openConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, activeConversation]);

  const sendMessage = async () => {
    if (!supabase || !activeConversation) return;
    const sharedNote = sharedNotes.find(note => note.id === selectedSharedNoteId);
    const attachmentType = extraAttachmentType === 'none' ? null : extraAttachmentType;
    if (!draft.trim() && !sharedNote && !attachmentType) return;
    setSending(true);
    setError('');
    try {
      const attachment = attachmentType ? {
        title: attachmentTitle.trim().slice(0, 180),
        url: attachmentType === 'research_summary' ? null : safeHttpUrl(attachmentUrl),
        content: attachmentContent.trim().slice(0, 12000)
      } : null;
      if (attachmentType && attachmentType !== 'research_summary' && !attachment?.url) throw new Error('Geçerli bir https:// veya http:// bağlantısı gir.');
      if (attachmentType === 'research_summary' && !attachment?.content) throw new Error('Araştırma özeti boş olamaz.');
      const { data: messageId, error: sendError } = await supabase.rpc('community_send_message', {
        p_conversation_id: activeConversation,
        p_body: draft.trim() || (sharedNote ? 'Seninle bir araştırma notu paylaştı.' : attachmentType ? 'Seninle bir akademik içerik paylaştı.' : ''),
        p_attachment_type: sharedNote ? 'note_snapshot' : attachmentType,
        p_attachment: sharedNote ? { shared_note_id: sharedNote.id, snapshot: sharedNote.snapshot } : attachment
      });
      if (sendError) throw sendError;
      setDraft('');
      setSelectedSharedNoteId('');
      setExtraAttachmentType('none');
      setAttachmentTitle('');
      setAttachmentUrl('');
      setAttachmentContent('');
      setShowExtras(false);
      const { data: sentMessage, error: fetchError } = await supabase
        .from('community_messages')
        .select('id,conversation_id,sender_id,body,attachment_type,attachment,created_at')
        .eq('id', messageId)
        .single();
      if (fetchError) throw fetchError;
      setMessages(prev => prev.some(message => message.id === sentMessage.id)
        ? prev
        : [...prev, sentMessage as Message].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)));
      setLatestMessages(prev => ({ ...prev, [activeConversation]: sentMessage as Message }));
      await loadConversations();
    } catch (e) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  };

  const activeRecord = conversations.find(conversation => conversation.id === activeConversation) || null;
  const otherIds = activeConversation ? (participants[activeConversation] || []).filter(id => id !== userId) : [];
  const directOtherId = activeRecord?.kind === 'direct' ? otherIds[0] || null : null;
  const directProfile = directOtherId ? profiles[directOtherId] || null : null;
  const activeTitle = activeRecord?.kind === 'group'
    ? activeRecord.title || 'Akademik grup'
    : directProfile?.display_name || directProfile?.username || 'Sohbet';

  if (loading) return <div className="flex min-h-[420px] items-center justify-center gap-2 text-sm text-[var(--mu)]"><Loader2 size={18} className="animate-spin" /> Sohbetlerin yükleniyor…</div>;

  return (
    <div className="grid h-[min(68dvh,680px)] min-h-[360px] grid-cols-1 gap-3 md:h-[min(72dvh,680px)] md:min-h-[520px] md:grid-cols-[300px_minmax(0,1fr)]">
      <section className={card + ' ' + (activeConversation ? 'hidden md:flex' : 'flex') + ' h-full min-h-0 flex-col overflow-hidden'}>
        <div className="shrink-0 border-b border-[var(--ln)] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div><h2 className="text-base font-bold text-[var(--ink)]">Mesajlar</h2><p className="mt-1 text-xs text-[var(--mu)]">Sohbetlerin ve mesaj isteklerin</p></div>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">{conversations.length} sohbet</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setShowRequests(false)} className={'min-h-10 rounded-xl px-3 text-xs font-semibold ' + (!showRequests ? 'bg-sky-700 text-white' : 'bg-[var(--bg)] text-[var(--mu)]')}>Sohbetler</button>
            <button type="button" onClick={() => setShowRequests(true)} className={'min-h-10 rounded-xl px-3 text-xs font-semibold ' + (showRequests ? 'bg-sky-700 text-white' : 'bg-[var(--bg)] text-[var(--mu)]')}>İstekler {requests.length > 0 ? '(' + requests.length + ')' : ''}</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
          {showRequests ? <>
            {requests.map(request => {
              const sender = profiles[request.sender_id] || null;
              const senderName = sender?.display_name || sender?.username || 'Abstract üyesi';
              return <article key={request.id} className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-3">
                <div className="flex items-center gap-2">
                  <MemberAvatar profile={sender} label={senderName} />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[var(--ink)]">{senderName}</div><div className="text-[10px] text-[var(--mu)]">Mesaj isteği · {new Date(request.created_at).toLocaleDateString('tr-TR')}</div></div>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-[var(--ink)]">{request.body}</p>
                {request.attachment_type === 'paper' && request.attachment && <div className="mt-2 rounded-xl bg-[var(--bg)] p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Akademik makale</div><div className="mt-1 text-xs font-semibold text-[var(--ink)]">{String(request.attachment.title || 'Makale')}</div><div className="mt-1 text-[10px] text-[var(--mu)]">{String(request.attachment.authors || '')} · {String(request.attachment.journal || '')}</div>{safeHttpUrl(request.attachment.url) && <a className="mt-2 inline-block text-[10px] font-semibold text-sky-700 underline dark:text-sky-300" href={safeHttpUrl(request.attachment.url)!} target="_blank" rel="noopener noreferrer">Makaleyi önizle</a>}</div>}
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={sending} onClick={() => void respondToRequest(request.id, false)} className="min-h-10 flex-1 rounded-xl border border-[var(--ln)] px-3 text-xs font-semibold text-[var(--mu)] disabled:opacity-50">Reddet</button>
                  <button type="button" disabled={sending} onClick={() => void respondToRequest(request.id, true)} className="min-h-10 flex-1 rounded-xl bg-sky-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Kabul et</button>
                </div>
              </article>;
            })}
            {!requests.length && <div className="px-4 py-12 text-center"><MessageCircle size={28} className="mx-auto mb-3 text-sky-500" /><p className="text-sm font-semibold text-[var(--ink)]">Bekleyen istek yok</p><p className="mt-1 text-xs leading-5 text-[var(--mu)]">Yeni kişilerden gelen mesaj istekleri burada görünür.</p></div>}
          </> : <>
          {conversations.map(conversation => {
            const ids = (participants[conversation.id] || []).filter(id => id !== userId);
            const otherId = conversation.kind === 'direct' ? ids[0] : null;
            const person = otherId ? profiles[otherId] || null : null;
            const last = latestMessages[conversation.id];
            const readAt = lastReadAt[conversation.id];
            const unread = Boolean(last && last.sender_id !== userId && (!readAt || Date.parse(last.created_at) > Date.parse(readAt)));
            const title = conversation.kind === 'group' ? conversation.title || 'Akademik grup' : person?.display_name || person?.username || 'Kamara üyesi';
            const preview = last
              ? last.body || (last.attachment_type === 'paper' ? 'Bir makale paylaştı' : last.attachment_type ? 'Bir içerik paylaştı' : 'Yeni mesaj')
              : 'Henüz mesaj yok';
            return (
              <div key={conversation.id} className={'flex items-center gap-2 rounded-2xl p-2 transition-colors ' + (activeConversation === conversation.id ? 'bg-sky-100 dark:bg-sky-950/50' : 'hover:bg-[var(--bg)]')}>
                {conversation.kind === 'direct'
                  ? <MemberAvatar profile={person} label={title} onClick={() => otherId && onOpenProfile(otherId)} />
                  : <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><Users size={18} /></span>}
                <button type="button" onClick={() => void openConversation(conversation.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ink)]">{title}</span>
                    <time className="shrink-0 text-[9px] text-[var(--mu)]">{last ? new Date(last.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : new Date(conversation.updated_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</time>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--mu)]">{last?.sender_id === userId ? 'Sen: ' : ''}{preview}</span>
                    {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-600" aria-label="Okunmamış mesaj" />}
                  </div>
                </button>
              </div>
            );
          })}
          {!conversations.length && <div className="px-4 py-12 text-center"><MessageCircle size={28} className="mx-auto mb-3 text-sky-500" /><p className="text-sm font-semibold text-[var(--ink)]">Henüz sohbet yok</p><p className="mt-1 text-xs leading-5 text-[var(--mu)]">Takip ettiğin veya bağlantı kurduğun üyelerle sohbet edebilirsin.</p></div>}
          </>}
        </div>
      </section>

      <section className={card + ' ' + (activeConversation ? 'flex' : 'hidden md:flex') + ' h-full min-h-0 flex-col overflow-hidden'}>
        {activeConversation ? <>
          <header className="flex shrink-0 items-center gap-2 border-b border-[var(--ln)] px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
            <button type="button" className="rounded-lg p-2 text-[var(--mu)] hover:bg-[var(--bg)] md:hidden" onClick={() => setActiveConversation(null)} aria-label="Sohbet listesine dön"><ArrowLeft size={18} /></button>
            {activeRecord?.kind === 'group'
              ? <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><Users size={17} /></span>
              : <MemberAvatar profile={directProfile} label={activeTitle} onClick={() => directOtherId && onOpenProfile(directOtherId)} />}
            <div className="min-w-0 flex-1">
              {activeRecord?.kind === 'group'
                ? <div className="truncate text-sm font-bold text-[var(--ink)]">{activeTitle}</div>
                : <button type="button" onClick={() => directOtherId && onOpenProfile(directOtherId)} className="block max-w-full truncate text-left text-sm font-bold text-[var(--ink)] hover:text-sky-700">{activeTitle}</button>}
              <div className="text-[10px] text-[var(--mu)]">{activeRecord?.kind === 'group' ? 'Grup sohbeti' : 'Özel mesaj'}</div>
            </div>
            {directOtherId && <button type="button" onClick={() => onOpenProfile(directOtherId)} className="rounded-xl border border-[var(--ln)] px-3 py-2 text-[10px] font-semibold text-[var(--mu)]">Profili gör</button>}
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain touch-pan-y px-2.5 py-3 sm:px-4 sm:py-4">
            {loadingMessages && <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--mu)]"><Loader2 size={16} className="animate-spin" /> Mesajlar yükleniyor…</div>}
            {!loadingMessages && messages.map(message => {
              const mine = message.sender_id === userId;
              const sender = profiles[message.sender_id] || null;
              const senderName = sender?.display_name || sender?.username || 'Kamara üyesi';
              return (
                <div key={message.id} className={'flex items-end gap-2 ' + (mine ? 'justify-end' : 'justify-start')}>
                  {!mine && <MemberAvatar profile={sender} label={senderName} size="sm" onClick={() => onOpenProfile(message.sender_id)} />}
                  <div className={'max-w-[86%] rounded-2xl px-3 py-2.5 text-sm shadow-sm ' + (mine ? 'rounded-br-md bg-sky-700 text-white' : 'rounded-bl-md bg-[var(--bg)] text-[var(--ink)]')}>
                    {activeRecord?.kind === 'group' && !mine && <button type="button" className="mb-1 block text-[10px] font-bold text-sky-700 dark:text-sky-300" onClick={() => onOpenProfile(message.sender_id)}>{senderName}</button>}
                    {message.body && <p className="whitespace-pre-wrap break-words leading-5">{message.body}</p>}
                    {message.attachment_type === 'paper' && message.attachment && <div className="mt-2 rounded-xl border border-current/15 bg-black/5 p-2"><div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Akademik makale</div><div className="mt-1 font-semibold">{String(message.attachment.title || 'Makale')}</div><div className="text-[10px] opacity-80">{String(message.attachment.authors || '')} · {String(message.attachment.journal || '')}</div>{safeHttpUrl(message.attachment.url) && <a className="mt-1 inline-block text-[10px] underline" href={safeHttpUrl(message.attachment.url)!} target="_blank" rel="noopener noreferrer">Makaleyi aç</a>}</div>}
                    {message.attachment_type === 'note_snapshot' && message.attachment && <div className="mt-2 rounded-xl border border-current/15 bg-black/5 p-2"><div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Paylaşılmış araştırma notu</div><div className="mt-1 font-semibold">{String((message.attachment.snapshot as Record<string, unknown>)?.paperTitle || 'Bilim Defterim notu')}</div><p className="mt-1 whitespace-pre-wrap text-xs">{String((message.attachment.snapshot as Record<string, unknown>)?.content || '')}</p></div>}
                    {(message.attachment_type === 'citation' || message.attachment_type === 'collection') && message.attachment && <div className="mt-2 rounded-xl border border-current/15 bg-black/5 p-2"><div className="text-[9px] font-bold uppercase tracking-wider opacity-80">{message.attachment_type === 'citation' ? 'Kaynak / Atıf' : 'Koleksiyon bağlantısı'}</div><div className="mt-1 font-semibold">{String(message.attachment.title || 'Paylaşılan bağlantı')}</div>{safeHttpUrl(message.attachment.url) && <a className="mt-1 inline-block text-[10px] underline" href={safeHttpUrl(message.attachment.url)!} target="_blank" rel="noopener noreferrer">Bağlantıyı aç</a>}</div>}
                    {message.attachment_type === 'research_summary' && message.attachment && <div className="mt-2 rounded-xl border border-current/15 bg-black/5 p-2"><div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Araştırma özeti</div><div className="mt-1 font-semibold">{String(message.attachment.title || 'Araştırma özeti')}</div><p className="mt-1 whitespace-pre-wrap text-xs">{String(message.attachment.content || '')}</p></div>}
                    <time className="mt-1.5 block text-right text-[9px] opacity-60">{new Date(message.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>
                </div>
              );
            })}
            {!loadingMessages && !messages.length && <p className="py-16 text-center text-xs text-[var(--mu)]">Henüz mesaj yok. İlk mesajı göndererek sohbeti başlat.</p>}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-[var(--ln)] p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
            {showExtras && <div className="mb-3 space-y-2 rounded-2xl bg-[var(--bg)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <select className={field + ' min-w-0 flex-1'} value={selectedSharedNoteId} onChange={e => { setSelectedSharedNoteId(e.target.value); if (e.target.value) setExtraAttachmentType('none'); }}>
                  <option value="">Paylaşılmış not seç</option>{sharedNotes.map(note => <option key={note.id} value={note.id}>{String(note.snapshot.paperTitle || 'Paylaşılmış not')}</option>)}
                </select>
                <select className={field + ' min-w-0 flex-1'} value={extraAttachmentType} onChange={e => { setExtraAttachmentType(e.target.value as typeof extraAttachmentType); if (e.target.value !== 'none') setSelectedSharedNoteId(''); }}>
                  <option value="none">Ek içerik türü</option><option value="citation">Kaynak / DOI</option><option value="collection">Koleksiyon bağlantısı</option><option value="research_summary">Araştırma özeti</option>
                </select>
              </div>
              <p className="text-[10px] text-[var(--mu)]">Yalnızca daha önce açıkça paylaşılmış notlar seçilebilir.</p>
              {extraAttachmentType !== 'none' && <div className="space-y-2">
                <input className={field} value={attachmentTitle} onChange={e => setAttachmentTitle(e.target.value)} placeholder="Başlık" />
                {extraAttachmentType !== 'research_summary' && <input className={field} value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} placeholder="https://…" />}
                <textarea className={field} rows={2} maxLength={12000} value={attachmentContent} onChange={e => setAttachmentContent(e.target.value)} placeholder={extraAttachmentType === 'research_summary' ? 'Araştırma özetini yaz…' : 'İsteğe bağlı kısa açıklama…'} />
              </div>}
            </div>}
            <div className="flex items-end gap-2">
              <button type="button" onClick={() => setShowExtras(value => !value)} className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-[var(--ln)] px-3 text-[var(--mu)] hover:bg-[var(--bg)]" aria-label="Akademik içerik ekle" title="Akademik içerik ekle"><Paperclip size={17} /></button>
              <textarea className={field + ' min-h-[44px] max-h-28 min-w-0 flex-1 resize-y px-3 py-2.5'} rows={1} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Mesaj yaz…" maxLength={5000} />
              <button className={button + ' h-11 min-h-11 w-11 shrink-0 rounded-xl px-0'} disabled={sending || (!draft.trim() && !selectedSharedNoteId && extraAttachmentType === 'none')} onClick={() => void sendMessage()} aria-label="Mesajı gönder">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button>
            </div>
            <div className="mt-1.5 px-1 text-[9px] text-[var(--mu)]">Enter ile gönder · Shift + Enter ile alt satıra geç</div>
          </div>
        </> : <div className="m-auto max-w-sm px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><MessageCircle size={24} /></div>
          <h3 className="text-base font-bold text-[var(--ink)]">Sohbetlerine hoş geldin</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--mu)]">Soldan bir konuşma seç veya kamara üyeleri arasından bir araştırmacıya mesaj gönder.</p>
        </div>}
      </section>

      {error && <div role="alert" className="md:col-span-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
    </div>
  );
};
