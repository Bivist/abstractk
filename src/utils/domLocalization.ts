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
  'Çerez ve gizlilik tercihleri': 'Cookie and privacy preferences',
  'Çerez tercihlerin': 'Your cookie preferences',
  'Yalnızca zorunlu olanları kullan': 'Use essential cookies only',
  'Tümünü kabul et': 'Accept all',
  'Yalnızca zorunlu': 'Essential only',
  'Akış gönderilerini yönet': 'Manage Feed Posts',
  'yüklü': 'loaded',
  'Gönderileri öne çıkar, tarih aralığına göre incele veya gerekçeyle kaldır.': 'Feature posts, review them by date range, or remove them with a reason.',
  'Kaldırma gerekçesi gönderi sahibine bildirilir ve yönetim kaydına eklenir.': 'The removal reason is sent to the post author and added to the admin log.',
  'Tarih aralığı': 'Date range',
  'Başlangıç tarihi': 'Start date',
  'Bitiş tarihi': 'End date',
  'Gönderi veya kullanıcı ara…': 'Search posts or users…',
  'Öne çıkan': 'Featured',
  'Öne çıkarmayı kaldır': 'Remove from featured',
  'Öne çıkar': 'Feature post',
  'Kaldırma gerekçesi (zorunlu)': 'Removal reason (required)',
  'Gönderiyi kaldır': 'Remove post',
  'Gönderi bulunamadı.': 'No posts found.',
  'En fazla 300 gönderi listelenir. Tarih filtresini daraltarak eski paylaşımları bulabilirsin.': 'Up to 300 posts are listed. Narrow the date range to find older posts.',
  'Yenile': 'Refresh',
  'Görünüşe göre rotadan çıktık.': 'Looks like we have drifted off course.',
  'BİLİMSEL KEŞİF ROTASI': 'SCIENTIFIC DISCOVERY ROUTE',
  'Ana sayfaya dön': 'Return to home',
  'Önceki sayfa': 'Previous page',
  'Abstract · Bilimi kaydırarak keşfet': 'Abstract · Discover science with a swipe',
  'Abstract Gizlilik Politikası ve Kişisel Verilerin İşlenmesine İlişkin Bilgilendirme': 'Abstract Privacy Policy and Information on the Processing of Personal Data',
  'Son güncelleme: 15 Kasım 2026': 'Last updated: November 15, 2026',
  '1. Veri sorumlusu': '1. Data controller',
  '2. Hangi veriler işlenebilir?': '2. What data may be processed?',
  'Hesap bilgileri:': 'Account information:',
  'Uygulama ve kullanım verileri:': 'App and usage data:',
  'Teknik veriler:': 'Technical data:',
  'Analitik veriler:': 'Analytics data:',
  '3. Verileri hangi amaçlarla kullanıyoruz?': '3. How do we use the data?',
  '4. Veriler nerede saklanır ve kimlerle paylaşılır?': '4. Where is data stored and with whom is it shared?',
  '5. Çerezler ve benzer teknolojiler': '5. Cookies and similar technologies',
  '6. Saklama süresi ve güvenlik': '6. Data retention and security',
  '7. Hakların ve başvuru': '7. Your rights and how to contact us',
  '8. Çocukların gizliliği': '8. Children’s privacy',
  '9. Politika değişiklikleri': '9. Policy changes',
  'Abstract platformunun yayıncısı ve veri sorumlusu Binali\'dir. Bu metin, https://abstractk.vercel.app adresinden sunulan Abstract web uygulaması için hazırlanmıştır. Abstract bağımsız bir akademik makale keşif ve kişisel okuma/arşiv platformudur.': 'Binali is the publisher of the Abstract platform and its data controller. This notice applies to the Abstract web application available at https://abstractk.vercel.app. Abstract is an independent platform for discovering academic papers and maintaining a personal reading archive.',
  'Hesapla giriş yapmayı seçersen e-posta adresin, görünen adın ve profil fotoğrafın.': 'If you choose to sign in, your email address, display name and profile photo.',
  'Beğendiğin makaleler, klasörlerin, okuma geçmişin, Bilim Defterim notların, okuma serin ve uygulama tercihlerin.': 'Papers you like, your folders, reading history, Research Notebook entries, reading streak and app preferences.',
  'Uygulamanın çalışması, güvenliği ve hata ayıklama için hizmet sağlayıcıların işleyebileceği bağlantı ve cihaz bilgileri. Bu verilerin kapsamı ilgili sağlayıcının teknik işleyişine bağlıdır.': 'Connection and device information that service providers may process to operate, secure and troubleshoot the app. The scope of this data depends on each provider’s technical operations.',
  'Yalnızca isteğe bağlı analitik iznini verirsen PostHog üzerinden uygulama etkileşimlerine ilişkin kullanım istatistikleri.': 'Usage statistics about app interactions collected through PostHog only if you grant optional analytics consent.',
  'Hesap oturumunu sağlamak; beğenilerini, notlarını ve tercihlerini saklamak ve cihazların arasında eşitlemek; makale keşfi ve kişiselleştirme özelliklerini sunmak; uygulamanın güvenliğini, sürekliliğini ve performansını korumak; yalnızca izin verdiğinde kullanım istatistikleri oluşturmak.': 'To provide account sessions; store and sync your likes, notes and preferences across devices; provide paper discovery and personalization features; maintain app security, availability and performance; and generate usage statistics only when you consent.',
  'Giriş yapmadan kullanılan bazı tercihler ve içerikler tarayıcının yerel depolama alanında tutulur. Hesapla giriş yaptığında eşitleme için hesap verileri Supabase altyapısındaki veritabanına; profil fotoğrafın ilgili dosya depolama alanına kaydedilebilir. Makale arama ve bibliyografik bilgiler OpenAlex gibi harici akademik veri hizmetlerinden alınır; arama isteğin bu hizmetlere iletilebilir.': 'Some preferences and content used without signing in are stored in your browser’s local storage. When you sign in, account data may be stored in a Supabase database for synchronization, and your profile photo may be stored in the associated file storage. Paper searches and bibliographic information are retrieved from external academic data services such as OpenAlex; your search query may be sent to those services.',
  'Analitik izni verdiğinde kullanım olayları PostHog hizmetine iletilir. Bu hizmet sağlayıcılar, kendi altyapıları ve sözleşmeleri kapsamında verileri işleyebilir. Altyapı sağlayıcılarının sunucu konumları ve uluslararası veri aktarım mekanizmaları kullanılan hesap/plan yapılandırmasına göre değişebilir; bu nedenle belirli bir ülkeye aktarım olmadığı garanti edilmez.': 'If you grant analytics consent, usage events are sent to PostHog. These service providers may process data under their own infrastructure and contractual terms. Server locations and international data-transfer mechanisms may vary depending on the account and plan configuration; therefore, transfer to a particular country cannot be ruled out.',
  'Abstract kişisel verilerini reklam amacıyla üçüncü kişilere satmayı amaçlamaz. Veriler; hizmetin sunulması, güvenliği veya hukuki yükümlülüklerin yerine getirilmesi için gerekli olduğu ölçüde ilgili altyapı sağlayıcıları ya da yetkili makamlarla paylaşılabilir.': 'Abstract does not intend to sell personal data to third parties for advertising. Data may be shared with relevant infrastructure providers or competent authorities to the extent necessary to provide and secure the service or meet legal obligations.',
  'Abstract şu anda tercihleri ve uygulama verilerini hatırlamak için ağırlıklı olarak tarayıcı yerel depolamasını kullanır; bu kayıtlar klasik HTTP çerezleriyle aynı şey değildir. Zorunlu kayıtlar uygulamanın temel işlevleri için kullanılır. PostHog analitiği, çerez tercih penceresinde “Tümünü kabul et” seçilmedikçe başlatılmaz. Tercihini Ayarlar bölümünden yeniden düzenleyebilirsin. Tarayıcı verilerini silmen, bu cihazdaki yerel kayıtları kaldırabilir.': 'Abstract currently relies mainly on browser local storage to remember preferences and app data; these records are not the same as conventional HTTP cookies. Essential records support core app functions. PostHog analytics does not start unless you select “Accept all” in the cookie preferences window. You can change your choice in Settings. Clearing browser data may remove local records from this device.',
  'Yerel veriler tarayıcı depolamasını temizleyene kadar; hesap verileri ise hesabın ve ilgili hizmetin çalışması için gerekli olduğu sürece saklanır. Yedekler, güvenlik kayıtları ve hizmet sağlayıcı kayıtları kendi saklama döngülerine tabi olabilir. Verilerin korunması için makul teknik ve idari önlemler uygulanır; ancak internet üzerinden aktarım veya elektronik saklama yöntemlerinin mutlak güvenliği garanti edilemez.': 'Local data is retained until you clear your browser storage. Account data is retained for as long as necessary to operate your account and the relevant service. Backups, security logs and provider records may follow their own retention cycles. Reasonable technical and organizational safeguards are used, but absolute security of internet transmissions or electronic storage cannot be guaranteed.',
  'Uygulanabildiği ölçüde 6698 sayılı Kişisel Verilerin Korunması Kanunu\'nun 11. maddesi ve ilgili diğer mevzuat kapsamında kişisel verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, işleme amacını öğrenme, aktarılan üçüncü kişileri bilme, eksik veya yanlış verilerin düzeltilmesini ve kanuni şartlar dahilinde silinmesini/yok edilmesini isteme, otomatik analiz sonuçlarına itiraz etme ve kanunda belirtilen şartlarda zararın giderilmesini talep etme haklarına sahipsin.': 'Where applicable, under Article 11 of Türkiye’s Personal Data Protection Law No. 6698 and other relevant legislation, you may have the right to learn whether your personal data is processed, request information, learn the purposes of processing and the third parties to whom data is transferred, request correction of incomplete or inaccurate data and deletion where legally permitted, object to automated analysis results, and seek compensation under the conditions set out by law.',
  'Abstract için ayrı bir e-posta veya başvuru adresi henüz yayımlanmamıştır. Başvuru kanalı belirlendiğinde bu sayfada duyurulacaktır. Bu eksiklik nedeniyle bu metin tek başına resmî başvuru kanalının yerine geçtiği şeklinde yorumlanmamalıdır.': 'A dedicated email address or contact channel for Abstract has not yet been published. It will be announced on this page once established. This notice should not be interpreted as a substitute for a formal contact channel.',
  'Abstract özellikle çocuklara yönelik tasarlanmamıştır. Ebeveyn veya yasal temsilci, bir çocuğa ait kişisel verinin uygun olmayan biçimde işlendiğini düşünüyorsa yayımlanacak başvuru kanalı üzerinden bildirimde bulunabilir.': 'Abstract is not specifically designed for children. If a parent or legal guardian believes that a child’s personal data has been processed inappropriately, they may report this through the contact channel that will be published.',
  'Platformun özellikleri, kullanılan hizmetler veya mevzuat değiştikçe bu politika güncellenebilir. Güncel metin her zaman Abstract\'ın Ayarlar bölümünde yayımlanır; önemli değişiklikler uygun olduğunda uygulama içinde duyurulur.': 'This policy may be updated as platform features, services or applicable laws change. The current version is published in Abstract’s Settings section; significant changes will be announced in the app where appropriate.',
  'Bu metin Abstract\'ın mevcut teknik işleyişi esas alınarak hazırlanmış genel bilgilendirmedir; hukuki danışmanlık veya mevzuata tam uyum garantisi değildir. Özellikle veri sorumlusu iletişim kanalı, saklama süreleri, hizmet sağlayıcı sözleşmeleri ve uluslararası aktarım mekanizmaları netleştirilerek yayına alınmadan önce hukuk uzmanı tarafından gözden geçirilmelidir.': 'This notice is general information based on Abstract’s current technical operation; it is not legal advice or a guarantee of full legal compliance. In particular, the data controller’s contact channel, retention periods, service-provider agreements and international transfer mechanisms should be clarified and reviewed by a legal professional before publication.',
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

const TR_MONTHS: Record<string, string> = {
  Ocak: 'January', Şubat: 'February', Mart: 'March', Nisan: 'April',
  Mayıs: 'May', Haziran: 'June', Temmuz: 'July', Ağustos: 'August',
  Eylül: 'September', Ekim: 'October', Kasım: 'November', Aralık: 'December',
};
const EN_MONTHS_TO_TR: Record<string, string> = Object.fromEntries(
  Object.entries(TR_MONTHS).map(([tr, en]) => [en, tr])
);

function translateKnownText(value: string, lang: Language): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const dictionary = lang === 'en' ? { ...KEY_TRANSLATIONS, ...LEGACY_UI_EN } : EN_TO_TR;
  const translated = dictionary[trimmed];
  if (translated) return value.replace(trimmed, translated);

  // Localized long dates are rendered by native Intl calls in several screens.
  // Convert only recognizable day-month-year date fragments.
  const months = lang === 'en' ? TR_MONTHS : EN_MONTHS_TO_TR;
  const monthPattern = lang === 'en'
    ? /(\\d{1,2})\\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\\s+(\\d{4})/g
    : /(\\d{1,2})\\s+(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(\\d{4})/g;
  if (monthPattern.test(value)) {
    monthPattern.lastIndex = 0;
    return value.replace(monthPattern, (_whole, day, month, year) => `${day} ${months[month] || month} ${year}`);
  }

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
