import { getLanguage, isRtl } from './languages.js';

const STRINGS = {
  en: {
    'title.home': 'Lodestar \u2014 Private Search',
    'title.search': 'Search \u2014 Lodestar',
    'title.settings': 'Settings \u2014 Lodestar',
    'title.history': 'History \u2014 Lodestar',
    'title.bookmarks': 'Saved \u2014 Lodestar',
    'title.404': 'Page not found \u2014 Lodestar',
    'desc.home':
      'Lodestar is a fast, private, minimal internet search engine. No tracking, no ads, no clutter.',
    'desc.search': 'Search the web privately with Lodestar.',
    'desc.settings':
      'Lodestar settings. Privacy controls and appearance preferences.',
    'desc.history': 'Your search history on Lodestar.',
    'desc.bookmarks': 'Results you saved on Lodestar.',

    'nav.history': 'History',
    'nav.saved': 'Saved',
    'nav.settings': 'Settings',
    'nav.signin': 'Sign in',
    'go.back': 'Go back',
    'skip.label': 'Skip to content',
    'back.to.search': 'Back to search',
    'search.action': 'Search',
    'search.placeholder': 'Search the web',
    'search.label': 'Search the web',
    'voice.search': 'Search by voice',
    'voice.listening': 'Listening\u2026',
    'suggest.recent': 'Recent',
    'suggest.remove': 'Remove "{q}" from history',
    'suggest.aria': 'Search suggestions',

    'tab.web': 'Web',
    'tab.images': 'Images',
    'tab.news': 'News',
    'tab.videos': 'Videos',
    'tab.maps': 'Maps',
    'home.tagline': 'Search the web privately',

    'results.titleLabel': 'Search results',
    'results.heading': 'Search results for {q}',
    'results.searching': 'Searching for {q}',
    'loading.text': 'Searching\u2026',
    'results.meta': { one: '{n} result', other: '{n} results' },
    'results.live': { one: '{n} result for {q}', other: '{n} results for {q}' },
    'results.noResults': 'No results found.',
    'results.tryAnother': 'Try another search.',
    'results.noQuery': 'Enter something to search.',
    'results.noQueryDesc': 'Search the web privately with Lodestar.',
    'error.connection':
      'Please check your connection and try again.',
    'error.retry': 'Try again',
    'error.generic': 'Something went wrong. Please try again.',
    'error.network':
      "Lodestar couldn't reach the search service. Please try again.",
    'share.label': 'Share',
    'result.save': 'Save result',
    'result.unsave': 'Remove from saved',
    'result.saved': 'Saved.',
    'result.removed': 'Removed from saved.',
    'related.label': 'Related',
    'instant.calculator': 'Calculator',
    'instant.conversion': 'Conversion',
    'official.title': 'Official website',
    'filter.any': 'Any time',
    'filter.day': 'Past 24h',
    'filter.week': 'Past week',
    'filter.month': 'Past month',
    'filter.year': 'Past year',
    'filter.safeOn': 'Safe search: on',
    'filter.safeOff': 'Safe search: off',
    'filter.safeToggle': 'Toggle safe search',
    'filter.results': 'Result filters',
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'pagination.label': 'Results pages',
    'map.openOsm': 'Open in OpenStreetMap',
    'map.title': 'Map',
    'country.capital': 'Capital: {name}',
    'country.flag': 'Flag of {name}',
    'country.map': 'Map of {name}',
    'country.prev': 'Previous image',
    'country.next': 'Next image',

    'settings.title': 'Settings',
    'settings.account': 'Account',
    'settings.privacy': 'Privacy',
    'settings.appearance': 'Appearance',
    'settings.search': 'Search',
    'settings.searchHistory': 'Search history',
    'settings.history.off': 'Off',
    'settings.history.off.desc': "Don't keep any search history",
    'settings.history.24h': 'Delete after 24 hours',
    'settings.history.24h.desc':
      'Default \u2014 history is cleared automatically every day',
    'settings.history.always': 'Keep always',
    'settings.history.always.desc':
      'Keep search history on this device permanently',
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.light.desc': 'Clean light interface',
    'settings.theme.dark': 'Dark',
    'settings.theme.dark.desc': 'Low-light interface',
    'settings.theme.system': 'System',
    'settings.theme.system.desc': 'Follow your device setting',
    'settings.suggestions': 'Search suggestions',
    'settings.suggestions.on': 'On',
    'settings.suggestions.on.desc':
      'Suggest queries and show recent searches while typing',
    'settings.suggestions.off': 'Off',
    'settings.suggestions.off.desc':
      'No suggestions or recent-search dropdown',
    'settings.safeSearch': 'Safe search',
    'settings.safesearch.off.desc': 'Show all results',
    'settings.safesearch.on.desc': 'Filter explicit content from results',
    'settings.language': 'Language',
    'settings.language.desc': 'Changes the language of the whole interface.',
    'settings.unsaved': 'You have unsaved changes',
    'settings.save': 'Save changes',
    'settings.saved': 'Saved.',
    'settings.saveFailed': 'Could not save. Please try again.',
    'settings.footer': 'Preferences are stored only on this device',

    'account.username': 'Username',
    'account.identifier': 'Username or email',
    'account.email': 'Email',
    'account.password': 'Password',
    'account.confirmPassword': 'Confirm password',
    'account.login': 'Log in',
    'account.register': 'Create account',
    'account.remember': 'Remember me',
    'account.remember.desc':
      'Stay signed in after you close the browser',
    'account.forgotPassword': 'Forgot password?',
    'account.hint':
      'Your search history, theme and settings sync between your devices.',
    'account.logout': 'Sign out',
    'account.editProfile': 'Edit profile',
    'account.changePassword': 'Change password',
    'account.syncNow': 'Sync now',
    'account.synced': 'Synced.',
    'account.delete': 'Delete account',
    'account.delete.desc':
      'This permanently removes your account and all synced data from Lodestar.',
    'account.delete.confirm': 'Type {username} to confirm.',
    'account.delete.permanent': 'Delete permanently',
    'account.cancel': 'Cancel',
    'account.save': 'Save',
    'account.displayName': 'Display name',
    'account.bio': 'Bio',
    'account.memberSince': 'Member since {date}',
    'account.noBio': 'No bio yet.',
    'account.removePhoto': 'Remove photo',
    'account.changePhoto': 'Change profile photo',
    'account.currentPassword': 'Current password',
    'account.newPassword': 'New password',
    'account.confirmNewPassword': 'Confirm new password',
    'account.updatePassword': 'Update password',
    'account.passwordUpdated': 'Password updated.',
    'account.devices': 'Devices',
    'account.thisDevice': 'This device',
    'account.otherDevice': 'Another device',
    'account.lastSeen': 'Last seen {time}',
    'account.revoke': 'Revoke',
    'account.signOutEverywhere': 'Sign out everywhere',
    'account.profileSaved': 'Profile saved.',
    'account.photoUpdated': 'Profile photo updated.',
    'account.photoRemoved': 'Profile photo removed.',
    'account.photoType': 'Choose a PNG or JPEG photo.',
    'account.photoRead': 'Could not read that image.',
    'account.enterUsername': 'Enter a username.',
    'account.enterEmail': 'Enter your email.',
    'account.emailInvalid': 'Enter a valid email address.',
    'account.passwordTooShort':
      'Password must be at least 6 characters.',
    'account.passwordsMismatch': 'Passwords do not match.',
    'account.usernameRules':
      'Username must be 3-20 characters (letters, numbers, . _ -).',
    'account.reset.title': 'Reset password',
    'account.reset.send': 'Send reset code',
    'account.reset.code': 'Reset code',
    'account.reset.codeDesc':
      'Enter your username and email to get a reset code.',
    'account.reset.codeShown':
      'Your reset code is {code}. It expires in 15 minutes.',
    'account.reset.invalid':
      'That reset code is invalid or has expired.',
    'account.reset.submit': 'Reset password',
    'account.reset.done': 'Password reset. You can now log in.',
    'account.reset.back': 'Back to log in',

    'history.title': 'History',
    'history.clear': 'Clear history',
    'history.count': { one: '{n} search', other: '{n} searches' },
    'history.empty.off': 'Search history is turned off.',
    'history.empty.none': 'No search history yet.',
    'history.empty.desc': 'Searches you make will appear here.',
    'history.footer': 'History is stored only on this device',

    'bookmarks.title': 'Saved',
    'bookmarks.clear': 'Clear saved',
    'bookmarks.count': { one: '{n} saved item', other: '{n} saved items' },
    'bookmarks.empty.title': 'Nothing saved yet.',
    'bookmarks.empty.desc':
      'Tap the star on any result to keep it here.',
    'bookmarks.footer': 'Saved items are stored only on this device',
    'bookmarks.remove': 'Remove',

    'error404.text':
      "The page you're looking for doesn't exist or has moved.",
    'error404.home': 'Go to Lodestar home',

    'account.menu.label': 'Account menu',
    'account.menu.settings': 'Settings',
    'account.menu.saved': 'Saved',
    'account.menu.signout': 'Sign out',
  },

  ar: {
    'title.home': 'Lodestar \u2014 بحث خاص',
    'title.search': 'بحث \u2014 Lodestar',
    'title.settings': 'الإعدادات \u2014 Lodestar',
    'title.history': 'السجل \u2014 Lodestar',
    'title.bookmarks': 'المحفوظات \u2014 Lodestar',
    'title.404': 'الصفحة غير موجودة \u2014 Lodestar',
    'desc.home':
      'Lodestar هو محرك بحث سريع وخاص وبسيط. لا تتبع، لا إعلانات، لا فوضى.',
    'desc.search': 'ابحث في الويب بخصوصية مع Lodestar.',
    'desc.settings':
      'إعدادات Lodestar. عناصر تحكم بالخصوصية وتفضيلات المظهر.',
    'desc.history': 'سجل البحث الخاص بك على Lodestar.',
    'desc.bookmarks': 'النتائج التي حفظتها على Lodestar.',

    'nav.history': 'السجل',
    'nav.saved': 'المحفوظات',
    'nav.settings': 'الإعدادات',
    'nav.signin': 'تسجيل الدخول',
    'go.back': 'رجوع',
    'skip.label': 'تخطي إلى المحتوى',
    'back.to.search': 'العودة إلى البحث',
    'search.action': 'بحث',
    'search.placeholder': 'ابحث في الويب',
    'search.label': 'ابحث في الويب',
    'voice.search': 'ابحث بالصوت',
    'voice.listening': 'جارٍ الاستماع\u2026',
    'suggest.recent': 'الأخيرة',
    'suggest.remove': 'إزالة «{q}» من السجل',
    'suggest.aria': 'اقتراحات البحث',

    'tab.web': 'ويب',
    'tab.images': 'الصور',
    'tab.news': 'الأخبار',
    'tab.videos': 'الفيديو',
    'tab.maps': 'الخرائط',
    'home.tagline': 'ابحث في الويب بخصوصية',

    'results.titleLabel': 'نتائج البحث',
    'results.heading': 'نتائج البحث عن {q}',
    'results.searching': 'جارٍ البحث عن {q}',
    'loading.text': 'جارٍ البحث\u2026',
    'results.meta': {
      zero: '{n} نتيجة',
      one: '{n} نتيجة',
      two: '{n} نتيجتين',
      few: '{n} نتائج',
      many: '{n} نتيجة',
      other: '{n} نتيجة',
    },
    'results.live': {
      zero: '{n} نتيجة عن {q}',
      one: '{n} نتيجة عن {q}',
      two: '{n} نتيجتين عن {q}',
      few: '{n} نتائج عن {q}',
      many: '{n} نتيجة عن {q}',
      other: '{n} نتيجة عن {q}',
    },
    'results.noResults': 'لا توجد نتائج.',
    'results.tryAnother': 'جرّب بحثًا آخر.',
    'results.noQuery': 'اكتب شيئًا للبحث.',
    'results.noQueryDesc': 'ابحث في الويب بخصوصية مع Lodestar.',
    'error.connection':
      'يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
    'error.retry': 'حاول مرة أخرى',
    'error.generic': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    'error.network':
      'تعذر على Lodestar الوصول إلى خدمة البحث. يرجى المحاولة مرة أخرى.',
    'share.label': 'مشاركة',
    'result.save': 'حفظ النتيجة',
    'result.unsave': 'إزالة من المحفوظات',
    'result.saved': 'تم الحفظ.',
    'result.removed': 'أُزيل من المحفوظات.',
    'related.label': 'ذات صلة',
    'instant.calculator': 'حاسبة',
    'instant.conversion': 'تحويل',
    'official.title': 'الموقع الرسمي',
    'filter.any': 'أي وقت',
    'filter.day': 'آخر 24 ساعة',
    'filter.week': 'خلال الأسبوع الماضي',
    'filter.month': 'خلال الشهر الماضي',
    'filter.year': 'خلال العام الماضي',
    'filter.safeOn': 'البحث الآمن: مفعّل',
    'filter.safeOff': 'البحث الآمن: معطّل',
    'filter.safeToggle': 'تبديل البحث الآمن',
    'filter.results': 'عوامل تصفية النتائج',
    'pagination.previous': 'السابق',
    'pagination.next': 'التالي',
    'pagination.label': 'صفحات النتائج',
    'map.openOsm': 'فتح في OpenStreetMap',
    'map.title': 'خريطة',
    'country.capital': 'العاصمة: {name}',
    'country.flag': 'علم {name}',
    'country.map': 'خريطة {name}',
    'country.prev': 'الصورة السابقة',
    'country.next': 'الصورة التالية',

    'settings.title': 'الإعدادات',
    'settings.account': 'الحساب',
    'settings.privacy': 'الخصوصية',
    'settings.appearance': 'المظهر',
    'settings.search': 'البحث',
    'settings.searchHistory': 'سجل البحث',
    'settings.history.off': 'إيقاف',
    'settings.history.off.desc': 'لا تحفظ أي سجل بحث',
    'settings.history.24h': 'حذف بعد 24 ساعة',
    'settings.history.24h.desc':
      'الافتراضي \u2014 يُمسح السجل تلقائيًا كل يوم',
    'settings.history.always': 'الاحتفاظ دائمًا',
    'settings.history.always.desc':
      'احتفظ بسجل البحث على هذا الجهاز بشكل دائم',
    'settings.theme': 'السمة',
    'settings.theme.light': 'فاتح',
    'settings.theme.light.desc': 'واجهة فاتحة نظيفة',
    'settings.theme.dark': 'داكن',
    'settings.theme.dark.desc': 'واجهة للإضاءة المنخفضة',
    'settings.theme.system': 'النظام',
    'settings.theme.system.desc': 'اتبع إعداد جهازك',
    'settings.suggestions': 'اقتراحات البحث',
    'settings.suggestions.on': 'تشغيل',
    'settings.suggestions.on.desc':
      'اقترح الاستعلامات وأظهر عمليات البحث الأخيرة أثناء الكتابة',
    'settings.suggestions.off': 'إيقاف',
    'settings.suggestions.off.desc':
      'لا اقتراحات ولا قائمة البحث الأخير',
    'settings.safeSearch': 'البحث الآمن',
    'settings.safesearch.off.desc': 'إظهار كل النتائج',
    'settings.safesearch.on.desc': 'تصفية المحتوى الصريح من النتائج',
    'settings.language': 'اللغة',
    'settings.language.desc': 'يغيّر لغة الواجهة بأكملها.',
    'settings.unsaved': 'لديك تغييرات غير محفوظة',
    'settings.save': 'حفظ التغييرات',
    'settings.saved': 'تم الحفظ.',
    'settings.saveFailed': 'تعذّر الحفظ. يرجى المحاولة مرة أخرى.',
    'settings.footer': 'تُخزَّن التفضيلات على هذا الجهاز فقط',

    'account.username': 'اسم المستخدم',
    'account.identifier': 'اسم المستخدم أو البريد الإلكتروني',
    'account.email': 'البريد الإلكتروني',
    'account.password': 'كلمة المرور',
    'account.confirmPassword': 'تأكيد كلمة المرور',
    'account.login': 'تسجيل الدخول',
    'account.register': 'إنشاء حساب',
    'account.remember': 'تذكرني',
    'account.remember.desc':
      'ابقَ مسجلاً الدخول بعد إغلاق المتصفح',
    'account.forgotPassword': 'نسيت كلمة المرور؟',
    'account.hint':
      'تتم مزامنة سجل البحث والمظهر والإعدادات بين أجهزتك.',
    'account.logout': 'تسجيل الخروج',
    'account.editProfile': 'تعديل الملف الشخصي',
    'account.changePassword': 'تغيير كلمة المرور',
    'account.syncNow': 'مزامنة الآن',
    'account.synced': 'تمت المزامنة.',
    'account.delete': 'حذف الحساب',
    'account.delete.desc':
      'يؤدي هذا إلى إزالة حسابك وجميع البيانات المتزامنة من Lodestar بشكل نهائي.',
    'account.delete.confirm': 'اكتب {username} للتأكيد.',
    'account.delete.permanent': 'حذف نهائي',
    'account.cancel': 'إلغاء',
    'account.save': 'حفظ',
    'account.displayName': 'الاسم المعروض',
    'account.bio': 'نبذة',
    'account.memberSince': 'عضو منذ {date}',
    'account.noBio': 'لا توجد نبذة بعد.',
    'account.removePhoto': 'إزالة الصورة',
    'account.changePhoto': 'تغيير صورة الملف الشخصي',
    'account.currentPassword': 'كلمة المرور الحالية',
    'account.newPassword': 'كلمة مرور جديدة',
    'account.confirmNewPassword': 'تأكيد كلمة المرور الجديدة',
    'account.updatePassword': 'تحديث كلمة المرور',
    'account.passwordUpdated': 'تم تحديث كلمة المرور.',
    'account.devices': 'الأجهزة',
    'account.thisDevice': 'هذا الجهاز',
    'account.otherDevice': 'جهاز آخر',
    'account.lastSeen': 'آخر ظهور {time}',
    'account.revoke': 'إبطال',
    'account.signOutEverywhere': 'تسجيل الخروج من كل الأجهزة',
    'account.profileSaved': 'تم حفظ الملف الشخصي.',
    'account.photoUpdated': 'تم تحديث صورة الملف الشخصي.',
    'account.photoRemoved': 'تمت إزالة صورة الملف الشخصي.',
    'account.photoType': 'اختر صورة PNG أو JPEG.',
    'account.photoRead': 'تعذّرت قراءة تلك الصورة.',
    'account.enterUsername': 'أدخل اسم المستخدم.',
    'account.enterEmail': 'أدخل بريدك الإلكتروني.',
    'account.emailInvalid': 'أدخل عنوان بريد إلكتروني صالحًا.',
    'account.passwordTooShort':
      'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    'account.passwordsMismatch': 'كلمتا المرور غير متطابقتين.',
    'account.usernameRules':
      'يجب أن يتكون اسم المستخدم من 3 إلى 20 حرفًا (أحرف وأرقام و . _ -).',
    'account.reset.title': 'إعادة تعيين كلمة المرور',
    'account.reset.send': 'إرسال رمز إعادة التعيين',
    'account.reset.code': 'رمز إعادة التعيين',
    'account.reset.codeDesc':
      'أدخل اسم المستخدم والبريد الإلكتروني للحصول على رمز إعادة التعيين.',
    'account.reset.codeShown':
      'رمز إعادة التعيين الخاص بك هو {code}. تنتهي صلاحيته خلال 15 دقيقة.',
    'account.reset.invalid':
      'رمز إعادة التعيين غير صالح أو منتهي الصلاحية.',
    'account.reset.submit': 'إعادة تعيين كلمة المرور',
    'account.reset.done':
      'تمت إعادة تعيين كلمة المرور. يمكنك الآن تسجيل الدخول.',
    'account.reset.back': 'العودة إلى تسجيل الدخول',

    'history.title': 'السجل',
    'history.clear': 'مسح السجل',
    'history.count': {
      zero: '{n} عملية بحث',
      one: '{n} عملية بحث',
      two: '{n} عمليتا بحث',
      few: '{n} عمليات بحث',
      many: '{n} عملية بحث',
      other: '{n} عملية بحث',
    },
    'history.empty.off': 'سجل البحث معطّل.',
    'history.empty.none': 'لا يوجد سجل بحث بعد.',
    'history.empty.desc': 'ستظهر عمليات البحث التي تجريها هنا.',
    'history.footer': 'يُخزَّن السجل على هذا الجهاز فقط',

    'bookmarks.title': 'المحفوظات',
    'bookmarks.clear': 'مسح المحفوظات',
    'bookmarks.count': {
      zero: '{n} عنصر محفوظ',
      one: '{n} عنصر محفوظ',
      two: '{n} عنصران محفوظان',
      few: '{n} عناصر محفوظة',
      many: '{n} عنصرًا محفوظًا',
      other: '{n} عنصر محفوظ',
    },
    'bookmarks.empty.title': 'لا شيء محفوظ بعد.',
    'bookmarks.empty.desc':
      'اضغط على النجمة في أي نتيجة للاحتفاظ بها هنا.',
    'bookmarks.footer': 'تُخزَّن العناصر المحفوظة على هذا الجهاز فقط',
    'bookmarks.remove': 'إزالة',

    'error404.text':
      'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    'error404.home': 'الانتقال إلى الصفحة الرئيسية لـ Lodestar',

    'account.menu.label': 'قائمة الحساب',
    'account.menu.settings': 'الإعدادات',
    'account.menu.saved': 'المحفوظات',
    'account.menu.signout': 'تسجيل الخروج',
  },

  es: {
    'title.home': 'Lodestar \u2014 Búsqueda privada',
    'title.search': 'Búsqueda \u2014 Lodestar',
    'title.settings': 'Ajustes \u2014 Lodestar',
    'title.history': 'Historial \u2014 Lodestar',
    'title.bookmarks': 'Guardados \u2014 Lodestar',
    'title.404': 'Página no encontrada \u2014 Lodestar',
    'desc.home':
      'Lodestar es un motor de búsqueda rápido, privado y minimalista. Sin seguimiento, sin anuncios, sin distracciones.',
    'desc.search': 'Busca en la web de forma privada con Lodestar.',
    'desc.settings':
      'Ajustes de Lodestar. Controles de privacidad y preferencias de apariencia.',
    'desc.history': 'Tu historial de búsqueda en Lodestar.',
    'desc.bookmarks': 'Resultados que has guardado en Lodestar.',

    'nav.history': 'Historial',
    'nav.saved': 'Guardados',
    'nav.settings': 'Ajustes',
    'nav.signin': 'Iniciar sesión',
    'go.back': 'Volver',
    'skip.label': 'Saltar al contenido',
    'back.to.search': 'Volver a la búsqueda',
    'search.action': 'Buscar',
    'search.placeholder': 'Buscar en la web',
    'search.label': 'Buscar en la web',
    'voice.search': 'Buscar por voz',
    'voice.listening': 'Escuchando\u2026',
    'suggest.recent': 'Recientes',
    'suggest.remove': 'Eliminar «{q}» del historial',
    'suggest.aria': 'Sugerencias de búsqueda',

    'tab.web': 'Web',
    'tab.images': 'Imágenes',
    'tab.news': 'Noticias',
    'tab.videos': 'Vídeos',
    'tab.maps': 'Mapas',
    'home.tagline': 'Busca en la web de forma privada',

    'results.titleLabel': 'Resultados de búsqueda',
    'results.heading': 'Resultados de búsqueda para {q}',
    'results.searching': 'Buscando {q}',
    'loading.text': 'Buscando\u2026',
    'results.meta': { one: '{n} resultado', other: '{n} resultados' },
    'results.live': {
      one: '{n} resultado para {q}',
      other: '{n} resultados para {q}',
    },
    'results.noResults': 'No se han encontrado resultados.',
    'results.tryAnother': 'Prueba otra búsqueda.',
    'results.noQuery': 'Introduce algo para buscar.',
    'results.noQueryDesc':
      'Busca en la web de forma privada con Lodestar.',
    'error.connection':
      'Comprueba tu conexión e inténtalo de nuevo.',
    'error.retry': 'Reintentar',
    'error.generic': 'Algo salió mal. Inténtalo de nuevo.',
    'error.network':
      'Lodestar no pudo conectarse al servicio de búsqueda. Inténtalo de nuevo.',
    'share.label': 'Compartir',
    'result.save': 'Guardar resultado',
    'result.unsave': 'Quitar de guardados',
    'result.saved': 'Guardado.',
    'result.removed': 'Eliminado de guardados.',
    'related.label': 'Relacionado',
    'instant.calculator': 'Calculadora',
    'instant.conversion': 'Conversión',
    'official.title': 'Sitio web oficial',
    'filter.any': 'Cualquier momento',
    'filter.day': 'Últimas 24 h',
    'filter.week': 'Última semana',
    'filter.month': 'Último mes',
    'filter.year': 'Último año',
    'filter.safeOn': 'Búsqueda segura: activada',
    'filter.safeOff': 'Búsqueda segura: desactivada',
    'filter.safeToggle': 'Cambiar búsqueda segura',
    'filter.results': 'Filtros de resultados',
    'pagination.previous': 'Anterior',
    'pagination.next': 'Siguiente',
    'pagination.label': 'Páginas de resultados',
    'map.openOsm': 'Abrir en OpenStreetMap',
    'map.title': 'Mapa',
    'country.capital': 'Capital: {name}',
    'country.flag': 'Bandera de {name}',
    'country.map': 'Mapa de {name}',
    'country.prev': 'Imagen anterior',
    'country.next': 'Imagen siguiente',

    'settings.title': 'Ajustes',
    'settings.account': 'Cuenta',
    'settings.privacy': 'Privacidad',
    'settings.appearance': 'Apariencia',
    'settings.search': 'Búsqueda',
    'settings.searchHistory': 'Historial de búsqueda',
    'settings.history.off': 'Desactivado',
    'settings.history.off.desc': 'No guardar historial de búsqueda',
    'settings.history.24h': 'Eliminar después de 24 horas',
    'settings.history.24h.desc':
      'Predeterminado: el historial se borra automáticamente cada día',
    'settings.history.always': 'Conservar siempre',
    'settings.history.always.desc':
      'Conservar el historial de búsqueda en este dispositivo permanentemente',
    'settings.theme': 'Tema',
    'settings.theme.light': 'Claro',
    'settings.theme.light.desc': 'Interfaz clara y limpia',
    'settings.theme.dark': 'Oscuro',
    'settings.theme.dark.desc': 'Interfaz para poca luz',
    'settings.theme.system': 'Sistema',
    'settings.theme.system.desc': 'Seguir la configuración del dispositivo',
    'settings.suggestions': 'Sugerencias de búsqueda',
    'settings.suggestions.on': 'Activadas',
    'settings.suggestions.on.desc':
      'Sugerir consultas y mostrar búsquedas recientes al escribir',
    'settings.suggestions.off': 'Desactivadas',
    'settings.suggestions.off.desc':
      'Sin sugerencias ni menú de búsquedas recientes',
    'settings.safeSearch': 'Búsqueda segura',
    'settings.safesearch.off.desc': 'Mostrar todos los resultados',
    'settings.safesearch.on.desc':
      'Filtrar contenido explícito de los resultados',
    'settings.language': 'Idioma',
    'settings.language.desc':
      'Cambia el idioma de toda la interfaz.',
    'settings.unsaved': 'Tienes cambios sin guardar',
    'settings.save': 'Guardar cambios',
    'settings.saved': 'Guardado.',
    'settings.saveFailed': 'No se pudo guardar. Inténtalo de nuevo.',
    'settings.footer':
      'Las preferencias se guardan solo en este dispositivo',

    'account.username': 'Nombre de usuario',
    'account.identifier': 'Nombre de usuario o correo',
    'account.email': 'Correo electrónico',
    'account.password': 'Contraseña',
    'account.confirmPassword': 'Confirmar contraseña',
    'account.login': 'Iniciar sesión',
    'account.register': 'Crear cuenta',
    'account.remember': 'Recordarme',
    'account.remember.desc':
      'Mantener la sesión iniciada al cerrar el navegador',
    'account.forgotPassword': '¿Olvidaste tu contraseña?',
    'account.hint':
      'Tu historial de búsqueda, tema y ajustes se sincronizan entre tus dispositivos.',
    'account.logout': 'Cerrar sesión',
    'account.editProfile': 'Editar perfil',
    'account.changePassword': 'Cambiar contraseña',
    'account.syncNow': 'Sincronizar ahora',
    'account.synced': 'Sincronizado.',
    'account.delete': 'Eliminar cuenta',
    'account.delete.desc':
      'Esto elimina permanentemente tu cuenta y todos los datos sincronizados de Lodestar.',
    'account.delete.confirm': 'Escribe {username} para confirmar.',
    'account.delete.permanent': 'Eliminar definitivamente',
    'account.cancel': 'Cancelar',
    'account.save': 'Guardar',
    'account.displayName': 'Nombre mostrado',
    'account.bio': 'Biografía',
    'account.memberSince': 'Miembro desde {date}',
    'account.noBio': 'Aún no hay biografía.',
    'account.removePhoto': 'Quitar foto',
    'account.changePhoto': 'Cambiar foto de perfil',
    'account.currentPassword': 'Contraseña actual',
    'account.newPassword': 'Nueva contraseña',
    'account.confirmNewPassword': 'Confirmar nueva contraseña',
    'account.updatePassword': 'Actualizar contraseña',
    'account.passwordUpdated': 'Contraseña actualizada.',
    'account.devices': 'Dispositivos',
    'account.thisDevice': 'Este dispositivo',
    'account.otherDevice': 'Otro dispositivo',
    'account.lastSeen': 'Visto por última vez {time}',
    'account.revoke': 'Revocar',
    'account.signOutEverywhere': 'Cerrar sesión en todos los dispositivos',
    'account.profileSaved': 'Perfil guardado.',
    'account.photoUpdated': 'Foto de perfil actualizada.',
    'account.photoRemoved': 'Foto de perfil eliminada.',
    'account.photoType': 'Elige una foto PNG o JPEG.',
    'account.photoRead': 'No se pudo leer esa imagen.',
    'account.enterUsername': 'Introduce un nombre de usuario.',
    'account.enterEmail': 'Introduce tu correo electrónico.',
    'account.emailInvalid':
      'Introduce una dirección de correo válida.',
    'account.passwordTooShort':
      'La contraseña debe tener al menos 6 caracteres.',
    'account.passwordsMismatch': 'Las contraseñas no coinciden.',
    'account.usernameRules':
      'El nombre de usuario debe tener de 3 a 20 caracteres (letras, números, . _ -).',
    'account.reset.title': 'Restablecer contraseña',
    'account.reset.send': 'Enviar código de restablecimiento',
    'account.reset.code': 'Código de restablecimiento',
    'account.reset.codeDesc':
      'Introduce tu nombre de usuario y correo para recibir un código.',
    'account.reset.codeShown':
      'Tu código de restablecimiento es {code}. Caduca en 15 minutos.',
    'account.reset.invalid':
      'Ese código de restablecimiento no es válido o ha caducado.',
    'account.reset.submit': 'Restablecer contraseña',
    'account.reset.done':
      'Contraseña restablecida. Ya puedes iniciar sesión.',
    'account.reset.back': 'Volver a iniciar sesión',

    'history.title': 'Historial',
    'history.clear': 'Borrar historial',
    'history.count': { one: '{n} búsqueda', other: '{n} búsquedas' },
    'history.empty.off': 'El historial de búsqueda está desactivado.',
    'history.empty.none': 'Aún no hay historial de búsqueda.',
    'history.empty.desc': 'Tus búsquedas aparecerán aquí.',
    'history.footer': 'El historial se guarda solo en este dispositivo',

    'bookmarks.title': 'Guardados',
    'bookmarks.clear': 'Borrar guardados',
    'bookmarks.count': {
      one: '{n} elemento guardado',
      other: '{n} elementos guardados',
    },
    'bookmarks.empty.title': 'Aún no has guardado nada.',
    'bookmarks.empty.desc':
      'Toca la estrella de cualquier resultado para guardarlo aquí.',
    'bookmarks.footer':
      'Los elementos guardados se almacenan solo en este dispositivo',
    'bookmarks.remove': 'Quitar',

    'error404.text':
      'La página que buscas no existe o ha sido movida.',
    'error404.home': 'Ir a la página principal de Lodestar',

    'account.menu.label': 'Menú de cuenta',
    'account.menu.settings': 'Ajustes',
    'account.menu.saved': 'Guardados',
    'account.menu.signout': 'Cerrar sesión',
  },

  ga: {
    'title.home': 'Lodestar \u2014 Cuardach Príobháideach',
    'title.search': 'Cuardach \u2014 Lodestar',
    'title.settings': 'Socruithe \u2014 Lodestar',
    'title.history': 'Stair \u2014 Lodestar',
    'title.bookmarks': 'Sábháilte \u2014 Lodestar',
    'title.404': 'Níor aimsíodh an leathanach \u2014 Lodestar',
    'desc.home':
      'Is inneall cuardaigh tapaidh, príobháideach agus íosta é Lodestar. Gan rianú, gan fógraí, gan tranglam.',
    'desc.search': 'Cuardaigh an gréasán go príobháideach le Lodestar.',
    'desc.settings':
      'Socruithe Lodestar. Rialuithe príobháideachta agus roghanna dealraimh.',
    'desc.history': 'Do stair chuardaigh ar Lodestar.',
    'desc.bookmarks': 'Torthaí a shábháil tú ar Lodestar.',

    'nav.history': 'Stair',
    'nav.saved': 'Sábháilte',
    'nav.settings': 'Socruithe',
    'nav.signin': 'Sínigh isteach',
    'go.back': 'Ar ais',
    'skip.label': 'Léim go dtí an t-ábhar',
    'back.to.search': 'Ar ais go dtí an cuardach',
    'search.action': 'Cuardaigh',
    'search.placeholder': 'Cuardaigh an gréasán',
    'search.label': 'Cuardaigh an gréasán',
    'voice.search': 'Cuardaigh le guth',
    'voice.listening': 'Ag éisteacht\u2026',
    'suggest.recent': 'Le déanaí',
    'suggest.remove': 'Bain «{q}» ón stair',
    'suggest.aria': 'Moltóirí cuardaigh',

    'tab.web': 'Gréasán',
    'tab.images': 'Íomhánna',
    'tab.news': 'Nuacht',
    'tab.videos': 'Físeáin',
    'tab.maps': 'Léarscáileanna',
    'home.tagline': 'Cuardaigh an gréasán go príobháideach',

    'results.titleLabel': 'Torthaí cuardaigh',
    'results.heading': 'Torthaí cuardaigh do {q}',
    'results.searching': 'Ag cuardach {q}',
    'loading.text': 'Ag cuardach\u2026',
    'results.meta': {
      one: '{n} toradh',
      two: '{n} thoradh',
      few: '{n} thorthaí',
      many: '{n} dtorthaí',
      other: '{n} torthaí',
    },
    'results.live': {
      one: '{n} toradh do {q}',
      two: '{n} thoradh do {q}',
      few: '{n} thorthaí do {q}',
      many: '{n} dtorthaí do {q}',
      other: '{n} torthaí do {q}',
    },
    'results.noResults': 'Níl aon torthaí ann.',
    'results.tryAnother': 'Bain triail as cuardach eile.',
    'results.noQuery': 'Cuir rud éigin isteach le cuardach.',
    'results.noQueryDesc':
      'Cuardaigh an gréasán go príobháideach le Lodestar.',
    'error.connection':
      'Seiceáil do cheangal agus bain triail as arís.',
    'error.retry': 'Bain triail as arís',
    'error.generic': 'Chuaigh rud éigin mícheart. Bain triail as arís.',
    'error.network':
      'Níor éirigh le Lodestar an tseirbhís cuardaigh a bhaint amach. Bain triail as arís.',
    'share.label': 'Roinn',
    'result.save': 'Sábháil toradh',
    'result.unsave': 'Bain ó na cinn sábháilte',
    'result.saved': 'Sábháilte.',
    'result.removed': 'Bainte de na cinn sábháilte.',
    'related.label': 'Gaolmhar',
    'instant.calculator': 'Áireamhán',
    'instant.conversion': 'Comhshó',
    'official.title': 'Suíomh oifigiúil',
    'filter.any': 'Am ar bith',
    'filter.day': '24 uair an chloig',
    'filter.week': 'An tseachtain seo caite',
    'filter.month': 'An mhí seo caite',
    'filter.year': 'An bhliain seo caite',
    'filter.safeOn': 'Cuardach sábháilte: ar',
    'filter.safeOff': 'Cuardach sábháilte: as',
    'filter.safeToggle': 'Cuardach sábháilte a lascadh',
    'filter.results': 'Scagairí torthaí',
    'pagination.previous': 'Roimhe seo',
    'pagination.next': 'Ar aghaidh',
    'pagination.label': 'Leathanaigh torthaí',
    'map.openOsm': 'Oscail in OpenStreetMap',
    'map.title': 'Léarscáil',
    'country.capital': 'Príomhchathair: {name}',
    'country.flag': 'Bratach {name}',
    'country.map': 'Léarscáil de {name}',
    'country.prev': 'Íomhá roimhe seo',
    'country.next': 'An chéad íomhá eile',

    'settings.title': 'Socruithe',
    'settings.account': 'Cuntas',
    'settings.privacy': 'Príobháideacht',
    'settings.appearance': 'Dealramh',
    'settings.search': 'Cuardach',
    'settings.searchHistory': 'Stair chuardaigh',
    'settings.history.off': 'As',
    'settings.history.off.desc': 'Ná coinnigh aon stair chuardaigh',
    'settings.history.24h': 'Scrios tar éis 24 uair',
    'settings.history.24h.desc':
      'Réamhshocrú \u2014 glantar an stair go huathoibríoch gach lá',
    'settings.history.always': 'Coinnigh i gcónaí',
    'settings.history.always.desc':
      'Coinnigh stair chuardaigh ar an ngléas seo go buan',
    'settings.theme': 'Téama',
    'settings.theme.light': 'Éadrom',
    'settings.theme.light.desc': 'Comhéadan éadrom glan',
    'settings.theme.dark': 'Dorcha',
    'settings.theme.dark.desc': 'Comhéadan do sholas íseal',
    'settings.theme.system': 'Córas',
    'settings.theme.system.desc': 'Lean socruithe do ghléis',
    'settings.suggestions': 'Moltóirí cuardaigh',
    'settings.suggestions.on': 'Ar',
    'settings.suggestions.on.desc':
      'Mol ceisteanna agus taispeáin cuardaigh le déanaí agus tú ag clóscríobh',
    'settings.suggestions.off': 'As',
    'settings.suggestions.off.desc':
      'Níl aon mholtóirí ná liosta cuardaigh le déanaí ann',
    'settings.safeSearch': 'Cuardach sábháilte',
    'settings.safesearch.off.desc': 'Taispeáin na torthaí go léir',
    'settings.safesearch.on.desc': 'Scag ábhar follasach ó na torthaí',
    'settings.language': 'Teanga',
    'settings.language.desc':
      'Athraíonn sé teanga an chomhéadain ar fad.',
    'settings.unsaved': 'Tá athruithe gan sábháil agat',
    'settings.save': 'Sábháil na hathruithe',
    'settings.saved': 'Sábháilte.',
    'settings.saveFailed': 'Níorbh fhéidir sábháil. Bain triail as arís.',
    'settings.footer': 'Ní stóráiltear roghanna ach ar an ngléas seo',

    'account.username': 'Ainm úsáideora',
    'account.identifier': 'Ainm úsáideora nó ríomhphost',
    'account.email': 'Ríomhphost',
    'account.password': 'Pasfhocal',
    'account.confirmPassword': 'Deimhnigh pasfhocal',
    'account.login': 'Logáil isteach',
    'account.register': 'Cruthaigh cuntas',
    'account.remember': 'Cuimhnigh orm',
    'account.remember.desc':
      'Fan logáilte isteach tar éis duit an brabhsálaí a dhúnadh',
    'account.forgotPassword': 'Dearmad pasfhocal?',
    'account.hint':
      'Déantar do stair chuardaigh, théama agus shocruithe a shioncronú idir do ghléasanna.',
    'account.logout': 'Logáil amach',
    'account.editProfile': 'Cuir an phróifíl in eagar',
    'account.changePassword': 'Athraigh pasfhocal',
    'account.syncNow': 'Sioncronaigh anois',
    'account.synced': 'Sioncronaithe.',
    'account.delete': 'Scrios cuntas',
    'account.delete.desc':
      'Baineann sé seo do chuntas agus na sonraí sioncronaithe go léir ó Lodestar go buan.',
    'account.delete.confirm': 'Clóscríobh {username} le deimhniú.',
    'account.delete.permanent': 'Scrios go buan',
    'account.cancel': 'Cealaigh',
    'account.save': 'Sábháil',
    'account.displayName': 'Ainm taispeána',
    'account.bio': 'Beathaisnéis',
    'account.memberSince': 'Ball ó {date}',
    'account.noBio': 'Níl aon bheathaisnéis fós.',
    'account.removePhoto': 'Bain grianghraf',
    'account.changePhoto': 'Athraigh grianghraf próifíle',
    'account.currentPassword': 'Pasfhocal reatha',
    'account.newPassword': 'Pasfhocal nua',
    'account.confirmNewPassword': 'Deimhnigh pasfhocal nua',
    'account.updatePassword': 'Nuashonraigh pasfhocal',
    'account.passwordUpdated': 'Nuashonraíodh an pasfhocal.',
    'account.devices': 'Gléasanna',
    'account.thisDevice': 'An gléas seo',
    'account.otherDevice': 'Gléas eile',
    'account.lastSeen': 'Feicthe le déanaí {time}',
    'account.revoke': 'Cúlghair',
    'account.signOutEverywhere': 'Logáil amach i ngach áit',
    'account.profileSaved': 'Sábháladh an phróifíl.',
    'account.photoUpdated': 'Nuashonraíodh grianghraf na próifíle.',
    'account.photoRemoved': 'Baineadh grianghraf na próifíle.',
    'account.photoType': 'Roghnaigh grianghraf PNG nó JPEG.',
    'account.photoRead': 'Níorbh fhéidir an íomhá sin a léamh.',
    'account.enterUsername': 'Cuir ainm úsáideora isteach.',
    'account.enterEmail': 'Cuir do ríomhphost isteach.',
    'account.emailInvalid': 'Cuir seoladh ríomhphoist bailí isteach.',
    'account.passwordTooShort':
      'Ní mór 6 charachtar ar a laghad a bheith sa phasfhocal.',
    'account.passwordsMismatch': 'Ní hionann na pasfhocail.',
    'account.usernameRules':
      'Ní mór 3-20 carachtar a bheith san ainm úsáideora (litreacha, uimhreacha, . _ -).',
    'account.reset.title': 'Athshocraigh pasfhocal',
    'account.reset.send': 'Seol cóid athshocraithe',
    'account.reset.code': 'Cód athshocraithe',
    'account.reset.codeDesc':
      "Cuir d'ainm úsáideora agus do ríomhphost isteach chun cóid a fháil.",
    'account.reset.codeShown':
      'Seo é do chód athshocraithe: {code}. Rachaidh sé in éag i 15 nóiméad.',
    'account.reset.invalid':
      'Tá an cód sin neamhbhailí nó rachadh sé in éag.',
    'account.reset.submit': 'Athshocraigh pasfhocal',
    'account.reset.done':
      'Athshocraíodh an pasfhocal. Is féidir leat logáil isteach anois.',
    'account.reset.back': 'Ar ais go dtí logáil isteach',

    'history.title': 'Stair',
    'history.clear': 'Glan stair',
    'history.count': {
      one: '{n} cuardach',
      two: '{n} chuardach',
      few: '{n} chuardaigh',
      many: '{n} gcuardaigh',
      other: '{n} cuardaigh',
    },
    'history.empty.off': 'Tá stair chuardaigh múchta.',
    'history.empty.none': 'Níl aon stair chuardaigh fós.',
    'history.empty.desc': 'Beidh na cuardaigh a dhéanfaidh tú le feiceáil anseo.',
    'history.footer': 'Ní stóráiltear stair ach ar an ngléas seo',

    'bookmarks.title': 'Sábháilte',
    'bookmarks.clear': 'Glan na cinn sábháilte',
    'bookmarks.count': {
      one: '{n} mír shábháilte',
      two: '{n} mhír shábháilte',
      few: '{n} míreanna sábháilte',
      many: '{n} míreanna sábháilte',
      other: '{n} míreanna sábháilte',
    },
    'bookmarks.empty.title': 'Níl aon rud sábháilte fós.',
    'bookmarks.empty.desc':
      'Tapa an réalta ar aon toradh chun é a choinneáil anseo.',
    'bookmarks.footer':
      'Ní stóráiltear na míreanna sábháilte ach ar an ngléas seo',
    'bookmarks.remove': 'Bain',

    'error404.text':
      "Níl an leathanach atá á lorg agat ann nó tá sé tar éis bogadh.",
    'error404.home': 'Téigh go dtí leathanach baile Lodestar',

    'account.menu.label': 'Roghnachán cuntais',
    'account.menu.settings': 'Socruithe',
    'account.menu.saved': 'Sábháilte',
    'account.menu.signout': 'Logáil amach',
  },

  he: {
    'title.home': 'Lodestar \u2014 חיפוש פרטי',
    'title.search': 'חיפוש \u2014 Lodestar',
    'title.settings': 'הגדרות \u2014 Lodestar',
    'title.history': 'היסטוריה \u2014 Lodestar',
    'title.bookmarks': 'שמורים \u2014 Lodestar',
    'title.404': 'הדף לא נמצא \u2014 Lodestar',
    'desc.home':
      'Lodestar הוא מנוע חיפוש מהיר, פרטי ומינימלי. ללא מעקב, ללא פרסומות, ללא עומס.',
    'desc.search': 'חפש באינטרנט בפרטיות עם Lodestar.',
    'desc.settings':
      'הגדרות Lodestar. בקרות פרטיות והעדפות מראה.',
    'desc.history': 'היסטוריית החיפוש שלך ב-Lodestar.',
    'desc.bookmarks': 'תוצאות ששמרת ב-Lodestar.',

    'nav.history': 'היסטוריה',
    'nav.saved': 'שמורים',
    'nav.settings': 'הגדרות',
    'nav.signin': 'התחברות',
    'go.back': 'חזרה',
    'skip.label': 'דלג לתוכן',
    'back.to.search': 'חזרה לחיפוש',
    'search.action': 'חיפוש',
    'search.placeholder': 'חפש באינטרנט',
    'search.label': 'חפש באינטרנט',
    'voice.search': 'חיפוש קולי',
    'voice.listening': 'מאזין\u2026',
    'suggest.recent': 'לאחרונה',
    'suggest.remove': 'הסר את «{q}» מההיסטוריה',
    'suggest.aria': 'הצעות חיפוש',

    'tab.web': 'אינטרנט',
    'tab.images': 'תמונות',
    'tab.news': 'חדשות',
    'tab.videos': 'סרטונים',
    'tab.maps': 'מפות',
    'home.tagline': 'חפש באינטרנט בפרטיות',

    'results.titleLabel': 'תוצאות חיפוש',
    'results.heading': 'תוצאות חיפוש עבור {q}',
    'results.searching': 'מחפש {q}',
    'loading.text': 'מחפש\u2026',
    'results.meta': { one: '{n} תוצאה', two: '{n} תוצאות', other: '{n} תוצאות' },
    'results.live': {
      one: '{n} תוצאה עבור {q}',
      two: '{n} תוצאות עבור {q}',
      other: '{n} תוצאות עבור {q}',
    },
    'results.noResults': 'לא נמצאו תוצאות.',
    'results.tryAnother': 'נסה חיפוש אחר.',
    'results.noQuery': 'הזן משהו לחיפוש.',
    'results.noQueryDesc': 'חפש באינטרנט בפרטיות עם Lodestar.',
    'error.connection': 'בדוק את החיבור ונסה שוב.',
    'error.retry': 'נסה שוב',
    'error.generic': 'משהו השתבש. נסה שוב.',
    'error.network':
      'Lodestar לא הצליח להגיע לשירות החיפוש. נסה שוב.',
    'share.label': 'שיתוף',
    'result.save': 'שמור תוצאה',
    'result.unsave': 'הסר משמורים',
    'result.saved': 'נשמר.',
    'result.removed': 'הוסר משמורים.',
    'related.label': 'קשור',
    'instant.calculator': 'מחשבון',
    'instant.conversion': 'המרה',
    'official.title': 'אתר רשמי',
    'filter.any': 'כל זמן',
    'filter.day': '24 השעות האחרונות',
    'filter.week': 'השבוע האחרון',
    'filter.month': 'החודש האחרון',
    'filter.year': 'השנה האחרונה',
    'filter.safeOn': 'חיפוש בטוח: פועל',
    'filter.safeOff': 'חיפוש בטוח: כבוי',
    'filter.safeToggle': 'החלף חיפוש בטוח',
    'filter.results': 'מסנני תוצאות',
    'pagination.previous': 'הקודם',
    'pagination.next': 'הבא',
    'pagination.label': 'דפי תוצאות',
    'map.openOsm': 'פתח ב-OpenStreetMap',
    'map.title': 'מפה',
    'country.capital': 'עיר בירה: {name}',
    'country.flag': 'דגל {name}',
    'country.map': 'מפה של {name}',
    'country.prev': 'התמונה הקודמת',
    'country.next': 'התמונה הבאה',

    'settings.title': 'הגדרות',
    'settings.account': 'חשבון',
    'settings.privacy': 'פרטיות',
    'settings.appearance': 'מראה',
    'settings.search': 'חיפוש',
    'settings.searchHistory': 'היסטוריית חיפוש',
    'settings.history.off': 'כבוי',
    'settings.history.off.desc': 'אל תשמור היסטוריית חיפוש',
    'settings.history.24h': 'מחק אחרי 24 שעות',
    'settings.history.24h.desc':
      'ברירת מחדל — ההיסטוריה נמחקת אוטומטית מדי יום',
    'settings.history.always': 'שמור תמיד',
    'settings.history.always.desc':
      'שמור היסטוריית חיפוש במכשיר זה לצמיתות',
    'settings.theme': 'ערכת נושא',
    'settings.theme.light': 'בהיר',
    'settings.theme.light.desc': 'ממשק בהיר ונקי',
    'settings.theme.dark': 'כהה',
    'settings.theme.dark.desc': 'ממשק לתאורה נמוכה',
    'settings.theme.system': 'מערכת',
    'settings.theme.system.desc': 'עקוב אחר הגדרת המכשיר',
    'settings.suggestions': 'הצעות חיפוש',
    'settings.suggestions.on': 'פועל',
    'settings.suggestions.on.desc':
      'הצע שאילתות והצג חיפושים אחרונים בזמן הקלדה',
    'settings.suggestions.off': 'כבוי',
    'settings.suggestions.off.desc':
      'אין הצעות ואין תפריט חיפושים אחרונים',
    'settings.safeSearch': 'חיפוש בטוח',
    'settings.safesearch.off.desc': 'הצג את כל התוצאות',
    'settings.safesearch.on.desc': 'סנן תוכן מפורש מהתוצאות',
    'settings.language': 'שפה',
    'settings.language.desc': 'משנה את שפת הממשק כולו.',
    'settings.unsaved': 'יש לך שינויים שלא נשמרו',
    'settings.save': 'שמור שינויים',
    'settings.saved': 'נשמר.',
    'settings.saveFailed': 'לא ניתן היה לשמור. נסה שוב.',
    'settings.footer': 'ההעדפות נשמרות רק במכשיר זה',

    'account.username': 'שם משתמש',
    'account.identifier': 'שם משתמש או אימייל',
    'account.email': 'אימייל',
    'account.password': 'סיסמה',
    'account.confirmPassword': 'אישור סיסמה',
    'account.login': 'התחבר',
    'account.register': 'צור חשבון',
    'account.remember': 'זכור אותי',
    'account.remember.desc': 'הישאר מחובר לאחר סגירת הדפדפן',
    'account.forgotPassword': 'שכחת סיסמה?',
    'account.hint':
      'היסטוריית החיפוש, ערכת הנושא וההגדרות מסונכרנות בין המכשירים שלך.',
    'account.logout': 'התנתק',
    'account.editProfile': 'ערוך פרופיל',
    'account.changePassword': 'שנה סיסמה',
    'account.syncNow': 'סנכרון עכשיו',
    'account.synced': 'סונכרן.',
    'account.delete': 'מחק חשבון',
    'account.delete.desc':
      'פעולה זו מסירה לצמיתות את חשבונך ואת כל הנתונים המסונכרנים מ-Lodestar.',
    'account.delete.confirm': 'הקלד {username} לאישור.',
    'account.delete.permanent': 'מחק לצמיתות',
    'account.cancel': 'בטל',
    'account.save': 'שמור',
    'account.displayName': 'שם מוצג',
    'account.bio': 'אודות',
    'account.memberSince': 'חבר מאז {date}',
    'account.noBio': 'אין אודות עדיין.',
    'account.removePhoto': 'הסר תמונה',
    'account.changePhoto': 'שנה תמונת פרופיל',
    'account.currentPassword': 'סיסמה נוכחית',
    'account.newPassword': 'סיסמה חדשה',
    'account.confirmNewPassword': 'אישור סיסמה חדשה',
    'account.updatePassword': 'עדכן סיסמה',
    'account.passwordUpdated': 'הסיסמה עודכנה.',
    'account.devices': 'מכשירים',
    'account.thisDevice': 'המכשיר הזה',
    'account.otherDevice': 'מכשיר אחר',
    'account.lastSeen': 'נראה לאחרונה {time}',
    'account.revoke': 'בטל גישה',
    'account.signOutEverywhere': 'התנתק מכל המכשירים',
    'account.profileSaved': 'הפרופיל נשמר.',
    'account.photoUpdated': 'תמונת הפרופיל עודכנה.',
    'account.photoRemoved': 'תמונת הפרופיל הוסרה.',
    'account.photoType': 'בחר תמונת PNG או JPEG.',
    'account.photoRead': 'לא ניתן היה לקרוא את התמונה.',
    'account.enterUsername': 'הזן שם משתמש.',
    'account.enterEmail': 'הזן את האימייל שלך.',
    'account.emailInvalid': 'הזן כתובת אימייל חוקית.',
    'account.passwordTooShort': 'הסיסמה חייבת להכיל לפחות 6 תווים.',
    'account.passwordsMismatch': 'הסיסמאות אינן תואמות.',
    'account.usernameRules':
      'שם המשתמש חייב להכיל 3-20 תווים (אותיות, מספרים, . _ -).',
    'account.reset.title': 'איפוס סיסמה',
    'account.reset.send': 'שלח קוד איפוס',
    'account.reset.code': 'קוד איפוס',
    'account.reset.codeDesc':
      'הזן שם משתמש ואימייל כדי לקבל קוד איפוס.',
    'account.reset.codeShown':
      'קוד האיפוס שלך הוא {code}. הוא יפוג בעוד 15 דקות.',
    'account.reset.invalid': 'קוד האיפוס אינו חוקי או פג תוקף.',
    'account.reset.submit': 'אפס סיסמה',
    'account.reset.done': 'הסיסמה אופסה. כעת תוכל להתחבר.',
    'account.reset.back': 'חזרה להתחברות',

    'history.title': 'היסטוריה',
    'history.clear': 'נקה היסטוריה',
    'history.count': { one: '{n} חיפוש', two: '{n} חיפושים', other: '{n} חיפושים' },
    'history.empty.off': 'היסטוריית החיפוש כבויה.',
    'history.empty.none': 'אין עדיין היסטוריית חיפוש.',
    'history.empty.desc': 'החיפושים שתבצע יופיעו כאן.',
    'history.footer': 'ההיסטוריה נשמרת רק במכשיר זה',

    'bookmarks.title': 'שמורים',
    'bookmarks.clear': 'נקה שמורים',
    'bookmarks.count': {
      one: '{n} פריט שמור',
      two: '{n} פריטים שמורים',
      other: '{n} פריטים שמורים',
    },
    'bookmarks.empty.title': 'עדיין לא נשמר דבר.',
    'bookmarks.empty.desc':
      'הקש על הכוכב בכל תוצאה כדי לשמור אותה כאן.',
    'bookmarks.footer': 'הפריטים השמורים נשמרים רק במכשיר זה',
    'bookmarks.remove': 'הסר',

    'error404.text': 'הדף שאתה מחפש אינו קיים או הועבר.',
    'error404.home': 'עבור לדף הבית של Lodestar',

    'account.menu.label': 'תפריט חשבון',
    'account.menu.settings': 'הגדרות',
    'account.menu.saved': 'שמורים',
    'account.menu.signout': 'התנתק',
  },
};

function pluralForm(count, lang) {
  const n = Number(count) || 0;
  if (lang === 'ar') {
    if (n === 0) return 'zero';
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    if (n >= 3 && n <= 10) return 'few';
    if (n >= 11 && n <= 99) return 'many';
    return 'other';
  }
  if (lang === 'ga') {
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    if (n >= 3 && n <= 6) return 'few';
    if (n >= 7 && n <= 10) return 'many';
    return 'other';
  }
  if (lang === 'he') {
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    return 'other';
  }
  return n === 1 ? 'one' : 'other';
}

export function t(key, vars) {
  const lang = getLanguage();
  const table = STRINGS[lang] || STRINGS.en;
  let value = table[key];
  if (value == null) value = STRINGS.en[key];
  if (value == null) return key;
  if (typeof value === 'object') {
    const form = pluralForm((vars && vars.count) || 0, lang);
    value = value[form] || value.other || value.one || '';
  }
  if (vars) {
    value = String(value).replace(/\{(\w+)\}/g, function (match, name) {
      return vars[name] != null ? String(vars[name]) : match;
    });
  }
  return value;
}

function applyStatic() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
}

function applyTitleAndDescription(page) {
  if (!page) return;
  const titleKey = 'title.' + page;
  if (STRINGS.en[titleKey] != null) document.title = t(titleKey);
  const descKey = 'desc.' + page;
  if (STRINGS.en[descKey] != null) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t(descKey));
  }
}

const LOCALIZED_LOGO = {
  ar: '../assets/logo-arabic.svg',
  he: '../assets/logo-hebrew.svg',
};

function applyLogo() {
  const lang = getLanguage();
  const file = LOCALIZED_LOGO[lang];
  document
    .querySelectorAll('img.logo-word, img.home__logo')
    .forEach(function (img) {
      let base = img.getAttribute('data-logo-src');
      if (!base) {
        base = img.src.split('/').pop();
        img.setAttribute('data-logo-src', base);
      }
      img.src = file || '../assets/' + base;
    });
}

export function applyLanguage() {
  const lang = getLanguage();
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  applyStatic();
  applyLogo();
  const page = document.body ? document.body.getAttribute('data-page') : null;
  applyTitleAndDescription(page);
  window.dispatchEvent(new CustomEvent('lodestar:lang', { detail: lang }));
}

applyLanguage();
