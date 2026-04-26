'use client'
import { useEffect, useState } from "react";
import styles from "./ImageSelector.module.css";
// import Image1 from './../../../../public/pic/carecter/ (3).jpeg';
// import Image2 from './../../../../public/pic/carecter/ (4).jpeg';
import Image from "next/image";
import { translate } from "../Translate/translate";
import useVibration from "../vibration";
import { apiRequestError } from "@/app/lib/apiRequestError";
import tokenCode from "../tokenCode";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'
const ImageSelector = (props) => {
  const [load, setLoad] = useState(false);
  const [chose, setChose] = useState(0);
  const [selected, setSelected] = useState(null);
  const [selectedButton, setSelectedButton] = useState(0);
  const [animateOut, setAnimateOut] = useState(false); 
  // const [text1, setText1] = useState("Sunbathing"); 
  // const [text2, setText2] = useState("Biliyard"); 
  const [question, setQuestion] = useState(""); 
  const [raceId, setRaceId] = useState(""); 
  const [text1, setText1] = useState("drinking coffee"); 
  const [text2, setText2] = useState("Play with ps"); 
  const triggerVibration = useVibration();
  const [image1, setImage1] = useState("");
  const [image2, setImage2] = useState("");

  useEffect(() => {
    let token =  tokenCode()
    apiRequestError("Get", {}, {}, "/race/current", true, false, token).then((response) => { 
      
      setQuestion(response[0].description)
      setText1(response[0].answerOne)
      setText2(response[0].answerTwo)
      setImage1(require(`./../../../../public/pic/carecter/${response[0].answerOneImg}`));
      setImage2(require(`./../../../../public/pic/carecter/${response[0].answerTwoImg}`));
      setRaceId(response[0]._id)
      let qid= response[0]._id
      let url =`/user-race/check/${qid}`
      apiRequestError("Get", {}, {},url, true, false, token).then((response2) => { 
       
        
if (response2.message) {
  setLoad(true)
} else {
  setLoad(true)
  setSelected(parseInt(response2.selectedAnswer))
  setChose(parseInt(response2.selectedAnswer))
  Confirm()
}

      }).catch((err)=> {}
      )
    })
  }, [])
  
  const handleSelect = (index) => {
    triggerVibration(100)
    setSelected(index);
    setSelectedButton(1);
  };

  const handleButtonSelect = (value) => {
    
    if (selected) {
      value==1 && triggerVibration(20)
      value==2 && triggerVibration(40)
      value==3 && triggerVibration(90)
      value==4 && triggerVibration(130)
      setSelectedButton(value);  
      
    }
  };

  const Confirm = () => {
    if (selected) {
      let token = tokenCode()
      let data = {
        "raceId": raceId,
        "selectedAnswer": selected,
        "type": selectedButton,
      }
      apiRequestError("Post", {}, data, '/user-race', true, false, token).then((res) => {
        console.log("rrrrrrrrrrrrrrrrrr" , res);
        
        if (res.hasError) { triggerVibration(130); return}
        
        props.chengeBalance((selectedButton-1) *500)
      setAnimateOut(true); 
      setTimeout(() => {
      setChose(selected); 
      }, 150); 

    })
      
    }
    
  };

  return (
    <div className={styles.container}>
       <div className="flex justify-center mb-2 items-center min-h-[5vh] ">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-center text-gray-100 leading-snug">
          {translate(question)}
        </h1>
      </div>
      <div className={`${styles.imagesContainer} `}>
        {!chose ? (
          <>
            <div
              className={`${styles.imageBox} ${selected === 1 ? styles.active : ""} ${animateOut ? styles.animateOut : ""}`}
              onClick={() => handleSelect(1)}
            >
              {load ? <Image src={image1} alt="Image 1" /> : (<Skeleton baseColor="#6d6d6d" height={155} width={155} />)}
              <div className={styles.caption}>{translate(text1)}</div>
            </div>
            <div
              className={`${styles.imageBox} ${selected === 2 ? styles.active : ""} ${animateOut ? styles.animateOut : ""}`}
              onClick={() => handleSelect(2)}
            >
              {load ? <Image src={image2} alt="Image 2" /> : (<Skeleton baseColor="#6d6d6d" height={155} width={155} />)}
              <div className={styles.caption}>{translate(text2)}</div>
            </div>
          </>
        ) : (
          <div className={`${styles.imageBox} ${styles.chose}`}>
            <Image src={chose == 1 ? image1 : image2} alt="Image 1" />
            <div className={styles.caption}>{translate(chose == 1 ? text1 : text2)}</div>
          </div>
        )}
      </div>

      {/* دکمه‌ها */}
      <div className={`${styles.buttonContainer} ${animateOut || chose ? styles.animateOut : ""}`}>
        <button
          className={`${styles.selectButton} ${selectedButton === 1 ? styles.activeButton : ""}`}
          onClick={() => handleButtonSelect(1)}
        >
          X1
        </button>
        <button
          className={`${styles.selectButton} ${selectedButton === 2 ? styles.activeButton : ""}`}
          onClick={() => handleButtonSelect(2)}
        >
          X2
        </button>
        <button
          className={`${styles.selectButton} ${selectedButton === 3 ? styles.activeButton : ""}`}
          onClick={() => handleButtonSelect(3)}
        >
          X3
        </button>
        <button
          className={`${styles.selectButton} ${selectedButton === 4 ? styles.activeButton : ""}`}
          onClick={() => handleButtonSelect(4)}
        >
          X4
        </button>
      </div>

      <div className="flex justify-center items-center  min-h-[10vh]">
        {!chose ? (
          <button onClick={Confirm} style={{width:'280px'}} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
            {selectedButton == 0 && translate("questionBtn")}
            {selectedButton == 1 && translate("questionBtn")}
            {selectedButton == 2 && `${translate("questionBtnPay")} ${'500'} ${translate("RevCoin")}`}
            {selectedButton == 3 && `${translate("questionBtnPay")} ${'1000'} ${translate("RevCoin")}`}
            {selectedButton == 4 && `${translate("questionBtnPay")} ${'1500'} ${translate("RevCoin")}`}
          </button>
        ) : (
          <button style={{color:"#ff9100",width:"200px", backgroundColor:"#181818"}} className="disabled font-bold py-2 px-4 rounded-full">
            {translate("your choice")}
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageSelector;
