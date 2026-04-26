
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
import Image1 from './../../../public/pic/carecter/ (1).jpeg';
import Image2 from './../../../public/pic/carecter/ (2).jpeg';
import Image3 from './../../../public/pic/carecter/ (3).jpeg';
import Image4 from './../../../public/pic/carecter/ (4).jpeg';
import Image5 from './../../../public/pic/carecter/ (5).jpeg';
import Image6 from './../../../public/pic/carecter/ (6).jpeg';
import Image7 from './../../../public/pic/carecter/ (7).jpeg';
import Image8 from './../../../public/pic/carecter/ (8).jpeg';
import Image9 from './../../../public/pic/carecter/ (9).jpeg';
import Image10 from './../../../public/pic/carecter/ (10).jpeg';
import Image11 from './../../../public/pic/carecter/ (11).jpeg';
import Image12 from './../../../public/pic/carecter/ (12).jpeg';
import Image13 from './../../../public/pic/carecter/ (13).jpeg';
import Image14 from './../../../public/pic/carecter/ (14).jpeg';
import Image15 from './../../../public/pic/carecter/ (15).jpeg';
import Image16 from './../../../public/pic/carecter/ (16).jpeg';
import Image17 from './../../../public/pic/carecter/ (17).jpeg';
import Image18 from './../../../public/pic/carecter/ (18).jpeg';
import Image19 from './../../../public/pic/carecter/ (19).jpeg';
import Image20 from './../../../public/pic/carecter/ (20).jpeg';
import Image21 from './../../../public/pic/carecter/ (21).jpeg';
import Image22 from './../../../public/pic/carecter/ (22).jpeg';
import Image23 from './../../../public/pic/carecter/ (23).jpeg';
import Image24 from './../../../public/pic/carecter/ (24).jpeg';
import Image25 from './../../../public/pic/carecter/ (25).jpeg';
import Image26 from './../../../public/pic/carecter/ (26).jpeg';
import Image27 from './../../../public/pic/carecter/ (27).jpeg';
import Image28 from './../../../public/pic/carecter/ (28).jpeg';
import Image29 from './../../../public/pic/carecter/ (29).jpeg';
import Image30 from './../../../public/pic/carecter/ (30).jpeg';
import Image31 from './../../../public/pic/carecter/ (31).jpeg';
import Image32 from './../../../public/pic/carecter/ (32).jpeg';
import Image from 'next/image';
export default function Mach(props: any) {
    const list = [
        { name: "Sunbathing", src: Image1, name2:"Biliyard" ,src2:Image2 },
        { name: "coffee", src: Image3, name2:"Playing" ,src2:Image4 },
        { name: "studying", src: Image5, name2:"rainy weather" ,src2:Image6 },
        { name: "beach Walk", src: Image7, name2:"flowers" ,src2:Image8 },
        { name: "bathing", src: Image9, name2:"Group game" ,src2:Image10 },
        { name: "to work", src: Image11, name2:"to discover" ,src2:Image12 },
        { name: "sleep", src: Image13, name2:"Loneliness" ,src2:Image14 },
        { name: "to buy", src: Image15, name2:"memory of writing" ,src2:Image16 },
        { name: "eating", src: Image17, name2:"Go to museum" ,src2:Image18 },
        { name: "meditation", src: Image19, name2:"Mobile game" ,src2:Image20 },
        { name: "arrange hair", src: Image21, name2:"music" ,src2:Image22 },
        { name: "Grandma's house", src: Image23, name2:"picnic" ,src2:Image24 },
        { name: "dance", src: Image25, name2:"travel" ,src2:Image26 },
        { name: "cinema", src: Image27, name2:"focus" ,src2:Image28 },
        { name: "Talk to a friend", src: Image29, name2:"birthday" ,src2:Image30 },
        { name: "exercise", src: Image31, name2:"yoga" ,src2:Image32 },
       
    ]
    let lang = localStorage.getItem("language")
    return (
        <Paper sx={{ backgroundColor:'#21242b', border: 0, boxShadow: 0,  maxWidth: '100%' ,direction:lang == "fa"  ? "rtl":"" }}>
           {list.map((item)=> <MenuList>
            <MenuItem style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px",
  flexDirection:  "row", 
}} onClick={() => { props.close() }}>

 
  <div style={{
    display: "flex",
    alignItems: "center",
    flex: "1",
    justifyContent: "flex-start",
    minWidth: "0", 
  }}>
    <Image
      style={{
        border: "1px solid #ff9100",
        borderRadius: "10px",
        width: "60px",
        height: "60px",
        marginRight: lang === "fa" ? "0px" : "7px", 
        marginLeft: lang === "fa" ? "7px" : "0px",
        flexShrink: 0,
      }}
      src={item.src}
      alt="Image"
    />
      <h6 style={{
      color:"#ffffff",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: "100px", 
      marginRight: lang === "fa" ? "0px" : "5px", 
      marginLeft: lang === "fa" ? "5px" : "0px",
    }}>
      {translate(item.name)}
    </h6>
  </div>

  
  <Typography style={{
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#ff9100",
    textAlign: "center",
    minWidth: "50px",
    flex: "0 1 50px", 
  }}>
    VS
  </Typography>

 
  <div style={{
    display: "flex",
    alignItems: "center",
    flex: "1",
    justifyContent:  "flex-end",
    minWidth: "0",
  }}>
      <h6 style={{
      color:"#ffffff",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: "100px", 
      marginRight: lang === "fa" ? "5px" : "5px", 
      marginLeft: lang === "fa" ? "0px" : "5px",
    }}>
      {translate(item.name2)}
    </h6>
    <Image
      style={{
        border: "1px solid #ff9100",
        borderRadius: "10px",
        width: "60px",
        height: "60px",
        marginRight: lang === "fa" ? "0px" : "7px",
        marginLeft: lang === "fa" ? "7px" : "0px",
        flexShrink: 0,
      }}
      src={item.src2}
      alt="Image"
    />
  </div>

</MenuItem>


                <Divider sx={{backgroundColor:'#fff'}}  />
            </MenuList>)
            }
            
        </Paper>
    );
}
