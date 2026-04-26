"use client";
import { useEffect, useState } from "react";
import localFont from "next/font/local";
import { LanguageProvider } from "../coponent/Translate/LanguageProvider";
import "../globals.css";
import SimpleBottomNavigation from "../SimpleBottomNavigation";
import { useRouter } from "next/navigation";
import Header from "./header";
import { createContext, useContext } from "react";
import SimpleBottomNavigationAtelier from "../SimpleBottomNavigationAtelier";

const MyContext = createContext<{ myProp: object }>({ myProp: {} });

export const useMyContext = () => useContext(MyContext)


const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

function tokenCode() {
  return localStorage.getItem("token");
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

    const [admin, setAdmin] = useState(false);
    const [atelier, setAtelier] = useState(false);
    const [cameraman, setCameraman] = useState(false);
    const [akas, setAkas] = useState(false);
  const [helishot, setHelishot] = useState(false);
  

  useEffect(() => {
    if (!tokenCode()) {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
      let user = JSON.parse(localStorage.getItem('user'))
      user?.id ? null : router.push("/")
      user?.roles.map((e) => {
        if (e.name == "ادمین") {setAdmin("true")
        } else {
       if(e.name == "آتلیه دار")  e.pivot.status == "تایید شده" ?  setAtelier("true") : setAtelier("wait")
       if(e.name == "فیلم بردار")  e.pivot.status == "تایید شده" ?  setCameraman("true") : setCameraman("wait")
       if(e.name == "عکاس")  e.pivot.status == "تایید شده" ?  setAkas("true") : setAkas("wait")
       if(e.name == "فیلم بردار هوایی")  e.pivot.status == "تایید شده" ?  setHelishot("true") : setHelishot("wait")
        
       }
   
      })
       
  
  }, [])
  

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased max-w-[600px] Nolanding`}
      >

        <LanguageProvider>
        <MyContext.Provider value={{ myProp: {admin ,cameraman,atelier,helishot,akas } , }}>
          <Header />
          {children}
           {admin === "true" ? <SimpleBottomNavigation /> : <SimpleBottomNavigationAtelier /> }
            </MyContext.Provider>
        </LanguageProvider>
      </body>
    </html>
  );
}
