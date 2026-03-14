import React, { createContext, useContext } from 'react';

type OpenCorridaModalContextType = {
  openModal: () => void;
};

const OpenCorridaModalContext = createContext<OpenCorridaModalContextType | null>(null);

export function OpenCorridaModalProvider({
  openModal,
  children,
}: {
  openModal: () => void;
  children: React.ReactNode;
}) {
  return (
    <OpenCorridaModalContext.Provider value={{ openModal }}>
      {children}
    </OpenCorridaModalContext.Provider>
  );
}

export function useOpenCorridaModal(): OpenCorridaModalContextType {
  const ctx = useContext(OpenCorridaModalContext);
  if (!ctx) {
    return { openModal: () => {} };
  }
  return ctx;
}
