import React, { useState, useMemo, useEffect } from 'react';
import { Paper, LighthouseWatchState, ReadingHistoryItem } from '../types';
import { SeyirHaritasi } from './SeyirHaritasi';
import { 
  Compass, 
  Activity, 
  Waves, 
  Flame, 
  Award, 
  BarChart3, 
  Sparkles, 
  Zap, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  Radio,
  ChevronDown
} from 'lucide-react';

interface SeyirPanosuProps {
  readingHistory: ReadingHistoryItem[];
  likedPapers: Paper[];
  lighthouseWatch: LighthouseWatchState;
  onOpenDetails: (paper: Paper) => void;
  langDict: Record<string, string>;
  onSearchKeyword: (keyword: string) => void;
  isDark: boolean;
}

export const SeyirPanosu: React.FC<SeyirPanosuProps> = ({
  readingHistory,
  likedPapers,
  lighthouseWatch,
  onOpenDetails,
  langDict,
  onSearchKeyword,
  isDark
}) => {
  // Alt görünüm: okuma özeti veya makale bağlantı haritası.
  const [activeView, setActiveView] = useState<'sensor' | 'chart'>('sensor');

  useEffect(() => {
    const openMapForTour = () => setActiveView('chart');
    const openSummaryForTour = () => setActiveView('sensor');
    window.addEventListener('abstract:seyir-tour-map', openMapForTour);
    window.addEventListener('abstract:seyir-tour-summary', openSummaryForTour);
    return () => {
      window.removeEventListener('abstract:seyir-tour-map', openMapForTour);
      window.removeEventListener('abstract:seyir-tour-summary', openSummaryForTour);
    };
  }, []);

  // Combined pool of papers (from likes + history)
  const allKnownPapers = useMemo(() => {
    const map = new Map<string, Paper>();
    likedPapers.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [likedPapers]);

  // Total read count & beam distance
  const totalReads = Math.max(lighthouseWatch.totalReadCount, readingHistory.length);
  const beamPower = Math.min(100, Math.max(5, lighthouseWatch.beamPower || 20));
  const beamDistanceMiles = (beamPower * 0.24).toFixed(1);

  // İlgi alanı dağılımındaki temsili derinlik hesabı.
  const calculatedDepthMeters = Math.max(80, totalReads * 140 + likedPapers.length * 90);

  // Discipline Depth Distribution
  const disciplineStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const defaultFields = ['Deniz Bilimleri', 'Su Ürünleri', 'Biyoloji', 'Ekoloji', 'Ziraat', 'Hukuk'];

    // Seed defaults for rich display
    defaultFields.forEach(f => { counts[f] = 0; });

    // Aggregate from reading history
    readingHistory.forEach(h => {
      const f = h.field || 'Diğer';
      counts[f] = (counts[f] || 0) + 1;
    });

    // Aggregate from liked papers
    likedPapers.forEach(p => {
      const f = p.field || 'Diğer';
      counts[f] = (counts[f] || 0) + 2;
    });

    // If zero across the board, seed gentle starter samples so user sees how the sensor functions
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    if (sum === 0) {
      counts['Deniz Bilimleri'] = 7;
      counts['Su Ürünleri'] = 5;
      counts['Biyoloji'] = 4;
      counts['Ekoloji'] = 3;
      counts['Ziraat'] = 2;
    }

    const totalScore = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / totalScore) * 100),
        depthMeters: Math.round((count / totalScore) * calculatedDepthMeters)
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [readingHistory, likedPapers, calculatedDepthMeters]);

  // Okuma temposu yalnızca gerçek, zaman damgalı okuma geçmişinden hesaplanır.
  const [activityRange, setActivityRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('7d');
  const activityData = useMemo(() => {
    const now = new Date();
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = startOfDay(now);
    const history = readingHistory.filter(item => Number.isFinite(item.timestamp) && item.timestamp > 0);
    const buckets: { key: string; label: string; count: number; isToday?: boolean }[] = [];
    if (activityRange === '7d' || activityRange === '30d') {
      const days = activityRange === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(start);
        date.setDate(start.getDate() - i);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        buckets.push({ key, label: activityRange === '7d'
          ? date.toLocaleDateString('tr-TR', { weekday: 'short' })
          : String(date.getDate()), count: 0, isToday: i === 0 });
      }
      const counts = new Map(buckets.map(bucket => [bucket.key, bucket]));
      history.forEach(item => {
        const date = new Date(item.timestamp);
        const bucket = counts.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
        if (bucket) bucket.count++;
      });
    } else {
      const earliestTimestamp = history.length
        ? Math.min(...history.map(item => item.timestamp))
        : now.getTime();
      const earliest = new Date(earliestTimestamp);
      const monthCount = activityRange === '90d' ? 3 : activityRange === '1y' ? 12 : Math.max(1,
        (now.getFullYear() - earliest.getFullYear()) * 12 + now.getMonth() - earliest.getMonth() + 1);
      const count = Math.min(monthCount, 120);
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        buckets.push({ key, label: date.toLocaleDateString('tr-TR', { month: 'short' }), count: 0, isToday: i === 0 });
      }
      const counts = new Map(buckets.map(bucket => [bucket.key, bucket]));
      history.forEach(item => {
        const date = new Date(item.timestamp);
        const bucket = counts.get(`${date.getFullYear()}-${date.getMonth()}`);
        if (bucket) bucket.count++;
      });
    }
    const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
    return { buckets, total, average: buckets.length ? total / buckets.length : 0 };
  }, [readingHistory, activityRange]);

  // Aggregate Key Concepts (Kavram Bulutu / Sonar Yankıları)
  const topKeywords = useMemo(() => {
    const kwMap: Record<string, number> = {};
    likedPapers.forEach(p => {
      (p.kw || []).forEach(k => {
        kwMap[k] = (kwMap[k] || 0) + 1;
      });
    });
    const fallbackKws = ['Biyo-lüminesans', 'Termohalin', 'Benthos', 'Pelajik', 'Mercan Resifleri', 'Kıta Sahanlığı', 'Mikroalg', 'DNA Barkodlama'];
    fallbackKws.forEach((k, i) => {
      if (!kwMap[k]) kwMap[k] = Math.max(1, 6 - i);
    });

    return Object.entries(kwMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [likedPapers]);

  // Total citations of explored papers
  const totalCitesExplored = useMemo(() => {
    const unique = new Map(likedPapers.map(p => [p.id, p]));
    return Array.from(unique.values()).reduce((acc, p) => {
      const citations = Number(p.cites);
      return acc + (Number.isFinite(citations) && citations > 0 ? citations : 0);
    }, 0);
  }, [likedPapers]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col select-none overflow-hidden bg-[#eef7fb] dark:bg-[#020e18] text-[#0a2540] dark:text-[#e0f4ff]">
      {/* Top Segmented Navigation: Sensör Panosu vs Seyir Haritası */}
      <div className="p-3 bg-white/90 dark:bg-[#071828]/90 backdrop-blur-md border-b border-[#c5dfe9]/60 dark:border-[#0d2f45] shrink-0">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          {/* Segmented Control matching reference aesthetics */}
          <div className="flex-1 flex p-1 bg-[#dff0f7] dark:bg-[#061522] rounded-2xl border border-[#c5dfe9]/70 dark:border-[#0d2f45]">
            <button
              type="button"
              onClick={() => setActiveView('sensor')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                activeView === 'sensor'
                  ? 'bg-white dark:bg-[#0b2438] text-[#0284c7] dark:text-[#38bdf8] shadow-xs'
                  : 'text-[#527993] dark:text-[#7bb0cc] hover:text-[#0284c7]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Okuma Özeti</span>
            </button>
            <button
              type="button"
              data-tour="seyir-map-tab"
              onClick={() => setActiveView('chart')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                activeView === 'chart'
                  ? 'bg-white dark:bg-[#0b2438] text-[#0284c7] dark:text-[#38bdf8] shadow-xs'
                  : 'text-[#527993] dark:text-[#7bb0cc] hover:text-[#0284c7]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Makale Haritası</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      {activeView === 'chart' ? (
        /* Makale bağlantı haritası */
        <div className="flex-1 min-h-0 h-full flex flex-col">
          <div data-tour="seyir-map-content" className="flex-1 min-h-0 h-full flex flex-col">
          <SeyirHaritasi
            papers={allKnownPapers}
            isDark={isDark}
            onOpenDetails={onOpenDetails}
            langDict={langDict}
          />
          </div>
        </div>
      ) : (
        /* Okuma özeti */
        <div className="flex-1 min-h-0 h-full overflow-y-auto overscroll-contain px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-10">
          {/* 1. Telemetry Top Status Header */}
          <div data-tour="seyir-overview" className="relative rounded-[26px] p-4.5 bg-gradient-to-br from-[#0284c7] via-[#0284c7] to-[#0ea5e9] text-white shadow-lg shadow-sky-950/15 overflow-hidden">
            {/* Atmospheric sonar ping concentric circles */}
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border border-white/15 pointer-events-none" />
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border border-white/20 pointer-events-none" />
            <div className="absolute -right-8 -top-8 w-20 h-20 rounded-full border border-white/25 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono tracking-wider uppercase text-sky-100 font-bold">
                    OKUMA DURUMUN
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold text-white">
                  <Flame className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>{lighthouseWatch.streakDays} Gün Seri</span>
                </div>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Okuma Yolculuğun
              </h2>
              <p className="text-xs text-sky-100/90 mt-1 max-w-[34ch]">
                Okuma alışkanlıklarını ve ilgi alanlarını burada görebilirsin.
              </p>

              {/* Kısa okuma özeti */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-center">
                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="block text-[10px] text-sky-100 uppercase tracking-tight">Okunan</span>
                  <b className="text-base sm:text-lg font-black">{totalReads}</b>
                </div>
                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="block text-[10px] text-sky-100 uppercase tracking-tight">Kaydedilen</span>
                  <b className="text-base sm:text-lg font-black">{likedPapers.length}</b>
                </div>
                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="block text-[10px] text-sky-100 uppercase tracking-tight">Günlük Seri</span>
                  <b className="text-base sm:text-lg font-black">{lighthouseWatch.streakDays} gün</b>
                </div>
              </div>
            </div>
          </div>


          {/* 3. Disiplin Derinleşme Göstergeleri (Discipline Depth Breakdown) */}
          <section className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-[24px] p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#0a2540] dark:text-[#f0f9ff]">
                    İlgi Alanların
                  </h3>
                  <p className="text-[11px] text-[#527993] dark:text-[#7bb0cc]">
                    Hangi akademik alanlarda ne kadar odaklandığınız
                  </p>
                </div>
              </div>
            </div>

            {/* List of disciplines with depth sonar bars */}
            <div className="space-y-3 pt-1">
              {disciplineStats.map(stat => (
                <div key={stat.name} className="group">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-[#0a2540] dark:text-[#f0f9ff] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] dark:bg-[#38bdf8]" />
                      <span>{stat.name}</span>
                    </span>
                    <span className="text-[#527993] dark:text-[#7bb0cc] font-mono text-[11px]">
                      {stat.depthMeters} m <span className="opacity-60">·</span> %{stat.percent}
                    </span>
                  </div>

                  <div className="relative w-full h-2 rounded-full bg-sky-100 dark:bg-sky-950/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0284c7] to-[#06b6d4] transition-all duration-500"
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Gerçek okuma geçmişinden dönemsel okuma temposu */}
          <section data-tour="seyir-activity" className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-[24px] p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#0a2540] dark:text-[#f0f9ff]">Okuma Tempon</h3>
                  <p className="text-[11px] text-[#527993] dark:text-[#7bb0cc]">Gerçek okuma kayıtlarına göre</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-[#0284c7] dark:text-[#38bdf8] font-mono">{activityData.total} makale</span>
                <p className="text-[10px] text-[#527993] dark:text-[#7bb0cc]">{activityData.average.toFixed(1)} / dönem</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {([
                ['7d', '7 gün'], ['30d', '30 gün'], ['90d', '3 ay'], ['1y', '1 yıl'], ['all', 'Tümü']
              ] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setActivityRange(value)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${activityRange === value
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-sky-50 dark:bg-sky-950/50 text-[#527993] dark:text-[#7bb0cc] border-sky-200 dark:border-sky-900'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className={`flex items-end gap-1.5 pt-3 pb-1 border-t border-sky-100 dark:border-sky-950 ${activityRange === '7d' ? 'justify-between' : 'overflow-x-auto'}`}>
              {activityData.buckets.map(bucket => {
                const maxVal = Math.max(...activityData.buckets.map(item => item.count), 1);
                const barHeight = bucket.count ? Math.max(5, Math.round((bucket.count / maxVal) * 58)) : 2;
                return (
                  <div key={bucket.key} title={`${bucket.label}: ${bucket.count} makale`}
                    className={`flex flex-col items-center gap-1.5 ${activityRange === '7d' ? 'flex-1 min-w-0' : 'min-w-[18px] flex-1'}`}>
                    <span className="text-[9px] font-bold text-[#527993] dark:text-[#7bb0cc] font-mono">{bucket.count || ''}</span>
                    <div className="w-full max-w-[28px] h-[64px] bg-sky-100/70 dark:bg-sky-950/60 rounded-lg flex items-end p-0.5 overflow-hidden">
                      <div className={`w-full rounded-md transition-all duration-500 ${bucket.isToday
                        ? 'bg-gradient-to-t from-[#0284c7] to-[#06b6d4]'
                        : 'bg-[#0284c7]/50 dark:bg-[#38bdf8]/40'}`}
                        style={{ height: `${barHeight}px` }} />
                    </div>
                    <span className="text-[9px] font-medium text-[#527993] dark:text-[#7bb0cc]">{bucket.label}</span>
                  </div>
                );
              })}
            </div>
            {!activityData.total && (
              <p className="text-center text-xs text-[#527993] dark:text-[#7bb0cc] py-3">Bu dönemde henüz okuma kaydı bulunmuyor.</p>
            )}
          </section>

          {/* 5. Akademik Atıf & Etki Barometresi (Citation Barometer) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-[22px] p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-[#527993] dark:text-[#7bb0cc] uppercase tracking-wider block">
                Kaydettiğin Makalelerin Atıfları
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#0284c7] dark:text-[#38bdf8] font-mono mt-0.5">
                {totalCitesExplored.toLocaleString()}
              </div>
              <p className="text-[10px] text-[#527993] dark:text-[#7bb0cc] mt-1">
                Kaydettiğin makalelerin OpenAlex verilerine göre toplam atıf sayısı
              </p>
            </div>

            <div className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-[22px] p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-[#527993] dark:text-[#7bb0cc] uppercase tracking-wider block">
                Öne Çıkan Makalen
              </span>
              <button type="button" disabled={!likedPapers[0]} onClick={() => likedPapers[0] && onOpenDetails(likedPapers[0])}
                className="w-full text-left text-base sm:text-lg font-black text-[#0a2540] dark:text-[#f0f9ff] truncate mt-0.5 hover:text-[#0284c7] dark:hover:text-[#38bdf8] disabled:cursor-default">
                {likedPapers[0]?.title || 'Henüz öne çıkan makale yok'}
              </button>
              <p className="text-[10px] text-[#527993] dark:text-[#7bb0cc] mt-1">
                {likedPapers[0] ? 'Makaleyi açmak için başlığına dokun.' : 'Bir makaleyi kaydettiğinde burada görünecek.'}
              </p>
            </div>
          </div>

          {/* 6. Sonar Yankıları & Anahtar Kavramlar (Keywords) */}
          <section data-tour="seyir-topics" className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-[24px] p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#0a2540] dark:text-[#f0f9ff]">
                  Öne Çıkan Konular
                </h3>
                <p className="text-[11px] text-[#527993] dark:text-[#7bb0cc]">
                  İlgini çeken konulara dokunarak ilgili makaleleri keşfet.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {topKeywords.map(([kw, score]) => (
                <button
                  type="button"
                  onClick={() => onSearchKeyword(kw)}
                  key={kw}
                  className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-900/50 text-xs font-medium text-[#0a2540] dark:text-[#e0f4ff] flex items-center gap-1.5"
                >
                  <span>{kw}</span>
                  <span className="text-[10px] text-[#0284c7] dark:text-[#38bdf8] font-bold font-mono">
                    +{score}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Okuma Derinliği: yakında açılacak pasif alan */}
          <section data-tour="seyir-depth" aria-disabled="true" className="relative isolate overflow-hidden rounded-[26px] border border-slate-300/70 dark:border-slate-700/70 bg-slate-200 dark:bg-slate-900 p-4 shadow-sm">
            <div className="pointer-events-none select-none grayscale blur-[2px] opacity-55" aria-hidden="true">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    <Waves className="h-3.5 w-3.5" /> Kişisel keşif alanı
                  </div>
                  <h3 className="font-serif text-xl font-black tracking-tight text-slate-700 dark:text-slate-200">Okuma Derinliği</h3>
                  <p className="mt-1 max-w-[34ch] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Okuma yolculuğunu okyanusun derinliklerinde görselleştireceğin keşif alanı.
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-400/40 bg-slate-400/20 text-slate-500">
                  <Compass className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 h-28 rounded-2xl border border-slate-400/40 bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800">
                <div className="flex h-full items-center justify-center">
                  <Waves className="h-10 w-10 text-slate-500 dark:text-slate-400" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="h-10 rounded-xl bg-slate-400/40 dark:bg-slate-700/70" />
                <div className="h-10 rounded-xl bg-slate-400/40 dark:bg-slate-700/70" />
              </div>
            </div>
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-200/35 dark:bg-slate-950/35">
              <span className="rounded-full border border-slate-500/30 bg-slate-500/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur-md dark:text-slate-200">
                Yakında
              </span>
              <p className="mt-2 text-[10px] font-semibold tracking-wide text-slate-600/80 dark:text-slate-300/80">
                Bu alan üzerinde çalışıyoruz
              </p>
            </div>
          </section>

          {/* Sitenin En Altındaki Telif & İmza Yazısı */}
          <footer className="pt-2 pb-6 text-center border-t border-[#c5dfe9]/40 dark:border-[#0d2f45]/40">
            <p className="text-xs text-[#527993] dark:text-[#7bb0cc] font-medium tracking-wide">
              © 2026 Binali. Her hakkı saklıdır.
            </p>
          </footer>
        </div>
      )}
    </div>
  );
};
