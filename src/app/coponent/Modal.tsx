import { Box, IconButton } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import type { ReactNode } from "react";
// import { RiCloseLargeFill } from "react-icons/ri";

type TModal = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  width?: string;
};

function Modal({ children, onClose, open, title, width }: TModal) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiPaper-root": {
          borderRadius: "24px",
          width: width +"!important",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>{title}</Box>
          <Box>
            <IconButton onClick={onClose}>
              {/* <RiCloseLargeFill size="1.25rem" /> */}
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{children}</DialogContentText>
      </DialogContent>
    </Dialog>
  );
}

export default Modal;
