import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Loader2, Pin, PinOff, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AdminPost = { id:string; author_id:string; body:string; paper:Record<string,unknown>|null; created_at:string; is_featured:boolean; };
type Author = { user_id:string; username:string; display_name:string; };

const card='rounded-2xl border border-[var(--ln)] bg-[var(--sf)]';
const action='inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--ln)] px-3 text-xs font-semibold text-[var(--mu)] disabled:opacity-50';

export const CommunityPostModeration:React.FC=()=>{
  const [posts,setPosts]=useState<AdminPost[]>([]);
  const [authors,setAuthors]=useState<Record<string,Author>>({});
  const [query,setQuery]=useState('');
  const [reasonByPost,setReasonByPost]=useState<Record<string,string>>({});
  const [busyId,setBusyId]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [expanded,setExpanded]=useState(false);
  const [fromDate,setFromDate]=useState('');
  const [toDate,setToDate]=useState('');

  const load=useCallback(async()=>{
    if(!supabase)return;
    setError('');
    let request=supabase.from('community_posts')
      .select('id,author_id,body,paper,created_at,is_featured')
      .eq('moderation_status','visible')
      .order('created_at',{ascending:false});
    if(fromDate)request=request.gte('created_at',new Date(`${fromDate}T00:00:00`).toISOString());
    if(toDate){const endExclusive=new Date(`${toDate}T00:00:00`);endExclusive.setDate(endExclusive.getDate()+1);request=request.lt('created_at',endExclusive.toISOString());}
    const {data,error}=await request.limit(300);
    if(error){setError(error.message);return;}
    const rows=(data||[]) as AdminPost[];
    setPosts(rows);
    const ids=[...new Set(rows.map(row=>row.author_id))];
    if(ids.length){
      const {data:profileRows,error:profileError}=await supabase.from('community_profiles')
        .select('user_id,username,display_name').in('user_id',ids);
      if(profileError){setError(profileError.message);return;}
      setAuthors(Object.fromEntries((profileRows||[]).map((p:any)=>[p.user_id,p as Author])));
    }else setAuthors({});
  },[fromDate,toDate]);

  useEffect(()=>{if(expanded)void load();},[load,expanded]);

  const feature=async(post:AdminPost)=>{
    if(!supabase)return;
    setBusyId(post.id);setError('');setNotice('');
    try{
      const {error}=await supabase.rpc('community_admin_set_post_featured',{p_post_id:post.id,p_featured:!post.is_featured});
      if(error)throw error;
      setNotice(post.is_featured?'Gönderi öne çıkanlardan kaldırıldı.':'Gönderi akışta öne çıkarıldı.');
      await load();
    }catch(e){setError(e instanceof Error?e.message:'İşlem tamamlanamadı.');}
    finally{setBusyId('');}
  };

  const remove=async(post:AdminPost)=>{
    if(!supabase)return;
    const reason=(reasonByPost[post.id]||'').trim();
    if(reason.length<5){setError('Gönderiyi kaldırmak için en az 5 karakterlik bir gerekçe yaz.');return;}
    setBusyId(post.id);setError('');setNotice('');
    try{
      const {error}=await supabase.rpc('community_admin_remove_post',{p_post_id:post.id,p_reason:reason});
      if(error)throw error;
      setNotice('Gönderi kaldırıldı. Sahibine gerekçeyi içeren bildirim gönderildi.');
      setReasonByPost(prev=>({...prev,[post.id]:''}));
      await load();
    }catch(e){setError(e instanceof Error?e.message:'İşlem tamamlanamadı.');}
    finally{setBusyId('');}
  };

  const filtered=posts.filter(post=>{
    const author=authors[post.author_id];
    const haystack=[post.body,String(post.paper?.title||''),author?.username||'',author?.display_name||''].join(' ').toLocaleLowerCase('tr-TR');
    return haystack.includes(query.trim().toLocaleLowerCase('tr-TR'));
  });

  return <section className={card+' overflow-hidden shadow-sm'}>
    <button type="button" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)} className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6">
      <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="text-lg font-bold text-[var(--ink)]">Akış gönderilerini yönet</h2><span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">{posts.length} yüklü</span></div><p className="mt-1 text-xs leading-5 text-[var(--mu)]">Gönderileri öne çıkar, tarih aralığına göre incele veya gerekçeyle kaldır.</p></div>
      <ChevronDown size={20} className={`shrink-0 text-[var(--mu)] transition-transform ${expanded?'rotate-180':''}`}/>
    </button>
    {expanded&&<div className="space-y-3 border-t border-[var(--ln)] p-5 sm:p-6">
    <p className="text-xs leading-5 text-[var(--mu)]">Kaldırma gerekçesi gönderi sahibine bildirilir ve yönetim kaydına eklenir.</p>
    {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}
    {notice&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</div>}
    <div className="rounded-2xl border border-[var(--ln)] bg-[var(--bg)] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><CalendarDays size={15}/> Tarih aralığı</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-[11px] font-semibold text-[var(--mu)]">Başlangıç tarihi<input type="date" value={fromDate} max={toDate||undefined} onChange={e=>setFromDate(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--ln)] bg-[var(--sf)] px-3 text-xs text-[var(--ink)]"/></label>
        <label className="text-[11px] font-semibold text-[var(--mu)]">Bitiş tarihi<input type="date" value={toDate} min={fromDate||undefined} onChange={e=>setToDate(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--ln)] bg-[var(--sf)] px-3 text-xs text-[var(--ink)]"/></label>
      </div>
      {(fromDate||toDate)&&<button type="button" onClick={()=>{setFromDate('');setToDate('');}} className="mt-2 text-[11px] font-semibold text-sky-700 dark:text-sky-300">Tarih filtresini temizle</button>}
    </div>
    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mu)]"/><input value={query} onChange={e=>setQuery(e.target.value)} className="h-10 w-full rounded-xl border border-[var(--ln)] bg-[var(--bg)] pl-9 pr-3 text-sm text-[var(--ink)]" placeholder="Gönderi veya kullanıcı ara…"/></div>
    <div className="space-y-2">
      {filtered.map(post=><article key={post.id} className="rounded-xl border border-[var(--ln)] p-3">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-xs font-bold text-[var(--ink)]">{authors[post.author_id]?.display_name||authors[post.author_id]?.username||'Topluluk üyesi'} <span className="font-normal text-[var(--mu)]">@{authors[post.author_id]?.username||post.author_id.slice(0,8)}</span></div><div className="mt-1 text-[10px] text-[var(--mu)]">{new Date(post.created_at).toLocaleString('tr-TR')}</div></div>{post.is_featured&&<span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-800">Öne çıkan</span>}</div>
        {post.body.trim()&&<p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[var(--ink)]">{post.body}</p>}
        {Boolean(post.paper?.title)&&<p className="mt-2 text-xs font-semibold text-sky-700">{String(post.paper.title)}</p>}
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!!busyId} onClick={()=>void feature(post)} className={action}>{busyId===post.id?<Loader2 size={14} className="animate-spin"/>:post.is_featured?<PinOff size={14}/>:<Pin size={14}/>}{post.is_featured?'Öne çıkarmayı kaldır':'Öne çıkar'}</button></div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={reasonByPost[post.id]||''} onChange={e=>setReasonByPost(prev=>({...prev,[post.id]:e.target.value.slice(0,500)}))} maxLength={500} placeholder="Kaldırma gerekçesi (zorunlu)" className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--ln)] bg-[var(--bg)] px-3 text-xs text-[var(--ink)]"/><button type="button" disabled={!!busyId} onClick={()=>void remove(post)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-300 px-3 text-xs font-semibold text-rose-700 disabled:opacity-50"><Trash2 size={14}/> Gönderiyi kaldır</button></div>
      </article>)}
      {!filtered.length&&<p className="rounded-xl bg-[var(--bg)] p-4 text-center text-xs text-[var(--mu)]">Gönderi bulunamadı.</p>}
    </div>
    <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-[var(--mu)]">En fazla 300 gönderi listelenir. Tarih filtresini daraltarak eski paylaşımları bulabilirsin.</span><button type="button" onClick={()=>void load()} className={action}><Check size={14}/> Yenile</button></div>
    </div>}
  </section>;
};
