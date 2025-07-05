import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { Camera, Square, Play, Pause, RotateCcw, Settings, Zap, AlertCircle, RefreshCw } from 'lucide-react';

interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

interface Hand {
  keypoints: HandLandmark[];
  handedness: string;
  score: number;
}

interface HandTrackerProps {
  onGestureDetected?: (gesture: string, confidence?: number, handData?: any) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGestureDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [detector, setDetector] = useState<handPoseDetection.HandDetector | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hands, setHands] = useState<Hand[]>([]);
  const [fps, setFps] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [smoothing, setSmoothing] = useState(0.8);
  const animationRef = useRef<number>();
  const fpsRef = useRef<number[]>([]);
  const gestureHistoryRef = useRef<string[]>([]);
  const smoothedLandmarksRef = useRef<HandLandmark[][]>([]);

  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera access denied. Please allow camera permissions to use hand tracking.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Failed to access camera. Please check your camera settings and try again.');
      }
    }
  }, []);

  const initializeModel = useCallback(async () => {
    try {
      setIsLoading(true);
      await tf.ready();
      
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'tfjs' as const,
        modelType: 'full' as const,
        maxHands: 2,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
      };
      
      const handDetector = await handPoseDetection.createDetector(model, detectorConfig);
      setDetector(handDetector);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load hand detection model.');
      setIsLoading(false);
      console.error('Model loading error:', err);
    }
  }, []);

  const smoothLandmarks = useCallback((currentLandmarks: HandLandmark[], handIndex: number) => {
    if (!smoothedLandmarksRef.current[handIndex]) {
      smoothedLandmarksRef.current[handIndex] = currentLandmarks;
      return currentLandmarks;
    }

    const smoothed = currentLandmarks.map((landmark, i) => {
      const prev = smoothedLandmarksRef.current[handIndex][i];
      return {
        x: prev.x * smoothing + landmark.x * (1 - smoothing),
        y: prev.y * smoothing + landmark.y * (1 - smoothing),
        z: prev.z && landmark.z ? prev.z * smoothing + landmark.z * (1 - smoothing) : landmark.z
      };
    });

    smoothedLandmarksRef.current[handIndex] = smoothed;
    return smoothed;
  }, [smoothing]);

  const calculateFingerAngles = useCallback((landmarks: HandLandmark[]) => {
    const angles = [];
    
    // Finger joint indices for each finger
    const fingerJoints = [
      [1, 2, 3, 4],   // Thumb
      [5, 6, 7, 8],   // Index
      [9, 10, 11, 12], // Middle
      [13, 14, 15, 16], // Ring
      [17, 18, 19, 20]  // Pinky
    ];

    fingerJoints.forEach(joints => {
      const fingerAngles = [];
      for (let i = 0; i < joints.length - 2; i++) {
        const p1 = landmarks[joints[i]];
        const p2 = landmarks[joints[i + 1]];
        const p3 = landmarks[joints[i + 2]];
        
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
        fingerAngles.push(angle);
      }
      angles.push(fingerAngles);
    });
    
    return angles;
  }, []);

  const detectAdvancedGesture = useCallback((hands: Hand[]) => {
    if (hands.length === 0) return { gesture: 'No hands detected', confidence: 0 };
    
    const hand = hands[0];
    const landmarks = smoothLandmarks(hand.keypoints, 0);
    const angles = calculateFingerAngles(landmarks);
    
    // Key landmarks
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    const thumbMcp = landmarks[2];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const pinkyMcp = landmarks[17];
    
    const wrist = landmarks[0];
    
    // Calculate distances and positions
    const thumbExtended = thumbTip.x > thumbMcp.x + 20;
    const indexExtended = indexTip.y < indexMcp.y - 20;
    const middleExtended = middleTip.y < middleMcp.y - 20;
    const ringExtended = ringTip.y < ringMcp.y - 20;
    const pinkyExtended = pinkyTip.y < pinkyMcp.y - 20;
    
    const extendedFingers = [
      thumbExtended,
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended
    ];
    
    const extendedCount = extendedFingers.filter(Boolean).length;
    
    // Advanced gesture detection with confidence scoring
    let gesture = 'Unknown';
    let confidence = 0;
    
    // Fist detection
    if (extendedCount === 0) {
      const compactness = Math.sqrt(
        Math.pow(indexTip.x - wrist.x, 2) + Math.pow(indexTip.y - wrist.y, 2)
      );
      confidence = Math.min(1, (100 - compactness) / 50);
      gesture = 'Fist';
    }
    // Open hand detection
    else if (extendedCount === 5) {
      const spread = Math.sqrt(
        Math.pow(thumbTip.x - pinkyTip.x, 2) + Math.pow(thumbTip.y - pinkyTip.y, 2)
      );
      confidence = Math.min(1, spread / 200);
      gesture = 'Open Hand';
    }
    // Pointing gesture
    else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const pointingAngle = Math.atan2(indexTip.y - indexMcp.y, indexTip.x - indexMcp.x);
      confidence = indexExtended ? 0.9 : 0.5;
      gesture = 'Pointing';
    }
    // Peace sign
    else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      const separation = Math.sqrt(
        Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)
      );
      confidence = Math.min(1, separation / 50);
      gesture = 'Peace Sign';
    }
    // Thumbs up
    else if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const thumbAngle = Math.atan2(thumbTip.y - thumbMcp.y, thumbTip.x - thumbMcp.x);
      confidence = thumbExtended ? 0.85 : 0.4;
      gesture = 'Thumbs Up';
    }
    // OK sign
    else if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
      );
      if (distance < 30) {
        confidence = 0.8;
        gesture = 'OK Sign';
      }
    }
    // Rock sign
    else if (indexExtended && pinkyExtended && !middleExtended && !ringExtended) {
      confidence = 0.75;
      gesture = 'Rock Sign';
    }
    // Call me gesture
    else if (thumbExtended && pinkyExtended && !indexExtended && !middleExtended && !ringExtended) {
      confidence = 0.7;
      gesture = 'Call Me';
    }
    // Number gestures
    else {
      gesture = `${extendedCount} Finger${extendedCount !== 1 ? 's' : ''}`;
      confidence = 0.6;
    }
    
    // Apply sensitivity threshold
    if (confidence < sensitivity) {
      gesture = 'Uncertain';
      confidence = 0;
    }
    
    // Gesture smoothing
    gestureHistoryRef.current.push(gesture);
    if (gestureHistoryRef.current.length > 5) {
      gestureHistoryRef.current.shift();
    }
    
    // Use most common gesture in recent history
    const gestureCount = gestureHistoryRef.current.reduce((acc, g) => {
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommon = Object.entries(gestureCount).reduce((a, b) => 
      gestureCount[a[0]] > gestureCount[b[0]] ? a : b
    )[0];
    
    return { 
      gesture: mostCommon, 
      confidence: Math.max(0, Math.min(1, confidence)),
      handData: {
        landmarks,
        angles,
        extendedFingers,
        handedness: hand.handedness
      }
    };
  }, [smoothLandmarks, calculateFingerAngles, sensitivity]);

  const drawAdvancedHands = useCallback((hands: Hand[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    hands.forEach((hand, handIndex) => {
      const landmarks = smoothLandmarks(hand.keypoints, handIndex);
      
      // Draw hand skeleton
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17] // Palm
      ];
      
      // Draw connections with gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#8B5CF6');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      });
      
      // Draw landmarks with different colors for different parts
      landmarks.forEach((landmark, index) => {
        let color = '#3B82F6';
        let size = 4;
        
        if (index === 0) { // Wrist
          color = '#EF4444';
          size = 8;
        } else if ([4, 8, 12, 16, 20].includes(index)) { // Fingertips
          color = '#10B981';
          size = 6;
        } else if ([2, 5, 9, 13, 17].includes(index)) { // MCP joints
          color = '#F59E0B';
          size = 5;
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, size, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add subtle shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fill();
        ctx.shadowColor = 'transparent';
      });
      
      // Draw hand bounding box
      const minX = Math.min(...landmarks.map(p => p.x));
      const maxX = Math.max(...landmarks.map(p => p.x));
      const minY = Math.min(...landmarks.map(p => p.y));
      const maxY = Math.max(...landmarks.map(p => p.y));
      
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(minX - 10, minY - 10, maxX - minX + 20, maxY - minY + 20);
      ctx.setLineDash([]);
      
      // Draw handedness label
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(hand.handedness, minX, minY - 15);
    });
  }, [smoothLandmarks]);

  const detectHands = useCallback(async () => {
    if (!detector || !videoRef.current || !isTracking) return;
    
    const startTime = performance.now();
    
    try {
      const hands = await detector.estimateHands(videoRef.current);
      setHands(hands);
      
      if (hands.length > 0) {
        const { gesture, confidence, handData } = detectAdvancedGesture(hands);
        onGestureDetected?.(gesture, confidence, handData);
      } else {
        onGestureDetected?.('No hands detected', 0);
      }
      
      drawAdvancedHands(hands);
      
      // Calculate FPS
      const endTime = performance.now();
      const frameTime = endTime - startTime;
      const currentFps = 1000 / frameTime;
      
      fpsRef.current.push(currentFps);
      if (fpsRef.current.length > 10) {
        fpsRef.current.shift();
      }
      
      const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
      setFps(Math.round(avgFps));
      
    } catch (err) {
      console.error('Hand detection error:', err);
    }
    
    if (isTracking) {
      animationRef.current = requestAnimationFrame(detectHands);
    }
  }, [detector, isTracking, detectAdvancedGesture, drawAdvancedHands, onGestureDetected]);

  const startTracking = useCallback(() => {
    setIsTracking(true);
    gestureHistoryRef.current = [];
    smoothedLandmarksRef.current = [];
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const resetTracking = useCallback(() => {
    stopTracking();
    setHands([]);
    gestureHistoryRef.current = [];
    smoothedLandmarksRef.current = [];
    fpsRef.current = [];
    setFps(0);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [stopTracking]);

  const retryCamera = useCallback(() => {
    initializeCamera();
  }, [initializeCamera]);

  useEffect(() => {
    initializeCamera();
    initializeModel();
    
    return () => {
      stopTracking();
    };
  }, [initializeCamera, initializeModel, stopTracking]);

  useEffect(() => {
    if (isTracking && detector) {
      detectHands();
    }
  }, [isTracking, detector, detectHands]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Required</h3>
        <p className="text-red-700 text-center mb-4">{error}</p>
        
        {permissionDenied && (
          <div className="bg-white p-4 rounded-lg border border-red-300 mb-4 max-w-md">
            <h4 className="font-semibold text-gray-800 mb-2">How to enable camera access:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Look for a camera icon in your browser's address bar</li>
              <li>Click the icon and select "Allow" or "Always allow"</li>
              <li>If no icon appears, check your browser settings for site permissions</li>
              <li>Refresh the page after granting permission</li>
            </ol>
          </div>
        )}
        
        <button
          onClick={retryCamera}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Camera Access</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-auto"
          width={640}
          height={480}
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          width={640}
          height={480}
        />
        
        {/* FPS Counter */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm font-mono">
          {fps} FPS
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading advanced hand detection model...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <button
              onClick={isTracking ? stopTracking : startTracking}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTracking ? 'Stop' : 'Start'} Tracking</span>
            </button>
            
            <button
              onClick={resetTracking}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">{fps} FPS</span>
            </div>
            <div className="flex items-center space-x-2">
              <Square className={`w-3 h-3 ${isTracking ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isTracking ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        
        {showSettings && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Detection Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Sensitivity: {sensitivity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Smoothing: {smoothing.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.95"
                  step="0.05"
                  value={smoothing}
                  onChange={(e) => setSmoothing(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
          <div>
            <p><strong>Hands detected:</strong> {hands.length}</p>
            {hands.length > 0 && (
              <p><strong>Detection confidence:</strong> {(hands[0].score * 100).toFixed(1)}%</p>
            )}
          </div>
          <div>
            <p><strong>Processing speed:</strong> {fps} FPS</p>
            <p><strong>Model:</strong> MediaPipe Hands</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandTracker;