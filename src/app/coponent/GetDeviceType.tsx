function GetDeviceType() {
    const userAgent = navigator.userAgent;
  
    if (/mobile/i.test(userAgent)) {
      return 'Mobile';
    }
  
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'Tablet';
    }
  
    if (/Android|iPhone|iPod|BlackBerry|Windows Phone|webOS/i.test(userAgent)) {
      return 'Mobile';
    }
  
    if (/Mac|Windows|Linux|X11/i.test(userAgent)) {
      return 'Desktop';
    }
  
    return 'Unknown';
  }
  
 
  