import React, { useEffect, useState } from 'react';

const CountdownTimer = ({ seconds ,color }) => {
  const formatTime = (time) => (time < 10 ? `0${time}` : time);

  const calculateTimeLeft = (remainingSeconds) => {
    let timeLeft = {};
    
    if (remainingSeconds > 0) {
      timeLeft = {
        hours: Math.floor((remainingSeconds / 3600) % 24),
        minutes: Math.floor((remainingSeconds / 60) % 60),
        seconds: Math.floor(remainingSeconds % 60),
      };
    } else {
      timeLeft = {
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return timeLeft;
  };

  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(remainingSeconds));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(remainingSeconds));
  }, [remainingSeconds]);

  return (
    <div style={{fontSize:"16px" , fontWeight:"600" , color: color ??"color"}}>
      <span>{formatTime(timeLeft.hours)}:</span>
      <span>{formatTime(timeLeft.minutes)}:</span>
      <span>{formatTime(timeLeft.seconds)}</span>
    </div>
  );
};

export default CountdownTimer;
