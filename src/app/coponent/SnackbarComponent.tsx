import React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface SnackbarComponentProps {
  open: boolean;
  autoHideDuration?: number;
  onClose: (event: React.SyntheticEvent | Event, reason?: string) => void;
  message: string;
}

export default function SnackbarComponent({
  open,
  autoHideDuration = 6000,
  onClose,
  message,
}: SnackbarComponentProps) {
  const action = (
    <React.Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={onClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
      <Snackbar
          
          style={{height:'120px'}}
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      message={message}
      action={action}
    />
  );
}
