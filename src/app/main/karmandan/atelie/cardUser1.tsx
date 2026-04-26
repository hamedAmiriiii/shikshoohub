
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
import { Margin } from "@mui/icons-material";
import BottomSheet from "@/app/coponent/BottomSheet";
import UserTable from "./showCameraMan";

export default function CardUser(props: any) {

  const [toggleModal, setToggleModal] = useState(false);
  const [load, setLoad] = useState(false);
  const [status, setStatus] = useState();
  const [accesptModal, setAccesptModal] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  
  useEffect(() => {
    const datetime = props.props.data?.created_at;
    const [date, time] = datetime.split(" ");
    setDate(date)
    setTime(time)

    setLoad(true)
  }, [])


  return load ? (
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px"  , border:"1px solid #505669" }} m={1} p={2}
    >
 <Box sx={{ display: "flex", justifyContent: "space-between" }} mb={2} >
        <span>{time}</span>
        <span>{date}</span>
      </Box>

      <Grid container className="">

        <Grid xs={8} sx={{ paddingBottom: 0 }}>
          {/* <div className="flex rtl font-sans pb-3">
            <span>وضعیت :</span>
            <span style={{ color: status?.status == "در انتظار بررسی" ? "#ff9100" : status?.status == "تایید شده" ? "#52a304" : "#d32f2f" }}
              className={`font-bold ${status?.status != "در انتظار بررسی" ? "text-secondary" : "text-positive"} `}
            >
              {status?.status}
            </span>
          </div> */}
          <LabelCustom title={"تاریخ مراسم"} name="" text={props.props.data?.date} />
          <LabelCustom title={"داماد"} name="" text={props.props.data?.groom_full_name} />
          <LabelCustom title={"تلفن داماد"} name="" text={props.props.data?.groom_phone} />
          <LabelCustom title={"باغ"} name="" text={props.props.data?.garden?.name} />
          <LabelCustom title={"تالار"} name="" text={props.props.data?.talar?.name} />
          {/* <LabelCustom title={"تاریخ درخواست"} name="" text={props.props.data?.created_at} /> */}
          <Grid style={{ justifyContent: "space-between", display: "flex" }} >
          </Grid>
        </Grid>

      


      </Grid>

      <Box>
            <Box
            mt="2rem"
            display="flex"
            alignItems="center"
            gap="2rem"
            justifyContent="center"
          >
            <Button
              onClick={() => setToggleModal(true)}
              variant="contained"
              fullWidth
              style={{ color:"#111e2a" ,height: "50px", borderRadius: '10px', backgroundColor: "#00B7A0" ,fontWeight:"600" , fontSize:"18px" }}
            >
            مشاهده فیلم برداران
            </Button>
           
          </Box>
      </Box>


      <BottomSheet
       open={toggleModal}
        title={
          <Grid item sx={{ display: "flex", alignItems: "center" }}>
            <Typography color="#ffffff" fontSize={"1rem"} ml={3} mt={1}>
            
            </Typography>
          </Grid>
        }
        onClose={() => setToggleModal(false)}
      >
        <Grid>
          <Box className="flex justify-center items-center w-full  mb-4">
            <UserTable id={props.props.data?.id}
              // close={() => setToggleModal(false)}
            />
          </Box>
          <Box className="flex justify-center items-center w-full  mb-4">
           
          </Box>
        </Grid>
      </BottomSheet>




    </Box>
  ) : (<></>)
}

