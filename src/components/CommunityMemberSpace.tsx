import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Bookmark, Check, Heart, Loader2, MessageCircle, MessageSquare, Plus, Search, Send, ShieldAlert, Users, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PaperNote } from '../types';

type Profile = { user_id:string; username:string; display_name:string; avatar_url:string|null; bio:string; affiliation:string; research_interests:string[]; };
type Post = { id:string; author_id:string; body:string; paper:Record<string,unknown>|null; created_at:string; };
type Conversation = { id:string; kind:'direct'|'group'; title:string|null; updated_at:string; };
type Message = { id:string; conversation_id:string; sender_id:string; body:string; attachment_type:string|null; attachment:Record<string,unknown>|null; created_at:string; };
type SharedNote = {id:string;owner_id:string;snapshot:Record<string,unknown>;shared_at:string};

const card = 'rounded-2xl border border-[var(--ln)] bg-[var(--sf)]';
const field = 'w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky-500';
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

function errorText(error:unknown) { return error && typeof error==='object' && 'message' in error ? String((error as {message:unknown}).message) : 'İşlem tamamlanamadı.'; }
function shortId(id:string) { return id.slice(0,8); }
function safeHttpUrl(value:unknown):string|null { try { const url=new URL(String(value)); return url.protocol==='https:'||url.protocol==='http:'?url.href:null; } catch { return null; } }

export const CommunityMemberSpace:React.FC<{userId:string; notes:PaperNote[]; pendingPaper?:import('../types').Paper|null; onPendingPaperHandled?:()=>void}> = ({userId,notes,pendingPaper,onPendingPaperHandled}) => {
  const [section,setSection]=useState<'feed'|'messages'|'people'|'notes'|'profile'>('feed');
  const [profile,setProfile]=useState<Profile|null>(null);
  const [profileDraft,setProfileDraft]=useState({username:'',display_name:'',bio:'',affiliation:'',research_interests:''});
  const [posts,setPosts]=useState<Post[]>([]);
  const [profiles,setProfiles]=useState<Record<string,Profile>>({});
  const [likes,setLikes]=useState<Set<string>>(new Set());
  const [followedPeople,setFollowedPeople]=useState<Set<string>>(new Set());
  const [notifications,setNotifications]=useState<{id:string;kind:string;actor_id:string|null;created_at:string;read_at:string|null}[]>([]);
  const [showNotifications,setShowNotifications]=useState(false);
  const [bookmarks,setBookmarks]=useState<Set<string>>(new Set());
  const [commentCounts,setCommentCounts]=useState<Record<string,number>>({});
  const [comments,setComments]=useState<Record<string,{id:string;author_id:string;parent_id:string|null;body:string;created_at:string}[]>>({});
  const [replyTargets,setReplyTargets]=useState<Record<string,string>>({});
  const [commentDrafts,setCommentDrafts]=useState<Record<string,string>>({});
  const [openComments,setOpenComments]=useState<Set<string>>(new Set());
  const [postDraft,setPostDraft]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [peopleQuery,setPeopleQuery]=useState('');
  const [people,setPeople]=useState<Profile[]>([]);
  const [selectedPeople,setSelectedPeople]=useState<Set<string>>(new Set());
  const [groupTitle,setGroupTitle]=useState('');
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [conversationMembers,setConversationMembers]=useState<Record<string,string[]>>({});
  const [activeConversation,setActiveConversation]=useState<string|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [sharedNoteIds,setSharedNoteIds]=useState<Set<string>>(new Set());
  const [sharedNotes,setSharedNotes]=useState<SharedNote[]>([]);
  const [messageDraft,setMessageDraft]=useState('');
  const [selectedSharedNoteId,setSelectedSharedNoteId]=useState('');

  const loadProfile=useCallback(async()=>{
    if(!supabase) return;
    const {data,error}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').eq('user_id',userId).maybeSingle();
    if(error) throw error;
    if(data) {
      const p=data as Profile; setProfile(p);
      setProfileDraft({username:p.username||'',display_name:p.display_name||'',bio:p.bio||'',affiliation:p.affiliation||'',research_interests:(p.research_interests||[]).join(', ')});
    }
  },[userId]);

  const loadFeed=useCallback(async()=>{
    if(!supabase) return;
    const {data,error}=await supabase.from('community_posts').select('id,author_id,body,paper,created_at').order('created_at',{ascending:false}).limit(40);
    if(error) throw error;
    const rows=(data||[]) as Post[]; setPosts(rows);
    const ids=rows.map(p=>p.id);
    if(!ids.length) {setProfiles({});setLikes(new Set());setBookmarks(new Set());setCommentCounts({});return;}
    const [profileRows,likeRows,bookmarkRows,commentRows]=await Promise.all([
      supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',[...new Set(rows.map(p=>p.author_id))]),
      supabase.from('community_post_likes').select('post_id,user_id').in('post_id',ids),
      supabase.from('community_post_bookmarks').select('post_id,user_id').eq('user_id',userId).in('post_id',ids),
      supabase.from('community_comments').select('post_id,author_id').in('post_id',ids)
    ]);
    if(profileRows.error) throw profileRows.error;
    if(likeRows.error) throw likeRows.error;
    if(bookmarkRows.error) throw bookmarkRows.error;
    if(commentRows.error) throw commentRows.error;
    const pmap:Record<string,Profile>={}; (profileRows.data||[]).forEach((p:any)=>pmap[p.user_id]=p as Profile);
    const commentAuthorIds=[...new Set((commentRows.data||[]).map((x:any)=>x.author_id).filter((id:string)=>!pmap[id]))];
    if(commentAuthorIds.length){const {data:commentProfiles,error:commentProfileError}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',commentAuthorIds);if(commentProfileError)throw commentProfileError;(commentProfiles||[]).forEach((p:any)=>pmap[p.user_id]=p as Profile);}
    setProfiles(pmap);
    setLikes(new Set((likeRows.data||[]).filter((x:any)=>x.user_id===userId).map((x:any)=>x.post_id)));
    setBookmarks(new Set((bookmarkRows.data||[]).map((x:any)=>x.post_id)));
    const counts:Record<string,number>={}; (commentRows.data||[]).forEach((x:any)=>counts[x.post_id]=(counts[x.post_id]||0)+1); setCommentCounts(counts);
    const {data:followRows,error:followError}=await supabase.from('community_follows').select('followed_id').eq('follower_id',userId);
    if(followError) throw followError;
    setFollowedPeople(new Set((followRows||[]).map((x:any)=>x.followed_id)));
    const {data:noteRows,error:noteError}=await supabase.from('community_shared_notes').select('id,owner_id,snapshot,shared_at').is('revoked_at',null).order('shared_at',{ascending:false}).limit(30);
    if(noteError) throw noteError;
    const shared=(noteRows||[]) as SharedNote[]; setSharedNotes(shared);
    const noteOwnerIds=[...new Set(shared.map(n=>n.owner_id))];
    if(noteOwnerIds.length){
      const {data:noteProfiles,error:noteProfileError}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',noteOwnerIds);
      if(noteProfileError) throw noteProfileError;
      setProfiles(prev=>({...prev,...Object.fromEntries((noteProfiles||[]).map((p:any)=>[p.user_id,p as Profile]))}));
    }
  },[userId]);

  const loadConversations=useCallback(async()=>{
    if(!supabase) return;
    const {data:mine,error:mineError}=await supabase.from('community_conversation_members').select('conversation_id').eq('user_id',userId);
    if(mineError) throw mineError;
    const ids=(mine||[]).map((x:any)=>x.conversation_id);
    if(!ids.length){setConversations([]);setConversationMembers({});return;}
    const [convResult,memberResult]=await Promise.all([
      supabase.from('community_conversations').select('id,kind,title,updated_at').in('id',ids).order('updated_at',{ascending:false}),
      supabase.from('community_conversation_members').select('conversation_id,user_id').in('conversation_id',ids)
    ]);
    if(convResult.error) throw convResult.error;
    if(memberResult.error) throw memberResult.error;
    setConversations((convResult.data||[]) as Conversation[]);
    const map:Record<string,string[]>={}; (memberResult.data||[]).forEach((x:any)=>{(map[x.conversation_id] ||= []).push(x.user_id);}); setConversationMembers(map);
    const otherIds=[...new Set((memberResult.data||[]).map((x:any)=>x.user_id).filter((id:string)=>id!==userId))];
    if(otherIds.length){
      const {data:otherProfiles,error:profileError}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',otherIds);
      if(profileError) throw profileError;
      setProfiles(prev=>({...prev,...Object.fromEntries((otherProfiles||[]).map((p:any)=>[p.user_id,p as Profile]))}));
    }
  },[userId]);

  const loadAll=useCallback(async()=>{
    if(!supabase){setLoading(false);return;}
    setLoading(true);setError('');
    try { await Promise.all([loadProfile(),loadFeed(),loadConversations()]); const {data:n,error:ne}=await supabase.from('community_notifications').select('id,kind,actor_id,created_at,read_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(20); if(ne)throw ne; setNotifications((n||[]) as any[]); }
    catch(e){setError(errorText(e));}
    finally{setLoading(false);}
  },[loadProfile,loadFeed,loadConversations]);
  useEffect(()=>{void loadAll();},[loadAll]);
  useEffect(()=>{if(pendingPaper)setSection('people');},[pendingPaper?.id]);

  const saveProfile=async()=>{
    if(!supabase)return;
    const username=profileDraft.username.trim().replace(/^@/,'');
    if(!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)){setError('Kullanıcı adı 3–30 karakter olmalı; harf, sayı, nokta, alt çizgi ve tire kullanılabilir.');return;}
    setBusy(true);setError('');setNotice('');
    try{
      const payload={user_id:userId,username,display_name:profileDraft.display_name.trim().slice(0,80),bio:profileDraft.bio.trim().slice(0,500),affiliation:profileDraft.affiliation.trim().slice(0,120),research_interests:profileDraft.research_interests.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),profile_visibility:'community',searchable:true};
      const {error}=await supabase.from('community_profiles').upsert(payload,{onConflict:'user_id'});if(error)throw error;
      await loadProfile();setNotice('Topluluk profilin kaydedildi.');
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  };

  const publishPost=async()=>{
    if(!supabase)return;
    if(!postDraft.trim()){setError('Gönderi metni boş olamaz.');return;}
    setBusy(true);setError('');
    try{const {error}=await supabase.from('community_posts').insert({author_id:userId,body:postDraft.trim()});if(error)throw error;setPostDraft('');await loadFeed();setNotice('Gönderin topluluk akışında yayımlandı.');}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };

  const toggleLike=async(postId:string)=>{
    if(!supabase)return;
    const active=likes.has(postId);setLikes(prev=>{const n=new Set(prev);active?n.delete(postId):n.add(postId);return n;});
    const result=active?await supabase.from('community_post_likes').delete().eq('post_id',postId).eq('user_id',userId):await supabase.from('community_post_likes').insert({post_id:postId,user_id:userId});
    if(result.error){setError(errorText(result.error));await loadFeed();}
  };
  const toggleBookmark=async(postId:string)=>{
    if(!supabase)return;
    const active=bookmarks.has(postId);setBookmarks(prev=>{const n=new Set(prev);active?n.delete(postId):n.add(postId);return n;});
    const result=active?await supabase.from('community_post_bookmarks').delete().eq('post_id',postId).eq('user_id',userId):await supabase.from('community_post_bookmarks').insert({post_id:postId,user_id:userId});
    if(result.error){setError(errorText(result.error));await loadFeed();}
  };
  const loadComments=async(postId:string)=>{
    if(!supabase)return;
    const {data,error}=await supabase.from('community_comments').select('id,author_id,parent_id,body,created_at').eq('post_id',postId).order('created_at',{ascending:true}).limit(100);
    if(error){setError(errorText(error));return;}setComments(prev=>({...prev,[postId]:(data||[]) as any[]}));
  };
  const addComment=async(postId:string)=>{
    if(!supabase)return;const body=(commentDrafts[postId]||'').trim();if(!body)return;
    const {error}=await supabase.from('community_comments').insert({post_id:postId,author_id:userId,parent_id:replyTargets[postId]||null,body});
    if(error){setError(errorText(error));return;}setCommentDrafts(prev=>({...prev,[postId]:''}));setReplyTargets(prev=>({...prev,[postId]:''}));await loadComments(postId);setCommentCounts(prev=>({...prev,[postId]:(prev[postId]||0)+1}));
  };
  const searchPeople=async()=>{
    if(!supabase||peopleQuery.trim().length<2){setError('Üye aramak için en az iki karakter yaz.');return;}
    setBusy(true);setError('');
    try{const {data,error}=await supabase.rpc('community_search_members',{p_query:peopleQuery.trim(),p_limit:25});if(error)throw error;setPeople((data||[]) as Profile[]);}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const blockMember=async(otherId:string)=>{
    if(!supabase||!window.confirm('Bu üyeyi engellemek istiyor musun? Engelleme karşılıklı mesajlaşmayı ve profil aramasını sınırlar.'))return;
    const {error}=await supabase.from('community_blocks').insert({blocker_id:userId,blocked_id:otherId});
    if(error){setError(errorText(error));return;}
    setPeople(prev=>prev.filter(p=>p.user_id!==otherId));
    setFollowedPeople(prev=>{const n=new Set(prev);n.delete(otherId);return n;});
    setNotice('Üye engellendi.');
  };
  const toggleFollow=async(otherId:string)=>{
    if(!supabase)return;const active=followedPeople.has(otherId);setFollowedPeople(prev=>{const n=new Set(prev);active?n.delete(otherId):n.add(otherId);return n;});
    const result=active?await supabase.from('community_follows').delete().eq('follower_id',userId).eq('followed_id',otherId):await supabase.from('community_follows').insert({follower_id:userId,followed_id:otherId});
    if(result.error){setError(errorText(result.error));setFollowedPeople(prev=>{const n=new Set(prev);active?n.add(otherId):n.delete(otherId);return n;});}
  };
  const markNotificationsRead=async()=>{
    if(!supabase)return;const unread=notifications.filter(n=>!n.read_at).map(n=>n.id);if(!unread.length)return;
    const {error}=await supabase.rpc('community_mark_notifications_read',{p_notification_ids:unread});
    if(error)setError(errorText(error));else setNotifications(prev=>prev.map(n=>({...n,read_at:n.read_at||new Date().toISOString()})));
  };
  const startConversation=async(otherId:string)=>{
    if(!supabase)return;setBusy(true);setError('');
    try{const {data,error}=await supabase.rpc('community_create_conversation',{p_user_ids:[otherId],p_kind:'direct',p_title:null});if(error)throw error;await loadConversations();setActiveConversation(data as string);setSection('messages');}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const startGroupConversation=async()=>{
    if(!supabase||selectedPeople.size<2)return;setBusy(true);setError('');
    try{const {data,error}=await supabase.rpc('community_create_conversation',{p_user_ids:[...selectedPeople],p_kind:'group',p_title:groupTitle.trim()||'Akademik grup'});if(error)throw error;setSelectedPeople(new Set());setGroupTitle('');await loadConversations();setActiveConversation(data as string);setSection('messages');}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const openConversation=async(id:string)=>{
    if(!supabase)return;setActiveConversation(id);setSection('messages');
    const {data,error}=await supabase.from('community_messages').select('id,conversation_id,sender_id,body,attachment_type,attachment,created_at').eq('conversation_id',id).order('created_at',{ascending:true}).limit(100);
    if(error){setError(errorText(error));return;}setMessages((data||[]) as Message[]);
    await supabase.from('community_conversation_members').update({last_read_at:new Date().toISOString()}).eq('conversation_id',id).eq('user_id',userId);
  };
  const sendPendingPaper=async()=>{
    if(!supabase||!pendingPaper||selectedPeople.size<1)return;
    setBusy(true);setError('');
    try{
      const recipients=[...selectedPeople];
      const {data:conversationId,error:createError}=await supabase.rpc('community_create_conversation',{p_user_ids:recipients,p_kind:recipients.length===1?'direct':'group',p_title:recipients.length===1?null:(groupTitle.trim()||'Makale paylaşımı')});
      if(createError)throw createError;
      const attachment={id:pendingPaper.id,title:pendingPaper.title,url:pendingPaper.link,authors:pendingPaper.authors,journal:pendingPaper.journal,year:pendingPaper.year,field:pendingPaper.sub||pendingPaper.field,abstract:pendingPaper.abs};
      const {error:sendError}=await supabase.rpc('community_send_message',{p_conversation_id:conversationId,p_body:'Seninle bir akademik makale paylaştı.',p_attachment_type:'paper',p_attachment:attachment});
      if(sendError)throw sendError;
      setSelectedPeople(new Set());setGroupTitle('');onPendingPaperHandled?.();await loadConversations();await openConversation(conversationId as string);setNotice('Makale seçtiğin üyelere özel mesajla gönderildi.');
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const sendMessage=async()=>{
    if(!supabase||!activeConversation||!messageDraft.trim())return;setBusy(true);setError('');
    try{const sharedNote=sharedNotes.find(n=>n.id===selectedSharedNoteId);const {error}=await supabase.rpc('community_send_message',{p_conversation_id:activeConversation,p_body:messageDraft.trim()||(sharedNote?'Seninle bir araştırma notu paylaştı.':''),p_attachment_type:sharedNote?'note_snapshot':null,p_attachment:sharedNote?{shared_note_id:sharedNote.id,snapshot:sharedNote.snapshot}:null});if(error)throw error;setMessageDraft('');setSelectedSharedNoteId('');await openConversation(activeConversation);await loadConversations();}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const reportPost=async(postId:string)=>{
    if(!supabase)return;const reason=window.prompt('Bu gönderiyi neden bildirmek istiyorsun?');if(!reason?.trim())return;
    const {error}=await supabase.from('community_reports').insert({reporter_id:userId,target_type:'post',target_id:postId,reason:reason.trim().slice(0,1000)});
    if(error)setError(errorText(error));else setNotice('Bildirimin yönetime iletildi.');
  };
  const tabs=[{id:'feed',label:'Akış',icon:MessageSquare},{id:'messages',label:'Mesajlar',icon:MessageCircle},{id:'people',label:'Üyeler',icon:Users},{id:'notes',label:'Notlarım',icon:Bookmark},{id:'profile',label:'Profilim',icon:UserPlus}] as const;

  if(loading)return <div className="flex flex-1 items-center justify-center gap-2 text-[var(--mu)]"><Loader2 className="animate-spin" size={18}/> Topluluk yükleniyor…</div>;
  return <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg)] px-3 py-4 sm:px-6 sm:py-6">
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-sky-700 dark:text-sky-300">Abstract · Kapalı topluluk</div><h1 className="mt-1 font-serif text-3xl font-bold text-[var(--ink)]">Bilimsel topluluk</h1><p className="mt-1 text-sm text-[var(--mu)]">Akademik paylaşım ve araştırmacılar arası iletişim alanı.</p></div><div className="flex items-center gap-3"><button className="relative rounded-xl border border-[var(--ln)] p-2 text-[var(--mu)]" onClick={()=>{setShowNotifications(v=>!v);void markNotificationsRead();}} aria-label="Bildirimler"><Bell size={18}/>{notifications.some(n=>!n.read_at)&&<span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500"/>}</button><div className="text-xs text-[var(--mu)]">{profile?'@'+profile.username:'Profilini tamamla'}</div></div></header>
      {showNotifications&&<section className={card+' p-3'}><div className="mb-2 text-sm font-bold text-[var(--ink)]">Bildirimler</div>{notifications.map(n=><div key={n.id} className="border-t border-[var(--ln)] py-2 text-xs text-[var(--mu)]">{n.kind==='like'?'Gönderin beğenildi.':n.kind==='comment'?'Gönderine yorum yapıldı.':n.kind==='follow'?'Yeni bir takipçin var.':n.kind==='message'?'Yeni mesajın var.':'Yeni topluluk bildirimi.'} · {new Date(n.created_at).toLocaleString('tr-TR')}</div>)}{!notifications.length&&<p className="text-xs text-[var(--mu)]">Henüz bildirimin yok.</p>}</section>}
      <nav className="grid grid-cols-5 gap-1 rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-1">{tabs.map(t=><button key={t.id} onClick={()=>{setSection(t.id);setError('');}} className={`flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold sm:gap-2 sm:text-sm ${section===t.id?'bg-sky-700 text-white':'text-[var(--mu)] hover:bg-[var(--bg)]'}`}><t.icon size={15}/><span>{t.label}</span></button>)}</nav>
      {error&&<div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
      {notice&&<div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{notice}</div>}

      {section==='notes'&&<section className={card+' space-y-3 p-4'}>
        <div><h2 className="font-bold text-[var(--ink)]">Bilim Defterim notları</h2><p className="mt-1 text-xs leading-5 text-[var(--mu)]">Notların varsayılan olarak özeldir. Yalnızca aşağıdaki paylaş düğmesine basıp onay verdiğin notlar topluluk üyelerine açılır. Paylaşım, notun o andaki içeriğinin ayrı bir kopyasını oluşturur.</p></div>
        {notes.map(note=><div key={note.id} className="rounded-xl border border-[var(--ln)] p-3"><div className="text-xs font-semibold text-[var(--ink)]">{note.paperTitle||'Başlıksız makale notu'} · {note.type==='quote'?'Alıntı':note.type==='question'?'Soru':'Not'}</div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[var(--mu)]">{note.content}</p><button className={button+' mt-3'} onClick={async()=>{
          if(!supabase)return;
          if(!window.confirm('Bu notun mevcut içeriğinin bir kopyası topluluk üyeleriyle paylaşılacak. Özel notunun kendisi değişmeyecek. Devam edilsin mi?'))return;
          setBusy(true);setError('');
          try{
            const {data,error}=await supabase.rpc('community_share_note_snapshot',{p_source_note_id:note.id,p_snapshot:{type:note.type,content:note.content,paperTitle:note.paperTitle||'',paperJournal:note.paperJournal||'',paperField:note.paperField||'',paperLink:note.paperLink||'',paperAuthors:note.paperAuthors||'',createdAt:note.createdAt}});
            if(error)throw error;
            setSharedNoteIds(prev=>new Set(prev).add(note.id));setNotice('Notun kopyası toplulukla paylaşıldı.');await loadFeed();
          }catch(e){setError(errorText(e));}finally{setBusy(false);}
        }} disabled={busy||sharedNoteIds.has(note.id)}><Check size={15}/>{sharedNoteIds.has(note.id)?'Bu oturumda paylaşıldı':'Açık onayla paylaş'}</button></div>)}
        {!notes.length&&<p className="rounded-xl bg-[var(--bg)] p-4 text-xs text-[var(--mu)]">Bilim Defterim’de henüz notun bulunmuyor.</p>}
      </section>}

      {section==='profile'&&<section className={`${card} space-y-3 p-4 sm:p-5`}><div><h2 className="font-bold text-[var(--ink)]">Topluluk profilin</h2><p className="mt-1 text-xs text-[var(--mu)]">E-posta adresin burada gösterilmez. Profil yalnızca topluluk üyelerine açıktır.</p></div>
        <label className="block text-xs font-semibold text-[var(--mu)]">Kullanıcı adı<input className={field+' mt-1'} value={profileDraft.username} onChange={e=>setProfileDraft(p=>({...p,username:e.target.value}))} placeholder="ornek.kullanici"/></label>
        <label className="block text-xs font-semibold text-[var(--mu)]">Görünen ad<input className={field+' mt-1'} value={profileDraft.display_name} onChange={e=>setProfileDraft(p=>({...p,display_name:e.target.value}))} maxLength={80}/></label>
        <label className="block text-xs font-semibold text-[var(--mu)]">Kurum / üniversite<input className={field+' mt-1'} value={profileDraft.affiliation} onChange={e=>setProfileDraft(p=>({...p,affiliation:e.target.value}))} maxLength={120}/></label>
        <label className="block text-xs font-semibold text-[var(--mu)]">Kısa biyografi<textarea className={field+' mt-1'} rows={3} value={profileDraft.bio} onChange={e=>setProfileDraft(p=>({...p,bio:e.target.value}))} maxLength={500}/></label>
        <label className="block text-xs font-semibold text-[var(--mu)]">Araştırma alanları (virgülle ayır)<input className={field+' mt-1'} value={profileDraft.research_interests} onChange={e=>setProfileDraft(p=>({...p,research_interests:e.target.value}))} placeholder="Deniz ekolojisi, moleküler biyoloji"/></label>
        <button className={button} disabled={busy} onClick={()=>void saveProfile()}>{busy?<Loader2 className="animate-spin" size={16}/>:<Check size={16}/>} Profili kaydet</button>
      </section>}

      {section==='feed'&&<div className="space-y-3">
        <section className={card+' p-4'}><textarea className={field+' resize-y'} rows={3} maxLength={5000} value={postDraft} onChange={e=>setPostDraft(e.target.value)} placeholder="Akademik bir fikir, araştırma notu veya bilimsel tartışma başlat…"/><div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-[var(--mu)]">{postDraft.length}/5000 · Yalnızca topluluk üyeleri görür</span><button className={button} disabled={busy||!postDraft.trim()} onClick={()=>void publishPost()}><Plus size={16}/> Paylaş</button></div></section>
        {posts.map(post=><article key={post.id} className={card+' p-4'}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold text-[var(--ink)]">{profiles[post.author_id]?.display_name||profiles[post.author_id]?.username||'Topluluk üyesi'}</div><div className="text-xs text-[var(--mu)]">@{profiles[post.author_id]?.username||shortId(post.author_id)} · {new Date(post.created_at).toLocaleString('tr-TR')}</div></div><button title="Gönderiyi bildir" onClick={()=>void reportPost(post.id)} className="rounded-lg p-2 text-[var(--mu)] hover:bg-[var(--bg)]"><ShieldAlert size={16}/></button></div>
          {post.body&&<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--ink)]">{post.body}</p>}
          {post.paper&&<div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/20"><div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Paylaşılan makale</div><div className="mt-1 font-semibold text-[var(--ink)]">{String(post.paper.title||'Akademik makale')}</div>{safeHttpUrl(post.paper.url)&&<a className="mt-2 inline-block text-xs font-semibold text-sky-700 underline dark:text-sky-300" href={safeHttpUrl(post.paper.url)!} target="_blank" rel="noopener noreferrer">Makale kaynağını aç</a>}</div>}
          <div className="mt-3 flex items-center gap-4 border-t border-[var(--ln)] pt-2"><button onClick={()=>void toggleLike(post.id)} className={`inline-flex items-center gap-1.5 text-xs ${likes.has(post.id)?'font-bold text-rose-600':'text-[var(--mu)]'}`}><Heart size={16} fill={likes.has(post.id)?'currentColor':'none'}/> Beğen</button><button onClick={()=>{const next=new Set(openComments);if(next.has(post.id))next.delete(post.id);else{next.add(post.id);void loadComments(post.id);}setOpenComments(next);}} className="inline-flex items-center gap-1.5 text-xs text-[var(--mu)]"><MessageCircle size={16}/> Yorum ({commentCounts[post.id]||0})</button><button onClick={()=>void toggleBookmark(post.id)} className={`ml-auto inline-flex items-center gap-1.5 text-xs ${bookmarks.has(post.id)?'font-bold text-sky-700':'text-[var(--mu)]'}`}><Bookmark size={16} fill={bookmarks.has(post.id)?'currentColor':'none'}/> Kaydet</button></div>
          {openComments.has(post.id)&&<div className="mt-3 space-y-2">{(comments[post.id]||[]).map(c=><div key={c.id} className={`rounded-lg bg-[var(--bg)] p-2.5 ${c.parent_id?'ml-5 border-l-2 border-sky-300':''}`}><div className="text-[10px] font-semibold text-[var(--mu)]">{profiles[c.author_id]?.display_name||shortId(c.author_id)} · {new Date(c.created_at).toLocaleString('tr-TR')}</div><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--ink)]">{c.body}</p><button className="mt-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300" onClick={()=>setReplyTargets(prev=>({...prev,[post.id]:c.id}))}>Yanıtla</button></div>)}{replyTargets[post.id]&&<div className="text-[10px] text-[var(--mu)]">Yoruma yanıt yazılıyor <button onClick={()=>setReplyTargets(prev=>({...prev,[post.id]:''}))} className="ml-2 text-rose-600">Vazgeç</button></div>}<div className="flex gap-2"><input className={field} value={commentDrafts[post.id]||''} onChange={e=>setCommentDrafts(p=>({...p,[post.id]:e.target.value}))} placeholder={replyTargets[post.id]?'Yanıt yaz…':'Yorum yaz…'} maxLength={2000}/><button className={button} onClick={()=>void addComment(post.id)} aria-label="Yorumu gönder"><Send size={15}/></button></div></div>}
        </article>)}
        {!posts.length&&<div className={card+' p-8 text-center text-sm text-[var(--mu)]'}>Henüz gönderi yok. İlk akademik paylaşımı sen başlatabilirsin.</div>}
        {sharedNotes.map(item=><article key={item.id} className={card+' p-4'}><div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Bilim Defterim · Açıkça paylaşılmış not</div><div className="mt-1 text-sm font-semibold text-[var(--ink)]">{profiles[item.owner_id]?.display_name||profiles[item.owner_id]?.username||'Topluluk üyesi'} · {String(item.snapshot.paperTitle||'Makale notu')}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{String(item.snapshot.content||'')}</p><div className="mt-2 flex items-center justify-between text-[10px] text-[var(--mu)]"><time>{new Date(item.shared_at).toLocaleString('tr-TR')}</time>{item.owner_id===userId&&<button className="font-semibold text-rose-600" onClick={async()=>{if(!supabase||!window.confirm('Bu not paylaşımını geri almak istiyor musun? Özel notun korunur.'))return;const {error}=await supabase.rpc('community_revoke_shared_note',{p_shared_note_id:item.id});if(error)setError(errorText(error));else{setSharedNotes(prev=>prev.filter(n=>n.id!==item.id));setNotice('Not paylaşımı geri alındı. Özel notun değişmedi.');}}}>Paylaşımı geri al</button>}</div></article>)}
      </div>}

      {section==='people'&&<section className={card+' p-4'}>{pendingPaper&&<div className="mb-3 rounded-xl border border-sky-300 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/30"><div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Makale gönderimi</div><div className="mt-1 text-sm font-semibold text-[var(--ink)]">{pendingPaper.title}</div><p className="mt-1 text-xs text-[var(--mu)]">Bir veya daha fazla alıcı seç. Tek alıcıya birebir, birden fazla alıcıya grup mesajı gönderilir.</p><button className={button+' mt-2'} disabled={busy||selectedPeople.size<1} onClick={()=>void sendPendingPaper()}><Send size={15}/> Seçilenlere makaleyi gönder ({selectedPeople.size})</button></div>}<h2 className="font-bold text-[var(--ink)]">Topluluk üyeleri</h2><p className="mt-1 text-xs text-[var(--mu)]">Yalnızca toplulukta görünür olmayı seçen üyeler listelenir.</p><div className="mt-3 flex gap-2"><input className={field} value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Ad, kullanıcı adı veya kurum…"/><button className={button} disabled={busy} onClick={()=>void searchPeople()}><Search size={16}/> Ara</button></div><div className="mt-3 space-y-2">{selectedPeople.size>=2&&<div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--bg)] p-3"><input className={field+' max-w-[220px]'} value={groupTitle} onChange={e=>setGroupTitle(e.target.value)} placeholder="Grup adı (isteğe bağlı)"/><button className={button} disabled={busy} onClick={()=>void startGroupConversation()}>Seçilenlerle grup kur ({selectedPeople.size})</button></div>}{people.map(p=><div key={p.user_id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--ln)] p-3"><div className="min-w-0"><div className="truncate text-sm font-bold text-[var(--ink)]">{p.display_name||p.username}</div><div className="text-xs text-[var(--mu)]">@{p.username} {p.affiliation?'· '+p.affiliation:''}</div><div className="mt-1 text-xs text-[var(--mu)]">{(p.research_interests||[]).join(' · ')}</div></div><div className="flex items-center gap-2"><label className="flex items-center gap-1 text-[10px] text-[var(--mu)]"><input type="checkbox" checked={selectedPeople.has(p.user_id)} onChange={e=>setSelectedPeople(prev=>{const n=new Set(prev);e.target.checked?n.add(p.user_id):n.delete(p.user_id);return n;})}/> Grup</label><button className="rounded-xl border border-[var(--ln)] px-3 py-2 text-xs font-semibold text-[var(--mu)]" onClick={()=>void toggleFollow(p.user_id)}>{followedPeople.has(p.user_id)?'Takibi bırak':'Takip et'}</button><button className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-600" onClick={()=>void blockMember(p.user_id)}>Engelle</button><button className={button} disabled={busy} onClick={()=>void startConversation(p.user_id)}><MessageCircle size={15}/> Mesaj</button></div></div>)}</div></section>}

      {section==='messages'&&<div className="grid gap-3 md:grid-cols-[minmax(190px,0.8fr)_minmax(0,1.5fr)]">
        <section className={card+' p-3'}><h2 className="mb-2 px-1 text-sm font-bold text-[var(--ink)]">Sohbetler</h2>{conversations.map(c=>{const other=(conversationMembers[c.id]||[]).find(x=>x!==userId);const p=other?profiles[other]:null;return <button key={c.id} onClick={()=>void openConversation(c.id)} className={`mb-1 w-full rounded-xl p-3 text-left ${activeConversation===c.id?'bg-sky-100 dark:bg-sky-950/50':'hover:bg-[var(--bg)]'}`}><div className="truncate text-sm font-semibold text-[var(--ink)]">{c.title||p?.display_name||p?.username||'Sohbet'}</div><div className="text-[10px] text-[var(--mu)]">{new Date(c.updated_at).toLocaleString('tr-TR')}</div></button>;})}{!conversations.length&&<p className="px-1 py-3 text-xs text-[var(--mu)]">Henüz sohbetin yok. Üyeler bölümünden mesaj başlatabilirsin.</p>}</section>
        <section className={card+' flex min-h-[360px] flex-col p-3'}><div className="mb-2 flex items-center gap-2 border-b border-[var(--ln)] pb-2"><MessageCircle size={16} className="text-sky-700"/><h2 className="text-sm font-bold text-[var(--ink)]">Özel mesajlar</h2></div><div className="flex-1 space-y-2 overflow-y-auto py-2">{messages.map(m=><div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.sender_id===userId?'ml-auto bg-sky-700 text-white':'bg-[var(--bg)] text-[var(--ink)]'}`}><p className="whitespace-pre-wrap break-words">{m.body}</p>{m.attachment_type==='paper'&&m.attachment&&<div className="mt-2 rounded-xl border border-white/20 bg-black/5 p-2"><div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Akademik makale</div><div className="mt-1 font-semibold">{String(m.attachment.title||'Makale')}</div><div className="text-[10px] opacity-80">{String(m.attachment.authors||'')} · {String(m.attachment.journal||'')}</div>{safeHttpUrl(m.attachment.url)&&<a className="mt-1 inline-block text-[10px] underline" href={safeHttpUrl(m.attachment.url)!} target="_blank" rel="noopener noreferrer">Makaleyi aç</a>}</div>}{m.attachment_type==='note_snapshot'&&m.attachment&&<div className="mt-2 rounded-xl border border-white/20 bg-black/5 p-2"><div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Paylaşılmış araştırma notu</div><div className="mt-1 font-semibold">{String((m.attachment.snapshot as Record<string,unknown>)?.paperTitle||'Bilim Defterim notu')}</div><p className="mt-1 whitespace-pre-wrap text-xs">{String((m.attachment.snapshot as Record<string,unknown>)?.content||'')}</p></div>}<time className="mt-1 block text-right text-[9px] opacity-70">{new Date(m.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</time></div>)}{!activeConversation&&<p className="m-auto py-12 text-center text-xs text-[var(--mu)]">Mesajlarını görmek için bir sohbet seç.</p>}</div>{activeConversation&&<div className="border-t border-[var(--ln)] pt-2"><div className="mb-2 flex gap-2"><select className={field+' max-w-[210px]'} value={selectedSharedNoteId} onChange={e=>setSelectedSharedNoteId(e.target.value)}><option value="">Not ekleme</option>{sharedNotes.map(n=><option key={n.id} value={n.id}>{String(n.snapshot.paperTitle||'Paylaşılmış not')}</option>)}</select><span className="self-center text-[10px] text-[var(--mu)]">Önceden açıkça paylaşılmış notlardan</span></div><div className="flex gap-2"><input className={field} value={messageDraft} onChange={e=>setMessageDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void sendMessage();}}} placeholder="Mesaj yaz…" maxLength={5000}/><button className={button} disabled={busy||(!messageDraft.trim()&&!selectedSharedNoteId)} onClick={()=>void sendMessage()} aria-label="Mesajı gönder"><Send size={16}/></button></div></div>}</section>
      </div>}
      <p className="px-1 text-[10px] leading-5 text-[var(--mu)]">Topluluk gönderileri ve mesajları yalnızca yetkili üyeler içindir. Özel notların otomatik paylaşılmaz; paylaşım için ayrıca açık onay gereklidir.</p>
    </div>
  </div>;
};
