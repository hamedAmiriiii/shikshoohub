import React from "react";
import {Box, IconButton, Modal, Slide, Typography, Grid} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {styled} from "@mui/system";
import {TransitionProps} from "@mui/material/transitions";
import Divider from "@mui/material/Divider";

interface BottomSheetProps {
  open: boolean;
  onClose: (event: any, reason: any) => void;
  icon?: React.ReactNode;
  title?: React.ReactNode | string;
  children: React.ReactNode;
}

const StyledModal = styled(Modal)(({theme}) => ({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  outline: "none"
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props}  />;
});

const BottomSheetModal: React.FC<BottomSheetProps> = ({open, onClose, icon, title, children}) => {
  return (
    <StyledModal
      open={open}
      onClose={onClose}
      aria-labelledby="bottom-sheet-title"
      aria-describedby="bottom-sheet-description"
      closeAfterTransition
      className="mts-layout"
    >
      <Transition in={open}>
        <Box
          sx={{
            width: {xs: "100%", sm: "100%", md: "50%", lg:"50%", xl: "50%"},
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "white",
            borderTopLeftRadius: "1.5rem",
            borderTopRightRadius: "1.5rem",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          }}>
          <Grid container>
            <Grid item xs={12} sx={{display: 'flex', justifyContent: 'center'}}>
              <Divider sx={{width: "3.5rem", height: "0.15rem"}} color="#2CDFC9"/>
            </Grid>
            <Grid item xs={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row-reverse",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "4px"
                  }}>
              <IconButton
                edge="end"
                color="inherit"
                onClick={onClose as any}
                aria-label="close"
                sx={{marginRight: "1rem"}}>
                <CloseIcon/>
              </IconButton>
              <Grid item xs={12}
                    sx={{
                      display: "flex",
                      justifyContent: "start",
                      alignItems: "center",
                      marginLeft: "1rem",
                    }}>
                {icon &&
                <Box sx={{marginLeft: "2px"}}>{icon}</Box>}
                {title &&
                <Typography
                  id="bottom-sheet-title"
                  variant="h2"
                  sx={{
                    fontSize: "font-size: 0.75rem",
                    fontWeight: "400",
                  }}>
                  {title}
                </Typography>}
              </Grid>
            </Grid>
            <Grid item xs={12}
                  sx={{
                    overflowY: "auto",
                    maxHeight: "calc(100vh - 100px)",
                    padding: "16px"
                  }}>
              {children}
            </Grid>
          </Grid>
        </Box>
      </Transition>
    </StyledModal>
  )
}
export default BottomSheetModal;
