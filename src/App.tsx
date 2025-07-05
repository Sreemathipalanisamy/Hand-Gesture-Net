import React, { useState, useEffect, useCallback } from 'react';
import HandTracker from './components/HandTracker';
import GestureDisplay from './components/GestureDisplay';
import Stats from './components/Stats';
import { Hand, Brain, Camera, BarChart3 } from 'lucide-react';

function App() {
  const [currentGesture, setCurrentGesture] = useState<string>('No hands detected');
  const [gestureHistory, setGestureHistory] = useState<string[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [totalGestures, setTotalGestures] = useState<number>(0);
  const [confidenceScores, setConfidenceScores] = useState<number[]>([]);
  const [handsDetected, setHandsDetected] = useState<number>(0);
  const [currentConfidence, setCurrentConfidence] = useState<number>(0);
  const [handData, setHandData] = useState<any>(null);

  const handleGestureDetected = useCallback((gesture: string, confidence: number = 0, handAnalysis: any = null) => {
    if (gesture !== currentGesture) {
      setCurrentGesture(gesture);
      setCurrentConfidence(confidence);
      setHandData(handAnalysis);
      
      if (gesture !== 'No hands detected' && gesture !== 'Uncertain') {
        setGestureHistory(prev => [...prev, gesture]);
        setTotalGestures(prev => prev + 1);
        setHandsDetected(prev => prev + 1);
        setConfidenceScores(prev => [...prev, confidence]);
      }
    } else {
      // Update confidence even if gesture is the same
      setCurrentConfidence(confidence);
      setHandData(handAnalysis);
    }
  }, [currentGesture]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const averageConfidence = confidenceScores.length > 0 
    ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Hand className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Advanced Hand Recognition System</h1>
                <p className="text-gray-600">Real-time gesture detection with AI-powered analysis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Camera className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Live Camera Feed</h2>
                <div className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Enhanced Detection
                </div>
              </div>
              <HandTracker onGestureDetected={handleGestureDetected} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Gesture Display */}
            <GestureDisplay
              currentGesture={currentGesture}
              gestureHistory={gestureHistory}
              confidence={currentConfidence}
              handData={handData}
            />

            {/* Statistics */}
            <Stats
              totalGestures={totalGestures}
              sessionTime={sessionTime}
              averageConfidence={averageConfidence}
              handsDetected={handsDetected}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How to Use the Enhanced System</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Allow Camera Access</h3>
              <p className="text-gray-600 text-sm">
                Grant permission for high-quality camera access for optimal detection.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Start Advanced Tracking</h3>
              <p className="text-gray-600 text-sm">
                Click "Start Tracking" to begin real-time hand analysis with confidence scoring.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Adjust Settings</h3>
              <p className="text-gray-600 text-sm">
                Fine-tune sensitivity and smoothing for optimal gesture recognition.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Make Gestures</h3>
              <p className="text-gray-600 text-sm">
                Try various hand gestures and see real-time analysis with confidence levels.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Features */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-semibold mb-6">Enhanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Hand className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Advanced Detection</h3>
              <p className="text-sm opacity-90">
                Enhanced gesture recognition with angle analysis and finger tracking.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Confidence Scoring</h3>
              <p className="text-sm opacity-90">
                Real-time confidence levels for each detected gesture with accuracy metrics.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Smooth Tracking</h3>
              <p className="text-sm opacity-90">
                Intelligent smoothing algorithms reduce jitter and improve stability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Performance Analytics</h3>
              <p className="text-sm opacity-90">
                Real-time FPS monitoring and detailed session statistics.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;