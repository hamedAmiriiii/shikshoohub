
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

export default function CardUser(props: any) {
  console.log("dataaaaaaaaaaaaaaaaaa", props);

  const [openSnackbar, setOpenSnackbar] = useState("");
  const [load, setLoad] = useState(true);
  const [status, setStatus] = useState();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  
  useEffect(() => {
    const datetime = props.props.data?.created_at;
    const [date, time] = datetime.split(" ");
    setDate(date)
    setTime(time)

   
  }, [])

  const deleteItem = () => {

  }

  return load ? (
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px"  , border:"1px solid #505669" }} m={1} p={2}
    >
 <Box sx={{ display: "flex", justifyContent: "space-between" }} mb={2} >
        <span>{time}</span>
        <span>{date}</span>
      </Box>

      <Grid container className="">

        <Grid xs={8} sx={{ paddingBottom: 0 }}>
        <LabelCustom title={"نام باغ"} name="" text={props.props.data?.name} />
          <LabelCustom title={"تلفن تماس"} name="" text={props.props.data?.phone} />
          
          <div className="flex rtl font-sans ">
            <span>وضعیت :</span>
            <span style={{ color: props.props.data?.status == "در انتظار بررسی" ? "#ff9100" : props.props.data?.status == "تایید شده" ? "#52a304" : "#d32f2f" }}
              className={`font-bold ${props.props.data?.status != "در انتظار بررسی" ? "text-secondary" : "text-positive"} `}
            >
              {props.props.data?.status}
            </span>
          </div>
        
         
          <Grid style={{ justifyContent: "space-between", display: "flex" }} >
          </Grid>
        </Grid>

        


      </Grid>

      <Box>
            <Box
            mt="1rem"
            display="flex"
            alignItems="center"
            gap="1rem"
            justifyContent="center"
          >
            <Button
              onClick={deleteItem}
              variant="contained"
              fullWidth
              style={{ color:"#111e2a" ,height: "50px", borderRadius: '10px', backgroundColor: "#00B7A0" ,fontWeight:"600" , fontSize:"18px" }}
            >
              تایید
            </Button>
            <Button
              onClick={() => setAccesptModal(false)}
              variant="contained"
              color="error"
              fullWidth
              style={{ color:"#111e2a" ,height: "50px", borderRadius: '10px' , backgroundColor: "#FA4D56" ,fontWeight:"bold", fontSize:"18px" }}
            >
              رد
            </Button>
          </Box>
      </Box>
    </Box>
  ) : (<></>)
}

