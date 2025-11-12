'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Tenant } from '@/types';

interface ThemeContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  tenant: Tenant | null;
}

export function ThemeProvider({ children, tenant: initialTenant }: ThemeProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant);

  useEffect(() => {
    if (tenant) {
      // Apply CSS variables to document root
      const root = document.documentElement;
      root.style.setProperty('--color-primary', tenant.primaryColor);
      root.style.setProperty('--color-secondary', tenant.secondaryColor);
      if (tenant.fontFamily) {
        root.style.setProperty('--font-family', tenant.fontFamily);
      }
      if (tenant.logoUrl) {
        root.style.setProperty('--logo-url', `url(${tenant.logoUrl})`);
      }
    }
  }, [tenant]);

  return (
    <ThemeContext.Provider value={{ tenant, setTenant }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

