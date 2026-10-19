'use client';

import * as React from 'react';

interface MobileNavContextValue {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const MobileNavContext = React.createContext<MobileNavContextValue>({
  mobileOpen: false,
  setMobileOpen: () => { },
  openMobileMenu: () => { },
  closeMobileMenu: () => { },
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const openMobileMenu = React.useCallback(() => setMobileOpen(true), []);
  const closeMobileMenu = React.useCallback(() => setMobileOpen(false), []);

  return (
    <MobileNavContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        openMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  return React.useContext(MobileNavContext);
}
