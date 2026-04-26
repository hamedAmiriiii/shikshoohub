
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
import ModalLabel from "@/app/coponent/ModalLabel";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import tokenCode from "@/app/coponent/tokenCode";


export default function CardUser(props: any) {

  const [openSnackbar, setOpenSnackbar] = useState("");
  const [load, setLoad] = useState(true);
  const [status, setStatus] = useState();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [accesptModal, setAccesptModal] = useState(false);
  const [chengeStatus, setChengeStatus] = useState(0);


  useEffect(() => {
    const datetime = props.props.data?.created_at;
    const [date, time] = datetime.split(" ");
    setDate(date)
    setTime(time)
    setStatus(props.props.data?.status)

  }, [])
  const chengeStatusF = () => {
    let token = tokenCode();

     let loadData = {
         "status": chengeStatus,
       };
     
       apiRequestError("Post", {}, loadData, `/api/admin/leave/confirm/${props.props.data?.id}`, true, true, token).then((res) => {
         if (res.hasError) {
           toast.error (JSON.parse(res.errorText).message[0].title);
           return;
         }
        
         setStatus(chengeStatus == 2 ? "تایید شده" : "رد شده");  //  استیت آپدیت 
         
         setAccesptModal(false);
         toast.success("ویرایش انجام شد");
       });
   
   
   
 }

  return load ? (
    <Box style={{ backgroundColor: "#2b3143", borderRadius: "15px", border: "1px solid #505669" }} m={1} p={2}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between" }} mb={2} >
        <span>{time}</span>
        <span>{date}</span>
      </Box>

      <Grid container className="">

        <Grid xs={12} sx={{ paddingBottom: 0 }}>
          <LabelCustom title={"نام "} name="" text={props.props.data?.user?.name + " " + props.props.data?.user?.last_name} />
          <LabelCustom title={"تلفن تماس"} name="" text={props.props.data?.user?.phone} />
          <LabelCustom title={"تاریخ مرخصی "} name="" text={props.props.data?.date_from + " || " + props.props.data?.date_to} />
          {/* <LabelCustom title={"تاریخ مرخصی تا"} name="" text={props.props.data?.date_to} /> */}

          <div className="flex rtl font-sans ">
            <span>وضعیت :</span>
            <span style={{ color: status == "در انتظار بررسی" ? "#ff9100" : status == "تایید شده" ? "#52a304" : "#d32f2f" }}
           
            >
              {status}
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
                      onClick={() => {
                        setAccesptModal(true)
                        setChengeStatus(2)
                      }}
          
                      variant="contained"
                      fullWidth
                      style={{ color: "#111e2a", height: "50px", borderRadius: '10px', backgroundColor: "#00B7A0", fontWeight: "600", fontSize: "18px" }}
                    >
                      تایید
                    </Button>
                    <Button
                      onClick={() => {
                        setAccesptModal(true)
                        setChengeStatus(3)
                      }}
                      variant="contained"
                      color="error"
                      fullWidth
                      style={{ color: "#111e2a", height: "50px", borderRadius: '10px', backgroundColor: "#FA4D56", fontWeight: "bold", fontSize: "18px" }}
                    >
                      رد
                    </Button>
        </Box>
      </Box>



      
      <ModalLabel
        title={<div></div>}
        width="375px"
        open={accesptModal}
        onClose={() => setAccesptModal(false)}
      >
        <Box>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Typography fontSize="1rem" fontWeight="bold">
              آیا از تغییر وضعیت اطمینان دارید؟
            </Typography>
          </Box>
          <Box
            mt="2rem"
            display="flex"
            alignItems="center"
            gap="2rem"
            justifyContent="center"
          >
            <Button
              onClick={() => chengeStatusF()}
              variant="contained"
              fullWidth
              style={{ height: "50px", borderRadius: '10px', backgroundColor: "#1758BA" }}
            >
              تایید
            </Button>
            <Button
              onClick={() => setAccesptModal(false)}
              variant="contained"
              color="error"
              fullWidth
              style={{ height: "50px", borderRadius: '10px' }}
            >
              لغو
            </Button>
          </Box>
        </Box>
      </ModalLabel>

      <ToastContainer autoClose={3000} style={{ marginBottom: '56px', borderRadius: "15px" }} position={"bottom-right"} />




    </Box>
  ) : (<></>)
}

