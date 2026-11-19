import React, { useEffect, useState } from 'react';
import { SettingsState } from '../types';
import { Smartphone, Monitor, Trash2, LogIn, LogOut, UserRound, Cloud, Save, Camera, X, NotebookPen, ChevronRight, Cookie, ShieldCheck } from 'lucide-react';

interface SettingsScreenProps {
  settings: SettingsState;
  onUpdateSettings: (updater: (prev: SettingsState) => SettingsState) => void;
  onClearLikes: () => void;
  onReplayTour?: () => void;
  langDict: Record<string, string>;
  /** Giriş özelliği (Supabase) yapılandırılmış mı? Değilse Hesap bölümü gizlenir. */
  authEnabled?: boolean;
  userEmail?: string | null;
  userDisplayName?: string | null;
  userAvatarUrl?: string | null;
  onUploadAvatar?: (file: File) => Promise<{ ok: boolean; message?: string }>;
  onRemoveAvatar?: () => Promise<{ ok: boolean; message?: string }>;
  onUpdateDisplayName?: (name: string) => Promise<{ ok: boolean; message?: string }>;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  onOpenNotes?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onClearLikes,
  onReplayTour,
  langDict,
  authEnabled = false,
  userEmail = null,
  userDisplayName = null,
  userAvatarUrl = null,
  onUploadAvatar,
  onRemoveAvatar,
  onUpdateDisplayName,
  syncStatus = 'idle',
  onOpenAuth,
  onSignOut,
  onOpenNotes
}) => {
  const [displayName, setDisplayName] = useState(userDisplayName || '');
  const [nameBusy, setNameBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  useEffect(() => { setDisplayName(userDisplayName || ''); }, [userDisplayName]);
  const saveDisplayName = async () => {
    if (!onUpdateDisplayName || nameBusy) return;
    setNameBusy(true);
    setNameMessage(null);
    try {
      const result = await onUpdateDisplayName(displayName);
      setNameMessage(result.message || (result.ok ? 'Kaydedildi.' : 'Kaydedilemedi.'));
    } finally { setNameBusy(false); }
  };

  const syncText =
    syncStatus === 'syncing' ? (langDict.sync_syncing || 'Eşitleniyor…')
    : syncStatus === 'error' ? (langDict.sync_error || 'Eşitlenemedi, tekrar denenecek')
    : (langDict.sync_ok || 'Verilerin hesabında yedekleniyor');

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-5xl mx-auto w-full select-none pb-12">
      {/* ── HESAP ── */}
      {authEnabled && (
        <div className="mb-5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#4a7a96] dark:text-[#5fa8c8] mb-2 block">
            {langDict.set_lbl_account || 'Hesap'}
          </span>
          <div className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-2xl overflow-hidden shadow-sm">
            {userEmail ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20 border-2 border-white dark:border-[#0d2f45]">
                    {userAvatarUrl ? <img src={userAvatarUrl} alt="Profil fotoğrafı" className="w-full h-full object-cover" /> : <UserRound className="w-7 h-7" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#0a2540] dark:text-[#e0f4ff] block truncate">{userDisplayName || userEmail}</span>
                    <span className="text-[11px] text-[#4a7a96] dark:text-[#5fa8c8] block truncate">{userEmail}</span>
                    <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${syncStatus === 'error' ? 'text-rose-500' : 'text-[#4a7a96] dark:text-[#5fa8c8]'}`}>
                      <Cloud className="w-3 h-3" /> {syncText}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold cursor-pointer">
                    <Camera className="w-4 h-4" /> {userAvatarUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
                    <input type="file" accept="image/*" className="sr-only" disabled={avatarBusy} onChange={async e => {
                      const file = e.target.files?.[0]; e.currentTarget.value = '';
                      if (!file || !onUploadAvatar) return;
                      setAvatarBusy(true); setAvatarMessage(null);
                      try { const result = await onUploadAvatar(file); setAvatarMessage(result.message || (result.ok ? 'Kaydedildi.' : 'Yüklenemedi.')); }
                      finally { setAvatarBusy(false); }
                    }} />
                  </label>
                  {userAvatarUrl && <button type="button" disabled={avatarBusy} onClick={async () => {
                    if (!onRemoveAvatar) return; setAvatarBusy(true); setAvatarMessage(null);
                    try { const result = await onRemoveAvatar(); setAvatarMessage(result.message || (result.ok ? 'Kaldırıldı.' : 'Kaldırılamadı.')); }
                    finally { setAvatarBusy(false); }
                  }} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#c5dfe9] dark:border-[#0d2f45] text-xs font-semibold text-[#4a7a96] dark:text-[#5fa8c8] disabled:opacity-50"><X className="w-4 h-4" /> Kaldır</button>}
                  {avatarBusy && <span className="text-xs text-sky-600">Yükleniyor…</span>}
                </div>
                {avatarMessage && <p role="status" className="text-[11px] text-[#4a7a96] dark:text-[#5fa8c8]">{avatarMessage}</p>}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#4a7a96] dark:text-[#5fa8c8]">Görünen ad</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={displayName}
                      maxLength={40}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="İsmini belirle (isteğe bağlı)"
                      className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-[#c5dfe9] dark:border-[#0d2f45] bg-[#f7fbfd] dark:bg-[#020f1a] text-sm text-[#0a2540] dark:text-[#e0f4ff] outline-none focus:border-sky-500"
                    />
                    <button type="button" onClick={saveDisplayName} disabled={nameBusy || !displayName.trim() || displayName.trim() === (userDisplayName || '')} className="px-3 rounded-xl bg-sky-700 text-white text-xs font-bold disabled:opacity-40">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                  {nameMessage && <p role="status" className="text-[11px] text-[#4a7a96] dark:text-[#5fa8c8]">{nameMessage}</p>}
                  <p className="text-[11px] text-[#4a7a96] dark:text-[#5fa8c8]">Bu isim hesabında saklanır ve giriş yaptığında diğer cihazlarında da görünür.</p>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#dff0f7] dark:bg-[#0d2236] text-xs font-bold text-[#0a2540] dark:text-[#e0f4ff] hover:bg-sky-200 dark:hover:bg-[#0c2d44] transition-colors"
                >
                  <LogOut className="w-4 h-4" /> {langDict.auth_signout || 'Çıkış yap'}
                </button>
                <p className="text-[11px] text-[#4a7a96] dark:text-[#5fa8c8] leading-relaxed">
                  {langDict.auth_signout_note || 'Çıkış yapınca bu cihazdaki veriler silinir; hesabına giriş yaptığında geri gelir.'}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-sky-50/60 dark:hover:bg-sky-950/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#0a2540] dark:text-[#e0f4ff] block">{langDict.auth_cta || 'Giriş yap / Hesap oluştur'}</span>
                  <p className="text-xs text-[#4a7a96] dark:text-[#5fa8c8] mt-0.5 leading-relaxed">
                    {langDict.auth_cta_desc || 'Beğenilerini yedekle, telefon ve bilgisayarında aynı veriyle devam et.'}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── BİLİM DEFTERİM ── */}
      {onOpenNotes && (
        <div className="mb-5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#4a7a96] dark:text-[#5fa8c8] mb-2 block">Kişisel Arşiv</span>
          <button
            type="button"
            onClick={onOpenNotes}
            className="w-full bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left hover:border-sky-500 dark:hover:border-sky-700 transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-[#dff0f7] dark:bg-[#0d2236] text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <NotebookPen className="w-5 h-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#0a2540] dark:text-[#e0f4ff]">Bilim Defterim</span>
              <span className="block mt-0.5 text-xs text-[#4a7a96] dark:text-[#5fa8c8]">Makale notlarını, alıntılarını ve araştırma sorularını görüntüle.</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#4a7a96] dark:text-[#7bb0cc] shrink-0" />
          </button>
        </div>
      )}

      {/* ── GÖRÜNÜM ── */}
      <div className="mb-5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#4a7a96] dark:text-[#5fa8c8] mb-2 block">Görünüm</span>
        <div className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-2xl p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#dff0f7] dark:bg-[#0d2236] rounded-xl">
            {([{id:'auto',label:'Otomatik',icon:<Smartphone className="w-4 h-4"/>},{id:'mobile',label:'Mobil',icon:<Smartphone className="w-4 h-4"/>},{id:'desktop',label:'Masaüstü',icon:<Monitor className="w-4 h-4"/>}] as const).map(mode => (
              <button key={mode.id} type="button" onClick={() => onUpdateSettings(prev => ({...prev, displayMode:mode.id}))}
                className={`py-2 px-1 text-[11px] font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${settings.displayMode === mode.id ? 'bg-white dark:bg-[#071828] text-[#0369a1] dark:text-[#38bdf8] shadow-sm' : 'text-[#4a7a96] dark:text-[#5fa8c8]'}`}>
                {mode.icon}{mode.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#4a7a96] dark:text-[#5fa8c8] px-2 pt-2">Otomatik mod ekranına göre uygun düzeni seçer. Tercihin hesabınla eşitlenir.</p>
        </div>
      </div>

      {/* ── OKUMA DENEYİMİ (Reading Experience) ── */}
      <div className="mb-5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#4a7a96] dark:text-[#5fa8c8] mb-2 block">
          {langDict.set_lbl_experience || "Okuma Deneyimi"}
        </span>
        <div className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#c5dfe9] dark:divide-[#0d2f45]">
          {/* AKIŞ MODU SWITCH */}
          {showPrivacyPolicy && (
            <article className="p-4 sm:p-5 space-y-4 text-xs leading-relaxed text-[#31566e] dark:text-[#b5d4e4]">
              <div>
                <h3 className="text-base font-bold text-[#0a2540] dark:text-[#e0f4ff]">Abstract Gizlilik Politikası ve Kişisel Verilerin İşlenmesine İlişkin Bilgilendirme</h3>
                <p className="mt-1 text-[11px]">Son güncelleme: 15 Kasım 2026</p>
              </div>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">1. Veri sorumlusu</h4>
                <p>Abstract platformunun yayıncısı ve veri sorumlusu Binali'dir. Bu metin, https://abstractk.vercel.app adresinden sunulan Abstract web uygulaması için hazırlanmıştır. Abstract bağımsız bir akademik makale keşif ve kişisel okuma/arşiv platformudur.</p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">2. Hangi veriler işlenebilir?</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>Hesap bilgileri:</b> Hesapla giriş yapmayı seçersen e-posta adresin, görünen adın ve profil fotoğrafın.</li>
                  <li><b>Uygulama ve kullanım verileri:</b> Beğendiğin makaleler, klasörlerin, okuma geçmişin, Bilim Defterim notların, okuma serin ve uygulama tercihlerin.</li>
                  <li><b>Teknik veriler:</b> Uygulamanın çalışması, güvenliği ve hata ayıklama için hizmet sağlayıcıların işleyebileceği bağlantı ve cihaz bilgileri. Bu verilerin kapsamı ilgili sağlayıcının teknik işleyişine bağlıdır.</li>
                  <li><b>Analitik veriler:</b> Yalnızca isteğe bağlı analitik iznini verirsen PostHog üzerinden uygulama etkileşimlerine ilişkin kullanım istatistikleri.</li>
                </ul>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">3. Verileri hangi amaçlarla kullanıyoruz?</h4>
                <p>Hesap oturumunu sağlamak; beğenilerini, notlarını ve tercihlerini saklamak ve cihazların arasında eşitlemek; makale keşfi ve kişiselleştirme özelliklerini sunmak; uygulamanın güvenliğini, sürekliliğini ve performansını korumak; yalnızca izin verdiğinde kullanım istatistikleri oluşturmak.</p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">4. Veriler nerede saklanır ve kimlerle paylaşılır?</h4>
                <p>Giriş yapmadan kullanılan bazı tercihler ve içerikler tarayıcının yerel depolama alanında tutulur. Hesapla giriş yaptığında eşitleme için hesap verileri Supabase altyapısındaki veritabanına; profil fotoğrafın ilgili dosya depolama alanına kaydedilebilir. Makale arama ve bibliyografik bilgiler OpenAlex gibi harici akademik veri hizmetlerinden alınır; arama isteğin bu hizmetlere iletilebilir.</p>
                <p>Analitik izni verdiğinde kullanım olayları PostHog hizmetine iletilir. Bu hizmet sağlayıcılar, kendi altyapıları ve sözleşmeleri kapsamında verileri işleyebilir. Altyapı sağlayıcılarının sunucu konumları ve uluslararası veri aktarım mekanizmaları kullanılan hesap/plan yapılandırmasına göre değişebilir; bu nedenle belirli bir ülkeye aktarım olmadığı garanti edilmez.</p>
                <p>Abstract kişisel verilerini reklam amacıyla üçüncü kişilere satmayı amaçlamaz. Veriler; hizmetin sunulması, güvenliği veya hukuki yükümlülüklerin yerine getirilmesi için gerekli olduğu ölçüde ilgili altyapı sağlayıcıları ya da yetkili makamlarla paylaşılabilir.</p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">5. Çerezler ve benzer teknolojiler</h4>
                <p>Abstract şu anda tercihleri ve uygulama verilerini hatırlamak için ağırlıklı olarak tarayıcı yerel depolamasını kullanır; bu kayıtlar klasik HTTP çerezleriyle aynı şey değildir. Zorunlu kayıtlar uygulamanın temel işlevleri için kullanılır. PostHog analitiği, çerez tercih penceresinde “Tümünü kabul et” seçilmedikçe başlatılmaz. Tercihini Ayarlar bölümünden yeniden düzenleyebilirsin. Tarayıcı verilerini silmen, bu cihazdaki yerel kayıtları kaldırabilir.</p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">6. Saklama süresi ve güvenlik</h4>
                <p>Yerel veriler tarayıcı depolamasını temizleyene kadar; hesap verileri ise hesabın ve ilgili hizmetin çalışması için gerekli olduğu sürece saklanır. Yedekler, güvenlik kayıtları ve hizmet sağlayıcı kayıtları kendi saklama döngülerine tabi olabilir. Verilerin korunması için makul teknik ve idari önlemler uygulanır; ancak internet üzerinden aktarım veya elektronik saklama yöntemlerinin mutlak güvenliği garanti edilemez.</p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">7. Hakların ve başvuru</h4>
                <p>Uygulanabildiği ölçüde 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 11. maddesi ve ilgili diğer mevzuat kapsamında kişisel verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, işleme amacını öğrenme, aktarılan üçüncü kişileri bilme, eksik veya yanlış verilerin düzeltilmesini ve kanuni şartlar dahilinde silinmesini/yok edilmesini isteme, otomatik analiz sonuçlarına itiraz etme ve kanunda belirtilen şartlarda zararın giderilmesini talep etme haklarına sahipsin.</p>
                <p>Abstract için ayrı bir e-posta veya başvuru adresi henüz yayımlanmamıştır. Başvuru kanalı belirlendiğinde bu sayfada duyurulacaktır. Bu eksiklik nedeniyle bu metin tek başına resmî başvuru kanalının yerine geçtiği şeklinde yorumlanmamalıdır.</p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">8. Çocukların gizliliği</h4>
                <p>Abstract özellikle çocuklara yönelik tasarlanmamıştır. Ebeveyn veya yasal temsilci, bir çocuğa ait kişisel verinin uygun olmayan biçimde işlendiğini düşünüyorsa yayımlanacak başvuru kanalı üzerinden bildirimde bulunabilir.</p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-sm text-[#0a2540] dark:text-[#e0f4ff]">9. Politika değişiklikleri</h4>
                <p>Platformun özellikleri, kullanılan hizmetler veya mevzuat değiştikçe bu politika güncellenebilir. Güncel metin her zaman Abstract'ın Ayarlar bölümünde yayımlanır; önemli değişiklikler uygun olduğunda uygulama içinde duyurulur.</p>
              </section>
              <p className="border-t border-[#c5dfe9] dark:border-[#17435c] pt-3 text-[11px]">Bu metin Abstract'ın mevcut teknik işleyişi esas alınarak hazırlanmış genel bilgilendirmedir; hukuki danışmanlık veya mevzuata tam uyum garantisi değildir. Özellikle veri sorumlusu iletişim kanalı, saklama süreleri, hizmet sağlayıcı sözleşmeleri ve uluslararası aktarım mekanizmaları netleştirilerek yayına alınmadan önce hukuk uzmanı tarafından gözden geçirilmelidir.</p>
            </article>
          )}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#0a2540] dark:text-[#e0f4ff] block">
                  {langDict.set_reels_mode || "Akış Modu"}
                </span>
                <p className="text-xs text-[#4a7a96] dark:text-[#5fa8c8] mt-0.5 leading-relaxed">
                  {langDict.set_reels_desc || "Makaleleri dikey kaydırarak geçin, beğenmek için sağa, ayrıntılar için sola kaydırın."}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.reelsMode}
                onChange={(e) => onUpdateSettings(prev => ({ ...prev, reelsMode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#c5dfe9] dark:bg-[#0d2f45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0369a1]"></div>
            </label>
          </div>

          {/* BLUP TRANSLATION (Fish Button) */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#0a2540] dark:text-[#e0f4ff]">
                {langDict.set_fish_tr || "blup"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings(prev => ({ ...prev, translate: !prev.translate }))}
              title="blup"
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                settings.translate
                  ? 'bg-[#dbeafe] dark:bg-[#0c2d44] border-sky-500 text-sky-600 dark:text-cyan-400 scale-105 shadow-sm'
                  : 'bg-[#dff0f7] dark:bg-[#0d2236] border-[#c5dfe9] dark:border-[#0d2f45] text-[#4a7a96] dark:text-[#5fa8c8]'
              }`}
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4C7 4 2.7 7.5 1 12c1.7 4.5 6 8 11 8 2.2 0 4.2-.7 6-1.8l3 1.8-1.5-3.5C20.5 15 21 13.5 21 12c0-4.4-4-8-9-8zm-4 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
              </svg>
            </button>
          </div>

          {/* SOUND EFFECTS */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#0a2540] dark:text-[#e0f4ff]">
              {langDict.set_sound || "Ses efektleri"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => onUpdateSettings(prev => ({ ...prev, sound: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#c5dfe9] dark:bg-[#0d2f45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0369a1]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ── UYGULAMA DİLİ (Language) ── */}
      <div className="mb-5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#4a7a96] dark:text-[#5fa8c8] mb-2 block">
          {langDict.set_lbl_lang || "Uygulama Dili"}
        </span>
        <div className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-2xl p-2 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-[#dff0f7] dark:bg-[#0d2236] rounded-xl">
            {([
              ['tr', 'Türkçe'], ['en', 'English'], ['ar', 'العربية'],
              ['zh', '简体中文'], ['es', 'Español'],
            ] as const).map(([code, label]) => (
              <button
                key={code}
                type="button"
                lang={code === 'zh' ? 'zh-Hans' : code}
                onClick={() => onUpdateSettings(prev => ({ ...prev, lang: code }))}
                aria-pressed={settings.lang === code}
                className={'py-2 px-2 text-xs font-semibold rounded-lg transition-all ' + (settings.lang === code
                  ? 'bg-white dark:bg-[#071828] text-[#0369a1] dark:text-[#38bdf8] shadow-sm'
                  : 'text-[#4a7a96] dark:text-[#5fa8c8]')}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="px-2 pt-2 text-[11px] leading-relaxed text-[#4a7a96] dark:text-[#5fa8c8]">
            {settings.lang === 'en'
              ? 'This changes the language of the entire app interface, including menus, settings, dialogs and community screens.'
              : settings.lang === 'ar'
                ? 'يغيّر هذا الخيار لغة واجهة التطبيق، بما في ذلك القوائم والإعدادات والنوافذ وشاشات المجتمع.'
                : settings.lang === 'zh'
                  ? '此设置将更改整个应用界面的语言，包括菜单、设置、对话框和社区页面。'
                  : settings.lang === 'es'
                    ? 'Esta opción cambia el idioma de toda la interfaz, incluidos los menús, ajustes, diálogos y pantallas de la comunidad.'
                    : 'Bu seçim menüler, ayarlar, pencereler ve topluluk ekranları dâhil uygulamanın tamamının arayüz dilini değiştirir.'}
          </p>
        </div>
      </div>

      {/* ── TEMA (Theme) ── */}
      <div className="mb-5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#4a7a96] dark:text-[#5fa8c8] mb-2 block">
          {langDict.set_lbl_theme || "Tema"}
        </span>
        <div className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-2xl p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#dff0f7] dark:bg-[#0d2236] rounded-xl">
            {(['auto', 'light', 'dark'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdateSettings(prev => ({ ...prev, theme: mode }))}
                className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                  settings.theme === mode
                    ? 'bg-white dark:bg-[#071828] text-[#0369a1] dark:text-[#38bdf8] shadow-sm'
                    : 'text-[#4a7a96] dark:text-[#5fa8c8]'
                }`}
              >
                {mode === 'auto' ? langDict.theme_auto || 'Sistem' : mode === 'light' ? langDict.theme_light || 'Açık Deniz' : langDict.theme_dark || 'Derin Deniz'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ÇEREZLER VE GİZLİLİK ── */}
      <div className="mb-5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#4a7a96] dark:text-[#5fa8c8] mb-2 block">
          Çerezler ve Gizlilik
        </span>
        <div className="bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#c5dfe9] dark:divide-[#0d2f45]">
          <div className="p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#dff0f7] dark:bg-[#0d2236] text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-[#0a2540] dark:text-[#e0f4ff]">Çerezler ve yerel depolama</span>
              <p className="mt-1 text-xs leading-relaxed text-[#4a7a96] dark:text-[#5fa8c8]">
                Abstract, tema, dil ve uygulama tercihlerini hatırlamak; beğenilerini ve kişisel arşivini bu cihazda tutmak için tarayıcının yerel depolama alanından yararlanır. Bunlar klasik tarayıcı çerezleri değil, benzer amaçla kullanılan cihaz içi kayıtlardır.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#4a7a96] dark:text-[#5fa8c8]">
                İsteğe bağlı kullanım istatistikleri PostHog aracılığıyla yalnızca “Tümünü kabul et” tercihini verdiğinde etkinleştirilir. “Yalnızca zorunlu” seçeneğinde analitik başlatılmaz.
              </p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#dff0f7] dark:bg-[#0d2236] text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#0a2540] dark:text-[#e0f4ff]">Gizlilik politikası</span>
              <p className="mt-1 text-xs leading-relaxed text-[#4a7a96] dark:text-[#5fa8c8]">
                Verilerin nasıl işlendiği, hangi amaçlarla kullanıldığı ve tercihlerini nasıl yönetebileceğin hakkında bilgi edin.
              </p>
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(v => !v)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline"
                aria-expanded={showPrivacyPolicy}
              >
                {showPrivacyPolicy ? 'Gizlilik politikasını gizle' : 'Abstract gizlilik politikasını oku'}
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPrivacyPolicy ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-[#0a2540] dark:text-[#e0f4ff]">Çerez tercihlerini değiştir</span>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#4a7a96] dark:text-[#5fa8c8]">
                Tercih penceresini yeniden açarak seçimini güncelleyebilirsin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                try { localStorage.removeItem('abs_cookie_consent'); } catch {}
                window.location.reload();
              }}
              className="shrink-0 px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors"
            >
              Tercihleri yönet
            </button>
          </div>
        </div>
      </div>

      {/* ── UYGULAMA TURU ── */}
      {onReplayTour && (
        <div className="mb-5">
          <button
            type="button"
            onClick={onReplayTour}
            className="w-full text-left bg-white dark:bg-[#071828] border border-[#c5dfe9] dark:border-[#0d2f45] rounded-2xl p-4 shadow-sm hover:border-sky-500 transition-colors"
          >
            <b className="block text-xs sm:text-sm text-[#0a2540] dark:text-[#e0f4ff]">{langDict.tour_replay || "Uygulama turunu tekrar göster"}</b>
            <span className="text-[11px] text-[#4a7a96] dark:text-[#5fa8c8]">{langDict.tour_replay_desc}</span>
          </button>
        </div>
      )}

      {/* ── İŞLEMLER (Danger Zone) ── */}
      <div className="mb-4">
        <span className="text-[11px] font-bold tracking-wider uppercase text-rose-500 mb-2 block">
          {langDict.set_lbl_actions || "İşlemler"}
        </span>
        <div className="bg-white dark:bg-[#071828] border border-rose-200 dark:border-rose-950 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={onClearLikes}
            className="w-full p-4 flex items-center justify-between text-left text-rose-600 dark:text-rose-400 font-semibold text-xs sm:text-sm hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4" />
              <span>{langDict.clear_likes || "Tüm beğenilenleri temizle"}</span>
            </div>
            <span className="text-xs opacity-60">▤</span>
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#4a7a96] dark:text-[#5fa8c8] px-2">
        {userEmail
          ? (langDict.privacy_note_account || "Veriler hesabına bağlı olarak güvenle saklanır; yalnızca sen erişebilirsin.")
          : (langDict.privacy_note || "Veriler yalnızca bu cihazın tarayıcısında saklanır.")}
      </p>

      {/* Sitenin En Altındaki Telif & İmza Yazısı */}
      <footer className="mt-4 pt-4 pb-2 text-center border-t border-[#c5dfe9]/50 dark:border-[#0d2f45]/50">
        <p className="text-xs text-[#527993] dark:text-[#7bb0cc] font-medium tracking-wide">
          Binali © 2026. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
