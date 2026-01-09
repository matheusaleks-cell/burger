import { useState, useRef, useCallback, useEffect } from "react";

// Create a pleasant but noticeable alert (Hotel Bell style)
const playAlert = (audioContext: AudioContext) => {
    const playNote = (freq: number, startTime: number, duration: number, volume: number) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        osc.frequency.value = freq;
        osc.type = "sine"; // Smooth sine wave for a bell-like sound

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    // Classic Hotel Desk Bell (Ding-Ding) - Pleasant repetition
    playNote(660, now, 1.5, 0.6);        // E5
    playNote(554.37, now + 0.25, 1.5, 0.4); // C#5
};

export const useKitchenSound = () => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<number | null>(null);

    const stopAlarm = useCallback(() => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const playAlarm = useCallback(() => {
        if (!soundEnabled || isPlaying) return;

        try {
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
            }

            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            setIsPlaying(true);

            // Initial play
            playAlert(ctx);

            // Set loop every 3.5 seconds (Polite persistence)
            intervalRef.current = window.setInterval(() => {
                if (ctx.state === 'suspended') ctx.resume();
                playAlert(ctx);
            }, 3500);

        } catch (error) {
            console.error("Error playing sound:", error);
            setIsPlaying(false);
        }
    }, [soundEnabled, isPlaying]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        soundEnabled,
        setSoundEnabled,
        playAlarm,
        stopAlarm,
        isPlaying
    };
};
