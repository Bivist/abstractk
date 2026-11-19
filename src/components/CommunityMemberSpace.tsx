import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Bookmark, Check, Heart, Loader2, MessageCircle, MessageSquare, Pin, Plus, Repeat2, Search, Send, ShieldAlert, Users, UserPlus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PaperNote } from '../types';
import { CommunityMessages } from './CommunityMessages';
import { TAXONOMY } from '../constants/taxonomy';
import type { TaxonomyNode } from '../types';

type Profile = { user_id:string; username:string; display_name:string; avatar_url:string|null; bio:string; affiliation:string; research_interests:string[]; profile_visibility?:'community'|'private'; searchable?:boolean; };
type Post = { id:string; author_id:string; body:string; paper:Record<string,unknown>|null; created_at:string; is_featured?:boolean; repost_of?:string|null; repost_note?:string|null; moderation_status?:string; };
type Conversation = { id:string; kind:'direct'|'group'; title:string|null; updated_at:string; };
type Message = { id:string; conversation_id:string; sender_id:string; body:string; attachment_type:string|null; attachment:Record<string,unknown>|null; created_at:string; };
type SharedNote = {id:string;owner_id:string;source_note_id:string;snapshot:Record<string,unknown>;shared_at:string};

const card = 'rounded-2xl border border-[var(--ln)] bg-[var(--sf)]';
const field = 'w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky-500';
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

function errorText(error:unknown) { return error && typeof error==='object' && 'message' in error ? String((error as {message:unknown}).message) : 'İşlem tamamlanamadı.'; }
function shortId(id:string) { return id.slice(0,8); }
function safeHttpUrl(value:unknown):string|null { try { const url=new URL(String(value)); return url.protocol==='https:'||url.protocol==='http:'?url.href:null; } catch { return null; } }

export const CommunityMemberSpace:React.FC<{userId:string; avatarUrl?:string|null; notes:PaperNote[]; pendingPaper?:import('../types').Paper|null; onPendingPaperHandled?:()=>void; onReturnToAdmin?:()=>void}> = ({userId,avatarUrl,notes,pendingPaper,onPendingPaperHandled,onReturnToAdmin}) => {
  const [section,setSection]=useState<'feed'|'messages'|'people'|'notes'|'profile'|'requests'>('feed');
  const [profile,setProfile]=useState<Profile|null>(null);
  const [profileVisibility,setProfileVisibility]=useState<'community'|'private'>('community');
  const [profileDraft,setProfileDraft]=useState({username:'',display_name:'',bio:'',affiliation:'',research_interests:''});
  const [selectedResearchInterests,setSelectedResearchInterests]=useState<string[]>([]);
  const [posts,setPosts]=useState<Post[]>([]);
  const [sourcePosts,setSourcePosts]=useState<Record<string,Post>>({});
  const [repostOpen,setRepostOpen]=useState<Set<string>>(new Set());
  const [repostDrafts,setRepostDrafts]=useState<Record<string,string>>({});
  const [feedHasMore,setFeedHasMore]=useState(true);
  const [loadingMore,setLoadingMore]=useState(false);
  const [profiles,setProfiles]=useState<Record<string,Profile>>({});
  const [likes,setLikes]=useState<Set<string>>(new Set());
  const [followedPeople,setFollowedPeople]=useState<Set<string>>(new Set());
  const [followRequests,setFollowRequests]=useState<{id:string;requester_id:string;created_at:string}[]>([]);
  const [sentFollowRequests,setSentFollowRequests]=useState<Set<string>>(new Set());
  const [sentFollowRequestRows,setSentFollowRequestRows]=useState<{id:string;target_id:string;created_at:string}[]>([]);
  const [composerOpen,setComposerOpen]=useState(false);
  const [notifications,setNotifications]=useState<{id:string;kind:string;actor_id:string|null;created_at:string;read_at:string|null;payload?:Record<string,unknown>}[]>([]);
  const [showNotifications,setShowNotifications]=useState(false);
  const [viewedProfileId,setViewedProfileId]=useState<string|null>(null);
  const [viewedProfile,setViewedProfile]=useState<Profile|null>(null);
  const [viewedProfilePrivate,setViewedProfilePrivate]=useState(false);
  const [profileLoading,setProfileLoading]=useState(false);
  
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
  const [blockedMembers,setBlockedMembers]=useState<{blocked_id:string;username?:string;display_name?:string}[]>([]);
  const [groupTitle,setGroupTitle]=useState('');
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [conversationMembers,setConversationMembers]=useState<Record<string,string[]>>({});
  const [activeConversation,setActiveConversation]=useState<string|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [sharedNoteIds,setSharedNoteIds]=useState<Set<string>>(new Set());
  const [sharedNotes,setSharedNotes]=useState<SharedNote[]>([]);
  const [messageDraft,setMessageDraft]=useState('');
  const [selectedSharedNoteId,setSelectedSharedNoteId]=useState('');
  const [extraAttachmentType,setExtraAttachmentType]=useState<'none'|'citation'|'collection'|'research_summary'>('none');
  const [attachmentTitle,setAttachmentTitle]=useState('');
  const [attachmentUrl,setAttachmentUrl]=useState('');
  const [attachmentContent,setAttachmentContent]=useState('');

  const loadProfile=useCallback(async()=>{
    if(!supabase) return;
    const {data,error}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests,profile_visibility').eq('user_id',userId).maybeSingle();
    if(error) throw error;
    if(data) {
      const p=data as Profile; setProfile(p);setProfileVisibility((data as any).profile_visibility==='private'?'private':'community');
      setSelectedResearchInterests(p.research_interests||[]);
      setProfileDraft({username:p.username||'',display_name:p.display_name||'',bio:p.bio||'',affiliation:p.affiliation||'',research_interests:(p.research_interests||[]).join(', ')});
    }
  },[userId]);

  const loadFeed=useCallback(async()=>{
    if(!supabase) return;
    const {data,error}=await supabase.from('community_posts').select('id,author_id,body,paper,created_at,is_featured,repost_of,repost_note,moderation_status').order('is_featured',{ascending:false}).order('created_at',{ascending:false}).limit(40);
    if(error) throw error;
    const rows=(data||[]) as Post[]; setPosts(rows); setFeedHasMore(rows.length===40);
    const sourceIds=[...new Set(rows.map(p=>p.repost_of).filter((id):id is string=>!!id))];
    if(sourceIds.length){const {data:sourceRows,error:sourceError}=await supabase.from('community_posts').select('id,author_id,body,paper,created_at,is_featured,repost_of,repost_note,moderation_status').in('id',sourceIds);if(sourceError)throw sourceError;const sourceList=(sourceRows||[]) as Post[];setSourcePosts(prev=>({...prev,...Object.fromEntries(sourceList.map(p=>[p.id,p]))}));const sourceAuthors=[...new Set(sourceList.map(p=>p.author_id))];if(sourceAuthors.length){const {data:sourceProfiles,error:sourceProfileError}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',sourceAuthors);if(sourceProfileError)throw sourceProfileError;setProfiles(prev=>({...prev,...Object.fromEntries((sourceProfiles||[]).map((p:any)=>[p.user_id,p as Profile]))}));}}
    const ids=rows.map(p=>p.id);
    if(!ids.length) {setProfiles({});setLikes(new Set());setCommentCounts({});}
    if(ids.length){
    const [profileRows,likeRows,bookmarkRows,commentRows]=await Promise.all([
      supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',[...new Set(rows.map(p=>p.author_id))]),
      supabase.from('community_post_likes').select('post_id,user_id').in('post_id',ids),
      supabase.from('community_comments').select('post_id,author_id').in('post_id',ids)
    ]);
    if(profileRows.error) throw profileRows.error;
    if(likeRows.error) throw likeRows.error;
    if(commentRows.error) throw commentRows.error;
    const pmap:Record<string,Profile>={}; (profileRows.data||[]).forEach((p:any)=>pmap[p.user_id]=p as Profile);
    const commentAuthorIds=[...new Set((commentRows.data||[]).map((x:any)=>x.author_id).filter((id:string)=>!pmap[id]))];
    if(commentAuthorIds.length){const {data:commentProfiles,error:commentProfileError}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',commentAuthorIds);if(commentProfileError)throw commentProfileError;(commentProfiles||[]).forEach((p:any)=>pmap[p.user_id]=p as Profile);}
    setProfiles(prev=>({...prev,...pmap}));
    setLikes(new Set((likeRows.data||[]).filter((x:any)=>x.user_id===userId).map((x:any)=>x.post_id)));
    setBookmarks(new Set((bookmarkRows.data||[]).map((x:any)=>x.post_id)));
    const counts:Record<string,number>={}; (commentRows.data||[]).forEach((x:any)=>counts[x.post_id]=(counts[x.post_id]||0)+1); setCommentCounts(counts);
    }
    const {data:followRows,error:followError}=await supabase.from('community_follows').select('followed_id').eq('follower_id',userId);
    if(followError) throw followError;
    setFollowedPeople(new Set((followRows||[]).map((x:any)=>x.followed_id)));
    const {data:noteRows,error:noteError}=await supabase.from('community_shared_notes').select('id,owner_id,source_note_id,snapshot,shared_at').is('revoked_at',null).order('shared_at',{ascending:false}).limit(30);
    if(noteError) throw noteError;
    const followedIds=new Set((followRows||[]).map((x:any)=>x.followed_id));
    const shared=((noteRows||[]) as SharedNote[]).filter(n=>n.owner_id===userId||followedIds.has(n.owner_id));
    setSharedNotes(shared); setSharedNoteIds(new Set(shared.filter(n=>n.owner_id===userId).map(n=>n.source_note_id)));
    const noteOwnerIds=[...new Set(shared.map(n=>n.owner_id))];
    if(noteOwnerIds.length){
      const {data:noteProfiles,error:noteProfileError}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',noteOwnerIds);
      if(noteProfileError) throw noteProfileError;
      setProfiles(prev=>({...prev,...Object.fromEntries((noteProfiles||[]).map((p:any)=>[p.user_id,p as Profile]))}));
    }
  },[userId]);

  const loadMorePosts=async()=>{
    if(!supabase||loadingMore||!feedHasMore)return;
    setLoadingMore(true);
    try{
      const {data,error}=await supabase.from('community_posts').select('id,author_id,body,paper,created_at,is_featured,repost_of,repost_note,moderation_status').order('is_featured',{ascending:false}).order('created_at',{ascending:false}).range(posts.length,posts.length+39);
      if(error)throw error;
      const rows=(data||[]) as Post[];setPosts(prev=>[...prev,...rows]);if(rows.length<40)setFeedHasMore(false);
      const sourceIds=[...new Set(rows.map(p=>p.repost_of).filter((id):id is string=>!!id))];
      if(sourceIds.length){const {data:sourceRows,error:sourceError}=await supabase.from('community_posts').select('id,author_id,body,paper,created_at,is_featured,repost_of,repost_note,moderation_status').in('id',sourceIds);if(sourceError)throw sourceError;const sourceList=(sourceRows||[]) as Post[];setSourcePosts(prev=>({...prev,...Object.fromEntries(sourceList.map(p=>[p.id,p]))}));const sourceAuthors=[...new Set(sourceList.map(p=>p.author_id))];if(sourceAuthors.length){const {data:sourceProfiles,error:sourceProfileError}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',sourceAuthors);if(sourceProfileError)throw sourceProfileError;setProfiles(prev=>({...prev,...Object.fromEntries((sourceProfiles||[]).map((p:any)=>[p.user_id,p as Profile]))}));}}
      const ids=rows.map(p=>p.id);
      if(ids.length){
        const [pr,lr,br,cr]=await Promise.all([
          supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',[...new Set(rows.map(p=>p.author_id))]),
          supabase.from('community_post_likes').select('post_id,user_id').in('post_id',ids),
          supabase.from('community_post_bookmarks').select('post_id,user_id').eq('user_id',userId).in('post_id',ids),
          supabase.from('community_comments').select('post_id,author_id').in('post_id',ids)
        ]);
        if(pr.error)throw pr.error;if(lr.error)throw lr.error;if(br.error)throw br.error;if(cr.error)throw cr.error;
        setProfiles(prev=>({...prev,...Object.fromEntries((pr.data||[]).map((p:any)=>[p.user_id,p as Profile]))}));
        setLikes(prev=>new Set([...prev,...(lr.data||[]).filter((x:any)=>x.user_id===userId).map((x:any)=>x.post_id)]));
        setBookmarks(prev=>new Set([...prev,...(br.data||[]).map((x:any)=>x.post_id)]));
        setCommentCounts(prev=>{const next={...prev};(cr.data||[]).forEach((x:any)=>next[x.post_id]=(next[x.post_id]||0)+1);return next;});
        const commentAuthors=[...new Set((cr.data||[]).map((x:any)=>x.author_id))];
        if(commentAuthors.length){const {data:cp,error:ce}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',commentAuthors);if(ce)throw ce;setProfiles(prev=>({...prev,...Object.fromEntries((cp||[]).map((p:any)=>[p.user_id,p as Profile]))}));}
      }
    }catch(e){setError(errorText(e));}finally{setLoadingMore(false);}
  };
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
    try { await Promise.all([loadProfile(),loadFeed(),loadConversations()]); const [n,b]=await Promise.all([supabase.from('community_notifications').select('id,kind,actor_id,created_at,read_at,payload').eq('user_id',userId).order('created_at',{ascending:false}).limit(20),supabase.from('community_blocks').select('blocked_id').eq('blocker_id',userId)]); if(n.error)throw n.error;if(b.error)throw b.error;setNotifications((n.data||[]) as any[]);const {data:followRequestRows,error:followRequestError}=await supabase.from('community_follow_requests').select('id,requester_id,target_id,created_at,status').or('requester_id.eq.'+userId+',target_id.eq.'+userId).eq('status','pending').order('created_at',{ascending:false});if(followRequestError)throw followRequestError;const requests=(followRequestRows||[]) as any[];setFollowRequests(requests.filter(row=>row.target_id===userId));setSentFollowRequests(new Set(requests.filter(row=>row.requester_id===userId).map(row=>row.target_id)));setSentFollowRequestRows(requests.filter(row=>row.requester_id===userId));const requestAuthors=[...new Set(requests.filter(row=>row.target_id===userId).map(row=>row.requester_id))];if(requestAuthors.length){const {data:requestProfiles,error:requestProfilesError}=await supabase.from('community_profiles').select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests').in('user_id',requestAuthors);if(requestProfilesError)throw requestProfilesError;setProfiles(prev=>({...prev,...Object.fromEntries((requestProfiles||[]).map((p:any)=>[p.user_id,p as Profile]))}));}const blockedIds=(b.data||[]).map((x:any)=>x.blocked_id);if(blockedIds.length){const {data:bp,error:be}=await supabase.from('community_profiles').select('user_id,username,display_name').in('user_id',blockedIds);if(be)throw be;const pmap:Record<string,any>={};(bp||[]).forEach((x:any)=>pmap[x.user_id]=x);setBlockedMembers(blockedIds.map((id:string)=>({blocked_id:id,username:pmap[id]?.username,display_name:pmap[id]?.display_name})));}else setBlockedMembers([]); }
    catch(e){setError(errorText(e));}
    finally{setLoading(false);}
  },[loadProfile,loadFeed,loadConversations]);
  useEffect(()=>{void loadAll();},[loadAll]);

  // Realtime bildirimleri yenileme gerektirmeden mevcut bildirim listesine eklenir.
  useEffect(()=>{
    if(!supabase||!userId)return;
    let active=true;
    const channel=supabase.channel('community-notifications-'+userId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'community_notifications',filter:'user_id=eq.'+userId},payload=>{
        if(!active)return;
        const incoming=payload.new as {id:string;kind:string;actor_id:string|null;created_at:string;read_at:string|null;payload?:Record<string,unknown>};
        if(!incoming?.id)return;
        setNotifications(prev=>[incoming,...prev.filter(item=>item.id!==incoming.id)].slice(0,50));
        setNotice('Yeni bir kamara bildirimin var.');
      })
      .subscribe(status=>{
        if(status==='SUBSCRIBED'){
          void supabase!.from('community_notifications')
            .select('id,kind,actor_id,created_at,read_at')
            .eq('user_id',userId)
            .order('created_at',{ascending:false})
            .limit(50)
            .then(({data,error})=>{
              if(!active)return;
              if(error){setError(errorText(error));return;}
              setNotifications((data||[]) as any[]);
            });
        }
      });
    return()=>{active=false;void supabase!.removeChannel(channel);};
  },[userId]);

  // Hesap fotoğrafını kamara profilinde de sakla; diğer kullanıcılar bu URL'yi
  // yalnızca kamara profilini görüntüleme izni varsa okuyabilir.
  useEffect(()=>{
    if(!supabase||!profile)return;
    const nextAvatar=avatarUrl||null;
    if((profile.avatar_url||null)===nextAvatar)return;
    let cancelled=false;
    void supabase.from('community_profiles').update({avatar_url:nextAvatar}).eq('user_id',userId).then(({error})=>{
      if(cancelled)return;
      if(error){setError(errorText(error));return;}
      setProfile(current=>current?{...current,avatar_url:nextAvatar}:current);
      setProfiles(current=>({...current,[userId]:current[userId]?{...current[userId],avatar_url:nextAvatar}:current[userId]}));
    });
    return()=>{cancelled=true;};
  },[avatarUrl,profile?.user_id,profile?.avatar_url,userId]);

  useEffect(()=>{if(pendingPaper)setSection('people');},[pendingPaper?.id]);

  const toggleResearchInterest=(label:string)=>setSelectedResearchInterests(prev=>prev.includes(label)?prev.filter(item=>item!==label):[...prev,label].slice(0,60));
  const renderInterestNode=(node:TaxonomyNode,depth=0):React.ReactNode=><div key={node.id} className={depth?'ml-3 border-l border-[var(--ln)] pl-2':''}>
    <button type="button" aria-pressed={selectedResearchInterests.includes(node.label)} onClick={()=>toggleResearchInterest(node.label)} className={'my-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition '+(selectedResearchInterests.includes(node.label)?'bg-sky-100 font-semibold text-sky-900 dark:bg-sky-950/50 dark:text-sky-100':'text-[var(--ink)] hover:bg-[var(--bg)]')}>
      <span className={'flex h-4 w-4 shrink-0 items-center justify-center rounded border '+(selectedResearchInterests.includes(node.label)?'border-sky-700 bg-sky-700 text-white':'border-[var(--ln)]')}>{selectedResearchInterests.includes(node.label)?<Check size={11}/>:null}</span><span className="min-w-0 flex-1">{node.label}</span>
    </button>
    {!!node.children?.length&&<details className="mb-1 ml-4"><summary className="cursor-pointer px-2 py-1 text-[10px] font-medium text-[var(--mu)]">Alt alanları göster ({node.children.length})</summary><div className="mt-1 space-y-0.5">{node.children.map(child=>renderInterestNode(child,depth+1))}</div></details>}
  </div>;

  const saveProfile=async()=>{
    if(!supabase)return;
    const username=profileDraft.username.trim().replace(/^@/,'');
    if(!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)){setError('Kullanıcı adı 3–30 karakter olmalı; harf, sayı, nokta, alt çizgi ve tire kullanılabilir.');return;}
    setBusy(true);setError('');setNotice('');
    try{
      const payload={user_id:userId,username,display_name:profileDraft.display_name.trim().slice(0,80),avatar_url:avatarUrl||null,bio:profileDraft.bio.trim().slice(0,500),affiliation:profileDraft.affiliation.trim().slice(0,120),research_interests:selectedResearchInterests.slice(0,60),profile_visibility:profileVisibility,searchable:true};
      const {error}=await supabase.from('community_profiles').upsert(payload,{onConflict:'user_id'});if(error)throw error;
      await loadProfile();setNotice('Kamara profilin kaydedildi.');
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  };

  const publishPost=async()=>{
    if(!supabase)return;
    if(!postDraft.trim()){setError('Gönderi metni boş olamaz.');return;}
    setBusy(true);setError('');
    try{const {error}=await supabase.from('community_posts').insert({author_id:userId,body:postDraft.trim()});if(error)throw error;setPostDraft('');await loadFeed();setNotice('Gönderin kamara akışında yayımlandı.');}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };

  const submitRepost=async(postId:string)=>{
    if(!supabase)return;const note=(repostDrafts[postId]||'').trim();if(!note){setError('Yeniden paylaşımına kısa bir not ekle.');return;}
    setBusy(true);setError('');
    try{const {error}=await supabase.rpc('community_repost_post',{p_source_post_id:postId,p_note:note});if(error)throw error;setRepostDrafts(prev=>({...prev,[postId]:''}));setRepostOpen(prev=>{const next=new Set(prev);next.delete(postId);return next;});await loadFeed();setNotice('Notunla birlikte yeniden paylaşıldı.');}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const toggleLike=async(postId:string)=>{
    if(!supabase)return;
    const active=likes.has(postId);setLikes(prev=>{const n=new Set(prev);active?n.delete(postId):n.add(postId);return n;});
    const result=active?await supabase.from('community_post_likes').delete().eq('post_id',postId).eq('user_id',userId):await supabase.from('community_post_likes').insert({post_id:postId,user_id:userId});
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
    try{const {data,error}=await supabase.rpc('community_search_members_v2',{p_query:peopleQuery.trim(),p_limit:25});if(error)throw error;const found=(data||[]) as Profile[];setPeople(found);setProfiles(prev=>({...prev,...Object.fromEntries(found.map(person=>[person.user_id,person]))}));}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const unblockMember=async(otherId:string)=>{
    if(!supabase||!window.confirm('Bu üyenin engelini kaldırmak istiyor musun?'))return;
    const {error}=await supabase.from('community_blocks').delete().eq('blocker_id',userId).eq('blocked_id',otherId);
    if(error)setError(errorText(error));else{setBlockedMembers(prev=>prev.filter(x=>x.blocked_id!==otherId));setNotice('Üyenin engeli kaldırıldı.');}
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
    if(!supabase||otherId===userId)return;
    if(sentFollowRequests.has(otherId)){setNotice('Takip isteğin hâlâ yanıt bekliyor.');return;}
    const active=followedPeople.has(otherId);
    setError('');
    if(active){const {error}=await supabase.rpc('community_toggle_follow',{p_followed_id:otherId,p_follow:false});if(error){setError(errorText(error));return;}setFollowedPeople(prev=>{const next=new Set(prev);next.delete(otherId);return next;});setNotice('Takipten çıktın.');return;}
    const {data,error}=await supabase.rpc('community_request_follow',{p_target_id:otherId});
    if(error){setError(error.message.includes('follow_target_unavailable')?'Bu hesap şu anda takip edilebilir durumda değil.':error.message.includes('follow_blocked')?'Engelleme nedeniyle bu hesabı takip edemezsin.':errorText(error));return;}
    if(data==='followed'){setFollowedPeople(prev=>new Set(prev).add(otherId));setNotice('Hesap takip ediliyor.');}
    else{setSentFollowRequests(prev=>new Set(prev).add(otherId));setNotice('Takip isteğin gönderildi.');}
  };
  const respondFollowRequest=async(requestId:string,requesterId:string,accept:boolean)=>{
    if(!supabase)return;setBusy(true);setError('');
    try{const {error}=await supabase.rpc('community_respond_follow_request',{p_request_id:requestId,p_accept:accept});if(error)throw error;setFollowRequests(prev=>prev.filter(item=>item.id!==requestId));setNotice(accept?'Takip isteği kabul edildi.':'Takip isteği silindi.');if(accept)await loadFeed();}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const markNotificationsRead=async()=>{
    if(!supabase)return;const unread=notifications.filter(n=>!n.read_at).map(n=>n.id);if(!unread.length)return;
    const {error}=await supabase.rpc('community_mark_notifications_read',{p_notification_ids:unread});
    if(error)setError(errorText(error));else setNotifications(prev=>prev.map(n=>({...n,read_at:n.read_at||new Date().toISOString()})));
  };
  const startConversation=async(otherId:string)=>{
    if(!supabase)return;setBusy(true);setError('');setNotice('');
    try{
      const {data:canMessage,error:checkError}=await supabase.rpc('community_can_message',{p_other:otherId});
      if(checkError)throw checkError;
      if(!canMessage){
        const firstMessage=window.prompt('Bu üyeyle henüz bağlantınız yok. Mesaj isteği olarak göndermek istediğin ilk mesajı yaz:');
        if(!firstMessage?.trim())return;
        const {error:requestError}=await supabase.rpc('community_create_message_request',{p_recipient:otherId,p_body:firstMessage.trim(),p_attachment_type:null,p_attachment:null});
        if(requestError)throw requestError;
        setNotice('Mesaj isteğin gönderildi. Karşı taraf kabul ederse sohbet açılacak.');
        return;
      }
      const {data,error}=await supabase.rpc('community_create_approved_conversation',{p_user_ids:[otherId],p_kind:'direct',p_title:null});
      if(error)throw error;
      await loadConversations();setActiveConversation(data as string);setSection('messages');
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const startGroupConversation=async()=>{
    if(!supabase||selectedPeople.size<2)return;setBusy(true);setError('');
    try{const {data,error}=await supabase.rpc('community_create_approved_conversation',{p_user_ids:[...selectedPeople],p_kind:'group',p_title:groupTitle.trim()||'Akademik grup'});if(error)throw error;setSelectedPeople(new Set());setGroupTitle('');await loadConversations();setActiveConversation(data as string);setSection('messages');}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const openConversation=async(id:string)=>{
    if(!supabase)return;setActiveConversation(id);setSection('messages');
    const {data,error}=await supabase.from('community_messages').select('id,conversation_id,sender_id,body,attachment_type,attachment,created_at').eq('conversation_id',id).order('created_at',{ascending:true}).limit(100);
    if(error){setError(errorText(error));return;}setMessages((data||[]) as Message[]);
    await supabase.rpc('community_mark_conversation_read',{p_conversation_id:id});
  };
  const sendPendingPaper=async()=>{
    if(!supabase||!pendingPaper||selectedPeople.size<1)return;
    setBusy(true);setError('');
    try{
      const recipients=[...selectedPeople];
      const {data:conversationId,error:createError}=await supabase.rpc('community_create_approved_conversation',{p_user_ids:recipients,p_kind:recipients.length===1?'direct':'group',p_title:recipients.length===1?null:(groupTitle.trim()||'Makale paylaşımı')});
      if(createError)throw createError;
      const attachment={id:pendingPaper.id,title:pendingPaper.title,url:pendingPaper.link,authors:pendingPaper.authors,journal:pendingPaper.journal,year:pendingPaper.year,field:pendingPaper.sub||pendingPaper.field,abstract:pendingPaper.abs};
      const {error:sendError}=await supabase.rpc('community_send_message',{p_conversation_id:conversationId,p_body:'Seninle bir akademik makale paylaştı.',p_attachment_type:'paper',p_attachment:attachment});
      if(sendError)throw sendError;
      setSelectedPeople(new Set());setGroupTitle('');onPendingPaperHandled?.();await loadConversations();await openConversation(conversationId as string);setNotice('Makale seçtiğin üyelere özel mesajla gönderildi.');
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const sendMessage=async()=>{
    if(!supabase||!activeConversation||!messageDraft.trim())return;setBusy(true);setError('');
    try{const sharedNote=sharedNotes.find(n=>n.id===selectedSharedNoteId);const extraType=extraAttachmentType==='none'?null:extraAttachmentType;const extraPayload=extraType?{title:attachmentTitle.trim().slice(0,180),url:extraType==='research_summary'?null:safeHttpUrl(attachmentUrl),content:attachmentContent.trim().slice(0,12000)}:null;if(extraType&&extraType!=='research_summary'&&!extraPayload?.url)throw new Error('Geçerli bir https:// veya http:// bağlantısı gir.');if(extraType==='research_summary'&&!extraPayload?.content)throw new Error('Araştırma özeti boş olamaz.');const {error}=await supabase.rpc('community_send_message',{p_conversation_id:activeConversation,p_body:messageDraft.trim()||(sharedNote?'Seninle bir araştırma notu paylaştı.':extraType?'Seninle bir akademik içerik paylaştı.':''),p_attachment_type:sharedNote?'note_snapshot':extraType,p_attachment:sharedNote?{shared_note_id:sharedNote.id,snapshot:sharedNote.snapshot}:extraPayload});if(error)throw error;setMessageDraft('');setSelectedSharedNoteId('');setExtraAttachmentType('none');setAttachmentTitle('');setAttachmentUrl('');setAttachmentContent('');await openConversation(activeConversation);await loadConversations();}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  const openMemberProfile=async(otherId:string)=>{
    if(otherId===userId){setSection('profile');return;}
    if(!supabase)return;
    setViewedProfileId(otherId);
    setViewedProfile(null);
    setViewedProfilePrivate(false);
    setProfileLoading(true);
    try{
      const {data,error}=await supabase.from('community_profiles')
        .select('user_id,username,display_name,avatar_url,bio,affiliation,research_interests,profile_visibility,searchable')
        .eq('user_id',otherId).maybeSingle();
      if(error)throw error;
      if(!data||data.profile_visibility!=='community'||data.searchable===false){
        setViewedProfilePrivate(true);
        return;
      }
      const visible=data as Profile;
      setViewedProfile(visible);
      setProfiles(prev=>({...prev,[otherId]:visible}));
    }catch(e){
      setViewedProfilePrivate(true);
      setError(errorText(e));
    }finally{
      setProfileLoading(false);
    }
  };

  const closeViewedProfile=()=>{
    setViewedProfileId(null);
    setViewedProfile(null);
    setViewedProfilePrivate(false);
  };

  const reportPost=async(postId:string)=>{
    if(!supabase)return;const reason=window.prompt('Bu gönderiyi neden bildirmek istiyorsun?');if(!reason?.trim())return;
    const {error}=await supabase.from('community_reports').insert({reporter_id:userId,target_type:'post',target_id:postId,reason:reason.trim().slice(0,1000)});
    if(error)setError(errorText(error));else setNotice('Bildirimin yönetime iletildi.');
  };
  const tabs=[{id:'feed',label:'Akış',icon:MessageSquare},{id:'requests',label:'İstekler',icon:UserPlus},{id:'messages',label:'Mesajlar',icon:MessageCircle},{id:'people',label:'Üyeler',icon:Users},{id:'notes',label:'Notlar',icon:Bookmark},{id:'profile',label:'Profilim',icon:UserPlus}] as const;

  if(loading)return <div className="flex flex-1 items-center justify-center gap-2 text-[var(--mu)]"><Loader2 className="animate-spin" size={18}/> Kamara yükleniyor…</div>;
  return <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg)] px-3 py-4 sm:px-6 sm:py-6">
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-sky-700 dark:text-sky-300">Abstract · Kapalı kamara</div><h1 className="mt-1 font-serif text-2xl font-bold text-[var(--ink)] sm:text-3xl">Bilimsel kamara</h1><p className="mt-1 text-sm text-[var(--mu)]">Akademik paylaşım ve araştırmacılar arası iletişim alanı.</p></div><div className="flex items-center gap-3">{onReturnToAdmin&&<button className="rounded-xl border border-[var(--ln)] px-3 py-2 text-xs font-semibold text-[var(--mu)]" onClick={onReturnToAdmin}>Yönetim paneli</button>}<button className="relative rounded-xl border border-[var(--ln)] p-2 text-[var(--mu)]" onClick={()=>{setShowNotifications(v=>!v);void markNotificationsRead();}} aria-label="Bildirimler"><Bell size={18}/>{notifications.some(n=>!n.read_at)&&<span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500"/>}</button><div className="text-xs text-[var(--mu)]">{profile?'@'+profile.username:'Profilini tamamla'}</div></div></header>
      {showNotifications&&<section className={card+' p-3'}><div className="mb-2 text-sm font-bold text-[var(--ink)]">Bildirimler</div>{notifications.map(n=><div key={n.id} className="border-t border-[var(--ln)] py-2 text-xs text-[var(--mu)]">{n.kind==='like'?'Gönderin beğenildi.':n.kind==='comment'?'Gönderine yorum yapıldı.':n.kind==='follow'?'Yeni bir takipçin var.':n.kind==='follow_request'?'Yeni bir takip isteğin var.':n.kind==='follow_request_accepted'?'Takip isteğin kabul edildi.':n.kind==='message'?'Yeni mesajın var.':n.kind==='post_removed'?'Bir gönderin kaldırıldı. Gerekçe: '+String(n.payload?.reason||'Kamara kuralları'):'Yeni kamara bildirimi.'} · {new Date(n.created_at).toLocaleString('tr-TR')}</div>)}{!notifications.length&&<p className="text-xs text-[var(--mu)]">Henüz bildirimin yok.</p>}</section>}
      <nav aria-label="Kamara bölümleri" className="grid grid-cols-3 gap-1 rounded-2xl border border-[var(--ln)] bg-[var(--sf)] p-1 sm:grid-cols-6">{tabs.map(t=><button key={t.id} onClick={()=>{setSection(t.id);setError('');}} className={`relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold leading-tight transition-colors sm:min-h-10 sm:flex-row sm:gap-2 sm:px-2 sm:text-xs ${section===t.id?'bg-sky-700 text-white shadow-sm':'text-[var(--mu)] hover:bg-[var(--bg)]'}`}><t.icon size={15}/><span className="max-w-full truncate">{t.label}</span>{t.id==='requests'&&followRequests.length>0&&<span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500"/>}</button>)}</nav>
      {error&&<div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
      {notice&&<div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{notice}</div>}

      {section==='notes'&&<section className={card+' space-y-3 p-4'}>
        <div><h2 className="font-bold text-[var(--ink)]">Bilim Defterim notları</h2><p className="mt-1 text-xs leading-5 text-[var(--mu)]">Notların varsayılan olarak özeldir. Yalnızca aşağıdaki paylaş düğmesine basıp onay verdiğin notlar kamara üyelerine açılır. Paylaşım, notun o andaki içeriğinin ayrı bir kopyasını oluşturur.</p></div>
        {notes.map(note=><div key={note.id} className="rounded-xl border border-[var(--ln)] p-3"><div className="text-xs font-semibold text-[var(--ink)]">{note.paperTitle||'Başlıksız makale notu'} · {note.type==='quote'?'Alıntı':note.type==='question'?'Soru':'Not'}</div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[var(--mu)]">{note.content}</p><button className={button+' mt-3'} onClick={async()=>{
          if(!supabase)return;
          if(!window.confirm('Bu notun mevcut içeriğinin bir kopyası kamara üyeleriyle paylaşılacak. Özel notunun kendisi değişmeyecek. Devam edilsin mi?'))return;
          setBusy(true);setError('');
          try{
            const {data,error}=await supabase.rpc('community_share_note_snapshot',{p_source_note_id:note.id,p_snapshot:{type:note.type,content:note.content,paperTitle:note.paperTitle||'',paperJournal:note.paperJournal||'',paperField:note.paperField||'',paperLink:note.paperLink||'',paperAuthors:note.paperAuthors||'',createdAt:note.createdAt}});
            if(error)throw error;
            setSharedNoteIds(prev=>new Set(prev).add(note.id));setNotice('Notun kopyası kamarala paylaşıldı.');await loadFeed();
          }catch(e){setError(errorText(e));}finally{setBusy(false);}
        }} disabled={busy||sharedNoteIds.has(note.id)}><Check size={15}/>{sharedNoteIds.has(note.id)?'Bu oturumda paylaşıldı':'Açık onayla paylaş'}</button></div>)}
        {!notes.length&&<p className="rounded-xl bg-[var(--bg)] p-4 text-xs text-[var(--mu)]">Bilim Defterim’de henüz notun bulunmuyor.</p>}
      </section>}

      {section==='profile'&&<section className={`${card} space-y-3 p-4 sm:p-5`}><div><h2 className="font-bold text-[var(--ink)]">Kamara profilin</h2><p className="mt-1 text-xs text-[var(--mu)]">E-posta adresin burada gösterilmez. Profil yalnızca kamara üyelerine açıktır.</p></div>
        <label className="block text-xs font-semibold text-[var(--mu)]">Kullanıcı adı<input className={field+' mt-1'} value={profileDraft.username} onChange={e=>setProfileDraft(p=>({...p,username:e.target.value}))} placeholder="ornek.kullanici"/></label>
        <label className="block text-xs font-semibold text-[var(--mu)]">Görünen ad<input className={field+' mt-1'} value={profileDraft.display_name} onChange={e=>setProfileDraft(p=>({...p,display_name:e.target.value}))} maxLength={80}/></label>
        <label className="block text-xs font-semibold text-[var(--mu)]">Kurum / üniversite<input className={field+' mt-1'} value={profileDraft.affiliation} onChange={e=>setProfileDraft(p=>({...p,affiliation:e.target.value}))} maxLength={120}/></label>
        <label className="block text-xs font-semibold text-[var(--mu)]">Kısa biyografi<textarea className={field+' mt-1'} rows={3} value={profileDraft.bio} onChange={e=>setProfileDraft(p=>({...p,bio:e.target.value}))} maxLength={500}/></label>
        <div className="space-y-2"><div className="text-xs font-semibold text-[var(--mu)]">İlgilendiğim alanlar</div><p className="text-[10px] leading-4 text-[var(--mu)]">Ana sayfadaki filtrelerle aynı bilimsel alan ağacından seçim yapabilirsin. Birden fazla alan seçebilirsin.</p><div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-[var(--ln)] bg-[var(--bg)] p-2">{TAXONOMY.map(node=><div key={node.id} className="rounded-lg border border-[var(--ln)] p-2"><div className="font-semibold">{renderInterestNode(node)}</div></div>)}</div><div className="text-[10px] text-[var(--mu)]">{selectedResearchInterests.length} alan seçildi</div></div>
        <div className="space-y-2"><div className="text-xs font-semibold text-[var(--mu)]">Hesap görünürlüğü</div><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={profileVisibility==='community'} onClick={()=>setProfileVisibility('community')} className={'rounded-xl border px-3 py-3 text-left transition '+(profileVisibility==='community'?'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100':'border-[var(--ln)] bg-[var(--bg)] text-[var(--mu)]')}><span className="block text-sm font-bold">Herkese açık</span><span className="mt-1 block text-[10px] leading-4">Kamara üyeleri profilini bulabilir ve takip edebilir.</span></button><button type="button" aria-pressed={profileVisibility==='private'} onClick={()=>setProfileVisibility('private')} className={'rounded-xl border px-3 py-3 text-left transition '+(profileVisibility==='private'?'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100':'border-[var(--ln)] bg-[var(--bg)] text-[var(--mu)]')}><span className="block text-sm font-bold">Gizli hesap</span><span className="mt-1 block text-[10px] leading-4">Takip etmek isteyenler önce istek gönderir.</span></button></div></div>
        <button className={button} disabled={busy} onClick={()=>void saveProfile()}>{busy?<Loader2 className="animate-spin" size={16}/>:<Check size={16}/>} Profili kaydet</button>
        <div className="border-t border-[var(--ln)] pt-3"><h3 className="text-sm font-bold text-[var(--ink)]">Engellediğim üyeler</h3>{blockedMembers.map(member=><div key={member.blocked_id} className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-[var(--bg)] p-2.5"><span className="truncate text-xs text-[var(--mu)]">{member.display_name||member.username||shortId(member.blocked_id)}</span><button className="text-xs font-semibold text-sky-700 dark:text-sky-300" onClick={()=>void unblockMember(member.blocked_id)}>Engeli kaldır</button></div>)}{!blockedMembers.length&&<p className="mt-1 text-xs text-[var(--mu)]">Engellediğin üye yok.</p>}</div>
      </section>}

      {section==='feed'&&<div className="space-y-3">
        <section className={card+' overflow-hidden'}><button type="button" onClick={()=>setComposerOpen(v=>!v)} aria-expanded={composerOpen} className="flex w-full items-center gap-3 p-3.5 text-left"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"><Plus size={20}/></div><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-[var(--ink)]">Kamarala ne paylaşmak istersin?</div><div className="mt-0.5 text-[11px] text-[var(--mu)]">Kısa bir not, fikir veya makale paylaş.</div></div><span className="rounded-full bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white">Yaz</span></button>{composerOpen&&<div className="border-t border-[var(--ln)] p-3.5"><textarea autoFocus className={field+' resize-y'} rows={3} maxLength={5000} value={postDraft} onChange={e=>setPostDraft(e.target.value)} placeholder="Akademik bir fikir, araştırma notu veya bilimsel tartışma başlat…"/><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-[var(--mu)]">{postDraft.length}/5000</span><div className="flex gap-2"><button type="button" className="rounded-xl px-3 py-2 text-xs font-semibold text-[var(--mu)]" onClick={()=>{setComposerOpen(false);setPostDraft('');}}>Vazgeç</button><button className={button} disabled={busy||!postDraft.trim()} onClick={()=>void publishPost()}><Plus size={16}/> Paylaş</button></div></div></div>}</section>
        {posts.map(post=><article key={post.id} className={card+' p-4'}>
          {post.is_featured&&<div className="mb-2 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"><Pin size={12}/> Öne çıkan</div>}
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><button type="button" onClick={()=>void openMemberProfile(post.author_id)} className="flex min-w-0 items-center gap-2.5 text-left"><span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">{profiles[post.author_id]?.avatar_url?<img src={profiles[post.author_id].avatar_url!} alt="" className="absolute inset-0 h-full w-full object-cover"/>:(profiles[post.author_id]?.display_name||profiles[post.author_id]?.username||'A').slice(0,1).toLocaleUpperCase('tr-TR')}</span><span className="min-w-0"><span className="block truncate text-sm font-bold text-[var(--ink)]">{profiles[post.author_id]?.display_name||profiles[post.author_id]?.username||'Kamara üyesi'}</span><span className="block text-xs text-[var(--mu)]">@{profiles[post.author_id]?.username||shortId(post.author_id)} · {new Date(post.created_at).toLocaleString('tr-TR')}</span></span></button></div><button title="Gönderiyi bildir" onClick={()=>void reportPost(post.id)} className="rounded-lg p-2 text-[var(--mu)] hover:bg-[var(--bg)]"><ShieldAlert size={16}/></button></div>
          {post.repost_note&&<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--ink)]">{post.repost_note}</p>}
          {post.repost_of&&<div className="mt-3 rounded-xl border border-[var(--ln)] bg-[var(--bg)] p-3"><div className="mb-1 text-[10px] font-semibold text-[var(--mu)]">Yeniden paylaşılan gönderi · {profiles[sourcePosts[post.repost_of]?.author_id]?.display_name||profiles[sourcePosts[post.repost_of]?.author_id]?.username||'Kaynak gönderi'}</div>{sourcePosts[post.repost_of]?.body?.trim()&&<p className="whitespace-pre-wrap text-xs leading-5 text-[var(--ink)]">{sourcePosts[post.repost_of].body}</p>}{Boolean(sourcePosts[post.repost_of]?.paper?.title)&&<p className="mt-2 text-xs font-semibold text-sky-700">{String(sourcePosts[post.repost_of].paper?.title)}</p>}{safeHttpUrl(sourcePosts[post.repost_of]?.paper?.url)&&<a className="mt-2 inline-block text-[11px] font-semibold text-sky-700 underline dark:text-sky-300" href={safeHttpUrl(sourcePosts[post.repost_of]?.paper?.url)!} target="_blank" rel="noopener noreferrer">Makale kaynağını aç</a>}</div>}
          {post.body?.trim()&&!post.repost_of&&<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--ink)]">{post.body}</p>}
          {post.paper&&<div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/20"><div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Paylaşılan makale</div><div className="mt-1 font-semibold text-[var(--ink)]">{String(post.paper.title||'Akademik makale')}</div>{safeHttpUrl(post.paper.url)&&<a className="mt-2 inline-block text-xs font-semibold text-sky-700 underline dark:text-sky-300" href={safeHttpUrl(post.paper.url)!} target="_blank" rel="noopener noreferrer">Makale kaynağını aç</a>}</div>}
          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[var(--ln)] pt-2"><button onClick={()=>void toggleLike(post.id)} className={`inline-flex items-center gap-1.5 text-xs ${likes.has(post.id)?'font-bold text-rose-600':'text-[var(--mu)]'}`}><Heart size={16} fill={likes.has(post.id)?'currentColor':'none'}/> Beğen</button><button onClick={()=>{const next=new Set(openComments);if(next.has(post.id))next.delete(post.id);else{next.add(post.id);void loadComments(post.id);}setOpenComments(next);}} className="inline-flex items-center gap-1.5 text-xs text-[var(--mu)]"><MessageCircle size={16}/> Yorum ({commentCounts[post.id]||0})</button><button onClick={()=>setRepostOpen(prev=>{const next=new Set(prev);next.has(post.id)?next.delete(post.id):next.add(post.id);return next;})} className="inline-flex items-center gap-1.5 text-xs text-[var(--mu)]"><Repeat2 size={16}/> Yeniden paylaş</button></div>
          {repostOpen.has(post.id)&&<div className="mt-3 rounded-xl border border-[var(--ln)] bg-[var(--bg)] p-3"><textarea className={field} rows={2} maxLength={1000} value={repostDrafts[post.id]||''} onChange={e=>setRepostDrafts(prev=>({...prev,[post.id]:e.target.value}))} placeholder="Bu makale veya gönderi hakkında ne düşünüyorsun?"/><div className="mt-2 flex justify-end gap-2"><button className="rounded-lg px-3 py-2 text-xs text-[var(--mu)]" onClick={()=>setRepostOpen(prev=>{const next=new Set(prev);next.delete(post.id);return next;})}>Vazgeç</button><button className={button} disabled={busy||!(repostDrafts[post.id]||'').trim()} onClick={()=>void submitRepost(post.id)}><Repeat2 size={14}/> Notla paylaş</button></div></div>}
          {openComments.has(post.id)&&<div className="mt-3 space-y-2">{(comments[post.id]||[]).map(c=><div key={c.id} className={`rounded-lg bg-[var(--bg)] p-2.5 ${c.parent_id?'ml-5 border-l-2 border-sky-300':''}`}><div className="text-[10px] font-semibold text-[var(--mu)]">{profiles[c.author_id]?.display_name||shortId(c.author_id)} · {new Date(c.created_at).toLocaleString('tr-TR')}</div><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--ink)]">{c.body}</p><button className="mt-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300" onClick={()=>setReplyTargets(prev=>({...prev,[post.id]:c.id}))}>Yanıtla</button></div>)}{replyTargets[post.id]&&<div className="text-[10px] text-[var(--mu)]">Yoruma yanıt yazılıyor <button onClick={()=>setReplyTargets(prev=>({...prev,[post.id]:''}))} className="ml-2 text-rose-600">Vazgeç</button></div>}<div className="flex gap-2"><input className={field} value={commentDrafts[post.id]||''} onChange={e=>setCommentDrafts(p=>({...p,[post.id]:e.target.value}))} placeholder={replyTargets[post.id]?'Yanıt yaz…':'Yorum yaz…'} maxLength={2000}/><button className={button} onClick={()=>void addComment(post.id)} aria-label="Yorumu gönder"><Send size={15}/></button></div></div>}
        </article>)}
        {!posts.length&&<div className={card+' p-8 text-center text-sm text-[var(--mu)]'}>Henüz gönderi yok. İlk akademik paylaşımı sen başlatabilirsin.</div>}
        {feedHasMore&&<div className="flex justify-center py-2"><button className="rounded-xl border border-[var(--ln)] px-5 py-2.5 text-xs font-semibold text-[var(--mu)]" disabled={loadingMore} onClick={()=>void loadMorePosts()}>{loadingMore?'Yükleniyor…':'Daha eski gönderileri yükle'}</button></div>}
        {sharedNotes.map(item=><article key={item.id} className={card+' p-4'}><div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Bilim Defterim · Açıkça paylaşılmış not</div><div className="mt-1 text-sm font-semibold text-[var(--ink)]">{profiles[item.owner_id]?.display_name||profiles[item.owner_id]?.username||'Kamara üyesi'} · {String(item.snapshot.paperTitle||'Makale notu')}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{String(item.snapshot.content||'')}</p><div className="mt-2 flex items-center justify-between text-[10px] text-[var(--mu)]"><time>{new Date(item.shared_at).toLocaleString('tr-TR')}</time>{item.owner_id===userId&&<button className="font-semibold text-rose-600" onClick={async()=>{if(!supabase||!window.confirm('Bu not paylaşımını geri almak istiyor musun? Özel notun korunur.'))return;const {error}=await supabase.rpc('community_revoke_shared_note',{p_shared_note_id:item.id});if(error)setError(errorText(error));else{setSharedNotes(prev=>prev.filter(n=>n.id!==item.id));setSharedNoteIds(prev=>{const next=new Set(prev);next.delete(item.source_note_id);return next;});setNotice('Not paylaşımı geri alındı. Özel notun değişmedi.');}}}>Paylaşımı geri al</button>}</div></article>)}
      </div>}

      {section==='people'&&<section className={card+' p-4'}>{pendingPaper&&<div className="mb-3 rounded-xl border border-sky-300 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/30"><div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Makale gönderimi</div><div className="mt-1 text-sm font-semibold text-[var(--ink)]">{pendingPaper.title}</div><p className="mt-1 text-xs text-[var(--mu)]">Bir veya daha fazla alıcı seç. Tek alıcıya birebir, birden fazla alıcıya grup mesajı gönderilir.</p><button className={button+' mt-2'} disabled={busy||selectedPeople.size<1} onClick={()=>void sendPendingPaper()}><Send size={15}/> Seçilenlere makaleyi gönder ({selectedPeople.size})</button></div>}<h2 className="font-bold text-[var(--ink)]">Kamara üyeleri</h2><p className="mt-1 text-xs text-[var(--mu)]">Açık profiller ayrıntılarıyla, gizli profiller yalnızca temel hesap bilgileriyle listelenir.</p><div className="mt-3 flex gap-2"><input className={field} value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder="Ad, kullanıcı adı veya kurum…"/><button className={button} disabled={busy} onClick={()=>void searchPeople()}><Search size={16}/> Ara</button></div><div className="mt-3 space-y-2">{selectedPeople.size>=2&&<div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--bg)] p-3"><input className={field+' max-w-[220px]'} value={groupTitle} onChange={e=>setGroupTitle(e.target.value)} placeholder="Grup adı (isteğe bağlı)"/><button className={button} disabled={busy} onClick={()=>void startGroupConversation()}>Seçilenlerle grup kur ({selectedPeople.size})</button></div>}{people.filter(p=>p.user_id!==userId).map(p=><div key={p.user_id} className="flex flex-col gap-3 rounded-xl border border-[var(--ln)] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><button type="button" onClick={()=>void openMemberProfile(p.user_id)} className="block truncate text-left text-sm font-bold text-[var(--ink)] hover:text-sky-700">{p.display_name||p.username}</button><div className="text-xs text-[var(--mu)]">@{p.username} {p.affiliation?'· '+p.affiliation:''}</div><div className="mt-1 text-xs text-[var(--mu)]">{(p.research_interests||[]).join(' · ')}</div></div><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-1 text-[10px] text-[var(--mu)]"><input type="checkbox" checked={selectedPeople.has(p.user_id)} onChange={e=>setSelectedPeople(prev=>{const n=new Set(prev);e.target.checked?n.add(p.user_id):n.delete(p.user_id);return n;})}/> Grup</label><button className="rounded-xl border border-[var(--ln)] px-3 py-2 text-xs font-semibold text-[var(--mu)]" onClick={()=>void toggleFollow(p.user_id)} disabled={sentFollowRequests.has(p.user_id)}>{p.profile_visibility==='private'?(sentFollowRequests.has(p.user_id)?'İstek gönderildi':'İstek gönder'):(followedPeople.has(p.user_id)?'Takibi bırak':'Takip et')}</button><button className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-600" onClick={()=>void blockMember(p.user_id)}>Engelle</button><button className={button} disabled={busy} onClick={()=>void startConversation(p.user_id)}><MessageCircle size={15}/> Mesaj</button></div></div>)}</div></section>}

      {section==='requests'&&<section className={card+' overflow-hidden'}><header className="border-b border-[var(--ln)] p-4"><h2 className="text-base font-bold text-[var(--ink)]">Takip istekleri</h2><p className="mt-1 text-xs leading-5 text-[var(--mu)]">Gizli profillerden gelen istekleri burada kabul edebilir veya reddedebilirsin.</p></header><div className="space-y-2 p-3">{followRequests.map(request=>{const person=profiles[request.requester_id];return <div key={request.id} className="flex items-center gap-3 rounded-xl border border-[var(--ln)] bg-[var(--bg)] p-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sm font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">{person?.avatar_url?<img src={person.avatar_url} alt="" className="h-full w-full object-cover"/>:(person?.display_name||person?.username||'A').slice(0,1).toLocaleUpperCase('tr-TR')}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[var(--ink)]">{person?.display_name||person?.username||'Bir kamara üyesi'}</div><div className="text-[10px] text-[var(--mu)]">{person?.username?'@'+person.username+' · ':''}{new Date(request.created_at).toLocaleDateString('tr-TR')}</div></div><div className="flex shrink-0 gap-1.5"><button type="button" disabled={busy} onClick={()=>void respondFollowRequest(request.id,request.requester_id,false)} className="rounded-lg border border-[var(--ln)] px-2.5 py-2 text-[11px] font-semibold text-[var(--mu)]">Sil</button><button type="button" disabled={busy} onClick={()=>void respondFollowRequest(request.id,request.requester_id,true)} className="rounded-lg bg-sky-700 px-2.5 py-2 text-[11px] font-semibold text-white">Kabul et</button></div></div>})}{!followRequests.length&&<div className="px-4 py-10 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--mu)]"><UserPlus size={20}/></div><p className="text-sm font-semibold text-[var(--ink)]">Bekleyen takip isteğin yok</p><p className="mt-1 text-xs text-[var(--mu)]">Yeni istekler burada görünecek.</p></div>}{sentFollowRequestRows.length>0&&<div className="mt-4 border-t border-[var(--ln)] pt-4"><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--mu)]">Gönderdiğin istekler</h3><div className="space-y-2">{sentFollowRequestRows.map(request=><div key={request.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg)] px-3 py-2.5"><span className="truncate text-xs font-medium text-[var(--ink)]">{profiles[request.target_id]?.display_name||profiles[request.target_id]?.username||'Gizli hesap'}</span><span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Yanıt bekleniyor</span></div>)}</div></div>}</div></section>}
      {section==='messages'&&<CommunityMessages userId={userId} initialConversationId={activeConversation} onInitialConversationHandled={()=>setActiveConversation(null)} onOpenProfile={openMemberProfile}/>}
      {viewedProfileId&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onClick={closeViewedProfile}>
        <section role="dialog" aria-modal="true" aria-label="Üye profili" onClick={e=>e.stopPropagation()} className="relative w-full max-w-md rounded-3xl border border-[var(--ln)] bg-[var(--sf)] p-5 shadow-2xl sm:p-6">
          <button type="button" onClick={closeViewedProfile} className="absolute right-3 top-3 rounded-full p-2 text-[var(--mu)] hover:bg-[var(--bg)]" aria-label="Profili kapat"><X size={18}/></button>
          {profileLoading?<div className="flex items-center justify-center gap-2 py-14 text-sm text-[var(--mu)]"><Loader2 className="animate-spin" size={18}/> Profil yükleniyor…</div>
          :viewedProfilePrivate||!viewedProfile?<div className="py-10 text-center"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800"><UserPlus size={24}/></div><h2 className="text-lg font-bold text-[var(--ink)]">Profil gizli</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[var(--mu)]">Bu üye profilini kamarala paylaşmayı seçmemiş.</p></div>
          :<div className="pt-5 text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--ln)] bg-sky-100 text-2xl font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
              {(viewedProfile.display_name||viewedProfile.username||'A').charAt(0).toLocaleUpperCase('tr-TR')}
              {viewedProfile.avatar_url&&<img src={viewedProfile.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover" onError={e=>e.currentTarget.remove()}/>}
            </div>
            <h2 className="mt-3 text-xl font-bold text-[var(--ink)]">{viewedProfile.display_name||viewedProfile.username}</h2>
            <div className="mt-1 text-xs text-[var(--mu)]">@{viewedProfile.username}</div>
            {viewedProfile.affiliation&&<p className="mt-3 text-sm font-medium text-[var(--ink)]">{viewedProfile.affiliation}</p>}
            {viewedProfile.bio&&<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--mu)]">{viewedProfile.bio}</p>}
            {!!viewedProfile.research_interests?.length&&<div className="mt-4"><div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--mu)]">Araştırma alanları</div><div className="flex flex-wrap justify-center gap-2">{viewedProfile.research_interests.map(item=><span key={item} className="rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">{item}</span>)}</div></div>}
            <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--ln)] px-3 text-xs font-semibold text-[var(--ink)]" onClick={()=>void toggleFollow(viewedProfile.user_id)}>{followedPeople.has(viewedProfile.user_id)?'Takibi bırak':sentFollowRequests.has(viewedProfile.user_id)?'İstek gönderildi':'Takip et'}</button><button type="button" className={button} onClick={()=>{const id=viewedProfile.user_id;closeViewedProfile();void startConversation(id);}}><MessageCircle size={15}/> Mesaj gönder</button></div>
          </div>}
        </section>
      </div>}
      <p className="px-1 text-[10px] leading-5 text-[var(--mu)]">Kamara gönderileri ve mesajları yalnızca yetkili üyeler içindir. Özel notların otomatik paylaşılmaz; paylaşım için ayrıca açık onay gereklidir.</p>
    </div>
  </div>;
};
