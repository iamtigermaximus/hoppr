"use client";
import styled from "styled-components";
import { useEffect } from "react";

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; justify-content: center;
  @media (min-width: 768px) { align-items: center; }
`;

const Sheet = styled.div`
  background: #121212;
  border: 1px solid #262626;
  border-radius: 20px 20px 0 0;
  width: 100%; max-width: 500px; max-height: 85vh;
  overflow-y: auto; padding: 20px;
  @media (min-width: 768px) { border-radius: 20px; margin: 20px; }
`;

interface ModalProps { open: boolean; onClose: () => void; children: React.ReactNode; }

export function Modal({ open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>{children}</Sheet>
    </Overlay>
  );
}
