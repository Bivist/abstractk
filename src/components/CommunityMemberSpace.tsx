import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark, Check, ChevronLeft, Heart, Loader2, MessageCircle, MessageSquare, Plus, Search, Send, ShieldAlert, Users, UserPlus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Profile = { user_id:string; username:string; display_name:string; avatar_url:string|null; bio:string; affiliation:string; research_interests:string[]; };
type Post = { id:string; author_id:string; body:string; paper:Record<string,unknown>|null; created_at:string; };
type Conversation = { id:string; kind:'direct'|'group'; title:string|null; updated_at:string; };
type Message = { id:string; conversation_id:string; sender_id:string; body:string; attachment_type:string|null; attachment:Record<string,unknown>|null; created_at:string; };

const card = 'rounded-2xl border border-[var(--ln)] bg-[var(--sf)]';
const field = 'w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky-500';
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

function errorText(error:unknown) { return error && typeof error==='object' && 'message' in error ? String((error as {message:unknown}).message) : 'İşlem tamamlanamadı.'; }
function shortId(id:string) { return id.slice(0,8); }

export const CommunityMemberSpace:React.FC<{userId:string}> = ({userId}) => {
  const [section,setSection]=useState<'feed'|'messages'|'people'|'profile'>('feed');
  const [profile,setProfile]=useState<Profile|null>(null);
  const [profileDraft,setProfileDraft]=useState({username:'',display_name:'',bio:'',affiliation:'',research_interests:''});
  const [posts,setPosts]=useState<Post[]>([]);
  const [profiles,setProfiles]=useState<Record<string,Profile>>({});
  const [likes,setLikes]=useState<Set<string>>(new Set());
  const [bookmarks,setBookmarks]=useState<Set<string>>(new Set());
  const [commentCounts,setCommentCounts]=useState<Record<string,number>>({});
  const [comments,setComments]=useState<Record<string,{id:string;author_id:string;body:string;created_at:string}[]>>({});
  const [commentDrafts,setCommentDrafts]=useState<Record<string,string>>({});
  const [openComments,setOpenComments]=useState<Set<string>>(new Set());
  const [postDraft,setPostDraft]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [peopleQuery,setPeopleQuery]=useState('');
  const [people,setPeople]=useState<Profile[]>([]);
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [conversationMembers,setConversationMembers]=useState<Record<string,string[]>>({});
  const [activeConversation,setActiveConversation]=useState<string|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [messageDraft,setMessageDraft]=useState('');

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
      supabase.from('community_comments').select('post_id').in('post_id',ids)
    ]);
    if(profileRows.error) throw profileRows.error;
    if(likeRows.error) throw likeRows.error;
    if(bookmarkRows.error) throw bookmarkRows.error;
    if(commentRows.error) throw commentRows.error;
    const pmap:Record<string,Profile>={}; (profileRows.data||[]).forEach((p:any)=>pmap[p.user_id]=p as Profile); setProfiles(pmap);
    setLikes(new Set((likeRows.data||[]).filter((x:any)=>x.user_id===userId).map((x:any)=>x.post_id)));
    setBookmarks(new Set((bookmarkRows.data||[]).map((x:any)=>x.post_id)));
    const counts:Record<string,number>={}; (commentRows.data||[]).forEach((x:any)=>counts[x.post_id]=(counts[x.post_id]||0)+1); setCommentCounts(counts);
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
  },[userId]);

  const loadAll=useCallback(async()=>{
    if(!supabase){setLoading(false);return;}
    setLoading(true);setError('');
    try { await Promise.all([loadProfile(),loadFeed(),loadConversations()]); }
    catch(e){setError(errorText(e));}
    finally{setLoading(false);}
  },[loadProfile,loadFeed,loadConversations]);
  useEffect(()=>{void loadAll();},[loadAll]);

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
    const {data,error}=await supabase.from('community_comments').select('id,author_id,body,created_at').eq('post_id',postId).order('created_at',{ascending:true}).limit(100);
    if(error){setError(errorText(error));return;}setComments(prev=>({...prev,[postId]:(data||[]) as any[]}));
  };
  const addComment=async(postId:string)=>{
    if(!supabase)return;const body=(commentDrafts[postId]||'').trim();if(!body)return;
    const {error}=await supabase.from('community_comments').insert({post_id:postId,author_id:userId,body});
    if(error){setError(errorText(error));return;}setCommentDrafts(prev=>({...prev,[postId]:''}));await loadComments(postId);setCommentCounts(prev=>({...prev,[postId]:(prev[postId]||0)+1}));
  };
  const searchPeople=async()=>{
    if(!supabase||peopleQuery.trim().length<2){setError('Üye aramak için en az iki karakter yaz.');return;}
    setBusy(true);setError('');
    try{const {data,error}=await supabase.rpc('community_search_members',{p_query:peopleQuery.trim(),p_limit:25});if(error)throw error;setPeople((data||[]) as Profile[]);}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const startConversation=async(otherId:string)=>{
    if(!supabase)return;setBusy(true);setError('');
    try{const {data,error}=await supabase.rpc('community_create_conversation',{p_user_ids:[otherId],p_kind:'direct',p_title:null});if(error)throw error;await loadConversations();setActiveConversation(data as string);setSection('messages');}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const openConversation=async(id:string)=>{
    if(!supabase)return;setActiveConversation(id);setSection('messages');
    const {data,error}=await supabase.from('community_messages').select('id,conversation_id,sender_id,body,attachment_type,attachment,created_at').eq('conversation_id',id).order('created_at',{ascending:true}).limit(100);
    if(error){setError(errorText(error));return;}setMessages((data||[]) as Message[]);
    await supabase.from('community_conversation_members').update({last_read_at:new Date().toISOString()}).eq('conversation_id',id).eq('user_id',userId);
  };
  const sendMessage=async()=>{
    if(!supabase||!activeConversation||!messageDraft.trim())return;setBusy(true);setError('');
    try{const {error}=await supabase.rpc('community_send_message',{p_conversation_id:activeConversation,p_body:messageDraft.trim(),p_attachment_type:null,p_attachment:null});if(error)throw error;setMessageDraft('');await openConversation(activeConversation);await loadConversations();}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const reportPost=async(postId:string)=>{
    if(!supabase)return;const reason=window.prompt('Bu gönderiyi neden bildirmek istiyorsun?');if(!reason?.trim())return;
    const {error}=await supabase.from('community_reports').insert({reporter_id:userId,target_type:'post',target_id:postId,reason:reason.trim().slice(0,1000)});
    if(error)setError(errorText(error));else setNotice('Bildirimin yönetime iletildi.');
  };
  const tabs=[{id:'feed',label:'Akış',icon:MessageSquare},{id:'messages',label:'Mesajlar',icon:MessageCircle},{id:'people',label:'Üyeler',icon:Users},{id:'profile',label:'Profilim',icon:UserPlus}] as const;

  if(loading)return <div className="flex flex-1 items-center justify-center gap-2 text-[var(--mu)]"><Loader2 className="animate-spin" size={18}/> Topluluk yükleniyor…</div>;
  return <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg)] px-3 py-4 sm:px-6 sm:py-6">
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-sky-700 dark:text-sky-300">Abstract · Kapalı topluluk</div><h1 className="mt-1 font-serif text-3xl font-bold text-[var(--ink)]">Bilimsel topluluk</h1><p className="mt-1 text-sm text-[var(--mu)]">Akademik paylaşım ve araştırmacılar arası iletişim alanı.</p></div><div className="text-xs text-[var(--mu)]">{profile?'@'+profile.username:'Profilini tamamla'}</div></header>
      <nav className="grid grid-cols-4 gap-1 rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-1">{tabs.map(t=><button key={t.id} onClick={()=>{setSection(t.id);setError('');}} className={`flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold sm:gap-2 sm:text-sm ${section===t.id?'bg-sky-700 text-white':'text-[var(--mu)] hover:bg-[var(--bg)]'}`}><t.icon size={15}/><span>{t.label}</span></button>)}</nav>
      {error&&<div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
      {notice&&<div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{notice}</div>}

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
          {post.paper&&<div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/20"><div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Paylaşılan makale</div><div className="mt-1 font-semibold text-[var(--ink)]">{String(post.paper.title||'Akademik makale')}</div>{post.paper.url&&<a className="mt-2 inline-block text-xs font-semibold text-sky-700 underline dark:text-sky-300" href={String(post.paper.url)} target="_blank" rel="noreferrer">Makale kaynağını aç</a>}</div>}
          <div className="mt-3 flex items-center gap-4 border-t border-[var(--ln)] pt-2"><button onClick={()=>void toggleLike(post.id)} className={`inline-flex items-center gap-1.5 text-xs ${likes.has(post.id)?'font-bold text-rose-600':'text-[var(--mu)]'}`}><Heart size={16} fill={likes.has(post.id)?'currentColor':'none'}/> Beğen</button><button onClick={()=>{const next=new Set(openComments);if(next.has(post.id))next.delete(post.id);else{next.add(post.id);void loadComments(post.id);}setOpenComments(next);}} className="inline-flex items-center gap-1.5 text-xs text-[var(--mu)]"><MessageCircle size={16}/> Yorum ({commentCounts[post.id]||0})</button><button onClick={()=>void toggleBookmark(post.id)} className={`ml-auto inline-flex items-center gap-1.5 text-xs ${bookmarks.has(post.id)?'font-bold text-sky-700':'text-[var(--mu)]'}`}><Bookmark size={16} fill={bookmarks.has(post.id)?'currentColor':'none'}/> Kaydet</button></div>
          {openComments.has(post.id)&&<div className="mt-3 space-y-2">{(comments[post.id]||[]).map(c=><div key={c.id} className="rounded-lg bg-[var(--bg)] p-2.5"><div className="text-[10px] font-semibold text-[var(--mu)]">{profiles[c.author_id]?.display_name||shortId(c.author_id)} · {new Date(c.created_at).toLocaleString('tr-TR')}</div><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--ink)]">{c.body}</p></div>)}<div className="flex gap-2"><input className={field} value={commentDrafts[post.id]||''} onChange={e=>setCommentDrafts(p=>({...p,[post.id]:e.target.value}))} placeholder="Yorum yaz…" maxLength={2000}/><button className={button} onClick={()=>void addComment(post.id)} aria-label="Yorumu gönder"><Send size={15}/></button></div></div>}
        </article>)}
        {!posts.length&&<div className={card+' p-8 text-center text-sm text-[var(--mu)]'}>Henüz gönderi yok. İlk akademik paylaşımı sen başlatabilirsin.</div>}
      </div>}

      {section==='people'&&<section className={card+' p-4'}><h2 className="font-bold text-[var(--ink)]">Topluluk üyeleri</h2><p className="mt-1 text-xs text-[var(--mu)]">Yalnızca toplulukta görünür olmayı seçen üyeler listelenir.</p><div className="mt-3 flex gap-2"><input className={field} value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Ad, kullanıcı adı veya kurum…"/><button className={button} disabled={busy} onClick={()=>void searchPeople()}><Search size={16}/> Ara</button></div><div className="mt-3 space-y-2">{people.map(p=><div key={p.user_id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--ln)] p-3"><div className="min-w-0"><div className="truncate text-sm font-bold text-[var(--ink)]">{p.display_name||p.username}</div><div className="text-xs text-[var(--mu)]">@{p.username} {p.affiliation?'· '+p.affiliation:''}</div><div className="mt-1 text-xs text-[var(--mu)]">{(p.research_interests||[]).join(' · ')}</div></div><button className={button} disabled={busy} onClick={()=>void startConversation(p.user_id)}><MessageCircle size={15}/> Mesaj</button></div>)}</div></section>}

      {section==='messages'&&<div className="grid gap-3 md:grid-cols-[minmax(190px,0.8fr)_minmax(0,1.5fr)]">
        <section className={card+' p-3'}><h2 className="mb-2 px-1 text-sm font-bold text-[var(--ink)]">Sohbetler</h2>{conversations.map(c=>{const other=(conversationMembers[c.id]||[]).find(x=>x!==userId);const p=other?profiles[other]:null;return <button key={c.id} onClick={()=>void openConversation(c.id)} className={`mb-1 w-full rounded-xl p-3 text-left ${activeConversation===c.id?'bg-sky-100 dark:bg-sky-950/50':'hover:bg-[var(--bg)]'}`}><div className="truncate text-sm font-semibold text-[var(--ink)]">{c.title||p?.display_name||p?.username||'Sohbet'}</div><div className="text-[10px] text-[var(--mu)]">{new Date(c.updated_at).toLocaleString('tr-TR')}</div></button>;})}{!conversations.length&&<p className="px-1 py-3 text-xs text-[var(--mu)]">Henüz sohbetin yok. Üyeler bölümünden mesaj başlatabilirsin.</p>}</section>
        <section className={card+' flex min-h-[360px] flex-col p-3'}><div className="mb-2 flex items-center gap-2 border-b border-[var(--ln)] pb-2"><MessageCircle size={16} className="text-sky-700"/><h2 className="text-sm font-bold text-[var(--ink)]">Özel mesajlar</h2></div><div className="flex-1 space-y-2 overflow-y-auto py-2">{messages.map(m=><div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.sender_id===userId?'ml-auto bg-sky-700 text-white':'bg-[var(--bg)] text-[var(--ink)]'}`}><p className="whitespace-pre-wrap break-words">{m.body}</p><time className="mt-1 block text-right text-[9px] opacity-70">{new Date(m.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</time></div>)}{!activeConversation&&<p className="m-auto py-12 text-center text-xs text-[var(--mu)]">Mesajlarını görmek için bir sohbet seç.</p>}</div>{activeConversation&&<div className="flex gap-2 border-t border-[var(--ln)] pt-2"><input className={field} value={messageDraft} onChange={e=>setMessageDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void sendMessage();}}} placeholder="Mesaj yaz…" maxLength={5000}/><button className={button} disabled={busy||!messageDraft.trim()} onClick={()=>void sendMessage()} aria-label="Mesajı gönder"><Send size={16}/></button></div>}</section>
      </div>}
      <p className="px-1 text-[10px] leading-5 text-[var(--mu)]">Topluluk gönderileri ve mesajları yalnızca yetkili üyeler içindir. Özel notların otomatik paylaşılmaz; paylaşım için ayrıca açık onay gereklidir.</p>
    </div>
  </div>;
};
