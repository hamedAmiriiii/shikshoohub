"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

interface ShopContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ShopContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShopContext() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShopContext must be used within a ShopProvider');
  }
  return context;
}

