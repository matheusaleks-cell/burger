import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export type SoundType = "newOrder" | "orderReady";

// Singleton global AudioContext to persist user gesture unlock
let globalAudioContext: AudioContext | null = null;
// Module-level interval to ensure global persistence across hook instances
let loopInterval: NodeJS.Timeout | null = null;

const getAudioContext = () => {
  if (!globalAudioContext) {
    // Cross-browser support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      globalAudioContext = new AudioContextClass();
    } else {
      console.error("Web Audio API not supported in this browser.");
    }
  }
  return globalAudioContext;
};

export function useNotificationSound() {

  // Global unlocker: Resume AudioContext on ANY user interaction
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log("AudioContext resumed by global interaction listener.");
          toast.success("Sistema de som ativado!"); // Feedback for user
        }).catch(e => console.error("Global resume failed:", e));
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const playProceduralSound = useCallback(async (type: SoundType) => {
    try {
      const ctx = getAudioContext();

      if (!ctx) {
        console.error("AudioContext not available.");
        return;
      }

      // Ensure context is running (unlock audio on user interaction)
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
          console.log("AudioContext resumed successfully.");
        } catch (resumeError) {
          console.error("Failed to resume AudioContext. User interaction required.", resumeError);
          // Alert user they must interact
          toast.error("⚠️ Clique em qualquer lugar da tela para ativar o som!", {
            duration: 10000,
            action: {
              label: "Ativar",
              onClick: () => ctx.resume()
            }
          });
          return; // Stop if we can't resume
        }
      }

      console.log(`🎵 Playing sound: ${type}`);

      // Helper for procedural notes (kept for orderReady or fallback)
      const playNote = (freq: number, startTime: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
      };

      if (type === "newOrder") {
        // Load and play the user's custom MP3 file
        try {
          console.log("Fetching /sounds/new-order.mp3...");
          const response = await fetch('/sounds/new-order.mp3');
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

          console.log(`MP3 Loaded. Duration: ${audioBuffer.duration.toFixed(2)}s, Channels: ${audioBuffer.numberOfChannels}`);

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;

          const gain = ctx.createGain();
          gain.gain.value = 1.0;

          source.connect(gain);
          gain.connect(ctx.destination);

          source.start(0);
          console.log("MP3 started via buffer source");
        } catch (e) {
          console.error("Failed to play mp3, falling back to beep:", e);
          // Fallback
          const now = ctx.currentTime;
          playNote(659.25, now, 0.2, 0.3);
          playNote(523.25, now + 0.25, 0.4, 0.3);
        }
      } else if (type === "orderReady") {
        const now = ctx.currentTime;
        playNote(523.25, now, 0.2, 0.3);
        playNote(659.25, now + 0.15, 0.2, 0.3);
        playNote(783.99, now + 0.3, 0.4, 0.3);
      }

    } catch (error) {
      console.log("Error playing sound:", error);
    }
  }, []);

  const playNewOrderSound = useCallback(() => {
    // Fire and forget, but catch errors
    playProceduralSound("newOrder").catch(e => console.error("Play new order error", e));
  }, [playProceduralSound]);

  const playOrderReadySound = useCallback(() => {
    playProceduralSound("orderReady").catch(e => console.error("Play order ready error", e));
  }, [playProceduralSound]);

  const startNewOrderLoop = useCallback(() => {
    if (loopInterval) return; // Already looping
    console.log("Starting new order sound loop...");

    // Play immediately
    playProceduralSound("newOrder").catch(console.error);

    // Loop every 8 seconds (to allow full MP3 playback)
    loopInterval = setInterval(() => {
      console.log("Looping new order sound...");
      playProceduralSound("newOrder").catch(console.error);
    }, 8000);
  }, [playProceduralSound]);

  const stopNewOrderLoop = useCallback(() => {
    if (loopInterval) {
      console.log("Stopping new order sound loop.");
      clearInterval(loopInterval);
      loopInterval = null;
    }
  }, []);

  return {
    playNewOrderSound,
    playOrderReadySound,
    startNewOrderLoop,
    stopNewOrderLoop
  };
}
