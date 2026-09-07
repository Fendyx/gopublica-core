'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface CategoryNavContextValue {
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
}

const CategoryNavContext = createContext<CategoryNavContextValue>({
  mobileDrawerOpen: false,
  setMobileDrawerOpen: () => {},
});

export function useCategoryNav() {
  return useContext(CategoryNavContext);
}

export function CategoryNavProvider({ children }: { children: ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <CategoryNavContext.Provider value={{ mobileDrawerOpen, setMobileDrawerOpen }}>
      {children}
    </CategoryNavContext.Provider>
  );
}
