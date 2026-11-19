import React, { useEffect } from 'react';
import { X, ShieldCheck, Cookie, FileText, Copyright, AlertTriangle, Mail, ExternalLink } from 'lucide-react';

export type LegalDocumentKey = 'privacy' | 'cookies' | 'terms' | 'copyright' | 'disclaimer';

const CONTACT = 'abstractk.info@gmail.com';
const updated = '20 Kasım 2026';

const documents: Record<LegalDocumentKey, { title: string; icon: React.ReactNode; body: React.ReactNode }> = {
  privacy: {
    title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni',
    icon: <ShieldCheck className="w-4 h-4" />,
    body: <>
      <p className="text-[11px] text-slate-500">Son güncelleme: {updated}</p>
      <h4>1.1. Veri sorumlusu</h4>
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca veri sorumlusu, https://abstractk.vercel.app adresinden sunulan Abstract web uygulamasının yayıncısı Binali Furkan Alper’dir (“Yayıncı”). İletişim: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
      <h4>1.2. İşlenen kişisel veriler, amaçlar ve hukuki sebepler</h4>
      <ul>
        <li><b>Kimlik ve iletişim:</b> Hesap oluşturduğunuzda e-posta, görünen ad, profil fotoğrafı ve Google ile girişte Google hesap adı/fotoğrafı; hesabın oluşturulması, kimlik doğrulama ve profilin gösterilmesi amacıyla, sözleşmenin kurulması/ifası hukuki sebebine dayanarak işlenir (KVKK m.5/2-c).</li>
        <li><b>Hesap güvenliği:</b> Şifre yalnızca şifrelenmiş/özet biçimde ve oturum belirteçleri; güvenli giriş ve şifre yenileme amacıyla, sözleşmenin ifası ve meşru menfaat kapsamında işlenir (m.5/2-f).</li>
        <li><b>Kullanıcı içeriği:</b> Beğenilen makaleler, klasörler, Bilim Defterim notları/alıntıları/soruları, okuma geçmişi, günlük hedef/seri bilgisi ve uygulama ayarları; hizmetin sunulması ve cihazlar arası eşitleme amacıyla işlenir.</li>
        <li><b>İlgi profili:</b> Okuma/beğeni verilerinden türetilen alan, alt alan, anahtar kelime ve başlık terimleri ile makale kimlikleri; yalnızca hesapla giriş yapan kullanıcılar için kişiselleştirilmiş ve benzer ilgi alanlarına dayalı öneriler amacıyla, Bölüm 6’daki açık rıza kapsamında işlenir.</li>
        <li><b>İşlem güvenliği ve teknik veriler:</b> IP adresi, tarayıcı/cihaz bilgisi, erişim zamanı ve hata kayıtları; sitenin sunulması, güvenliği ve kötüye kullanımın önlenmesi amacıyla meşru menfaat kapsamında işlenir (m.5/2-f).</li>
        <li><b>Kullanım istatistikleri (PostHog):</b> Sekme ve makale etkileşimleri ile filtre kullanım durumu; yalnızca “Tümünü kabul et” tercihiyle açık rıza verilirse ürün iyileştirme ve istatistik amacıyla işlenir (m.5/1).</li>
      </ul>
      <p>Abstract; ad-soyad ile kullanıcı ismi, ırk, din, sağlık, siyasi görüş vb. özel nitelikli kişisel verileri bilerek istemez ve işlemez. Not alanlarına ve arama kutularına bu tür verileri yazmamanızı rica ederiz. Bilim Defterim’e kendi iradenizle yazdığınız içerikten siz sorumlusunuz.</p>
      <h4>1.3. Verilerin toplanma yöntemi</h4>
      <p>Veriler; kayıt, profil, not ve filtre formları, tarayıcı yerel depolaması, hesap altyapısı ve (rızanız varsa) analitik aracı aracılığıyla otomatik veya kısmen otomatik yollarla toplanır.</p>
      <h4>1.4. Verilerin aktarıldığı taraflar</h4>
      <p>Kişisel verileriniz satılmaz ve reklam amacıyla kullanılmaz. Veriler, hizmetin sunulması için gerekli olduğu ölçüde şu hizmet sağlayıcılarla paylaşılabilir:</p>
      <ul>
        <li>Supabase Inc. — hesap, veritabanı ve dosya depolama.</li>
        <li>Vercel Inc. — barındırma ve içerik dağıtımı.</li>
        <li>Google LLC — Google ile giriş (kullandığınızda), Google Fonts ve “blup” çeviri özelliğini açtığınızda makale başlığı/özeti çevirisi.</li>
        <li>OpenAlex (OurResearch) — makale arama ve bibliyografik veri; arama ve filtre sorguları bu servise iletilir.</li>
        <li>PostHog Inc. — yalnızca rıza verirseniz kullanım istatistikleri.</li>
        <li>Yasal yükümlülük hâlinde yetkili kamu kurum ve kuruluşları.</li>
      </ul>
      <h4>1.5. Yurt dışına aktarım</h4>
      <p>Hizmet sağlayıcılarının sunucuları yurt dışında (ör. ABD veya AB) bulunabilir. Bu nedenle verileriniz KVKK m.9 ve ilgili mevzuat kapsamında yurt dışına aktarılabilir. Aktarım, Kanun’da öngörülen güvence mekanizmalarına (yeterlilik kararı, standart sözleşme vb.) veya ilgili durumlarda açık rızanıza dayanır. Analitik amaçlı aktarım yalnızca açık rızanızla yapılır; rızanızı çerez tercihlerinden istediğiniz an geri çekebilirsiniz.</p>
      <h4>1.6. Saklama süresi</h4>
      <ul>
        <li>Yerel veriler: Tarayıcı verilerini silene veya çıkış yapana kadar cihazınızda kalır.</li>
        <li>Hesap verileri: Hesabınız açık olduğu sürece; hesap silme talebinizden sonra makul sürede, en geç 30 gün içinde silinir veya anonim hâle getirilir.</li>
        <li>Analitik veriler: PostHog tarafında en fazla 12 ay.</li>
        <li>Güvenlik/erişim kayıtları: Hizmet sağlayıcıların standart döngüsü uyarınca; yasal saklama yükümlülükleri saklıdır.</li>
      </ul>
      <h4>1.7. KVKK m.11 kapsamındaki haklarınız</h4>
      <p>Veri sorumlusuna başvurarak kişisel verilerinizin işlenip işlenmediğini öğrenme; işlenmişse bilgi isteme; işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme; yurt içi/yurt dışı aktarıldığı üçüncü kişileri bilme; eksik/yanlış işlenmişse düzeltilmesini isteme; KVKK m.7 çerçevesinde silinmesini/yok edilmesini ve bunun aktarılan üçüncü kişilere bildirilmesini isteme; münhasıran otomatik sistemlerle analiz sonucu aleyhinize bir sonuç doğmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğrarsanız zararın giderilmesini talep etme haklarına sahipsiniz.</p>
      <p><b>Başvuru yolu:</b> Taleplerinizi kimliğinizi doğrulayacak bilgilerle birlikte <a href={`mailto:${CONTACT}`}>{CONTACT}</a> adresine yazılı olarak iletebilirsiniz. Başvurular, talebin niteliğine göre en geç 30 gün içinde ücretsiz sonuçlandırılır; ayrıca maliyet gerektiren hâllerde Kurul tarifesindeki ücret alınabilir. Cevabı yetersiz bulursanız Kişisel Verileri Koruma Kurumu’na şikâyet hakkınız saklıdır.</p>
      <h4>1.8. Hesabı ve verileri silme</h4>
      <p>Hesabınızın ve buluttaki verilerinizin silinmesi için hesabınıza kayıtlı e-posta adresinden <a href={`mailto:${CONTACT}`}>{CONTACT}</a> adresine yazabilirsiniz. Yerel verileri tarayıcı verilerini temizleyerek silebilirsiniz.</p>
      <h4>1.9. Güvenlik</h4>
      <p>İletişim HTTPS ile şifrelenir; veritabanında satır düzeyi güvenlik (RLS) ile kullanıcıların kendi verilerine erişimi sınırlandırılır; şifreler Yayıncı tarafından görülemez. Buna rağmen internet üzerinden hiçbir aktarım veya saklama yönteminin mutlak güvenli olduğu garanti edilemez. Kişisel veri ihlali hâlinde KVKK m.12 uyarınca ilgili kişilere ve Kurul’a gecikmeksizin, Kurul’a en geç 72 saat içinde bildirim yapılır.</p>
      <h4>1.10. Profil fotoğrafı hakkında uyarı</h4>
      <p>Yüklediğiniz profil fotoğrafı teknik olarak herkese açık bir bağlantıda saklanır; bağlantıyı bilen kişiler görüntüleyebilir. Kendiniz dışında kişilerin yer aldığı veya hassas içerikli fotoğraf yüklememenizi öneririz.</p>
      <h4>1.11. Çocukların gizliliği</h4>
      <p>Abstract, 13 yaşın altındaki çocuklara yönelik değildir ve bu kişilerden bilerek veri toplamaz. Hesap oluşturan kullanıcıların 18 yaşından büyük olduğu veya 18 yaşından küçükse veli/vasisinin onayını aldığı varsayılır. Bir çocuğa ait verinin işlendiğini düşünen veli/vasi <a href={`mailto:${CONTACT}`}>{CONTACT}</a> adresinden bize ulaşabilir.</p>
      <h4>1.12. Değişiklikler</h4>
      <p>Bu metin mevzuat veya hizmet değiştikçe güncellenebilir. Güncel sürüm bu bölümde yayımlanır; önemli değişiklikler uygulama içinde duyurulur.</p>
      <h4>1.13. Topluluk önerileri / ilgi profili için açık rıza</h4>
      <p>Abstract’ın, beğendiğiniz/görüntülediğiniz makale kimliklerinizden ve bunlardan türetilen konu/alan terimlerinden bir ilgi profili oluşturmasını; bu profili benzer ilgi alanlarına sahip diğer kullanıcılarla anonim olarak eşleştirerek size makale önerileri sunmak amacıyla işlemesini kabul etmeniz gerekir. Diğer kullanıcılara kimliğiniz, adınız veya profiliniz gösterilmez. Rızanızı Ayarlar’dan dilediğiniz an geri çekebilirsiniz; geri çektiğinizde profiliniz silinir. Bu işlemenin hukuki sebebi açık rızanızdır (KVKK m.5/1). Rıza vermemeniz hâlinde yalnızca kendi geçmişinize dayalı kişisel öneriler çalışır, topluluk önerileri kapatılır.</p>
    </>
  },
  cookies: {
    title: 'Çerez ve Yerel Depolama Politikası',
    icon: <Cookie className="w-4 h-4" />,
    body: <>
      <p className="text-[11px] text-slate-500">Son güncelleme: {updated}</p>
      <h4>2.1. Genel bilgi</h4>
      <p>Abstract, klasik HTTP çerezlerinden çok tarayıcının yerel depolama (localStorage) alanını kullanır. Bu kayıtlar çerezlerle benzer amaçla kullanıldığı için bu politikada birlikte ele alınmıştır. Zorunlu kayıtlar dışında hiçbir kayıt, izniniz olmadan kurulmaz.</p>
      <h4>2.2. Kullandığımız kayıtlar</h4>
      <ul>
        <li><b>Zorunlu yerel kayıtlar:</b> abs_s, abs_liked, abs_folders, abs_notes, abs_history ve abs_streak; ayarlarınızı, beğenilerinizi, klasörlerinizi, notlarınızı, okuma geçmişinizi ve serinizi hatırlamak için kullanılır. Siz silene kadar saklanır; hizmet için zorunludur.</li>
        <li><b>Zorunlu tercih ve oturum kayıtları:</b> abs_guest, abs_tour_done, abs_seyir_tour_done, abs_cookie_consent, abs_sync_uid ve Supabase oturum kayıtları; misafir/tur/çerez tercihini, eşitlenen hesabı ve oturumunuzu hatırlamak için kullanılır.</li>
        <li><b>Google Fonts:</b> Sayfa yazı tiplerinin yüklenmesi için kullanılır; sayfa yüklendiğinde IP adresiniz Google’a iletilebilir. Tarayıcı önbelleğine göre saklanır.</li>
        <li><b>PostHog (isteğe bağlı analitik):</b> Anonim kullanım istatistikleri içindir. Otomatik yakalama ve oturum kaydı kapalıdır. Yalnızca “Tümünü kabul et” açık rızasıyla etkinleşir.</li>
      </ul>
      <h4>2.3. Tercihlerinizi yönetme</h4>
      <p>İlk ziyarette çıkan pencerede “Tümünü kabul et” veya “Yalnızca zorunlu” seçeneklerinden birini seçebilirsiniz. Seçiminizi istediğiniz an Ayarlar bölümündeki “Çerezler ve Gizlilik” alanından “Tercihleri yönet” düğmesiyle değiştirebilir, rızanızı geri çekebilirsiniz. Rıza vermemeniz hâlinde uygulamanın temel işlevleri etkilenmez. Tarayıcı ayarlarınızdan yerel depolamayı da silebilirsiniz; bu durumda yerel verileriniz kaybolabilir.</p>
      <h4>2.4. Üçüncü taraf kaynaklar</h4>
      <p>Google Fonts gibi dış kaynaklar sayfa yüklendiğinde IP adresinizi ilgili sağlayıcıya iletebilir.</p>
    </>
  },
  terms: {
    title: 'Kullanım Koşulları',
    icon: <FileText className="w-4 h-4" />,
    body: <>
      <p className="text-[11px] text-slate-500">Son güncelleme: {updated}</p>
      <h4>3.1. Taraflar ve kabul</h4><p>Bu koşullar, Abstract’ı (https://abstractk.vercel.app) kullanan kişi (“Kullanıcı”) ile yayıncı Binali Furkan Alper (“Yayıncı”) arasındadır. Siteyi kullanarak veya hesap oluşturarak bu koşulları kabul etmiş olursunuz.</p>
      <h4>3.2. Hizmetin tanımı</h4><p>Abstract, ücretsiz sunulan akademik makale keşif ve kişisel okuma arşivi aracıdır. Makale verileri üçüncü taraf kaynaklardan (OpenAlex) alınır; Yayıncı bu içeriklerin yazarı veya yayıncısı değildir.</p>
      <h4>3.3. Hesap</h4><p>Hesap isteğe bağlıdır. Doğru bilgi vermek, şifrenizi gizli tutmak ve hesabınızdaki faaliyetlerden sorumlu olmak size aittir. Yetkisiz kullanımı fark ederseniz derhal bildirmelisiniz.</p>
      <h4>3.4. Kabul edilebilir kullanım</h4><p>Hizmeti bot veya scraper gibi otomatik araçlarla toplu veri çekmek ya da aşırı yük bindirmek; güvenlik önlemlerini aşmak, sisteme izinsiz erişmek veya zarar vermek; başkalarının haklarını ihlal eden, hukuka aykırı, hakaret veya nefret içeren içerik girmek; hizmeti tersine mühendislikle çözmek veya kaynak kodunu izinsiz kopyalamak; yanıltıcı kimlik kullanmak yasaktır.</p>
      <h4>3.5. Kullanıcı içeriği</h4><p>Notlarınız, alıntılarınız, klasörleriniz ve profil fotoğrafınız size aittir. Bu içeriği yalnızca hizmeti sunmak (saklama, eşitleme, görüntüleme) amacıyla işlememiz için bize sınırlı, münhasır olmayan, ücretsiz bir kullanım izni vermiş olursunuz. İçeriğinizin hukuka uygunluğundan ve üçüncü kişilerin haklarını ihlal etmemesinden siz sorumlusunuz. Notlara başkasına ait telifli metinleri uzun alıntılarla eklememenizi öneririz.</p>
      <h4>3.6. Fikri mülkiyet</h4><p>Abstract’ın adı, logosu, tasarımı, arayüzü, yazılımı, görselleri, metinleri ve özgün öğeleri Yayıncı’ya aittir ve ilgili mevzuatla korunur. Yazılı izin olmadan kopyalanamaz, çoğaltılamaz, dağıtılamaz veya ticari amaçla kullanılamaz. Üçüncü taraf makale içerikleri için Telif Hakkı bölümüne bakınız.</p>
      <h4>3.7. Üçüncü taraf bağlantılar ve hizmetler</h4><p>Makale kaynakları, DOI ve diğer dış bağlantıların içeriğinden ve gizlilik uygulamalarından Yayıncı sorumlu değildir.</p>
      <h4>3.8. Sorumluluğun sınırlandırılması</h4><p>Hizmet “olduğu gibi” ve “mevcut olduğu şekliyle” sunulur. Yayıncı; hizmetin kesintisiz, hatasız veya her zaman erişilebilir olacağını, makale verilerinin doğru, eksiksiz ve güncel olduğunu ya da cihazlar arası eşitlemenin veri kaybı yaşatmayacağını garanti etmez. Emredici hukuk hükümleri saklı kalmak üzere; kast ve ağır kusur hâlleri hariç, hizmetin kullanımından veya kullanılamamasından doğan dolaylı, arızi ve sonuçsal zararlardan, kâr/veri kaybından sorumlu tutulamaz. Önemli verilerinizi ayrıca yedeklemenizi öneririz.</p>
      <h4>3.9. Akademik ve hukuki amaçla kullanım</h4><p>Abstract’taki içerik, atıf kaynağı veya resmî bir bilgi kaynağı yerine geçmez. Akademik çalışmalarda kaynağı yayıncının orijinal sayfasından doğrulamanız gerekir.</p>
      <h4>3.10. Hizmette değişiklik, askıya alma ve sonlandırma</h4><p>Yayıncı hizmeti veya özelliklerini önceden bildirmeksizin değiştirebilir ya da durdurabilir; bu koşulları ihlal eden hesapları askıya alabilir veya kapatabilir. Siz de hesabınızı istediğiniz an sildirmek için başvurabilirsiniz.</p>
      <h4>3.11. Koşullarda değişiklik</h4><p>Yayıncı bu koşulları güncelleyebilir. Güncel koşullar yayımlandığı tarihten itibaren geçerlidir; hizmeti kullanmaya devam etmeniz güncel koşulları kabul ettiğiniz anlamına gelir.</p>
      <h4>3.12. Uygulanacak hukuk ve yetki</h4><p>Bu koşullara Türk hukuku uygulanır. Uyuşmazlıklarda Ankara Mahkemeleri ve İcra Daireleri yetkilidir; tüketici mevzuatından doğan zorunlu yetki ve başvuru hakları saklıdır.</p>
      <h4>3.13. İletişim</h4><p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </>
  },
  copyright: {
    title: 'Telif Hakkı ve Üçüncü Taraf Veri Bildirimi',
    icon: <Copyright className="w-4 h-4" />,
    body: <>
      <p className="text-[11px] text-slate-500">Son güncelleme: {updated}</p>
      <h4>4.1. Veri kaynağı</h4><p>Makale başlıkları, özetleri, yazar, kurum, dergi ve atıf bilgileri OpenAlex (https://openalex.org) açık bibliyografik veri tabanından alınır. OpenAlex verileri CC0 lisansıyla sunulur. Bibliyografik veriye katkısı için OpenAlex’e teşekkür ederiz.</p>
      <h4>4.2. Özetlerin hakları</h4><p>Makale özetleri ve tam metinleri ilgili yazarlara ve/veya yayıncılara aittir. Abstract bu içeriklerin sahibi veya yayıncısı olduğunu iddia etmez; içerik yalnızca bilimsel keşif, bilgilendirme ve kaynağa yönlendirme amacıyla, kaynağına atıf yapılarak ve orijinal kaynağa bağlantı verilerek gösterilir. Tam metne erişim ilgili yayıncının sayfasındadır.</p>
      <h4>4.3. Kişisel kullanım</h4><p>Kullanıcılar, beğendikleri makalelerin bilgilerini yalnızca kişisel, ticari olmayan, akademik/eğitsel amaçla yazdırabilir ve dışa aktarabilir. Dışa aktarılan çıktıların yeniden yayımlanması, çoğaltılması veya ticari kullanımı ilgili hak sahiplerinin iznini gerektirebilir ve kullanıcı sorumluluğundadır.</p>
      <h4>4.4. Çeviri</h4><p>“blup” çeviri özelliği otomatik çeviri sunar; resmî veya doğrulanmış bir çeviri değildir. Çeviri hataları olabilir; orijinal metin esas alınmalıdır.</p>
      <h4>4.5. Marka ve logolar</h4><p>Üçüncü tarafların ad, marka ve logoları ilgili sahiplerine aittir. Abstract’ın bunlarla resmî bir bağlantısı, ortaklığı veya onayı yoktur.</p>
      <h4>4.6. Telif hakkı ihlali bildirimi ve kaldırma talebi</h4><p>Bir içeriğin hakkınızı ihlal ettiğini düşünüyorsanız <a href={`mailto:${CONTACT}`}>{CONTACT}</a> adresine şu bilgilerle başvurun: adınız ve iletişim bilgileriniz; hak sahibi olduğunuzu gösteren bilgi; ihlal iddiasına konu içeriğin bağlantısı; iddianızın gerekçesi; bilgilerin doğruluğuna dair beyan. Geçerli başvurular makul sürede incelenir; haklı bulunan talepler doğrultusunda ilgili içerik sitemizde gösterilmez (5846 sayılı FSEK ve 5651 sayılı Kanun çerçevesinde). Bildirimin hukuka aykırı olması hâlinde sorumluluk bildirimciye aittir.</p>
      <h4>4.7. Telif bildirimi</h4><p>© 2026 Binali Furkan Alper. Abstract’ın özgün yazılımı, tasarımı ve metinleri üzerindeki tüm hakları saklıdır. Makale içeriği ilgili hak sahiplerine aittir; bibliyografik veriler OpenAlex (CC0) kaynaklıdır.</p>
    </>
  },
  disclaimer: {
    title: 'Sorumluluk Reddi',
    icon: <AlertTriangle className="w-4 h-4" />,
    body: <p>Abstract, makalelerin içeriğini üretmez; üçüncü taraf kaynaklardan alınan bilgileri bilimsel keşif amacıyla listeler. Bilgilerin doğruluğu, güncelliği ve eksiksizliği garanti edilmez. Çeviriler otomatiktir. İçerik; tıbbi, hukuki, mali veya mesleki tavsiye değildir. Önemli kararlar için lütfen orijinal kaynağı inceleyin ve uzmanlara danışın.</p>
  }
};

export const LegalDocumentModal: React.FC<{ documentKey: LegalDocumentKey; onClose: () => void }> = ({ documentKey, onClose }) => {
  const document = documents[documentKey];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="legal-document-title" className="w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85dvh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-[#c5dfe9] dark:border-[#17435c] bg-[#f7fbfd] dark:bg-[#071828] shadow-2xl">
        <header className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-[#c5dfe9] dark:border-[#17435c] shrink-0">
          <span className="w-9 h-9 rounded-xl bg-[#dff0f7] dark:bg-[#0d2236] text-sky-700 dark:text-sky-300 flex items-center justify-center">{document.icon}</span>
          <h3 id="legal-document-title" className="flex-1 min-w-0 text-sm sm:text-base font-bold text-[#0a2540] dark:text-[#e0f4ff]">{document.title}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-full flex items-center justify-center text-[#4a7a96] hover:bg-sky-100 dark:hover:bg-[#0d2f45]"><X className="w-5 h-5" /></button>
        </header>
        <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 text-[12px] sm:text-[13px] leading-[1.75] text-[#31566e] dark:text-[#b5d4e4] legal-document-content">
          {document.body}
          <div className="mt-6 pt-4 border-t border-[#c5dfe9] dark:border-[#17435c] text-[11px] flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" /><a href={`mailto:${CONTACT}`} className="font-semibold text-sky-700 dark:text-sky-300">{CONTACT}</a></div>
          <p className="mt-3 text-[10px] text-slate-500">Bu metinler bilgilendirme amacı taşır; hukuki danışmanlık yerine geçmez. Yayına alınmadan önce hukuk uzmanı tarafından kontrol edilmesi önerilir.</p>
        </div>
      </section>
    </div>
  );
};

export const LegalDocumentLinks: React.FC<{ onOpen: (key: LegalDocumentKey) => void }> = ({ onOpen }) => {
  const links: { key: LegalDocumentKey; label: string }[] = [
    { key: 'privacy', label: 'Gizlilik ve KVKK' },
    { key: 'cookies', label: 'Çerezler' },
    { key: 'terms', label: 'Kullanım koşulları' },
    { key: 'copyright', label: 'Telif hakkı' },
    { key: 'disclaimer', label: 'Sorumluluk reddi' }
  ];
  return <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-[10px] sm:text-[11px] text-[#7895a7] dark:text-[#64879c]">
    {links.map((link, index) => <React.Fragment key={link.key}>
      {index > 0 && <span aria-hidden="true" className="opacity-50">·</span>}
      <button type="button" onClick={() => onOpen(link.key)} className="hover:text-sky-700 dark:hover:text-sky-300 underline-offset-2 hover:underline">{link.label}</button>
    </React.Fragment>)}
  </div>;
};
