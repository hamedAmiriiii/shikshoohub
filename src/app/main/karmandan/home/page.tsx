"use client"

import {
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LabelCustom from "@/app/coponent/labelCustom";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { GridContainerCard } from "@/app/coponent/CommonComponent";
import { Height, Margin } from "@mui/icons-material";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import Header from "../../header";
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import { useMyContext } from "../../layout";
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from "next/navigation";
import InsertInvitationIcon from '@mui/icons-material/InsertInvitation';
export default function CardUser(props) {
  const router = useRouter();
  const { myProp } = useMyContext();

  const [openSnackbar, setOpenSnackbar] = useState("");
  const [load, setLoad] = useState(true);
  const [status, setStatus] = useState();
  const [accesptModal, setAccesptModal] = useState(false);
  const [user, setUser] = useState("");

  useEffect(() => {
    let user = JSON.parse(localStorage.getItem('user'))
    setUser(user)

  }, [])


  return load ? (
    <>
      {/* <Header /> */}


      {myProp.atelier == "true" && <Box onClick={()=>router.push("/main/karmandan/atelie/create")} style={{
        backgroundColor: "#78b568", borderRadius: "15px", border: "1px solid #505669", Height: "130px"
      }} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} >
          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>
            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} >  <AddIcon fontSize="large"  sx={{ width: "50px" ,color:"#fff"}} />    </span>
          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px",color:"#fff" }} >
              <span> ثبت مراسم جدید  </span>
            </div>
          </Grid>
        </Box>

      </Box>}


      {myProp.atelier == "true" && <Box  style={{
        backgroundColor: "#4B4B4B", borderRadius: "15px", border: "1px solid #ff9100", Height: "120px"
      }} m={1} p={1} mt={3}>

        <Box onClick={()=>router.push("/main/karmandan/atelie")}  style={{
          display: "flex",
          justifyContent: "space-between",
        }} >


          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>

            <span  style={{ color: "#6BA6FF", borderRadius: "50px", }} > <KeyboardArrowLeftIcon />مشاهده </span>


          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px" }} >
              <span>مشاهده مراسمات ثبت شده   </span>
            </div>
            <ViewWeekIcon fontSize="large"  sx={{ width: "50px" ,color:"#ff9100"}} />
          </Grid>
        </Box>
        <div style={{ color: "#F2F4F8", border: "dotted 1px #ff9100", width: "100%", display: "flex", marginTop: "10px" }} className=' mb-3  ' />
        <Box display="flex" justifyContent="space-between">
          <span style={{
            color: "#fFF", borderRadius: "50px", marginLeft: "5px"
            , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px", padding: "5px"
          }} > </span>
          <span style={{
            backgroundColor: "#fff", color: "#6BA6FF", borderRadius: "50px", marginLeft: "5px"
            , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px", padding: "5px"
          }} > ثبت شده </span>


        </Box>
      </Box>}


      {(myProp.akas === "true" || myProp.cameraman == "true" || myProp.helishot === "true") && <Box style={{
        backgroundColor: "#78b568", borderRadius: "15px", border: "1px solid #ff9100", Height: "130px"
      }} onClick={()=>router.push("/main/karmandan/cameraman/create")} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} >
          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>
            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} >  <AddIcon fontSize="large"  sx={{ width: "50px" ,color:"#fff"}} />    </span>
          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px",color:"#fff" }} >
              <span> ثبت مرخصی  </span>
            </div>
          </Grid>
        </Box>

      </Box>}

      {(myProp.akas === "true" || myProp.cameraman == "true" || myProp.helishot === "true") &&  <Box style={{
        backgroundColor: "#4B4B4B", borderRadius: "15px", border: "1px solid #ff9100", Height: "120px"
      }} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} onClick={()=>router.push("/main/karmandan/cameraman")} >


          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>

            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} > <KeyboardArrowLeftIcon />مشاهده </span>


          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px" }} >
              <span>مشاهده مرخصی ها    </span>
            </div>
            <ViewWeekIcon fontSize="large"  sx={{ width: "50px" ,color:"#ff9100"}} />
          </Grid>
        </Box>
        <div style={{ color: "#F2F4F8", border: "dotted 0.5px #F2F4F8", width: "100%", display: "flex", marginTop: "10px" }} className=' mb-3  ' />
        <Box display="flex" justifyContent="space-between">
          <span style={{
            color: "#fFF", borderRadius: "50px", marginLeft: "5px"
            , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px", padding: "5px"
          }} ></span>
          <span style={{
            backgroundColor: "#fff", color: "#6BA6FF", borderRadius: "50px", marginLeft: "5px"
            , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px", padding: "5px"
          }} > ثبت شده </span>


        </Box>
      </Box>}



      {(myProp.akas === "true" || myProp.cameraman == "true" || myProp.helishot === "true") &&  <Box style={{
        backgroundColor: "#4B4B4B", borderRadius: "15px", border: "1px solid #ff9100", Height: "120px"
      }} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} onClick={()=>router.push("/main/karmandan/cameraman/marasemat")} >


          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>

            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} > <KeyboardArrowLeftIcon />مشاهده </span>


          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px" }} >
              <span>مشاهده مراسمات     </span>
            </div>
            <InsertInvitationIcon fontSize="large"  sx={{ width: "50px" ,color:"#ff9100"}} />
          </Grid>
        </Box>
        <div style={{ color: "#F2F4F8", border: "dotted 0.5px #F2F4F8", width: "100%", display: "flex", marginTop: "10px" }} className=' mb-3  ' />
        <Box display="flex" justifyContent="space-between">
          <span style={{
            color: "#fFF", borderRadius: "50px", marginLeft: "5px"
            , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px", padding: "5px"
          }} ></span>
          <span style={{
            backgroundColor: "#fff", color: "#6BA6FF", borderRadius: "50px", marginLeft: "5px"
            , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px", padding: "5px"
          }} > ثبت شده </span>


        </Box>
      </Box>}


      
    </>
  ) : (<></>)
}

