# xCenBar Rean Free — Hosting (ដាក់លើអ៊ីនធឺណិតឱ្យគេប្រើទូទាំងពិភពលោក)

គេហទំព័រនេះជា **Static website** (HTML/CSS/JS សុទ្ធ) — មិនត្រូវការ Server ពិសេស ឬ Build ទេ។ Upload Folder `xcenbar-rean-free` ទាំងមូល។

## ✅ ជម្រើសទី ១ — Netlify (ងាយបំផុត · ឥតគិតថ្លៃ)
1. ចូល https://app.netlify.com/drop
2. អូស (Drag) Folder `xcenbar-rean-free` ដាក់ក្នុងទំព័រ
3. បានតំណ `https://….netlify.app` ភ្លាម → ប្តូរឈ្មោះក្នុង Site settings › Domain

## ✅ ជម្រើសទី ២ — Cloudflare Pages (លឿននៅអាស៊ី)
1. https://dash.cloudflare.com › Workers & Pages › Create › Pages › **Upload assets**
2. Upload Folder → Deploy → បាន `https://….pages.dev`

## ✅ ជម្រើសទី ៣ — Hosting ធម្មតា (cPanel / DirectAdmin)
1. File Manager › `public_html`
2. Upload ZIP → Extract → ផ្លាស់ឯកសារពីក្នុង `xcenbar-rean-free/` ទៅ `public_html/`
3. ឯកសារ `.htaccess` មានស្រាប់ (cache, gzip, 404)

## 🌐 Domain ផ្ទាល់ខ្លួន
ទិញ Domain (ឧ. `xcenbar.com`) → ក្នុង Netlify/Cloudflare ចុច **Add custom domain** → ធ្វើតាមការណែនាំ DNS → HTTPS ដំណើរការស្វ័យប្រវត្តិ។

## 👤 គណនី (Login / Sign up)
- **លំនាំដើម**៖ គណនីរក្សាទុកក្នុង Browser របស់អ្នកប្រើម្នាក់ៗ (ពាក្យសម្ងាត់ត្រូវ hash SHA-256)។ សមរម្យសម្រាប់សាកល្បង — ប៉ុន្តែគណនីមិនតាមអ្នកប្រើទៅឧបករណ៍ផ្សេងទេ ហើយ **មិនមែនជាសុវត្ថិភាពពិតប្រាកដ** (អ្នកចេះបច្ចេកទេសអាចបើកមេរៀនដោយផ្ទាល់)។
- **ដើម្បីបានគណនីពិត (Cloud) សម្រាប់អ្នកប្រើទូទាំងពិភពលោក**៖
  1. បង្កើតគម្រោងឥតគិតថ្លៃនៅ https://supabase.com
  2. Project Settings › API → ចម្លង **Project URL** និង **anon public key**
  3. ដាក់ក្នុង `config.js`៖ `SUPABASE_URL` និង `SUPABASE_ANON_KEY`
  4. Authentication › URL Configuration › Site URL = តំណគេហទំព័ររបស់អ្នក
  - ពេលនោះ Sign up/Login ប្រើ Email + Password ពិត មានបញ្ជាក់ Email និងប្តូរពាក្យសម្ងាត់បាន។

## ⚙️ ការកំណត់ (`config.js`)
| ឈ្មោះ | ន័យ |
|---|---|
| `REQUIRE_LOGIN` | `true` = ត្រូវចូលមុនបើកមេរៀន |
| `INVITE_CODE` | ដាក់កូដ ប្រសិនបើចង់ឱ្យតែអ្នកមានកូដចុះឈ្មោះ |
| `FEEDBACK_URL` | តំណប៊ូតុង 🐞 Feedback |

## 📁 រចនាសម្ព័ន្ធ
```
index.html            ទំព័រដើម · វគ្គ · Profile · Login
config.js             ការកំណត់
assets/               app.css · app.js · lesson.js · logo · icons/
lessons/              មេរៀន HTML ទាំងអស់ (មាន icon + ប៊ូតុងត្រឡប់ទៅទំព័រដើម)
```
## ➕ បន្ថែមមេរៀនថ្មី
1. ដាក់ឯកសារក្នុង `lessons/`
2. បន្ថែមមួយបន្ទាត់ក្នុង `assets/catalog.js` (id, file, title, en, desc, cat, size)
3. បង្កើត icon `assets/icons/<id>.svg` (ចម្លងមួយដែលមានស្រាប់ ហើយប្តូរអក្សរ/ពណ៌)
4. នៅចុងមេរៀន មុន `</body>` ដាក់៖ `<script src="../config.js"></script><script src="../assets/lesson.js" data-id="<id>"></script>`
