


import type { ReactNode } from "react";
import BottomSheet from "./BottomSheet";
import { useResponsive } from "./useResponsive";
import Modal from "./Modal";

interface IModalLabel {
  children: ReactNode;
  open: boolean;
  title: ReactNode;
  width?: string;
  onClose: () => any;
}

function ModalLabel({ children, onClose, open, title, width }: IModalLabel) {
  const isMobile = useResponsive("down", "md");

  return isMobile ? (
    <BottomSheet open={open} title={title} onClose={onClose}>
      {children}
    </BottomSheet>
  ) : (
    <Modal open={open} title={title} onClose={onClose} width={width}>
      {children}
    </Modal>
  );
}

export default ModalLabel;
