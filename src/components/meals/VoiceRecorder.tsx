/**
 * Voice Recorder Component
 * Main interface for recording voice descriptions of meals
 */

import { useState, useEffect, useRef } from 'react';
import { Mic, Square, RotateCcw, Loader2, CheckCircle, Upload } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useMealStore } from '../../stores/mealStore';
import { Button } from '../common/Button';
import { AudioVisualizer } from './AudioVisualizer';
import { cn } from '../../utils';

/**
 * Format seconds to MM:SS display
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Voice recorder component
 * Provides visual interface for recording meal descriptions
 */
export function VoiceRecorder() {
  const [showSuccess, setShowSuccess] = useState(false);
  const hasAutoSubmittedRef = useRef(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressHoldRef = useRef(false);
  
  const {
    isRecording,
    duration,
    audioBlob,
    stream,
    error: recordingError,
    recordingMode,
    startRecording,
    stopRecording,
    resetRecording,
    getAudioFile,
  } = useVoiceRecorder();

  const {
    uploadVoiceRecording,
    isUploading,
    error: uploadError,
    successMessage,
    currentMeal,
    clearError,
    clearSuccess,
    resetUploadState,
  } = useMealStore();

  // Handle success message display
  useEffect(() => {
    if (successMessage && currentMeal) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        clearSuccess();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, currentMeal, clearSuccess]);

  // Auto-submit when recording ends
  useEffect(() => {
    if (audioBlob && !isUploading && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      
      const autoSubmit = async () => {
        const audioFile = getAudioFile();
        if (!audioFile) return;

        clearError();
        const meal = await uploadVoiceRecording(audioFile);
        
        if (meal) {
          // Reset recording state after successful upload
          resetRecording();
          hasAutoSubmittedRef.current = false;
        } else {
          // If upload failed, allow manual retry
          hasAutoSubmittedRef.current = false;
        }
      };

      autoSubmit();
    }
  }, [audioBlob, isUploading, getAudioFile, uploadVoiceRecording, clearError, resetRecording]);

  // Reset auto-submit flag when starting new recording
  useEffect(() => {
    if (isRecording) {
      hasAutoSubmittedRef.current = false;
    }
  }, [isRecording]);

  /**
   * Handle button press start (mouse down / touch start)
   */
  const handlePressStart = () => {
    if (isRecording || audioBlob || isUploading) return;
    
    isPressHoldRef.current = false;
    
    // Set a timer to determine if this is a press-and-hold
    pressTimerRef.current = setTimeout(async () => {
      // If we reach here, it's a press-and-hold
      isPressHoldRef.current = true;
      await startRecording('hold');
    }, 300); // 300ms threshold to distinguish between click and hold
  };

  /**
   * Handle button press end (mouse up / touch end)
   */
  const handlePressEnd = async () => {
    // Clear the hold timer if still pending
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // If we were in hold mode and recording, stop now
    if (isPressHoldRef.current && recordingMode === 'hold') {
      stopRecording();
      isPressHoldRef.current = false;
      return;
    }
    
    // If this was a quick tap (not a hold) and we're not recording yet, start toggle mode
    if (!isPressHoldRef.current && !isRecording && !audioBlob) {
      await startRecording('toggle');
    }
  };

  /**
   * Handle mouse leaving the button area (only for canceling hold mode)
   */
  const handleMouseLeave = () => {
    // Clear the hold timer if mouse leaves before hold threshold
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    // If we were in hold mode and recording, stop now
    if (isPressHoldRef.current && recordingMode === 'hold') {
      stopRecording();
      isPressHoldRef.current = false;
    }
  };

  /**
   * Handle button click for stopping in toggle mode
   */
  const handleRecordButtonClick = (e: React.MouseEvent) => {
    // Only handle click if already recording in toggle mode
    // This prevents double-triggering with handlePressEnd
    if (isRecording && recordingMode === 'toggle') {
      e.preventDefault();
      e.stopPropagation();
      stopRecording();
    }
  };

  /**
   * Handle manual upload button click (fallback if auto-submit fails)
   */
  const handleUpload = async () => {
    const audioFile = getAudioFile();
    if (!audioFile) return;

    clearError();
    hasAutoSubmittedRef.current = true;
    const meal = await uploadVoiceRecording(audioFile);
    
    if (meal) {
      // Reset recording state after successful upload
      resetRecording();
      hasAutoSubmittedRef.current = false;
    } else {
      hasAutoSubmittedRef.current = false;
    }
  };

  /**
   * Handle reset/new recording
   */
  const handleReset = () => {
    resetRecording();
    resetUploadState();
    clearError();
    clearSuccess();
    setShowSuccess(false);
    hasAutoSubmittedRef.current = false;
  };

  const error = recordingError || uploadError;
  const maxDuration = 5 * 60; // 5 minutes
  const progressPercent = (duration / maxDuration) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        🎤 Log Your Meal
      </h2>
      
      <p className="text-sm text-gray-600 text-center mb-6">
        Describe what you just ate and our AI will analyze the nutritional content
      </p>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {showSuccess && currentMeal && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
              <p className="text-xs text-green-700 mt-1">
                {currentMeal.food_items?.length || 0} food items detected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Interface */}
      <div className="flex flex-col items-center">
        {/* Progress Ring / Record Button - Always at the top */}
        <div className="relative mb-4">
          {/* Background circle */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke={isRecording ? "#ef4444" : "#3b82f6"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - progressPercent / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Center button */}
          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onClick={handleRecordButtonClick}
            disabled={isUploading || !!audioBlob}
            className={cn(
              'absolute inset-0 m-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200',
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : audioBlob
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'select-none' // Prevent text selection during press-and-hold
            )}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-white" fill="white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Duration Display - Below button */}
        <div className="text-center mb-4">
          <span className={cn(
            'text-2xl font-mono font-bold',
            isRecording ? 'text-red-600' : 'text-gray-700'
          )}>
            {formatDuration(duration)}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {isRecording 
              ? recordingMode === 'hold' 
                ? 'Recording... (release to stop)' 
                : 'Recording... (click to stop or wait for silence)'
              : audioBlob 
              ? 'Recording complete' 
              : 'Max 5 minutes'
            }
          </p>
        </div>

        {/* Audio Visualizer - Below duration */}
        {(isRecording || isUploading) && (
          <div className="w-full mb-4">
            <AudioVisualizer 
              stream={stream} 
              isRecording={isRecording}
              className="shadow-sm border border-gray-200" 
            />
            {isUploading && (
              <div className="mt-2 text-center">
                <div className="flex items-center justify-center text-primary-600">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm font-medium">Analyzing your meal...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {audioBlob && !isUploading && uploadError && (
            <>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Recording
              </Button>
              
              <Button
                onClick={handleUpload}
                className="flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Retry Analysis
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        {!isRecording && !audioBlob && !isUploading && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 font-medium mb-2">
              Two ways to record:
            </p>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Press & hold:</span> Record while holding, release to stop
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Quick tap:</span> Click to start, click again or pause for 3s to stop
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Example: "I had two eggs with toast and orange juice for breakfast"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
