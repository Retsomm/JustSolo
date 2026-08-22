import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隱私權政策 | JustSolo",
  description: "JustSolo 蒐集、使用與保護個人資料的方式說明。",
};

const CONTACT_EMAIL = "112182ssss@gmail.com";
const LAST_UPDATED = "2026-08-22";

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-heading text-lg text-foreground">{children}</h2>
);

const SectionBody = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
    {children}
  </div>
);

const PrivacyPolicyPage = () => (
  <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-16 pt-24">
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl text-foreground">隱私權政策</h1>
      <p className="text-sm text-foreground/70">最後更新日期：{LAST_UPDATED}</p>
    </div>

    <SectionBody>
      <p>
        JustSolo（以下稱「本服務」）是一款協助使用者尋找對單人用餐友善之餐廳的應用程式，提供網頁版與行動裝置版（iOS／Android）。我們重視使用者的隱私，本政策說明我們會蒐集哪些資訊、如何使用這些資訊，以及使用者對自己資料所擁有的權利。使用本服務即表示您同意本政策所述之內容。
      </p>
    </SectionBody>

    <section className="flex flex-col gap-3">
      <SectionHeading>一、我們蒐集的資訊</SectionHeading>
      <SectionBody>
        <p className="text-foreground">1. 帳號資訊</p>
        <p>
          本服務僅支援以 Google 帳號登入。登入時，我們會透過 Google 取得您的電子郵件地址、姓名與大頭貼圖片，並建立對應的帳號資料。我們不會取得您的
          Google 帳號密碼。
        </p>
        <p className="text-foreground">2. 您主動提供或編輯的資訊</p>
        <p>
          您可以在個人頁面自訂顯示名稱，或上傳自訂大頭貼取代 Google 提供的頭像。
        </p>
        <p className="text-foreground">3. 位置資訊</p>
        <p>
          地圖功能會請求瀏覽器／裝置的定位權限，用來在您的裝置上就近運算最近的餐廳與步行距離。這項位置資訊僅在您的裝置上運算使用，不會傳送到我們的伺服器或被儲存。您可以隨時透過瀏覽器或系統設定拒絕或撤回定位權限，本服務其餘功能仍可正常使用。
        </p>
        <p className="text-foreground">4. 使用者互動內容</p>
        <p>
          您在使用本服務時產生的資料，包括收藏的餐廳清單，以及「單人座位回報」（回報某間餐廳是否有單人座位，可附加文字備註）。回報內容僅您本人可見與編輯，其他使用者僅會看到由多筆回報彙整而成的友善度分數，不會看到個別回報者的身分或備註內容。
        </p>
        <p className="text-foreground">5. 來自第三方的資訊</p>
        <p>
          餐廳的名稱、地址、電話、營業時間、評分、照片與評論等資訊，來自 Google
          Places API，屬於 Google
          提供之公開資料（含撰寫評論之使用者名稱），非本服務向您蒐集之個人資料。
        </p>
      </SectionBody>
    </section>

    <section className="flex flex-col gap-3">
      <SectionHeading>二、我們如何使用這些資訊</SectionHeading>
      <SectionBody>
        <p>我們僅將蒐集到的資訊用於下列目的：</p>
        <ul className="list-disc pl-5">
          <li>建立與維護您的帳號，並讓您在網頁版與行動版之間保持登入狀態</li>
          <li>提供收藏清單、單人座位回報等核心功能</li>
          <li>在您的裝置上計算餐廳距離與地圖顯示</li>
          <li>回應您透過聯絡信箱提出的問題或需求</li>
        </ul>
        <p>
          本服務目前未使用任何第三方分析或廣告追蹤工具，不會將您的個人資料用於廣告投放，也不會出售您的個人資料。
        </p>
      </SectionBody>
    </section>

    <section className="flex flex-col gap-3">
      <SectionHeading>三、資訊的分享與揭露</SectionHeading>
      <SectionBody>
        <p>除下列情形外，我們不會將您的個人資料分享給第三方：</p>
        <ul className="list-disc pl-5">
          <li>
            <span className="text-foreground">服務提供商：</span>
            我們使用 Google（帳號登入、地圖與餐廳資料）與資料庫代管服務來營運本服務，這些服務商僅依我們的指示處理必要資料。
          </li>
          <li>
            <span className="text-foreground">法律要求：</span>
            若法律、法規、傳票或政府機關要求，我們可能依法揭露必要資訊。
          </li>
        </ul>
      </SectionBody>
    </section>

    <section className="flex flex-col gap-3">
      <SectionHeading>四、Cookie 與登入狀態</SectionHeading>
      <SectionBody>
        <p>
          網頁版使用單一的登入狀態
          Cookie（僅存放必要的帳號識別資訊）以維持您的登入狀態，僅用於判斷您是否已登入，不用於廣告或跨網站追蹤。行動版則以裝置端的安全儲存空間保存登入憑證。
        </p>
      </SectionBody>
    </section>

    <section className="flex flex-col gap-3">
      <SectionHeading>五、資料儲存與安全</SectionHeading>
      <SectionBody>
        <p>
          您的帳號資料儲存於受存取控管之資料庫中，僅本服務之後端程式得以存取。我們採取合理之技術措施保護您的資料，惟請理解透過網際網路傳輸或電子方式儲存之資料，無法保證絕對安全。
        </p>
      </SectionBody>
    </section>

    <section className="flex flex-col gap-3">
      <SectionHeading>六、您的權利</SectionHeading>
      <SectionBody>
        <p>
          您可以隨時在個人頁面查看與修改您的顯示名稱與大頭貼。若您希望刪除您的帳號與所有相關資料（包括收藏清單與單人座位回報），請透過下方聯絡信箱提出申請，我們會在確認身分後盡快處理刪除作業。
        </p>
      </SectionBody>
    </section>

    <section className="flex flex-col gap-3">
      <SectionHeading>七、兒童隱私</SectionHeading>
      <SectionBody>
        <p>
          本服務並非針對兒童設計，我們不會在明知的情況下蒐集 13
          歲以下兒童之個人資料。若您是兒童之家長或監護人，發現您的孩子在未經您同意的情況下向我們提供了個人資料，請透過下方聯絡信箱與我們聯繫，我們會盡快刪除相關資料。
        </p>
      </SectionBody>
    </section>

    <section className="flex flex-col gap-3">
      <SectionHeading>八、政策異動</SectionHeading>
      <SectionBody>
        <p>
          我們可能不定期更新本政策，更新後將修改本頁面上方之「最後更新日期」。若有重大變更，我們會透過適當方式（例如應用程式內通知）另行告知。建議您定期查閱本頁面以掌握最新內容。
        </p>
      </SectionBody>
    </section>

    <section className="flex flex-col gap-3">
      <SectionHeading>九、聯絡我們</SectionHeading>
      <SectionBody>
        <p>
          若您對本隱私權政策或您的個人資料有任何問題，歡迎透過以下信箱與我們聯繫：
          <br />
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </SectionBody>
    </section>
  </main>
);

export default PrivacyPolicyPage;
