
"use client"
import React, { createContext, useState, useEffect, useContext } from 'react';


const LanguageContext = createContext<any>(null);

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: any) {
  const [language, setLanguage] = useState('fa');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fa';
    setLanguage(savedLanguage);
  }, []);

  const changeLanguage = (lang: string) => {
    localStorage.setItem('language', lang);
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
