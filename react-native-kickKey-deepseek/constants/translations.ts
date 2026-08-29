export type Language = 'en' | 'bn';

const translations = {
  en: {
    // Tab bar
    tabHome: 'Home',
    tabSettings: 'Settings',
    tabThemes: 'Themes',
    tabLang: 'Lang',
    tabDict: 'Dict',

    // Home screen
    homeTitle: 'KickKey',
    homeSubtitle: 'Your custom keyboard',
    keyboardEnabled: 'Keyboard Enabled',
    setAsDefault: 'Set as Default',
    activeLanguage: 'Active Language',
    tryItOut: 'Try it out',
    testInputPlaceholder: 'Tap here and start typing...',
    yes: 'Yes',
    no: 'No',

    // Settings screen
    settingsTitle: 'Settings',
    feedback: 'Feedback',
    hapticFeedback: 'Haptic Feedback',
    hapticDescription: 'Vibrate on every key press',
    keySounds: 'Key Sounds',
    keySoundsDescription: 'Play a click sound on key press',
    typing: 'Typing',
    autoCorrect: 'Auto-correct',
    autoCorrectDescription: 'Automatically fix typos when you press space',
    showSuggestions: 'Show Suggestions',
    showSuggestionsDescription: 'Display word suggestions above the keyboard',
    keySize: 'Key Size',
    keyHeight: 'Key Height',
    cornerRadius: 'Corner Radius',
    fontSize: 'Font Size',
    cursorType: 'Cursor Type',
    cursorColor: 'Cursor Color',
    cursorSize: 'Cursor Size',
    size: 'Size',
    displayOverOtherApps: 'Display Over Other Apps',
    overlayPermission: 'Overlay Permission',
    checking: 'Checking…',
    granted: 'Granted',
    notGranted: 'Not Granted',
    openOverlaySettings: 'Open Overlay Settings',
    overlayHint: 'Grant "Display over other apps" permission to enable the on-screen mouse pointer when using the touchpad.',
    accessibility: 'Accessibility',
    accessibilityService: 'Accessibility Service',
    enabled: 'Enabled',
    disabled: 'Disabled',
    openAccessibilitySettings: 'Open Accessibility Settings',
    accessibilityHint: 'Enable "KickKey Accessibility", then assign it to the Accessibility button or shortcut to open the floating panel anywhere — no input field needed.',
    settingsFootnote: 'Changes apply automatically the next time you open the keyboard.',

    // Themes screen
    themesTitle: 'Themes',
    colorTheme: 'Color Theme',

    // Language screen
    languageTitle: 'Language',
    languageDescription: 'Choose your default typing language. You can always switch languages from the keyboard\'s globe button while typing.',

    // Dictionary screen
    dictionaryTitle: 'Custom Dictionary',
    dictionaryDescription: 'Add names, slang, or technical terms so KickKey suggests them.',
    dictionaryEn: 'English',
    dictionaryBn: 'Bangla',
    addWordPlaceholder: 'Add a word...',
    add: 'Add',
    emptyDictionary: 'No custom words yet. Add one above.',

    // Onboarding Step 1
    enableKickKey: 'Enable KickKey',
    step1Description: 'First, you need to turn on KickKey in your phone\'s keyboard settings. Android will show a security notice — this is normal for every keyboard app. Tap "OK" to continue.',
    step1Step1: 'Tap the button below',
    step1Step2: 'Find "KickKey Keyboard" in the list',
    step1Step3: 'Toggle it on',
    step1Step4: 'Tap "OK" on the security notice',
    step1Step5: 'Come back to this app',
    openKeyboardSettings: 'Open Keyboard Settings',
    step1Hint: 'This screen will automatically advance once KickKey is enabled.',

    // Onboarding Step 2
    setAsDefaultTitle: 'Set as Default',
    step2Description: 'Almost there! Now set KickKey as your default keyboard so it opens automatically whenever you tap a text field.',
    step2Step1: 'Tap the button below',
    step2Step2: 'Select "KickKey Keyboard" as default',
    step2Step3: 'Come back to this app',
    setDefaultKeyboard: 'Set Default Keyboard',
    step2Hint: 'This screen will automatically advance once KickKey is your default keyboard.',

    // Onboarding Step 3
    displayOverOtherAppsTitle: 'Display Over Other Apps',
    step3Description: 'Allow KickKey to draw over other apps so the touchpad cursor can appear anywhere on screen. This is optional but recommended for the full touchpad experience.',
    step3Step1: 'Tap the button below',
    step3Step2: 'Find "KickKey" in the list',
    step3Step3: 'Toggle the permission on',
    step3Step4: 'Come back to this app',
    skipForNow: 'Skip for now',
    step3Hint: 'You can always enable this later in Settings.',

    // Onboarding Step 4
    allSet: "You're All Set!",
    step4Description: 'KickKey is ready to use. Tap any text field in any app and your new keyboard will appear. You can switch languages anytime with the globe button, and customize your experience in the Settings tab.',
    startUsingKickKey: 'Start Using KickKey',
  },

  bn: {
    // Tab bar
    tabHome: 'হোম',
    tabSettings: 'সেটিংস',
    tabThemes: 'থিম',
    tabLang: 'ভাষা',
    tabDict: 'অভিধান',

    // Home screen
    homeTitle: 'KickKey',
    homeSubtitle: 'আপনার কাস্টম কীবোর্ড',
    keyboardEnabled: 'কীবোর্ড সক্রিয়',
    setAsDefault: 'ডিফল্ট হিসাবে সেট করুন',
    activeLanguage: 'সক্রিয় ভাষা',
    tryItOut: 'চেষ্টা করুন',
    testInputPlaceholder: 'এখানে ট্যাপ করুন এবং টাইপ করা শুরু করুন...',
    yes: 'হ্যাঁ',
    no: 'না',

    // Settings screen
    settingsTitle: 'সেটিংস',
    feedback: 'ফিডব্যাক',
    hapticFeedback: 'হ্যাপটিক ফিডব্যাক',
    hapticDescription: 'প্রতিটি কী চাপে কম্পন',
    keySounds: 'কী সাউন্ড',
    keySoundsDescription: 'কী চাপে ক্লিক সাউন্ড বাজান',
    typing: 'টাইপিং',
    autoCorrect: 'স্বয়ংক্রিয় সংশোধন',
    autoCorrectDescription: 'স্পেস চাপলে স্বয়ংক্রিয়ভাবে টাইপো সংশোধন করুন',
    showSuggestions: 'পরামর্শ দেখান',
    showSuggestionsDescription: 'কীবোর্ডের উপরে শব্দের পরামর্শ দেখান',
    keySize: 'কীর আকার',
    keyHeight: 'কীর উচ্চতা',
    cornerRadius: 'কোণের ব্যাসার্ধ',
    fontSize: 'ফন্টের আকার',
    cursorType: 'কার্সরের ধরন',
    cursorColor: 'কার্সরের রং',
    cursorSize: 'কার্সরের আকার',
    size: 'আকার',
    displayOverOtherApps: 'অন্যান্য অ্যাপের উপরে প্রদর্শন',
    overlayPermission: 'ওভারলে অনুমতি',
    checking: 'যাচাই করা হচ্ছে…',
    granted: 'প্রদান করা হয়েছে',
    notGranted: 'প্রদান করা হয়নি',
    openOverlaySettings: 'ওভারলে সেটিংস খুলুন',
    overlayHint: '"অন্যান্য অ্যাপের উপরে প্রদর্শন" অনুমতি প্রদান করুন টাচপ্যাড ব্যবহার করার সময় অন-স্ক্রিন মাউস পয়েন্টার সক্রিয় করতে।',
    accessibility: 'প্রবেশযোগ্যতা',
    accessibilityService: 'প্রবেশযোগ্যতা সেবা',
    enabled: 'সক্রিয়',
    disabled: 'নিষ্ক্রিয়',
    openAccessibilitySettings: 'প্রবেশযোগ্যতা সেটিংস খুলুন',
    accessibilityHint: '"KickKey প্রবেশযোগ্যতা" সক্রিয়করুন, তারপর যেকোনো জায়গায় ভাসমান প্যানেল খুলতে এটি প্রবেশযোগ্যতা বোতাম বা শর্টকাটে নির্ধারণ করুন — ইনপুট ফিল্ডের প্রয়োজন নেই।',
    settingsFootnote: 'পরিবর্তনগুলি পরবর্তীবার কীবোর্ড খোলার সময় স্বয়ংক্রিয়ভাবে প্রয়োগ হবে।',

    // Themes screen
    themesTitle: 'থিম',
    colorTheme: 'রঙের থিম',

    // Language screen
    languageTitle: 'ভাষা',
    languageDescription: 'আপনার ডিফল্ট টাইপিং ভাষা বাছাই করুন। টাইপ করার সময় সবসময় কীবোর্ডের গ্লোব বোতাম থেকে ভাষা পরিবর্তন করতে পারবেন।',

    // Dictionary screen
    dictionaryTitle: 'কাস্টম অভিধান',
    dictionaryDescription: 'নাম, স্ল্যাং বা প্রযুক্তি পরিভাষা যোগ করুন যাতে KickKey সেগুলি প্রস্তাব করে।',
    dictionaryEn: 'ইংরেজি',
    dictionaryBn: 'বাংলা',
    addWordPlaceholder: 'একটি শব্দ যোগ করুন...',
    add: 'যোগ করুন',
    emptyDictionary: 'এখনো কোনো কাস্টম শব্দ নেই। উপরে একটি যোগ করুন।',

    // Onboarding Step 1
    enableKickKey: 'KickKey সক্রিয় করুন',
    step1Description: 'প্রথমে, আপনার ফোনের কীবোর্ড সেটিংসে KickKey চালু করতে হবে। Android একটি নিরাপত্তা বিজ্ঞপ্তি দেখাবে — এটি প্রতিটি কীবোর্ড অ্যাপের জন্য স্বাভাবিক। চালিয়ে যেতে "OK" ট্যাপ করুন।',
    step1Step1: 'নিচের বোতামে ট্যাপ করুন',
    step1Step2: 'তালিকায় "KickKey Keyboard" খুঁজুন',
    step1Step3: 'এটি চালু করুন',
    step1Step4: 'নিরাপত্তা বিজ্ঞপ্তিতে "OK" ট্যাপ করুন',
    step1Step5: 'এই অ্যাপে ফিরে আসুন',
    openKeyboardSettings: 'কীবোর্ড সেটিংস খুলুন',
    step1Hint: 'KickKey সক্রিয় হলে এই স্ক্রিন স্বয়ংক্রিয়ভাবে এগিয়ে যাবে।',

    // Onboarding Step 2
    setAsDefaultTitle: 'ডিফল্ট হিসাবে সেট করুন',
    step2Description: 'প্রায় শেষ! এখন KickKey কে আপনার ডিফল্ট কীবোর্ড হিসাবে সেট করুন যাতে যখনই আপনি একটি টেক্সট ফিল্ডে ট্যাপ করবেন তখন এটি স্বয়ংক্রিয়ভাবে খুলে ওঠে।',
    step2Step1: 'নিচের বোতামে ট্যাপ করুন',
    step2Step2: '"KickKey Keyboard" কে ডিফল্ট হিসাবে নির্বাচন করুন',
    step2Step3: 'এই অ্যাপে ফিরে আসুন',
    setDefaultKeyboard: 'ডিফল্ট কীবোর্ড সেট করুন',
    step2Hint: 'KickKey আপনার ডিফল্ট কীবোর্ড হলে এই স্ক্রিন স্বয়ংক্রিয়ভাবে এগিয়ে যাবে।',

    // Onboarding Step 3
    displayOverOtherAppsTitle: 'অন্যান্য অ্যাপের উপরে প্রদর্শন',
    step3Description: 'টাচপ্যাড কার্সর যেকোনো জায়গায় দেখাতে KickKey কে অন্যান্য অ্যাপের উপরে আঁকতে দিন। এটি ঐচ্ছিক কিন্তু সম্পূর্ণ টাচপ্যাড অভিজ্ঞতার জন্য সুপারিশকৃত।',
    step3Step1: 'নিচের বোতামে ট্যাপ করুন',
    step3Step2: 'তালিকায় "KickKey" খুঁজুন',
    step3Step3: 'অনুমতি চালু করুন',
    step3Step4: 'এই অ্যাপে ফিরে আসুন',
    skipForNow: 'এখন এড়িয়ে যান',
    step3Hint: 'আপনি সবসময় পরে সেটিংসে এটি সক্রিয় করতে পারবেন।',

    // Onboarding Step 4
    allSet: 'আপনি সব সেট করে ফেলেছেন!',
    step4Description: 'KickKey ব্যবহারের জন্য প্রস্তুত। যেকোনো অ্যাপে যেকোনো টেক্সট ফিল্ডে ট্যাপ করুন এবং আপনার নতুন কীবোর্ড দেখাবে। গ্লোব বোতাম দিয়ে যেকোনো সময় ভাষা পরিবর্তন করতে পারবেন, এবং সেটিংস ট্যাবে আপনার অভিজ্ঞতা কাস্টমাইজ করতে পারবেন।',
    startUsingKickKey: 'KickKey ব্যবহার শুরু করুন',
  },
} as const;

export type TranslationKeys = keyof typeof translations.en;

export default translations;
