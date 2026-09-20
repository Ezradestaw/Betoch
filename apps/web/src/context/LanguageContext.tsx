// ==============================================================================
// BETOCH LOCALIZATION CONTEXT (English & Amharic)
// Fast, zero-dependency translation provider with persistence
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'am';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.browse': 'Browse Homes',
    'nav.trust': 'Trust Center',
    'nav.safety': 'Safety Tips',
    'nav.postProperty': 'List a Property',
    'nav.signIn': 'Sign In',
    'nav.saved': 'Saved',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',

    // Common Actions
    'action.search': 'Search',
    'action.filter': 'Filters',
    'action.apply': 'Apply Now',
    'action.scheduleTour': 'Schedule Viewing',
    'action.save': 'Save',
    'action.saved': 'Saved',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.viewDetails': 'View Details',
    'action.clearAll': 'Clear All',

    // Homepage
    'hero.badge': 'Ethiopia’s Most Trusted Home Rental Platform',
    'hero.title': 'Find Verified Homes in Addis Ababa',
    'hero.subtitle': 'Direct landlord communication, legally-backed 2-month deposit security, and certified Carta title deeds.',
    'hero.searchPlaceholder': 'Search by sub-city, neighborhood, or landmark (e.g. Bole, CMC, Sarbet)...',
    'hero.cta': 'Explore Available Homes',

    // Property Details & Badges
    'prop.monthlyRent': 'Monthly Rent',
    'prop.deposit': 'Security Deposit',
    'prop.bedrooms': 'Bedrooms',
    'prop.bathrooms': 'Bathrooms',
    'prop.size': 'Area (sqm)',
    'prop.faydaVerified': 'Fayda Verified Landlord',
    'prop.cartaVerified': 'Carta Title Deed Inspected',
    'prop.priceReduced': 'Price Reduced',

    // Sub-cities
    'subcity.bole': 'Bole',
    'subcity.yeka': 'Yeka',
    'subcity.kirkos': 'Kirkos',
    'subcity.arada': 'Arada',
    'subcity.lideta': 'Lideta',
    'subcity.kolfe': 'Kolfe Keranio',
    'subcity.gullele': 'Gullele',
    'subcity.nifassilk': 'Nifas Silk-Lafto',
    'subcity.akaki': 'Akaki Kality',
    'subcity.lemi': 'Lemi Kura'
  },
  am: {
    // Navigation
    'nav.home': 'ዋና ገጽ',
    'nav.browse': 'ቤቶችን ይመልከቱ',
    'nav.trust': 'የእምነት ማዕከል',
    'nav.safety': 'የደህንነት መመሪያ',
    'nav.postProperty': 'ቤት ያከራዩ',
    'nav.signIn': 'ይግቡ',
    'nav.saved': 'የተወደዱ',
    'nav.messages': 'መልዕክቶች',
    'nav.profile': 'መገለጫ',
    'nav.settings': 'ቅንብሮች',

    // Common Actions
    'action.search': 'ፈልግ',
    'action.filter': 'አጣራ',
    'action.apply': 'አሁን ያመልክቱ',
    'action.scheduleTour': 'ቀጠሮ ይያዙ',
    'action.save': 'አስቀምጥ',
    'action.saved': 'ተቀምጧል',
    'action.cancel': 'ይቅር',
    'action.confirm': 'አረጋግጥ',
    'action.viewDetails': 'ዝርዝር ይመልከቱ',
    'action.clearAll': 'ሁሉንም አጽዳ',

    // Homepage
    'hero.badge': 'በኢትዮጵያ አስተማማኝ እና ህጋዊ የቤት ኪራይ መድረክ',
    'hero.title': 'በአዲስ አበባ የተረጋገጡ ቤቶችን ያግኙ',
    'hero.subtitle': 'ቀጥተኛ የባለቤት ግንኙነት፣ በህግ የተደገፈ የ2 ወር የዋስትና ገደብ እና የተረጋገጠ የካርታ ሰነድ።',
    'hero.searchPlaceholder': 'በክፍለ ከተማ፣ አካባቢ ወይም ታዋቂ ቦታ ይፈልጉ (ለምሳሌ ቦሌ፣ ሲኤምሲ፣ ሳርቤት)...',
    'hero.cta': 'ያሉ ቤቶችን ይመልከቱ',

    // Property Details & Badges
    'prop.monthlyRent': 'የወር ኪራይ',
    'prop.deposit': 'የዋስትና ገንዘብ',
    'prop.bedrooms': 'የመኝታ ክፍሎች',
    'prop.bathrooms': 'መታጠቢያ ቤቶች',
    'prop.size': 'ስፋት (ካሬ ሜትር)',
    'prop.faydaVerified': 'በፋይዳ ዲጂታል መታወቂያ የተረጋገጠ',
    'prop.cartaVerified': 'ካርታው የተረጋገጠ ቤት',
    'prop.priceReduced': 'ዋጋው የቀነሰ',

    // Sub-cities
    'subcity.bole': 'ቦሌ',
    'subcity.yeka': 'የካ',
    'subcity.kirkos': 'ቂርቆስ',
    'subcity.arada': 'አራዳ',
    'subcity.lideta': 'ልደታ',
    'subcity.kolfe': 'ኮልፌ ቀራኒዮ',
    'subcity.gullele': 'ጉለሌ',
    'subcity.nifassilk': 'ንፋስ ስልክ ላፍቶ',
    'subcity.akaki': 'አቃቂ ቃሊቲ',
    'subcity.lemi': 'ለሚ ኩራ'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (k) => k
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('betoch_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('betoch_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
