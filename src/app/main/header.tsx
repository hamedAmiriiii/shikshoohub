
"use client";
import {
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LabelCustom from "@/app/coponent/labelCustom";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { GridContainerCard } from "@/app/coponent/CommonComponent";
import { Height, Margin } from "@mui/icons-material";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { useRouter } from "next/navigation";
import { useMyContext } from "./layout";
import LogoutIcon from '@mui/icons-material/Logout';


export default function Header() {
  const router = useRouter();
  const { myProp } = useMyContext();

  const [openSnackbar, setOpenSnackbar] = useState("");
  const [load, setLoad] = useState(false);
  const [status, setStatus] = useState();
  const [accesptModal, setAccesptModal] = useState(false);
  const [user, setUser] = useState("");
  const [admin, setAdmin] = useState("false");
  const [atelier, setAtelier] = useState("false");
  const [cameraman, setCameraman] = useState("false");
  const [akas, setAkas] = useState("false");
  const [helishot, setHelishot] = useState("false");
  const [anchorEl, setAnchorEl] = useState(false);


  useEffect(() => {
    let user = JSON.parse(localStorage.getItem('user'))
    user?.id ? null : router.push("/")
      setUser(user)
      setLoad(true)

  }, [])
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewInfo = () => {
    setAnchorEl(null);
    router.push('/main/edit-info');
  };
  const handleClose1 = () => {
    localStorage.clear();
    setAnchorEl(null);
    router.push('/');
  };
  

  return load ? (
  
      <Box style={{
        backgroundColor: "#4E7CC5", borderRadius: "15px", border: "1px solid #505669", display: "flex",
        justifyContent: "space-between", Height: "80px"
      }} m={1} p={1}>
        <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>

        {/* <LogoutIcon    style={{ backgroundColor:"#000",width:"30px" , height:"30px",
                borderRadius: "50px"
                , border: "1px solid #505669"
              }} /> */}
          <span style={{
            backgroundColor: "#fff", color: "#6BA6FF", borderRadius: "50px", marginLeft: "5px"
            , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px"
          }} >{myProp.admin == "true" ?"ادمین" : myProp.atelier == "wait" ?"در انتظار بررسی" :
             myProp.atelier == "true" ? "واحد صنفی" :
           myProp.cameraman == "true" ?"فیلم بردار" :
            myProp.cameraman == "wait" ?"در انتظار بررسی" :"" } </span>


        </Grid>

        <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

          {user?.name && <div style={{ marginRight: "2px" }} >
            <span>{user?.name + " " + user?.last_name}  </span>
          </div>}

         
        <div>
              <IconButton
                size="small"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {user?.personality_image && <Image
            src={`https://webinoplus.ir${user?.personality_image}`}
            width={60}
            height={60}
            alt={``}
            style={{
              height: "60px",
              borderRadius: "100px"
              , border: "1px solid #505669"
            }}
            />}
            
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleViewInfo}>مشاهده اطلاعات</MenuItem>
                <MenuItem onClick={handleClose1}>خروج</MenuItem>
              </Menu>
        </div>
        





        </Grid>


      </Box>

  
  ) : (<></>)
}
