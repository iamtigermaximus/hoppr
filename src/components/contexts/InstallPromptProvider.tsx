"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { InstallBanner } from "@/components/ui/InstallBanner";

interface InstallPromptContextValue {
  /** Programmatically trigger the native install dialog */
  triggerInstall: () => Promise<boolean>;
  /** Force-show the banner (e.g. after following a venue) */
  showBanner: () => void;
  /** Whether the app is already installed as a PWA */
  installed: boolean;
  /** Whether the browser supports install prompt */
  promptAvailable: boolean;
}

const InstallPromptContext = createContext<InstallPromptContextValue>({
  triggerInstall: async () => false,
  showBanner: () => {},
  installed: false,
  promptAvailable: false,
});

export function useInstallPromptContext() {
  return useContext(InstallPromptContext);
}

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const {
    showBanner: visible,
    triggerInstall,
    dismiss,
    show,
    installed,
    promptAvailable,
  } = useInstallPrompt();

  return (
    <InstallPromptContext.Provider
      value={{ triggerInstall, showBanner: show, installed, promptAvailable }}
    >
      {children}
      {visible && (
        <InstallBanner onInstall={triggerInstall} onDismiss={dismiss} />
      )}
    </InstallPromptContext.Provider>
  );
}
