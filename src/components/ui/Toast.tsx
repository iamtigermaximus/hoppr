"use client";
import { createContext, useContext, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { CheckCircle, XCircle, Info, X } from "@phosphor-icons/react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  confirm: async () => false,
});

export function useToast() {
  return useContext(ToastContext);
}

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideOut = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
`;

const ToastContainer = styled.div`
  position: fixed; top: 16px; right: 16px; z-index: 200;
  display: flex; flex-direction: column; gap: 8px;
  max-width: 320px;
`;

const ToastItem = styled.div<{ $type: ToastType; $leaving: boolean }>`
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: 12px;
  background: ${({ $type }) => $type === "success" ? "#065f46" : $type === "error" ? "#991b1b" : "#1e3a5f"};
  border: 1px solid ${({ $type }) => $type === "success" ? "#10b98133" : $type === "error" ? "#ef444433" : "#3b82f633"};
  color: #fff; font-size: 13px; font-weight: 500;
  animation: ${({ $leaving }) => $leaving ? slideOut : slideIn} 0.3s ease forwards;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
`;

const ToastMessage = styled.span`flex: 1;`;

const IconMap = { success: CheckCircle, error: XCircle, info: Info };
const IconColor = { success: "#10b981", error: "#ef4444", info: "#3b82f6" };

const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 150;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
`;

const ModalBox = styled.div`
  background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px; padding: 24px;
  max-width: 360px; width: 100%;
`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [leaving, setLeaving] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setLeaving(prev => new Set(prev).add(id));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, 3000);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => setModal({ message, resolve }));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      <ToastContainer>
        {toasts.map(t => {
          const Icon = IconMap[t.type];
          return (
            <ToastItem key={t.id} $type={t.type} $leaving={leaving.has(t.id)}>
              <Icon size={18} color={IconColor[t.type]} weight="fill" />
              <ToastMessage>{t.message}</ToastMessage>
              <button onClick={() => {
                setLeaving(prev => new Set(prev).add(t.id));
                setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 300);
              }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <X size={14} color="#737373" />
              </button>
            </ToastItem>
          );
        })}
      </ToastContainer>

      {modal && (
        <ModalOverlay onClick={() => { modal.resolve(false); setModal(null); }}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>Confirm</h3>
            <p style={{ color: "#a3a3a3", fontSize: "13px", lineHeight: 1.5, marginBottom: "20px" }}>{modal.message}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { modal.resolve(false); setModal(null); }} style={{
                flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #262626",
                background: "transparent", color: "#a3a3a3", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={() => { modal.resolve(true); setModal(null); }} style={{
                flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                background: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>Confirm</button>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </ToastContext.Provider>
  );
}
