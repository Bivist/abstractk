import { I18N } from '../constants/i18n';

type Language = 'tr' | 'en';

/**
 * Exact UI-copy translations for legacy screens that still contain inline
 * Turkish copy. User-authored text, paper metadata and abstracts are not
 * translated unless they exactly match a known interface label.
 */
const LEGACY_UI_EN: Record<string, string> = {
  'Akış Modu': 'Feed Mode',
  'Akış Modu ·': 'Feed Mode ·',
  'Sana özel': 'For you',
  'Sana özel ·': 'For you ·',
  'Bilimi keşfet,': 'Discover science,',
  'fenerin ışığında.': 'in the lighthouse beam.',
  'Fener Işık Huzmesi': 'Lighthouse Beam',
  'Kişisel Seyir Panosu & Bilgi Haritası': 'Personal Reading Dashboard & Knowledge Map',
  'Günde': 'Per day',
  'makale hedefi': 'paper goal',
  'Gün Seri': 'Day streak',
  'gün': 'days',
  'Usta Kılavuz': 'Master Navigator',
  'Kıdemli Fenerci': 'Senior Lighthouse Keeper',
  'Nöbetçi Gözcü': 'Watchful Lookout',
  'Deniz fenerini keşfet': 'Explore the lighthouse',
  'Feneri keşfet': 'Explore the lighthouse',
  'Açık': 'On',
  'Geç': 'Skip',
  'Ayrıntılar': 'Details',
  'Beğen': 'Like',
  'Beğen (Sağa kaydır)': 'Like (swipe right)',
  'Detaylı Bilgi (Sola kaydır)': 'More details (swipe left)',
  'Kaynağında Aç': 'Open at source',
  'Sonraki Makale (Aşağı kaydır)': 'Next paper (swipe down)',
  '→ Beğen': '→ Like',
  '© 2026 Binali. Her hakkı saklıdır.': '© 2026 Binali. All rights reserved.',
  'Makale beğenilenlerden çıkarıldı.': 'Paper removed from favorites.',
  'Silmek için sola kaydır': 'Swipe left to remove',
  'Yukarı taşı': 'Move up',
  'Aşağı taşı': 'Move down',
  'Çıkar': 'Remove',
  'Tüm alan seçili': 'All fields selected',
  'Alt Dalları Göster': 'Show subfields',
  'Başlangıç yılı (örn. 2018)': 'Start year (e.g. 2018)',
  'Bitiş yılı (örn. 2026)': 'End year (e.g. 2026)',
  'Yazar adları (virgülle ayır)': 'Author names (separate with commas)',
  'Birden fazla yazarı virgül veya noktalı virgülle ayırabilirsin.': 'You can separate multiple authors with commas or semicolons.',
  'Örn. Aquaculture': 'e.g. Aquaculture',
  'Örn. Antalya, Kaş, Akdeniz, Tuna Havzası': 'e.g. Antalya, Kaş, Mediterranean, Danube Basin',
  'Coğrafi bölge': 'Geographic area',
  'Şehir veya bölge adı, bilimsel yayınlarda kullanılan yaygın karşılıklarıyla da aranır. Eşleşme başlık ya da özette bulunur; tek başına araştırma sahasını kanıtlamaz.': 'City and region names are also searched using their common forms in scientific publications. Matches are found in the title or abstract and do not, by themselves, verify the study area.',
  'Önce bu alanların hepsini birlikte ele alan disiplinlerarası yayınlar gösterilir; bittikçe tek tek devam edilir.': 'Interdisciplinary publications covering all selected fields are shown first, followed by results for each field.',
  'Okuma Özeti': 'Reading Summary',
  'Makale Haritası': 'Paper Map',
  'Günlük Seri': 'Daily Streak',
  'Gerçek okuma kayıtlarına göre': 'Based on your reading history',
  'Bu dönemde henüz okuma kaydı bulunmuyor.': 'There is no reading activity for this period yet.',
  'Kişisel keşif alanı': 'Personal discovery space',
  'Okuma Derinliği': 'Reading Depth',
  'Seyir Haritası': 'Reading Map',
  '· Bilgi Ağı': '· Knowledge Network',
  'Gece Gökyüzü Takımyıldızı': 'Night Sky Constellation',
  'Gökyüzü': 'Sky',
  'Eski Portolan Deniz Haritası': 'Historic Portolan Sea Chart',
  'Yakınlaştır': 'Zoom in',
  'Uzaklaştır': 'Zoom out',
  'Konumu Sıfırla': 'Reset view',
  'Örnek Keşif Haritası': 'Sample Discovery Map',
  'Makaleleri beğendikçe kişisel takım-yıldız bilgi ağınız burada otomatik olarak dallanıp parlayacak.': 'As you like papers, your personal constellation-style knowledge network will branch out and light up here.',
  'Ayrıntılı Makale Bilgisi': 'Detailed Paper Information',
  'Kaynağa Git': 'Go to source',
  'ABSTRACT · KİŞİSEL ARŞİV': 'ABSTRACT · PERSONAL ARCHIVE',
  'Makalelerden biriktirdiğin fikirler, sorular ve önemli cümleler.': 'Ideas, questions and important passages you have collected from papers.',
  'Toplam kayıt': 'Total entries',
  'Alıntı': 'Quote',
  'Araştırma sorusu': 'Research question',
  'Notlarda, makale başlıklarında veya alanlarda ara…': 'Search notes, paper titles or fields…',
  'Aramayı temizle': 'Clear search',
  'kayıt listeleniyor': 'entries listed',
  'Son güncellenen önce': 'Recently updated first',
  'Notu düzenle': 'Edit note',
  'Düzenle': 'Edit',
  'Bu kaydı Bilim Defterim’den silmek istiyor musun?': 'Do you want to delete this entry from My Research Notebook?',
  'Notu sil': 'Delete note',
  'Sil': 'Delete',
  'Başlığı kaydedilmemiş makale': 'Paper with no saved title',
  'Vazgeç': 'Cancel',
  'Defterin henüz boş': 'Your notebook is empty',
  'Aradığın kayıt bulunamadı': 'No matching entries found',
  'Bir makalenin ayrıntılarını açıp kişisel not, önemli alıntı veya araştırma sorusu eklediğinde kayıtların burada birikecek.': 'Your entries will appear here when you open a paper and add a personal note, an important quote or a research question.',
  'Başka bir kelime dene veya farklı bir kayıt türü seç.': 'Try another keyword or choose a different entry type.',
  'Topluluk erişimi kontrol ediliyor…': 'Checking community access…',
  'Özel topluluk': 'Private community',
  'Topluluk alanını görüntülemek için Abstract hesabına giriş yapmalısın.': 'You must sign in to your Abstract account to view the community.',
  'Abstract · Kapalı beta': 'Abstract · Private beta',
  'Bilimsel topluluk': 'Research Community',
  'Topluluk erişimi şu anda hesabında etkin değil. Hesabına yeniden erişim vermek için yöneticiyle iletişime geçebilirsin.': 'Community access is not currently enabled for your account. Contact an administrator to request access.',
  'Erişim durumu: Yetkilendirme bekleniyor': 'Access status: Awaiting authorization',
  'Topluluk yönetimi': 'Community Administration',
  'Üyeleri ve erişim izinlerini buradan yönet. Yeni hesaplar otomatik olarak topluluğa üye olur; bireysel erişim kararları sende kalır.': 'Manage members and access permissions here. New accounts are automatically added to the community; individual access decisions remain under your control.',
  'Akademik topluluk alanı hazırlanıyor. Paylaşım ve iletişim özellikleri henüz etkin değil.': 'The academic community area is being prepared. Sharing and messaging features are not available yet.',
  'Topluluk alanını görüntüle': 'View community',
  'Kayıtlı üyeler': 'Registered Members',
  'Topluluğa katılan üyeler ve katılım tarihleri': 'Members who joined the community and their join dates',
  'Pencereyi kapat': 'Close dialog',
  'Üye adı veya kullanıcı adı ara…': 'Search name or username…',
  'üye listeleniyor': 'members listed',
  'İsimsiz üye': 'Unnamed member',
  'Kullanıcı adı yok': 'No username',
  'Katılım tarihi': 'Joined on',
  'Tarih bilgisi yok': 'Date unavailable',
  'Henüz kayıtlı üye bulunmuyor.': 'No registered members yet.',
  'Aramayla eşleşen üye bulunamadı.': 'No members match your search.',
  'Kapat': 'Close',
  'Listeyi görüntüle →': 'View list →',
  'Yöneticiler': 'Administrators',
  'Son yönetim kaydı': 'Latest admin activity',
  'Henüz kayıt yok': 'No records yet',
  'Genel erişim kontrolü': 'Global Access Control',
  'Bu anahtar topluluk modülünü tüm üyeler için açar veya kapatır. Kullanıcı erişimini ayrıca aşağıdaki bölümden kişi bazında yönetebilirsin.': 'This switch enables or disables the community module for all members. You can also manage access for individual users in the section below.',
  'Kullanıcı erişimi': 'User Access',
  'E-posta, görünen ad veya kullanıcı UID\'siyle ara. E-posta yalnızca bu yönetici ekranında kullanılır; topluluk profillerinde gösterilmez.': 'Search by email, display name or user UID. Email is used only in this admin screen and is not shown on community profiles.',
  'Bağlantı için seçilen hesaplar': 'Accounts selected for connection',
  'Yeni arama yaptığında seçimlerin korunur. En fazla iki hesap seçebilirsin.': 'Your selections remain when you start a new search. You can select up to two accounts.',
  'Seçilen iki hesabı bağla': 'Connect the two selected accounts',
  'Seçimi kaldır': 'Remove selection',
  'İsimsiz hesap': 'Unnamed account',
  'E-posta yok': 'No email',
  'Atanmış rol / erişim': 'Assigned role / access',
  'Henüz yetki yok': 'No access assigned',
  'Rol ata…': 'Assign role…',
  'Üye erişimi ver': 'Grant member access',
  'Yönetici yetkisi ver': 'Grant administrator access',
  'Erişimi kapat': 'Disable access',
  'Üye: topluluk özellikleri · Yönetici: tüm yönetim yetkileri · Kapalı: erişemez': 'Member: community features · Administrator: full admin permissions · Disabled: no access',
  'Üye bildirimleri': 'Member Reports',
  'açık': 'open',
  'Hedef:': 'Target:',
  'Bildiren:': 'Reported by:',
  'İnceleniyor': 'Under review',
  'Çözüldü': 'Resolved',
  'Reddet': 'Dismiss',
  'Henüz bildirim yok.': 'No reports yet.',
  'Yönetim geçmişi': 'Admin History',
  'Genel topluluk ayarı': 'Global community setting',
  'İşlemi yapan:': 'Action by:',
  'Bilinmiyor': 'Unknown',
  'Henüz yönetim işlemi kaydedilmemiş.': 'No admin activity has been recorded yet.',
  'Yeniden paylaşıldı.': 'Reposted.',
  'Notunla birlikte yeniden paylaşıldı.': 'Reposted with your note.',
  'Üyenin engeli kaldırıldı.': 'Member unblocked.',
  'Beğen': 'Like',
  'Yorum': 'Comment',
  'Yeniden paylaş': 'Repost',
  'Kaydet': 'Save',
  'Bu makale veya gönderi hakkında ne düşünüyorsun?': 'What do you think about this paper or post?',
  'Notla paylaş': 'Share with note',
  'Yoruma yanıt yazılıyor': 'Writing a reply to the comment',
  'Yanıtla': 'Reply',
  'Yanıt yaz…': 'Write a reply…',
  'Yorum yaz…': 'Write a comment…',
  'Yorumu gönder': 'Send comment',
  'Henüz gönderi yok. İlk akademik paylaşımı sen başlatabilirsin.': 'No posts yet. Start the first academic discussion.',
  'Yükleniyor…': 'Loading…',
  'Daha eski gönderileri yükle': 'Load older posts',
  'Bilim Defterim · Açıkça paylaşılmış not': 'My Research Notebook · Publicly shared note',
  'Topluluk üyesi': 'Community member',
  'Makale notu': 'Paper note',
  'Bu not paylaşımını geri almak istiyor musun? Özel notun korunur.': 'Do you want to revoke this note share? Your private note will be preserved.',
  'Not paylaşımı geri alındı. Özel notun değişmedi.': 'Note sharing revoked. Your private note has not changed.',
  'Paylaşımı geri al': 'Revoke share',
  'Makale gönderimi': 'Paper delivery',
  'Bir veya daha fazla alıcı seç. Tek alıcıya birebir, birden fazla alıcıya grup mesajı gönderilir.': 'Select one or more recipients. One recipient receives a direct message; multiple recipients receive a group message.',
  'Seçilenlere makaleyi gönder': 'Send paper to selected recipients',
  'Topluluk üyeleri': 'Community Members',
  'Yalnızca toplulukta görünür olmayı seçen üyeler listelenir.': 'Only members who have chosen to be visible in the community are listed.',
  'Ad, kullanıcı adı veya kurum…': 'Name, username or institution…',
  'Ara': 'Search',
  'Grup adı (isteğe bağlı)': 'Group name (optional)',
  'Seçilenlerle grup kur': 'Create group with selected members',
  'Grup': 'Group',
  'Takibi bırak': 'Unfollow',
  'Takip et': 'Follow',
  'Engelle': 'Block',
  'Mesaj': 'Message',
  'Üye profili': 'Member profile',
  'Profil yükleniyor…': 'Loading profile…',
  'Profil gizli': 'Private profile',
  'Bu üye profilini toplulukla paylaşmayı seçmemiş.': 'This member has chosen not to share their profile with the community.',
  'Araştırma alanları': 'Research interests',
  'Mesaj gönder': 'Send message',
  'Topluluk gönderileri ve mesajları yalnızca yetkili üyeler içindir. Özel notların otomatik paylaşılmaz; paylaşım için ayrıca açık onay gereklidir.': 'Community posts and messages are for authorized members only. Private notes are never shared automatically; explicit consent is required to share them.',
  'Sohbetlerin yükleniyor…': 'Loading your conversations…',
  'İstekler': 'Requests',
  'Mesaj isteği': 'Message request',
  'Akademik makale': 'Academic paper',
  'Makaleyi önizle': 'Preview paper',
  'Bekleyen istek yok': 'No pending requests',
  'Yeni kişilerden gelen mesaj istekleri burada görünür.': 'Message requests from new contacts appear here.',
  'Okunmamış mesaj': 'Unread message',
  'Henüz sohbet yok': 'No conversations yet',
  'Takip ettiğin veya bağlantı kurduğun üyelerle sohbet edebilirsin.': 'You can chat with members you follow or are connected to.',
  'Sohbet listesine dön': 'Back to conversations',
  'Grup sohbeti': 'Group conversation',
  'Özel mesaj': 'Direct message',
  'Profili gör': 'View profile',
  'Mesajlar yükleniyor…': 'Loading messages…',
  'Makaleyi aç': 'Open paper',
  'Paylaşılmış araştırma notu': 'Shared research note',
  'Bilim Defterim notu': 'Research Notebook note',
  'Kaynak / Atıf': 'Source / Citation',
  'Koleksiyon bağlantısı': 'Collection link',
  'Paylaşılan bağlantı': 'Shared link',
  'Bağlantıyı aç': 'Open link',
  'Araştırma özeti': 'Research summary',
  'Henüz mesaj yok. İlk mesajı göndererek sohbeti başlat.': 'No messages yet. Send the first message to start the conversation.',
  'Paylaşılmış not seç': 'Select a shared note',
  'Ek içerik türü': 'Additional content type',
  'Kaynak / DOI': 'Source / DOI',
  'Koleksiyon bağlantısı': 'Collection link',
  'Yalnızca daha önce açıkça paylaşılmış notlar seçilebilir.': 'Only notes that have been explicitly shared before can be selected.',
  'Başlık': 'Title',
  'Araştırma özetini yaz…': 'Write a research summary…',
  'İsteğe bağlı kısa açıklama…': 'Optional short description…',
  'Akademik içerik ekle': 'Add academic content',
  'Mesajı gönder': 'Send message',
  'Enter ile gönder · Shift + Enter ile alt satıra geç': 'Press Enter to send · Shift + Enter for a new line',
  'Sohbetlerine hoş geldin': 'Welcome to your conversations',
  'Soldan bir konuşma seç veya topluluk üyeleri arasından bir araştırmacıya mesaj gönder.': 'Select a conversation on the left or message a researcher from the community.',
  'Makaleyi mesajla gönder': 'Send paper in a message',
  'Makaleyi gönder': 'Send paper',
  'Takip ettiklerin veya yeni üyeler': 'People you follow or new members',
  'Paylaşılacak makale': 'Paper to share',
  'İstersen makaleyle birlikte kısa bir not yaz…': 'Add a short note with the paper (optional)…',
  'Yeni üye ara…': 'Search for a new member…',
  'Takip ettiklerin': 'People you follow',
  'Kişiler yükleniyor…': 'Loading people…',
  'Henüz takip ettiğin üye yok. Yukarıdan yeni bir üye arayabilirsin.': 'You are not following any members yet. Search for someone above.',
  'Arama sonuçları': 'Search results',
  'kişiye gönderilecek. Yeni kişilere önce mesaj isteği gider.': 'recipient(s). New contacts will first receive a message request.',
  'Göndermek için en az bir kişi seç.': 'Select at least one recipient to send.',
  'Gönder': 'Send',
  'Toplulukta paylaş': 'Share with community',
  'Üyelere mesajla gönder': 'Send to members by message',
  'Mesajla gönder': 'Send in a message',
  'Bu makaleye özel kişisel kayıtların': 'Your personal entries for this paper',
  'kayıt': 'entries',
  'Bu makale hakkında ne düşünüyorsun?': 'What do you think about this paper?',
  'Saklamak istediğin cümleyi buraya ekle…': 'Add the passage you want to save…',
  'Bu makaleden hareketle hangi soruyu araştırmak istersin?': 'What question would you like to investigate based on this paper?',
  'Kaydı sil': 'Delete entry',
  'Bu makale için henüz kayıt yok. İlk notunu ekleyerek başlayabilirsin.': 'There are no entries for this paper yet. Add your first note to get started.',
  'Makaleyi kaynağında aç': 'Open paper at source',
  'Yeni klasör adı…': 'New folder name…',
  'Makaleyi Klasöre Taşı': 'Move Paper to Folder',
  'Çerezler ve Gizlilik': 'Cookies & Privacy',
  'Çerezler ve yerel depolama': 'Cookies and local storage',
  'Abstract, tema, dil ve uygulama tercihlerini hatırlamak; beğenilerini ve kişisel arşivini bu cihazda tutmak için tarayıcının yerel depolama alanından yararlanır. Bunlar klasik tarayıcı çerezleri değil, benzer amaçla kullanılan cihaz içi kayıtlardır.': 'Abstract uses your browser’s local storage to remember your theme, language and app preferences, and to keep your favorites and personal archive on this device. These are device-local records, not traditional browser cookies.',
  'İsteğe bağlı kullanım istatistikleri PostHog aracılığıyla yalnızca “Tümünü kabul et” tercihini verdiğinde etkinleştirilir. “Yalnızca zorunlu” seçeneğinde analitik başlatılmaz.': 'Optional usage analytics through PostHog are enabled only if you choose “Accept all”. Analytics are not started when you choose “Essential only”.',
  'Gizlilik politikası': 'Privacy Policy',
  'Verilerin nasıl işlendiği, hangi amaçlarla kullanıldığı ve tercihlerini nasıl yönetebileceğin hakkında bilgi edin.': 'Learn how your data is processed, why it is used and how you can manage your preferences.',
  'Gizlilik politikasını gizle': 'Hide privacy policy',
  'Abstract gizlilik politikasını oku': 'Read Abstract’s privacy policy',
  'Çerez tercihlerini değiştir': 'Change cookie preferences',
  'Tercih penceresini yeniden açarak seçimini güncelleyebilirsin.': 'Reopen the preferences window to update your choice.',
  'Tercihleri yönet': 'Manage preferences',
  'Binali © 2026. All rights reserved.': 'Binali © 2026. All rights reserved.',
};

const KEY_TRANSLATIONS: Record<string, string> = Object.fromEntries(
  Object.keys(I18N.tr).flatMap((key) => {
    const tr = I18N.tr[key as keyof typeof I18N.tr];
    const en = I18N.en[key as keyof typeof I18N.en];
    return typeof tr === 'string' && typeof en === 'string' ? [[tr, en]] : [];
  })
);

const EN_TO_TR: Record<string, string> = Object.fromEntries(
  Object.entries({ ...KEY_TRANSLATIONS, ...LEGACY_UI_EN }).map(([tr, en]) => [en, tr])
);

function translateKnownText(value: string, lang: Language): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const dictionary = lang === 'en' ? { ...KEY_TRANSLATIONS, ...LEGACY_UI_EN } : EN_TO_TR;
  const translated = dictionary[trimmed];
  if (translated) return value.replace(trimmed, translated);

  if (lang === 'en') {
    let match = trimmed.match(/^(\d+) kayıt listeleniyor$/);
    if (match) return value.replace(trimmed, `${match[1]} entries listed`);
    match = trimmed.match(/^(\d+) üye listeleniyor$/);
    if (match) return value.replace(trimmed, `${match[1]} members listed`);
    match = trimmed.match(/^(\d+) seçildi$/);
    if (match) return value.replace(trimmed, `${match[1]} selected`);
    match = trimmed.match(/^(\d+) açık$/);
    if (match) return value.replace(trimmed, `${match[1]} open`);
  }
  return value;
}

function isEditableOrUserContent(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return false;
  return Boolean(parent.closest('input, textarea, select, [contenteditable="true"], script, style, code, pre, .paper-abstract, .paper-title, [data-user-content="true"]'));
}

function translateElement(root: ParentNode, lang: Language): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  for (const node of textNodes) {
    if (isEditableOrUserContent(node)) continue;
    const next = translateKnownText(node.nodeValue || '', lang);
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  if (root instanceof Element) {
    for (const attr of ['placeholder', 'title', 'aria-label', 'aria-description']) {
      const value = root.getAttribute(attr);
      if (value) {
        const next = translateKnownText(value, lang);
        if (next !== value) root.setAttribute(attr, next);
      }
    }
  }
  if ('querySelectorAll' in root) {
    root.querySelectorAll('[placeholder], [title], [aria-label], [aria-description]').forEach((element) => {
      for (const attr of ['placeholder', 'title', 'aria-label', 'aria-description']) {
        const value = element.getAttribute(attr);
        if (value) {
          const next = translateKnownText(value, lang);
          if (next !== value) element.setAttribute(attr, next);
        }
      }
    });
  }
}

/**
 * Applies localization to legacy inline copy and observes React's later
 * renders so dynamically opened sheets, dialogs and community screens follow
 * the selected language as well.
 */
export function observeAppLanguage(lang: Language): () => void {
  document.documentElement.lang = lang;
  const root = document.getElementById('root');
  if (!root) return () => {};

  translateElement(root, lang);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData' && record.target.parentElement) {
        translateElement(record.target.parentElement, lang);
      }
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (!isEditableOrUserContent(node)) {
            const text = node as Text;
            text.nodeValue = translateKnownText(text.nodeValue || '', lang);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          translateElement(node as Element, lang);
        }
      });
      if (record.type === 'attributes' && record.target instanceof Element) {
        translateElement(record.target, lang);
      }
    }
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['placeholder', 'title', 'aria-label', 'aria-description'],
  });
  return () => observer.disconnect();
}
