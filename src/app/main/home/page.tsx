"use client"
// import React, { useState } from 'react'
// import Header from '../../coponent/Header';
// import Slider from '@/app/coponent/slider/slider';
// import { translate } from '../../coponent/Translate/translate';
// import ImageSelector from '@/app/coponent/ImageSelector/ImageSelector';
// import { useTelegram } from '@/app/lib/telegram/TelegramProvider';
// import { Box, Button, Grid, Typography } from '@mui/material';
// import CustomizedProgressBars from '@/app/coponent/Progres';
// import HelpCenterIcon from '@mui/icons-material/HelpCenter';
// import AssessmentIcon from '@mui/icons-material/Assessment';
// import BottomSheet from '@/app/coponent/BottomSheet';
// import SelectLang from '@/app/coponent/SelectLang';
// import HowGame from '@/app/coponent/HowGame';
// import Mach from '@/app/coponent/Mach';
// import CardList from '@/app/coponent/TabelNew';
// export default function page() {
//   const [toggleModalInfo, setToggleModalInfo] = useState(false);
//   const [toggleModalMach, setToggleModalMach] = useState(false);
//   const [chengeBalance, setChengeBalance] = useState("");

//   return (
//     <>
//       <Header chengeBalance={chengeBalance}  setToggleModalInfo={setToggleModalInfo} />
//       <div style={{display:'flex' , justifyContent:"center" , margin:"5px 30px"}}>
//         {/* <HelpCenterIcon onClick={() => setToggleModalInfo(true)} style={{ fontSize: 30, color: "#ff9100" }} /> */}
//         {/* <Typography >{translate("Get 1000 RevCoin")} </Typography> */}
//         <AssessmentIcon onClick={() => setToggleModalMach(true)} style={{width:'100px', fontSize: 40, color:"#ff9100"  }} />
//      </div>
//       {/* <Slider /> */}
//       {/* <ImageSelector chengeBalance={(e)=>setChengeBalance(e)} /> */}



//       <CardList />



//       {/* <BottomSheet
//        open={toggleModalInfo}
//         title={
//           <Grid item sx={{ display: "flex", alignItems: "center" }}>
//             <Typography color="#ff9100" fontSize={"2rem"} ml={3} mt={1}>
//            RevCoin
//             </Typography>
//           </Grid>
//         }
//         onClose={() => setToggleModalInfo(false)}
//       >
//         <Grid>
//           <Box className="flex justify-center items-center w-full color-#262626  mb-4">
//             <HowGame close={() => setToggleModalInfo(false)}  />
//           </Box>
//           <Box className="flex justify-center items-center w-full  mb-4">

//           </Box>
//         </Grid>
//       </BottomSheet>




//       <BottomSheet
//        open={toggleModalMach}
//         title={
//           <Grid item sx={{ display: "flex", alignItems: "center" }}>
//             <Typography color="#ff9100" fontSize={"1.4rem"} ml={3} mt={1}>
//            {translate('Tournament schedule')}
//             </Typography>
//           </Grid>
//         }
//         onClose={() => setToggleModalMach(false)}
//       >
//         <Grid>
//           <Box className="flex justify-center items-center w-full  mb-4">
//             <Mach close={() => setToggleModalMach(false)}  />
//           </Box>
//           <Box className="flex justify-center items-center w-full  mb-4">

//           </Box>
//         </Grid>
//       </BottomSheet> */}

//     </>
//   )
// }





// import List from '@/app/coponent/grid/Grid'
// import React, { useState } from 'react'
// import CardUser from './cardUser';


// export default function page() {
//   const [dataFilter, setDataFilter] = useState([])

//   let searchBoxList: any = [{ "fieldName": "user.username", "fieldOperation": "MATCH", "fieldValue": "", "nextConditionOperator": "OR" },
//   { "fieldName": "user.fullName", "fieldOperation": "MATCH", "fieldValue": "", "nextConditionOperator": "OR" },
//   { "fieldName": "user.fullName", "fieldOperation": "MATCH", "fieldValue": "", "nextConditionOperator": "OR" }
//   ];
//   const FilterComponent = () => (<h1>ggggggggg</h1>);


//   return (
//     <div style={{ width: "100%" }} className="flex-col items-center justify-center ">
//       <List
//         searchBoxList={searchBoxList}
//         filterBoxList={dataFilter}
//         // CartComponent={CardUser}
//         CartComponent={(props: any) => (
//           <CardUser props={props} />

//         )}
//         url={"/api/admin/atelier"}
//         filterComponent={<FilterComponent />}
//       />
//     </div>
//   )
// }


"use client";
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
import Header from "../header";
import { useMyContext } from "../layout";
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useRouter } from "next/navigation";
import AirplanemodeInactiveIcon from '@mui/icons-material/AirplanemodeInactive';
import SmsIcon from '@mui/icons-material/Sms';
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


      <Box style={{
        backgroundColor: "#4B4B4B", borderRadius: "15px", border: " solid 1px #ff9100", Height: "130px"
      }} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} 
        onClick={()=> router.push("/main/atelie")} >


          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>

            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} ><KeyboardArrowLeftIcon />    مشاهده  </span>


          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px" }} >
              <span>واحدهای صنفی  </span>
            </div>
<AssignmentIcon    style={{color:"#ff9100", backgroundColor:"#000",width:"40px" , height:"40px",
                borderRadius: "50px"
                , border: "1px solid #505669"
              }} />
         
          </Grid>
        </Box>
        <div style={{ color: "#F2F4F8", border: "dotted 1px #ff9100", width: "100%", display: "flex", marginTop: "10px" }} className=' mb-3  ' />
        <Box display="flex" justifyContent="space-between">
        <span style={{
          color: "#fFF", borderRadius: "50px", marginLeft: "5px"
          , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px", padding: "5px"
          }} >  </span>
          <span style={{
          backgroundColor: "#fff", color: "#6BA6FF", borderRadius: "50px", marginLeft: "5px"
          , marginRight: "5px", paddingRight: "9px", paddingLeft: "9px", padding: "5px"
        }} > ثبت شده </span>
          </Box>
      </Box>

      
      <Box  style={{
        backgroundColor: "#4B4B4B", borderRadius: "15px", border: " solid 1px #ff9100", Height: "120px"
      }} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} >


          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>
          <Button onClick={()=> router.push("/main/marasemat")}>
            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} > <KeyboardArrowLeftIcon />مشاهده </span>
            </Button>

          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px" }} >
              <span>مراسمات ثبت شده  </span>
            </div>

            <InsertInvitationIcon    style={{color:"#ff9100", backgroundColor:"#000",width:"40px" , height:"40px",
                borderRadius: "50px"
                , border: "1px solid #505669"
              }} />
          </Grid>
          </Box>
        
      </Box>

      


      <Box  style={{
        backgroundColor: "#4B4B4B", borderRadius: "15px", border: "1px solid #ff9100", Height: "120px"
      }} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} >


          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>
          <Button onClick={()=> router.push("/main/payamak")}>
            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} > <KeyboardArrowLeftIcon />مشاهده </span>
            </Button>

          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px" }} >
              <span>پیامکهای ارسال شده  </span>
            </div>

            <SmsIcon    style={{ color:"#ff9100",backgroundColor:"#000",width:"40px" , height:"40px",
                borderRadius: "50px"
                , border: "1px solid #505669"
              }} />
          </Grid>
          </Box>
        
      </Box>

      


      <Box  style={{
        backgroundColor: "#4B4B4B", borderRadius: "15px", border: "1px solid #ff9100", Height: "120px"
      }} m={1} p={1} mt={3}>

        <Box style={{
          display: "flex",
          justifyContent: "space-between",
        }} >

        
          <Grid xs={4} container style={{ display: "flex", alignItems: "center", justifyContent: "start", }}>
          <Button onClick={()=> router.push("/main/morakhasi")}>
            <span style={{ color: "#6BA6FF", borderRadius: "50px", }} > <KeyboardArrowLeftIcon />مشاهده </span>
            </Button>

          </Grid>

          <Grid xs={8} container style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>

            <div style={{ marginRight: "6px" }} >
              <span>مرخصی ها  </span>
            </div>

            <AirplanemodeInactiveIcon    style={{color:"#ff9100", backgroundColor:"#000",width:"40px" , height:"40px",
                borderRadius: "50px"
                , border: "1px solid #505669"
              }} />
          </Grid>
          </Box>
          </Box>
        
     


    </>
  ) : (<></>)
}

