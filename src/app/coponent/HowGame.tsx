
"use client";
import React, { useEffect } from 'react';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import { translate } from './Translate/translate';
export default function HowGame(props: any) {
    let lang = localStorage.getItem("language")
    return (
        <Paper sx={{backgroundColor:'#21242b', border: 0, boxShadow: 0, width: 320, maxWidth: '100%' ,direction:lang == "fa"  ? "rtl":"" }}>
            <MenuList sx={{color:'#fff'}}>
                <MenuItem onClick={() => {
                     <Typography variant="body2" sx={{ color: '#ffffff' , fontWeight:'600' }}>
                      {translate('en')}
                 </Typography>
                   
                    props.close()}}>
                    
                   
                    <Typography variant="body2" sx={{fontSize:"1.3rem", fontWeight:"900", color: '#ff9100' }}>
                    {translate('how to play')}
                    </Typography>
                </MenuItem>
                <Divider />
            </MenuList>
            <Typography variant="body2" sx={{ marginBottom :"15px",fontSize:"1rem", color: '#ffffff' }}>
                      {translate('1- In each match, you choose one of the things that makes you feel better')}
                 </Typography>
            <Typography variant="body2" sx={{marginBottom :"15px",fontSize:"1rem",  color: '#ffffff' }}>
                      {translate('2- At the end of the match, whichever card gets more votes wins and you get coins')}
                 </Typography>
            <Typography variant="body2" sx={{marginBottom :"15px", fontSize:"1rem", color: '#ffffff' }}>
                      {translate('3- You can increase the bonus up to 4 times by paying coins')}
                 </Typography>
        </Paper>
    );
}
