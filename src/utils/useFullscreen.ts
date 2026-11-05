import { useState, useEffect, useCallback } from 'react';

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const checkFullscreen = useCallback(() => {
    const doc = document as FullscreenDocument;
    const fsElement =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement;
    setIsFullscreen(Boolean(fsElement));
  }, []);

  useEffect(() => {
    const doc = document as FullscreenDocument;
    const elem = document.documentElement as FullscreenElement;
    const supported = Boolean(
      elem.requestFullscreen ||
      elem.webkitRequestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullscreen
    );
    setIsSupported(supported);
    checkFullscreen();

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];

    events.forEach((evt) => document.addEventListener(evt, checkFullscreen));
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, checkFullscreen));
    };
  }, [checkFullscreen]);

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement as FullscreenElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      return true;
    } catch (err) {
      console.warn('Fullscreen request failed or was dismissed:', err);
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      const doc = document as FullscreenDocument;
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
      setIsFullscreen(false);
      return true;
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
      return false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      return await exitFullscreen();
    } else {
      return await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
