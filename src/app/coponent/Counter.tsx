'use client'
import React, { useState, useEffect } from 'react';

const AnimatedNumber = ({ number }) => {
  const [displayedNumber, setDisplayedNumber] = useState(number -(number * 0.1));

  useEffect(() => {
    if(number > 0){
      
    
    const duration = 700;
    const frameRate = 80; 
    const totalFrames = (duration / 1000) * frameRate; 
    const incrementPerFrame = (number * 0.1) / totalFrames; 

    let currentNumber = number - (number * 0.1);
    const interval = setInterval(() => {
      currentNumber += incrementPerFrame;
      if (currentNumber >= number) {
        currentNumber = number;
        clearInterval(interval); 
      }
      setDisplayedNumber(Math.round(currentNumber));
    }, 1000 / frameRate);

    return () => clearInterval(interval);
  }else{
    setDisplayedNumber(number)
  }
  }, [number]);

  return (
    <div>
      <h2>{displayedNumber}</h2> 
    </div>
  );
};

export default AnimatedNumber;
