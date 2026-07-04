export type ChatLang = "en" | "ur" | "hi";

export const CHAT_LANG_LABELS: Record<ChatLang, string> = {
  en: "English",
  ur: "اردو",
  hi: "हिन्दी",
};

type Dict = {
  title: string;
  welcome: string;
  pickLanguage: string;
  pickMode: string;
  chatWithAi: string;
  chatWithAgent: string;
  inputPlaceholder: string;
  send: string;
  waitingAgent: string;
  noAgentsTitle: string;
  noAgentsBody: string;
  leaveMessage: string;
  emailInquiry: string;
  continueAi: string;
  yourEmail: string;
  yourName: string;
  yourMessage: string;
  submit: string;
  thanks: string;
  closedByAgent: string;
  transferring: string;
  online: string;
};

export const CHAT_I18N: Record<ChatLang, Dict> = {
  en: {
    title: "Support Chat",
    welcome: "Hi! How can we help you today?",
    pickLanguage: "Please choose your language",
    pickMode: "How would you like to continue?",
    chatWithAi: "Chat with AI Bot",
    chatWithAgent: "Chat with Live Agent",
    inputPlaceholder: "Type your message...",
    send: "Send",
    waitingAgent: "Waiting for a live agent to join...",
    noAgentsTitle: "No agents online right now",
    noAgentsBody: "You can leave a message, submit an email inquiry, or continue with our AI bot.",
    leaveMessage: "Leave a message",
    emailInquiry: "Submit email inquiry",
    continueAi: "Continue with AI Bot",
    yourEmail: "Your email",
    yourName: "Your name (optional)",
    yourMessage: "Your message",
    submit: "Submit",
    thanks: "Thanks! Our team will reach out via email.",
    closedByAgent: "This conversation was closed.",
    transferring: "Transferring to a live agent...",
    online: "We're online",
  },
  ur: {
    title: "سپورٹ چیٹ",
    welcome: "سلام! ہم آپ کی کیسے مدد کر سکتے ہیں؟",
    pickLanguage: "براہ کرم اپنی زبان منتخب کریں",
    pickMode: "آپ کیسے جاری رکھنا چاہیں گے؟",
    chatWithAi: "AI بوٹ سے بات کریں",
    chatWithAgent: "لائیو ایجنٹ سے بات کریں",
    inputPlaceholder: "اپنا پیغام لکھیں...",
    send: "بھیجیں",
    waitingAgent: "ایجنٹ کے شامل ہونے کا انتظار...",
    noAgentsTitle: "ابھی کوئی ایجنٹ آن لائن نہیں ہے",
    noAgentsBody: "آپ پیغام چھوڑ سکتے ہیں، ای میل کر سکتے ہیں، یا AI بوٹ سے بات جاری رکھ سکتے ہیں۔",
    leaveMessage: "پیغام چھوڑیں",
    emailInquiry: "ای میل بھیجیں",
    continueAi: "AI بوٹ سے جاری رکھیں",
    yourEmail: "آپ کی ای میل",
    yourName: "آپ کا نام (اختیاری)",
    yourMessage: "آپ کا پیغام",
    submit: "جمع کریں",
    thanks: "شکریہ! ہماری ٹیم آپ سے ای میل پر رابطہ کرے گی۔",
    closedByAgent: "یہ گفتگو بند کر دی گئی ہے۔",
    transferring: "لائیو ایجنٹ سے منتقل کیا جا رہا ہے...",
    online: "ہم آن لائن ہیں",
  },
  hi: {
    title: "सपोर्ट चैट",
    welcome: "नमस्ते! हम आपकी कैसे मदद कर सकते हैं?",
    pickLanguage: "कृपया अपनी भाषा चुनें",
    pickMode: "आप कैसे आगे बढ़ना चाहेंगे?",
    chatWithAi: "AI बॉट से बात करें",
    chatWithAgent: "लाइव एजेंट से बात करें",
    inputPlaceholder: "अपना संदेश लिखें...",
    send: "भेजें",
    waitingAgent: "एजेंट के जुड़ने का इंतज़ार...",
    noAgentsTitle: "अभी कोई एजेंट ऑनलाइन नहीं है",
    noAgentsBody: "आप संदेश छोड़ सकते हैं, ईमेल भेज सकते हैं, या AI बॉट से जारी रख सकते हैं।",
    leaveMessage: "संदेश छोड़ें",
    emailInquiry: "ईमेल भेजें",
    continueAi: "AI बॉट से जारी रखें",
    yourEmail: "आपका ईमेल",
    yourName: "आपका नाम (वैकल्पिक)",
    yourMessage: "आपका संदेश",
    submit: "जमा करें",
    thanks: "धन्यवाद! हमारी टीम ईमेल पर संपर्क करेगी।",
    closedByAgent: "यह बातचीत बंद हो गई है।",
    transferring: "लाइव एजेंट से जोड़ा जा रहा है...",
    online: "हम ऑनलाइन हैं",
  },
};
