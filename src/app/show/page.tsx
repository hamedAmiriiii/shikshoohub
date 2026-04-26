


"use client";
import React, { useEffect, useState, Suspense } from "react";
import { Box, Button, Grid } from "@mui/material";
import ReactPlayer from "react-player";
import { translate } from "@/app/coponent/Translate/translate";
import { useSearchParams } from "next/navigation";
import InputSlider from "@/app/coponent/InputSlider";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import tokenCode from "../coponent/tokenCode";
import Image from "next/image";
import png from '../../../public/pic/777300.png';
import { apiRequestError } from "../lib/apiRequestError";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const VideoPlayer = () => {
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const url = searchParams.get("url");
  const title = searchParams.get("title");

  const [duration, setDuration] = useState(0);
  const [onBuffer, setOnBuffer] = useState(false);
  const [onStart, setOnStart] = useState(false);
  const [onPause, setOnPause] = useState(false);
  const [onEnded, setOnEnded] = useState(false);
  const [value, setValue] = useState(1);
  const [intervalId, setIntervalId] = useState(null);



  
  useEffect(() => {
    if (onStart && !onPause) {
      const id = setInterval(() => {
        setValue((prev) => (prev <= duration ? prev + 1 : duration));
      }, 1000); 
      setIntervalId(id);
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [onStart, onPause, duration]);

  const submited = () => {
    let token = tokenCode()
    if (duration == value && onEnded) {
      let data = {
        "task":id,
        "isDone":true
    }
      apiRequestError("Post", {}, data, "/usertask", true, false, token).then((res) => {
        if (res.hasError) { } else {
          toast.success('Done Task')
          setTimeout(() => {
            
            window.close()
          }, 900);
        }
        
      })
    } else {
      toast.error('Not Complete Task');
}
  }


  return (
    <Grid className="mt-5">
      <div style={{display:"flex",  justifyContent:"center"}} className='flex justify-center' >
       <Image
               style={{marginTop:'5px'}}
              src={png}
              alt="Vercel logomark"
              width={100}
              height={100}
        />
        </div>
      <Box className="flex justify-center h-10px items-center w-full p-1 mb-1">
      
        

        <ReactPlayer
          onStart={() => setOnStart(true)}
          onPause={() => {
            setOnPause(true);
            setOnBuffer(false);
          }}
          onDuration={(e) => setDuration(e)}
          onBuffer={() => {
            setOnBuffer(true);
            setOnPause(false);
          }}
          onEnded={() => {
            setOnEnded(true);
            setOnStart(false);
            setOnPause(true);
          }}
          playing={false}
          url={url}
        />
      </Box>
     
      <Box className="flex justify-center h-10px items-center w-full p-1 mb-1">
        <InputSlider max={duration * 10} value={value*10} />
      </Box>
      <Box className="flex justify-center items-center w-full mb-4">
        <Button
          // disabled={duration != value || !onEnded}
          onClick={() => submited()}
          sx={{
            backgroundColor: "#1758BA",
            height: "45px",
            margin: 2,
            width: "75%",
            borderRadius: "10px",
            color:"#fff"
          }}
          variant="contained"
          
        >
          {translate("Claim")} {duration*10}
          {/* <MonetizationOnIcon style={{ fontSize: 25, color: "#ffbc43e3" }} /> */}
        </Button>
      </Box>


      <ToastContainer  autoClose={3000}  style={{marginBottom:'76px' ,borderRadius:"15px" }} position={"bottom-right"} />

    </Grid>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoPlayer />
    </Suspense>
  );
}
