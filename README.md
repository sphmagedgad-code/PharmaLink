# PharmaLink OS — نسخة التشغيل المباشر (Static Web App)

## ما الموجود في هذه الحزمة

هذا تجميع لكل الملفات المعتمدة فعليًا في هذا المشروع حتى الآن:

- **Data Layer كامل**: schema.js, connection.js, schemaGuards.js, medicinesRepo.js,
  suppliersRepo.js, dealsRepo.js, whatsappRepo.js, transactions.js
- **State Layer + Orchestrators كاملة**: appStore.js, completeDeal.js, matchSupplier.js,
  classifyWhatsAppMessage.js, backupRestore.js
- **UI Layer (جزئي)**: شاشتين فقط جاهزتين وشغالتين فعليًا:
  - Dashboard (`src/ui/dashboard.html`)
  - Medicines (`src/ui/medicines.html`)

## نقطة التشغيل

افتح `index.html` — هيحوّلك تلقائيًا لشاشة Dashboard.

## تحذير تقني ضروري (لازم تعرفه قبل التجربة)

المشروع مبني بالكامل بـ **ES Modules** (`import`/`export`) — ده قرار معماري مجمّد ومقصود.
المشكلة: متصفحات Chrome/Chromium (اللي غالبًا مثبت على أي هاتف أندرويد، بما فيه Realme C12)
**بترفض تحميل ES Modules لو فتحت الملف مباشرة من نظام الملفات (`file://`)** — هتشوف خطأ زي:
`Access to script blocked by CORS policy`.

يعني ببساطة: **مجرد الضغط على `index.html` من مدير الملفات في الهاتف غالبًا مش هيشتغل من غير خطوة إضافية.**

### الحل العملي (بدون لابتوب، وبدون أي أدوات تطوير حقيقية)

ثبّت تطبيق بسيط من نوع "Local HTTP Server" من متجر Google Play (مجاني، بدون أي كود أو إعداد،
زي تطبيقات باسم "Simple HTTP Server" أو ما شابه)، ثم:

1. افتح التطبيق واختر مجلد المشروع ده.
2. اضغط "Start Server".
3. افتح Chrome على نفس الهاتف وروح على العنوان اللي هيديهولك التطبيق (عادة `http://localhost:8080`).

بعد كده المشروع هيشتغل بالكامل زي ما هو متوقع (IndexedDB + ES Modules هتشتغل عادي لأنه بقى بيتقدم عبر HTTP مش file://).

## الشاشات المتاحة فعليًا الآن

- ✅ Dashboard
- ✅ Medicines (إضافة / تعديل / حذف / عرض)
- ⬜ Suppliers, Deals, WhatsApp, Search, Settings, Backup — **لسه مش مبنية**.

روابط التنقل في شريط الـ nav بتشاور على الشاشات دي (`suppliers.html`, `deals.html`, إلخ)
كخطوة مستقبلية متفق عليها — الضغط عليها دلوقتي هيديك صفحة غير موجودة لحد ما تتبني.
