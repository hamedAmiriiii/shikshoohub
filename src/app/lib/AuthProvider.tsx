"use client"
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [mobile, setMobile] = useState(true);
  const router = useRouter();

  function GetDeviceType() {
    const userAgent = navigator.userAgent;
  
    if (/mobile/i.test(userAgent)) {
      return 'Mobile';
    }
  
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'Tablet';
    }
  
    if (/Android|iPhone|iPod|BlackBerry|webOS/i.test(userAgent)) {
      return 'Mobile';
    }
  
    if (/Mac|Windows|Linux|X11/i.test(userAgent)) {
      return 'Desktop';
    }
  
    return 'Unknown';
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const url = window.location.href
    const device = GetDeviceType()
   
    if (!url.includes('localhost') && device !='Mobile') setMobile(false)
    if (!token) router.push('/main/login');
    
  }, []);

  return <AuthContext.Provider value={user}>{ mobile ? children : <h4>Please login with mobile</h4>}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
