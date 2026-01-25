/**
 * Voice Recorder Hook
 * Custom hook for managing audio recording with Web Audio API
 */

import { useState, useRef, useCallback } from 'react';

/** Maximum recording duration in seconds (5 minutes) */
const MAX_RECORDING_DURATION = 5 * 60;

/** Recording mode type */
type RecordingMode = 'hold' | 'toggle' | null;

/** Recording state interface */
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  stream: MediaStream | null;
  recordingMode: RecordingMode;
}

/** Voice recorder hook return type */
interface UseVoiceRecorderReturn extends RecordingState {
  startRecording: (mode: RecordingMode) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  getAudioFile: () => File | null;
  setRecordingMode: (mode: RecordingMode) => void;
}

/**
 * Custom hook for voice recording functionality
 * Uses MediaRecorder API for capturing audio
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    error: null,
    stream: null,
    recordingMode: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef<boolean>(false); // Track recording state for closures

  /**
   * Update duration timer
   */
  const updateDuration = useCallback(() => {
    if (state.isPaused) return;
    
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) + pausedDurationRef.current;
    
    if (elapsed >= MAX_RECORDING_DURATION) {
      // Auto-stop at max duration
      stopRecording();
      return;
    }
    
    setState(prev => ({ ...prev, duration: elapsed }));
  }, [state.isPaused]);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async (mode: RecordingMode = 'toggle') => {
    try {
      // Reset state
      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        error: null,
        stream: null,
        recordingMode: mode,
      });
      chunksRef.current = [];
      pausedDurationRef.current = 0;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      streamRef.current = stream;

      // Setup audio context and analyser for silence detection (toggle mode only)
      if (mode === 'toggle') {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 2048;
      }

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          audioBlob,
          stream: null,
        }));
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Handle error
      mediaRecorder.onerror = () => {
        setState(prev => ({ 
          ...prev, 
          error: 'Recording error occurred. Please try again.',
          isRecording: false,
        }));
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      isRecordingRef.current = true;
      
      setState(prev => ({ ...prev, isRecording: true, stream }));

      // Start duration timer
      timerRef.current = setInterval(updateDuration, 1000);

      // Start silence detection for toggle mode
      if (mode === 'toggle' && analyserRef.current) {
        const SILENCE_THRESHOLD = 0.02; // Audio level threshold (increased for better detection)
        const SILENCE_DURATION = 3000; // 3 seconds
        let lastSoundTime = Date.now();
        let hasSoundStarted = false; // Only start silence detection after user speaks

        silenceCheckIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;

          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteTimeDomainData(dataArray);

          // Calculate audio level (RMS)
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / bufferLength);

          if (rms > SILENCE_THRESHOLD) {
            // Sound detected
            hasSoundStarted = true;
            lastSoundTime = Date.now();
          } else if (hasSoundStarted) {
            // Silence detected (only after user has started speaking)
            const silenceDuration = Date.now() - lastSoundTime;
            if (silenceDuration >= SILENCE_DURATION) {
              // Stop recording after 3 seconds of silence
              if (silenceCheckIntervalRef.current) {
                clearInterval(silenceCheckIntervalRef.current);
                silenceCheckIntervalRef.current = null;
              }
              stopRecording();
            }
          }
        }, 100); // Check every 100ms
      }

    } catch (error) {
      let errorMessage = 'Failed to access microphone.';
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        }
      }
      
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [updateDuration]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      isRecordingRef.current = false;
      mediaRecorderRef.current.stop();
      
      // Clean up silence detection
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
        silenceCheckIntervalRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    }
  }, []); // No dependencies needed since we use refs

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      pausedDurationRef.current = state.duration;
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused, state.duration]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isPaused) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isPaused]);

  /**
   * Reset recording state
   */
  const resetRecording = useCallback(() => {
    // Stop any ongoing recording
    if (mediaRecorderRef.current && isRecordingRef.current) {
      isRecordingRef.current = false;
      mediaRecorderRef.current.stop();
    }
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    
    // Stop stream
    streamRef.current?.getTracks().forEach(track => track.stop());
    
    // Reset state
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      stream: null,
      error: null,
      recordingMode: null,
    });
    isRecordingRef.current = false;
    chunksRef.current = [];
    pausedDurationRef.current = 0;
  }, []); // No dependencies needed since we use refs

  /**
   * Get audio file from blob
   */
  const getAudioFile = useCallback((): File | null => {
    if (!state.audioBlob) return null;
    
    const extension = state.audioBlob.type.includes('webm') ? 'webm' : 'm4a';
    const filename = `meal_recording_${Date.now()}.${extension}`;
    
    return new File([state.audioBlob], filename, { type: state.audioBlob.type });
  }, [state.audioBlob]);

  /**
   * Set recording mode
   */
  const setRecordingMode = useCallback((mode: RecordingMode) => {
    setState(prev => ({ ...prev, recordingMode: mode }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    getAudioFile,
    setRecordingMode,
  };
}