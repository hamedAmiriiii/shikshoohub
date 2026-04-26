
"use client";
import React, { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Box, Avatar } from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";
import YouTubeIcon from "@mui/icons-material/YouTube";
import AssignmentIcon from '@mui/icons-material/Assignment';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import CountdownTimer from './Confetti/CountdownTimer';
import { toast, ToastContainer } from 'react-toastify';
import { translate } from './Translate/translate';
import 'react-toastify/dist/ReactToastify.css';
import { apiRequestError } from '../lib/apiRequestError';
import tokenCode from './tokenCode';
// تعریف props برای TaskCard
interface TaskCardProps {
  id: string; 
  url: string; 
  icon: string; 
  title: string;
  reward: string;
  cexp?: string;
  disable?: boolean;
  isImportant?: boolean;
  type?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ id, url, icon, title, reward, cexp, disable, isImportant, type }) => {
  const [disabled ,setDisabled] =useState(true)
  const [time ,setTime] =useState(0)
  const [level ,setLevel] =useState(0)
  const [disss ,setDisss] =useState('block')


  useEffect(() => {
    setDisabled(disable)
  }, [disable])
  
  const handleCardClick = () => {
    // let text = translate("Not Complete Task")
    if (!disabled) {
      setDisabled(true)
      if (type == "YTStreem") {
      setTime(600)
        window.open(`https://revcoin.site/show?url=${url}&id=${id}&title=${title}`, '_blank');
      } else {
        if (level == 0) {
          setLevel(1)
          setTime(15)
          window.open(url, '_blank');
          setTimeout(() => {
            setDisabled(false)
          setTime(0)
            toast.error('Not Complete Task');
          }, 15000);
        } else {
          window.open(url, '_blank');
          let token = tokenCode()
          setTime(15)
          let data = {
            "task":id,
            "isDone":true
          }
          setTimeout(() => {
            setTime(0)
        apiRequestError("Post", {}, data, "/usertask", true, false, token).then((res) => {
          if (res.hasError) { } else {
            setDisss("none")
              toast.success('Done Task');
            }
        })    
          }, 15000);
          
      }}
    }
  };


    return (
    <div style={{display:disss}}>
    
    <Card
      onClick={handleCardClick} // فراخوانی تابع کلیک
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        marginBottom: "10px",
        borderRadius: "12px",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        backgroundColor: cexp ? "#262626" : "#333",
        border: isImportant && !disabled ? "2px solid #ff9100" : "none",
        cursor: disabled ? "not-allowed" : "pointer", 
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {/* نمایش آواتار یا آیکون */}
        {icon ? (
          <Avatar
            src={icon}
            alt={title}
            sx={{
              width: "48px",
              height: "48px",
              backgroundColor: "#fff",
              marginRight: "12px",
            }}
          />
            ) : (
                type == 'YTStreem' ?
                  <YouTubeIcon style={{ fontSize: 50, color: disabled ? '#979797' : "#dd2c00" }} /> :
                 title == 'folow youtube chanel ' ? 
          <SubscriptionsIcon style={{ fontSize: 40, color: disabled ? '#979797' : "#00bfa5" }} /> :
          <AssignmentIcon style={{ fontSize: 40, color: disabled ? '#979797' : "#00bfa5" }} />
        )}

        {/* محتوای متنی */}
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ color: disabled ? '#979797' : "#fff", fontWeight: "bold" }}
          >
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "#aaa" }}>
            {reward}
          </Typography>
        </Box>
      </Box>

      {/* نمایش CEXP و فلش */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {cexp && !disabled && (
          <Box
            sx={{
              backgroundColor: "#333",
              padding: "4px 8px",
              borderRadius: "8px",
              marginRight: "10px",
            }}
          >
            <Typography justifyContent="center" variant="body2" sx={{ color: "#ff9100" }}>
              {cexp}
            </Typography>
          </Box>
        )}
        {/* آیکون فلش */}
        { time ?<CountdownTimer color="#fff" seconds={time} /> :  <ArrowForwardIos sx={{ color: "#fff" }} /> }
      </Box>
        </Card>
        
      
      </div>
  );
};

// کامپوننت TaskList برای نمایش لیست تسک‌ها
export default function TaskList({ task, disable }) {
  return ( 
    <Box sx={{ padding: "16px", backgroundColor: "#1c1c1c", minHeight: "100vh" }}>
      <Typography variant="h6" sx={{ color: "#fff", marginBottom: "16px" }}>
        Daily tasks
      </Typography>

      {/* رندر کردن کارت‌های تسک */}
      {task?.length>0 && task?.map((taskItem, index) => (
        <TaskCard
          key={index}
          id={taskItem._id}
          url={taskItem.link}
          icon={""}
          title={taskItem.title}
          reward={taskItem.point}
          cexp={taskItem.point}
          disable={disable}
          isImportant={taskItem.isImportant}
          type={taskItem.type}
        />
      ))}
      
      <ToastContainer  autoClose={3000}  style={{marginBottom:'56px' ,borderRadius:"15px" }} position={"bottom-right"} />
      </Box>
 
      
  );
}
