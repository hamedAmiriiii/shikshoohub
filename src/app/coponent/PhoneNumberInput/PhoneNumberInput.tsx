
"use client"
import React, { useState } from 'react';
import { TextField, InputAdornment, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { StyledTextField } from './style';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import DoneIcon from '@mui/icons-material/MobileFriendly';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
interface PhoneNumberInputProps {
  name: string;
  defaultValue: string;
  
  onChange: (value: string) => void;
  // error: boolean;
  // helperText: string;
}


const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ name, defaultValue, onChange }) => {
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '');
    if (newValue.length === 11 || newValue.length === 10 && newValue.substring(0, 1) === "9") {
      setLoading(true)
      onChange(newValue);
      
    } else {
      setLoading(false)
      onChange("");
    }
  };
  

  return (
    <Box sx={{display:"flex"}} >

      {/* <Box sx={{width:"5%",display:"flex", alignItems:"center"}}>
      <Typography sx={{fontWeight:"600", color:"#ff9100" }} variant="subtitle1" gutterBottom>
        شماره تلفن :
        </Typography>
        </Box> */}
      <Box  sx={{width:"90%"}}>
      <StyledTextField
        placeholder='912...'
        variant="outlined"
        // color="secondary" 
        focused 
        // value={value}
        onChange={handleInputChange}
        onBlur={handleInputChange}
        // error={error}
        // helperText={helperText}
        name={name}
        defaultValue={defaultValue}
          InputProps={{
            startAdornment: (
              <IconButton  sx={{ p: '2px' , display: 'inline-flex', color:"#1abf0b" }} aria-label="directions">
             {loading ? <DoneIcon fontSize='large' /> : <SmartphoneIcon fontSize='large'  /> }
                    </IconButton>
          ),
          endAdornment: (
            <InputAdornment position="start" >
              <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  component="span"
                  sx={{
                    height: '24px', // Adjust this value as needed
                    width: '2px',
                    backgroundColor: '#ff9100',
                    margin: '0 0px',
                  }}
                />
                <Box component="span" sx={{ direction: 'ltr', paddingX:'12px' , color:"#ff9100" }}>+98</Box>
              </Box>

         
              
            </InputAdornment>
            
          ),
          inputProps: { style: { direction: 'ltr', textAlign: 'left', paddingLeft: "15px" , color:"#ff9100" } }, 
        }}
        fullWidth
        />
        </Box>
    </Box>
  );
};

export default PhoneNumberInput;
