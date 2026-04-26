// "use client";
// import en from './en.json';
// import fa from './fa.json';

// export function translate(key: any) {
//   let language = 'en';

//   if (typeof window !== 'undefined') {
//     language = localStorage.getItem('language') || 'en';
//   }
//   const translations = language === 'fa' ? fa : en;

//   return translations[key] || key;
// }


"use client";
import React from 'react';
import en from './en.json';
import fa from './fa.json';
import gr from './gr.json';
import { useLanguage } from './LanguageProvider'; // وارد کردن context

export function translate(key: string) {
  const { language } = useLanguage(); // گرفتن زبان از context
  const translations = language === 'fa' ? fa : language === 'gr' ? gr : en;

  return translations[key] || key;
}
