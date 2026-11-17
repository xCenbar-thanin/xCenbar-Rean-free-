# 🪷 xCenBar Rean Free — Beta Testing (GitHub Pages)

គេហទំព័ររៀនឥតគិតថ្លៃជាភាសាខ្មែរ៖ English · ភាសាចិន HSK 1–9 · Programming · Design · Office — **កំណែសាកល្បងសម្រាប់មិត្ត ២–៥ នាក់**។

## 🚀 ដាក់លើ GitHub Pages (១០ នាទី)
1. ចូល https://github.com → **New repository** → ឈ្មោះ `xcenbar-rean-free` → **Public** → Create
2. ចុច **uploading an existing file** → អូសឯកសារ *ទាំងអស់ពីក្នុង* Folder `xcenbar-rean-free/` (រួមទាំង Folder `.github`) → **Commit changes**
   - ឬប្រើ Git៖
   ```bash
   cd xcenbar-rean-free
   git init && git add . && git commit -m "xCenBar Rean Free beta"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/xcenbar-rean-free.git
   git push -u origin main
   ```
3. Repository › **Settings › Pages** › Source = **GitHub Actions**
4. រង់ចាំ ~១ នាទី (មើល Tab **Actions**) → តំណ៖ `https://YOUR-USERNAME.github.io/xcenbar-rean-free/`
5. ក្នុង `config.js` ប្តូរ `YOUR-USERNAME` ក្នុង `FEEDBACK_URL` ជាឈ្មោះ GitHub របស់អ្នក

## 👥 អញ្ជើញមិត្ត ២–៥ នាក់មកសាកល្បង
1. ផ្ញើតំណគេហទំព័រ + **លេខកូដអញ្ជើញ**៖ `XCB-FRIENDS-2026` (ប្តូរបានក្នុង `config.js` › `INVITE_CODE`)
2. មិត្តបង្កើតគណនី (Name + Email + Password + កូដ) ហើយចាប់ផ្តើមរៀន
3. មិត្តរាយការណ៍កំហុសតាមប៊ូតុង **🐞 Feedback** (GitHub Issues) — ត្រូវមានគណនី GitHub
4. ចង់ឱ្យមិត្តជួយកែកូដ៖ Settings › **Collaborators** › Add people

> ⚠️ **ចំណាំ**៖ GitHub Pages របស់ Repository ឥតគិតថ្លៃ គឺ **Public** — អ្នកណាមានតំណក៏បើកបាន។ លេខកូដអញ្ជើញការពារត្រឹមការចុះឈ្មោះនៅលើទំព័រ (មិនមែនសុវត្ថិភាពពិតប្រាកដ)។ គណនីក្នុងកំណែនេះរក្សាក្នុង Browser នីមួយៗ — មិត្តម្នាក់ៗមានគណនីលើឧបករណ៍ខ្លួនឯង។ ចង់បានគណនី Cloud ពិត សូមមើល `SUPABASE_URL` ក្នុង `config.js`។

## 🧪 អ្វីដែលត្រូវសាកល្បង — មើល [TESTERS.md](TESTERS.md)

## 📁 រចនាសម្ព័ន្ធ
```
index.html                ទំព័រដើម · វគ្គ · Profile · Login/Sign up · Timer · ពណ៌ផ្ទៃ
config.js                 ការកំណត់ (Invite code, Feedback, Supabase)
assets/                   app.css · app.js · lesson.js · logo.svg · icons/*.svg · catalog.js
lessons/*.html            មេរៀនទាំងអស់
.github/workflows/        Deploy ស្វ័យប្រវត្តិទៅ GitHub Pages ពេល push
.github/ISSUE_TEMPLATE/   ទម្រង់រាយការណ៍កំហុស និងគំនិត
```
