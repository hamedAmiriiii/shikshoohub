"use client";

import { useEffect } from 'react';

export default function PWAHead() {
  useEffect(() => {
    // Check if elements already exist
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }

    let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      themeColor.content = '#1f9ad1';
      document.head.appendChild(themeColor);
    }

    let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement;
    if (!appleCapable) {
      appleCapable = document.createElement('meta');
      appleCapable.name = 'apple-mobile-web-app-capable';
      appleCapable.content = 'yes';
      document.head.appendChild(appleCapable);
    }

    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
      appleStatusBar.content = 'default';
      document.head.appendChild(appleStatusBar);
    }

    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (!appleTitle) {
      appleTitle = document.createElement('meta');
      appleTitle.name = 'apple-mobile-web-app-title';
      appleTitle.content = 'kerman-Photo';
      document.head.appendChild(appleTitle);
    }

    // No cleanup needed - these meta tags should persist
    return () => {
      // Elements should remain in the DOM, so we don't remove them
    };
  }, []);

  return null;
}

