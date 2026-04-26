import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CircularProgress, {
  circularProgressClasses,
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { Typography } from '@mui/material';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 17,
    marginLeft:"5px",
  borderRadius: '0 20px 20px 0' ,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[200],
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[800],
    }),
  },
    [`& .${linearProgressClasses.bar}`]: {
        marginLeft:"5px",
    borderRadius:'0 20px 20px 0',
    backgroundColor: '#ff9100',
    ...theme.applyStyles('dark', {
      backgroundColor: '#308fe8',
    }),
  },
}));


export default function CustomizedProgressBars({value=0}) {
  return (
    <Stack spacing={2} sx={{ flexGrow: 1 }}>
          <BorderLinearProgress variant="determinate" value={value} />
        
    </Stack>
  );
}
