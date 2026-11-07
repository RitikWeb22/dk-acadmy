/**
 * Fullscreen Utility for DK Academy CBT Mock Testing Engine
 * Handles cross-browser fullscreen requests and exits securely.
 */

export const requestFullScreen = async (element?: HTMLElement): Promise<boolean> => {
  try {
    // Avoid triggering native browser fullscreen on small screens/mobile devices
    // as mobile browsers stretch, zoom, or distort responsive viewports in fullscreen
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false;
    }

    const target = element || document.documentElement;
    if (document.fullscreenElement) {
      return true;
    }

    if (target.requestFullscreen) {
      await target.requestFullscreen();
      return true;
    } else if ((target as any).webkitRequestFullscreen) {
      await (target as any).webkitRequestFullscreen();
      return true;
    } else if ((target as any).mozRequestFullScreen) {
      await (target as any).mozRequestFullScreen();
      return true;
    } else if ((target as any).msRequestFullscreen) {
      await (target as any).msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('[FullScreen] Failed to enter fullscreen automatically:', err);
  }
  return false;
};

export const exitFullScreen = async (): Promise<boolean> => {
  try {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
        return true;
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
        return true;
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
        return true;
      }
    }
  } catch (err) {
    console.warn('[FullScreen] Failed to exit fullscreen:', err);
  }
  return false;
};

export const isFullScreenActive = (): boolean => {
  return Boolean(
    document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
  );
};

