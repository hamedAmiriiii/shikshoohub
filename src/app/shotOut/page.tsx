"use client";

import { useState, useEffect } from "react";
import { Button, Typography, Container, Box, Card } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button)(({ theme }) => ({
    width:"70%",
  margin: theme.spacing(2),
  padding: theme.spacing(1.5),
  fontSize: "18px",
  fontWeight: "bold",
  borderRadius: "12px",
}));

const TimerBox = styled(Card)(({ theme, color }) => ({
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  width: "60px",
  height: "80px",
  margin: "0 5px",
  backgroundColor: color || theme.palette.primary.main,
  borderRadius: "12px",
  fontSize: "56px",
  color: "white",
  fontWeight: "bold",
  fontFamily: "'Roboto Mono', monospace",
}));
const TimerBox3 = styled(Card)(({ theme, color }) => ({
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  width: "30px",
  height: "80px",
  margin: "0 5px",
  backgroundColor: color || theme.palette.primary.main,
  borderRadius: "12px",
  fontSize: "36px",
  color: "white",
  fontWeight: "bold",
  fontFamily: "'Roboto Mono', monospace",
}));
const TimerBox2 = styled(Card)(({ theme, color }) => ({
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100px",
  height: "120px",
  margin: "0 5px",
  backgroundColor: color || theme.palette.primary.main,
  borderRadius: "12px",
  fontSize: "76px",
  color: "white",
  fontWeight: "bold",
  fontFamily: "'Roboto Mono', monospace",
}));

const ShootOutTimer = () => {
  const [gameTime, setGameTime] = useState(600); // زمان کلی بازی (ثانیه)
  const [playerTime, setPlayerTime] = useState(15); // زمان بازیکن (ثانیه)
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isPlayerTimerRunning, setIsPlayerTimerRunning] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1); // بازیکن فعلی (1 یا 2)
  const [buttonState, setButtonState] = useState("start"); // وضعیت دکمه: start, taken, stopped

  useEffect(() => {
    let gameInterval;
    if (isGameRunning && gameTime > 0) {
      gameInterval = setInterval(() => {
        setGameTime((prev) => prev - 1);
      }, 1000);
    }

    // پخش صدای پایان 5 دقیقه اول
    if (gameTime === 300) {
      playSound("/sound/tik11.mp3");
    }

      if (gameTime === 0) {
      playSound("/sound/tashvigh.mp3");
      setIsGameRunning(false);
    }
    return () => clearInterval(gameInterval);
  }, [isGameRunning, gameTime]);

  useEffect(() => {
    let playerInterval;
    if (isPlayerTimerRunning && playerTime > 0) {
      playerInterval = setInterval(() => {
        setPlayerTime((prev) => prev - 1);
      }, 1000);

      // پخش صدای شمارش معکوس بازیکن در 3 ثانیه پایانی
      if (playerTime <= 5 && playerTime > 0) {
        playSound("/sound/11.mp3");
      }
    }

    if (playerTime === 0) {
      playSound("/sound/22.mp3");
      setIsPlayerTimerRunning(false);
    }

    return () => clearInterval(playerInterval);
  }, [isPlayerTimerRunning, playerTime]);

  const playSound = (src) => {
    const audio = new Audio(src);
    audio.play();
  };

  const startGame = () => {
    setGameTime(600);
    setIsGameRunning(true);
    setPlayerTime(15);
    setIsPlayerTimerRunning(true);
    setButtonState("start");
  };

  const handleShotButton = () => {
    if (buttonState === "start") {
      setButtonState("taken");
      setIsPlayerTimerRunning(false);
    } else if (buttonState === "taken") {
      setButtonState("stopped");
      setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
      setPlayerTime(gameTime > 300 ? 15 : 10);
      setIsPlayerTimerRunning(true);
      setButtonState("start");
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return {
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  };

  const gameTimer = formatTime(gameTime);
  const playerTimer = formatTime(playerTime);

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Shoot-Out Snooker
      </Typography>
      <Typography variant="h2" gutterBottom>
          Milad Club
      </Typography>

      {/* تایمر کلی */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 8 ,mt:8 }}>
        <TimerBox color="#FF5252">{gameTimer.minutes[0]}</TimerBox>
        <TimerBox color="#FF5252">{gameTimer.minutes[1]}</TimerBox>
        <TimerBox3 color="#FF5252">:</TimerBox3>
        <TimerBox color="#FF5252">{gameTimer.seconds[0]}</TimerBox>
        <TimerBox color="#FF5252">{gameTimer.seconds[1]}</TimerBox>
      </Box>

      {/* تایمر بازیکن */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 14 }}>
        <TimerBox2 color="#4CAF50">{playerTimer.seconds[0]}</TimerBox2>
        <TimerBox2 color="#4CAF50">{playerTimer.seconds[1]}</TimerBox2>
      </Box>

      {/* دکمه‌ها */}
      <Box sx={{ display: "flex", justifyContent: "center",alignItems:"end" }}>
       {!isGameRunning && <StyledButton
          variant="contained"
          color="primary"
          onClick={startGame}
          disabled={isGameRunning}
        >
          شروع مسابقه
        </StyledButton>}
       {isGameRunning &&  <StyledButton
          variant="contained"
          color={
            buttonState === "start"
              ? "secondary"
              : buttonState === "taken"
              ? "warning"
              : "success"
          }
          onClick={handleShotButton}
        >
          {buttonState === "start"
            ? "ضربه زده شد"
            : buttonState === "taken"
            ? "توپ ایستاد"
            : "Ball Stopped"}
        </StyledButton>}
      </Box>
    </Container>
  );
};

export default ShootOutTimer;
