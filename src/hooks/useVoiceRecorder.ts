/**
 * Voice Recorder Hook
 * Custom hook for managing audio recording with Web Audio API
 */

import { useState, useRef, useCallback } from 'react';

/** Maximum recording duration in seconds (5 minutes) */
const MAX_RECORDING_DURATION = 5 * 60;

/** Recording state interface */
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  stream: MediaStream | null;
}

/** Voice recorder hook return type */
interface UseVoiceRecorderReturn extends RecordingState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  getAudioFile: () => File | null;
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
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

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
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        error: null,
        stream: null,
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
      
      setState(prev => ({ ...prev, isRecording: true, stream }));

      // Start duration timer
      timerRef.current = setInterval(updateDuration, 1000);

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
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

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
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
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
    });
    chunksRef.current = [];
    pausedDurationRef.current = 0;
  }, [state.isRecording]);

  /**
   * Get audio file from blob
   */
  const getAudioFile = useCallback((): File | null => {
    if (!state.audioBlob) return null;
    
    const extension = state.audioBlob.type.includes('webm') ? 'webm' : 'm4a';
    const filename = `meal_recording_${Date.now()}.${extension}`;
    
    return new File([state.audioBlob], filename, { type: state.audioBlob.type });
  }, [state.audioBlob]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    getAudioFile,
  };
}