"use client"
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import MuiInput from '@mui/material/Input';
import VolumeUp from '@mui/icons-material/VolumeUp';
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

const Input = styled(MuiInput)`
  width: 32px;
  border:0
`;

export default function InputSlider(props) {
  const [value, setValue] = React.useState(props.value);
    const [iconSize, setIconSize] = React.useState(25);
    
React.useEffect(() => {
    setValue(props.value)
    if (props.value > 0) {
        setIconSize(27);
        setTimeout(() => setIconSize(25), 200);
      }
}, [props])

  const handleSliderChange = (event, newValue) => {
    setValue(newValue);
  };


  return (
    <Box sx={{ width: 300 }}>
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
       
        <Grid item xs>
          <Slider
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
                      aria-labelledby="input-slider"
                      min={0}
                      max={props.max}
                      
          />
        </Grid>
        <Grid item>
                  <span>{value} </span> 
                  <MonetizationOnIcon
                      style={{ fontSize: 25, color: iconSize == 25 ? "#ffbc43e3":"#ff8100fc" }}
                          />
        </Grid>
      </Grid>
    </Box>
  );
}
