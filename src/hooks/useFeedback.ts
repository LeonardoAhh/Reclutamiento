import { useCallback, useEffect, useState } from 'react';

type FeedbackType = 'light' | 'success' | 'error';

// AudioContext compartido para evitar crear múltiples instancias y quedarse sin memoria.
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
};

// Singleton para el estado global del sonido, permitiendo sincronización entre componentes
let isSoundEnabledGlobal = true;
try {
  const stored = localStorage.getItem('reclutamiento-sound');
  if (stored !== null) {
    isSoundEnabledGlobal = stored === 'true';
  }
} catch (e) {
  // Ignorar errores de SSR o localStorage no disponible
}

const notifySoundChange = () => {
  window.dispatchEvent(new Event('sound-preference-changed'));
};

export function useFeedback() {
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabledGlobal);

  useEffect(() => {
    const handleSync = () => setSoundEnabledState(isSoundEnabledGlobal);
    window.addEventListener('sound-preference-changed', handleSync);
    return () => window.removeEventListener('sound-preference-changed', handleSync);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !isSoundEnabledGlobal;
    isSoundEnabledGlobal = next;
    try {
      localStorage.setItem('reclutamiento-sound', String(next));
    } catch (e) {}
    notifySoundChange();
  }, []);

  const trigger = useCallback((type: FeedbackType) => {
    // 1. Vibración (Haptics)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        switch (type) {
          case 'light':
            navigator.vibrate(10);
            break;
          case 'success':
            navigator.vibrate([20, 50, 30]);
            break;
          case 'error':
            navigator.vibrate([50, 50, 50, 50, 50]);
            break;
        }
      } catch (e) {
        // Ignorar fallos de hardware
      }
    }

    // 2. Sonido Sintetizado (Audio)
    if (isSoundEnabledGlobal) {
      const ctx = getAudioContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'light') {
        // Un "bloop" sutil (gota)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        osc.start(t);
        osc.stop(t + 0.1);

      } else if (type === 'success') {
        // Dos notas agudas, alegres (C5, E5)
        osc.type = 'sine';
        // Primera nota (C5)
        osc.frequency.setValueAtTime(523.25, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        // Segunda nota (E5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, t + 0.15);
        gain2.gain.setValueAtTime(0, t + 0.15);
        gain2.gain.linearRampToValueAtTime(0.1, t + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        
        osc.start(t);
        osc.stop(t + 0.15);
        osc2.start(t + 0.15);
        osc2.stop(t + 0.4);

      } else if (type === 'error') {
        // Tono grave tipo "buzz" suave
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.2);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        
        osc.start(t);
        osc.stop(t + 0.2);
      }
    }
  }, []);

  return { soundEnabled, toggleSound, trigger };
}
