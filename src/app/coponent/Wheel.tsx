'use client'
import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Box, Card, CardContent, CircularProgress } from '@mui/material';
import './confetti.css';
import { translate } from './Translate/translate';
import AnimatedNumber from './Counter';
import Confetti from './Confetti/Confetti';
import useVibration from './vibration';
import { time } from 'console';
import CountdownTimer from './Confetti/CountdownTimer';
import { apiRequestError } from '../lib/apiRequestError';
import tokenCode from './tokenCode';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

export default function NumberMemoryGame({ level = 0 }) {
  const triggerVibration = useVibration();
  const gridSize = Math.min(3 + level, 5);
  const [grid, setGrid] = useState([]);
  const [claim, setClaim] = useState(0);
  const [showNumbers, setShowNumbers] = useState(true);
  const [userInput, setUserInput] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [userSelect, setUserSelect] = useState([]);
  const [gameState, setGameState] = useState('waiting');
  const [timeLeft, setTimeLeft] = useState(10 - level);
  const [showConfetti, setShowConfetti] = useState(false);
  const [time, setTime] = useState(0);
  const [incorrectNumbers, setIncorrectNumbers] = useState([]);
  const [score, setScore] = useState(0);
  const [isGame, setIsGame] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState([]); 
  const [userAnswer, setUserAnswer] = useState([]); 
  const [send, setSend] = useState(false); 

  useEffect(() => {
    // const newSequence = Array.from({ length: gridSize * gridSize }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setShowNumbers(false)
    setGameState('fail');
    setTimeout(() => {
      // setGrid((prevGrid) => prevGrid.map((cell) => ({ ...cell, revealed: false })));
      // setShowNumbers(false);
      // setGameState('input');
    }, 3000);
  }, [level]);


useEffect(() => {
getData()
}, [])
  
useEffect(() => {
  sendData(userAnswer)
}, [userAnswer])
  
  const sendData = (e) => {
    if (userAnswer.length == 0) return
    if (send == true) return
    setSend(true)
  userAnswer.map((item, index) => {
    setTimeout(() => {
      setUserInput((prevUserInput) => {
        const newInput = [...prevUserInput, item];
        handleUserInput2(item, newInput);
        return newInput;
      });
    }, index * 100);
  });

    
   }


  const getData = () => {
    let token =  tokenCode()
  apiRequestError("Get", {}, {}, "/game/today", true, false, token).then((res) => {
    console.log('rrrrr',res);
    if (res.message) return
    
    setShowNumbers(false);
    setSequence(res.answer)
    if (!res.isDone) {
      setGrid(res.answer.map((num) => ({ number: num, revealed: false })));
      setIsGame(false)
    } else {
      setGrid(res.answer.map((num) => ({ number: num, revealed: true })));
      setScore(res.point)
      setTime(res.time)
      setIsGame(true)
      setGameState('input');
      setUserAnswer(res.userAnswer)
      
    }

}).catch((e)=>console.log("errrrrrrrrrrrrrrrrrr"))
      
     
  }
  


  useEffect(() => {
   
       if (gameState === 'input') {
        if (timeLeft > 0) {
          const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
          return () => clearTimeout(timer);
        } else {
          console.log("end time");
          setClaim(score)
          score> 0 && claimAPI()
        }
      }
   
  }, [timeLeft, gameState]);


  const claimAPI = () => {
    let token = tokenCode()
    let data = {
      point: score,
      answer:userSelect
    }
    apiRequestError("Post", {}, data, "/game", true, false, token).then((res) => {
      console.log(res);
      getData()
    })
  }
 

  const handleUserInput2 = (number, currentInput) => {
    if (gameState !== 'input') return;
    if (timeLeft === 0) return;
    
    const index = sequence.indexOf(number); 
    
    // اگر عدد درست بود و در نوبت درست انتخاب شده بود
    if (number === currentInput.length) {
      triggerVibration(15);
      
      setSelectedNumbers((prev) => [...prev, number]);
      
      // نشان دادن عدد در گرید
      setGrid((prevGrid) => {
        const newGrid = [...prevGrid];
       
          newGrid[index].revealed = true; // نمایش عدد در گرید
      
        return newGrid;
      });
  
  
    } else {
    
      setIncorrectNumbers((prev) => [...prev, number]);
    }
  
    if (currentInput.length === sequence.length) {
     
      
      if (currentInput.join('') === sequence.join('')) {
        setGameState('success'); 
      } else {
        setGameState('fail'); 
      }
    }
  };
  

  const handleUserInput = (number) => {
    console.log("number44444" , number);
    console.log("newInput" , userInput);
    if (gameState !== 'input') return;
    if (timeLeft == 0) return;
    const index = sequence.indexOf(number)
    const newInput = [...userInput, number];
    setUserInput(newInput);
    
    const UserSelect = [...userSelect, number];
    setUserSelect(UserSelect);

    if (number === userInput.length + 1) {
      triggerVibration(15)
      // اگر عدد درست بود و در نوبت درست انتخاب شده بود
      setSelectedNumbers((prev) => [...prev, number]);
      
      
      setGrid((prevGrid) => {
        // ابتدا یک کپی از آرایه ایجاد کنید
        const newGrid = [...prevGrid];
      
        // تغییر مقدار خانه مشخص شده
        newGrid[index].revealed = true;
      
        // بازگرداندن آرایه جدید
        return newGrid;
      });

      setScore((prev) => prev + 50); 
    } else {
      triggerVibration(200)
      // اگر عدد انتخابی نادرست بود یا در نوبت اشتباه انتخاب شد
      setIncorrectNumbers((prev) => [...prev, number]); // اضافه کردن شماره اشتباه
    }
  
  
    if (newInput.length === sequence.length) {
      setClaim(score)
      if (newInput.join('') === sequence.join('')) {
      } else {
      }
    }
  };
  

  const resetGame = () => {
    console.log("rresetttttttttttttttttttttttttt");
    
    setIncorrectNumbers([])
    setScore(0)
    setUserInput([]);
    setSelectedNumbers([]);
    setGameState('waiting');
    setShowNumbers(true);
    setShowConfetti(false);
    setTimeLeft(10 - level);
    

    setTimeout(() => {
      setGrid((prevGrid) => prevGrid.map((cell) => ({ ...cell, revealed: false })));
      setShowNumbers(false);
      setGameState('input');
    }, 3000);
  };

  return (
    <Box  style={{height:"100%",minHeight: '100vh', textAlign: 'center',backgroundColor: "#1c1c1c",
     padding: '20px', position: 'relative' }}>

<Card sx={{ mb: 4,minHeight:"490px", bgcolor: "#333" ,marginTop:"50px" , borderRadius:"20px" }}>
          <CardContent sx={{ bgcolor: "#333" }}>
            <Typography sx={{ color: '#ededed' }} variant="h5" align="center">
            {/* {translate('Your reward')}   */}
            </Typography>
            <Typography variant="h4" align="center" sx={{ my: 2, color: '#00bfa5' }}>
            <AnimatedNumber number={score} /> 
            </Typography>
            <Typography variant="h6" align="center" sx={{ my: 2, color: '#00bfa5' }}>
             {!isGame ? 'Rev' :translate("have received")}
            </Typography>
            
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 80px)`, gap: '10px', justifyContent: 'center', margin: '20px 0' }}>
        {grid.map((cell, index) => (
          <div
            key={index}
            onClick={() => handleUserInput(cell.number)}
            style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selectedNumbers.includes(cell.number) ? '#90caf9' : incorrectNumbers.includes(cell.number) ? '#f38c8c' :
                (cell.revealed || showNumbers ? '#f0f0f0' : '#ccc'),
              fontSize: '20px',
              cursor: gameState === 'input' ? 'pointer' : 'default',
              borderRadius: '8px',
              border: '1px solid #000',
              color: cell.revealed || showNumbers ? '#000' : '#000',
              fontWeight: 'bold',
            }}
          >
            {cell.revealed || showNumbers ? cell.number : ''}
          </div>
        ))}
      </div>

      {gameState === 'input' && !isGame && (
        <div style={{ margin: '20px 0' }}>
          <Typography variant="h6" color="#ff9100">Time: {timeLeft} </Typography>
          <CircularProgress variant="determinate"  value={(timeLeft / (10 - level)) * 100} />
        </div>
      )}


          <Box display="flex" justifyContent="center" mt={2}>
          {(gameState === 'success' || gameState === 'fail' && !isGame) && (
              <Button onClick={()=>resetGame()} sx={{ borderRadius: "15px",width:"60%" }} variant="contained" color="primary">
              {translate('Start')}
              </Button>
            )}
            
          {claim > 0 && score>0 && !isGame && (
              <Button onClick={()=>claimAPI()} sx={{ borderRadius: "15px",width:"60%" }} variant="contained" color="primary">
              {translate('claim')} {score}
              </Button>
            )}
            

            {isGame && (
  <Button 
    sx={{ 
      borderRadius: "15px", 
      width: "60%", 
      display: "flex", 
      justifyContent: "center", // تایمر را وسط قرار می‌دهد
      alignItems: "center",     // عناصر را عمودی وسط قرار می‌دهد
      position: "relative"      // برای تنظیم موقعیت آیکون
    }} 
    variant="contained" 
    color="warning"
  >
    <SettingsBackupRestoreIcon 
      sx={{
        position: "absolute",  // آیکون را مستقل از جریان اصلی قرار می‌دهد
        right: "10px",          // آیکون را به گوشه چپ چسبانده
        top: "50%",            // موقعیت عمودی وسط
        transform: "translateY(-50%)" // تنظیم برای وسط قرار دادن آیکون عمودی
      }}
    />
    <CountdownTimer seconds={time} />
  </Button>
)}

            
          </Box>
          {(gameState === 'success' || gameState === 'fail' && !isGame) && (
          <div>

              <Typography variant="h6" mt={2} color='#00bfa5'>{ translate("Remember the numbers and choose in the correct order to get 450 coins")}</Typography>
            </div>
          )}
          </CardContent>
        </Card>
      <Typography variant="h4" gutterBottom></Typography>
      
      {/* {gameState === 'success' && (
        <>
          {showConfetti && (
            <div className="confetti">
              {[...Array(9)].map((_, index) => <div key={index} />)}
            </div>
          )}
        </>
      )} */}
      {/* {gameState === 'fail' && <Typography variant="h5" color="error.main">اشتباه کردید! تلاش مجدد کنید.</Typography>} */}
     
    </Box>
  );
}




