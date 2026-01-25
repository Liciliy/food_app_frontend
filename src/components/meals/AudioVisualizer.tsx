/**
 * Audio Visualizer Component
 * Real-time audio waveform visualization using Web Audio API
 */

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  className?: string;
}

export function AudioVisualizer({ stream, isRecording, className = '' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream || !isRecording) {
      // Clean up when not recording
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Clear canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Higher fftSize = more frequency resolution
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;

    // Connect stream to analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Drawing function
    const draw = () => {
      if (!isRecording || !analyserRef.current || !dataArrayRef.current) return;

      animationRef.current = requestAnimationFrame(draw);

      // @ts-ignore - TypeScript strict mode issue with Web Audio API types
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      const width = rect.width;
      const height = rect.height;

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#f0f9ff');
      gradient.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2563eb';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayRef.current[i] / 128.0; // Normalize to 0-2 range
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw frequency bars (bottom half)
      const barDataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      // @ts-ignore - TypeScript strict mode issue with Web Audio API types
      analyserRef.current.getByteFrequencyData(barDataArray);
      
      const barWidth = width / 50; // Show 50 bars
      const barSpacing = 2;
      
      for (let i = 0; i < 50; i++) {
        const barHeight = (barDataArray[i] / 255) * (height / 3);
        const barX = i * (barWidth + barSpacing);
        const barY = height - barHeight;
        
        // Gradient for bars
        const barGradient = ctx.createLinearGradient(0, barY, 0, height);
        barGradient.addColorStop(0, '#3b82f6');
        barGradient.addColorStop(1, '#1d4ed8');
        
        ctx.fillStyle = barGradient;
        ctx.fillRect(barX, barY, barWidth, barHeight);
      }
    };

    draw();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-lg ${className}`}
      style={{ height: '120px' }}
    />
  );
}
