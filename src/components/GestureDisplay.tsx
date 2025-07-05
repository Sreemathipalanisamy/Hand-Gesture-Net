import React from 'react';
import { Hand, Activity, Target, Zap, TrendingUp } from 'lucide-react';

interface GestureDisplayProps {
  currentGesture: string;
  gestureHistory: string[];
  confidence?: number;
  handData?: any;
}

const GestureDisplay: React.FC<GestureDisplayProps> = ({ 
  currentGesture, 
  gestureHistory, 
  confidence = 0,
  handData
}) => {
  const getGestureIcon = (gesture: string) => {
    switch (gesture.toLowerCase()) {
      case 'fist':
        return '✊';
      case 'open hand':
        return '✋';
      case 'pointing':
        return '👉';
      case 'peace sign':
        return '✌️';
      case 'thumbs up':
        return '👍';
      case 'ok sign':
        return '👌';
      case 'rock sign':
        return '🤘';
      case 'call me':
        return '🤙';
      case '1 finger':
        return '☝️';
      case '2 fingers':
        return '✌️';
      case '3 fingers':
        return '🤟';
      case '4 fingers':
        return '🖖';
      case '5 fingers':
        return '✋';
      case 'no hands detected':
        return '❌';
      case 'uncertain':
        return '❓';
      default:
        return '🤚';
    }
  };

  const getGestureColor = (gesture: string) => {
    switch (gesture.toLowerCase()) {
      case 'fist':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'open hand':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pointing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'peace sign':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'thumbs up':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ok sign':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'rock sign':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'call me':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'no hands detected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'uncertain':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.6) return 'text-yellow-600';
    if (conf >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Medium';
    if (conf >= 0.4) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Hand className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Advanced Gesture Recognition</h2>
      </div>
      
      <div className="space-y-6">
        {/* Current Gesture */}
        <div className="text-center">
          <div className="mb-4">
            <span className="text-5xl">{getGestureIcon(currentGesture)}</span>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getGestureColor(currentGesture)}`}>
            <Target className="w-4 h-4 mr-2" />
            <span className="font-medium">{currentGesture}</span>
          </div>
          
          {/* Confidence Display */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Confidence</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    confidence >= 0.8 ? 'bg-green-500' :
                    confidence >= 0.6 ? 'bg-yellow-500' :
                    confidence >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                ></div>
              </div>
              <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className={`text-xs ${getConfidenceColor(confidence)}`}>
              {getConfidenceLabel(confidence)}
            </div>
          </div>
        </div>
        
        {/* Hand Analysis */}
        {handData && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Hand Analysis
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-600">Hand:</span>
                <span className="ml-2 font-medium">{handData.handedness}</span>
              </div>
              <div>
                <span className="text-gray-600">Extended Fingers:</span>
                <span className="ml-2 font-medium">
                  {handData.extendedFingers?.filter(Boolean).length || 0}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Gesture History */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-700">Recent Gestures</h3>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {gestureHistory.slice(-6).reverse().map((gesture, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
              >
                <span className="text-lg">{getGestureIcon(gesture)}</span>
                <span className="text-sm text-gray-700 flex-1">{gesture}</span>
                <span className="text-xs text-gray-500">
                  {index === 0 ? 'Current' : `${index}s ago`}
                </span>
              </div>
            ))}
            
            {gestureHistory.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">
                <Hand className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No gestures detected yet
              </div>
            )}
          </div>
        </div>
        
        {/* Supported Gestures */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Supported Gestures</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: '✊', name: 'Fist' },
              { icon: '✋', name: 'Open Hand' },
              { icon: '👉', name: 'Pointing' },
              { icon: '✌️', name: 'Peace Sign' },
              { icon: '👍', name: 'Thumbs Up' },
              { icon: '👌', name: 'OK Sign' },
              { icon: '🤘', name: 'Rock Sign' },
              { icon: '🤙', name: 'Call Me' },
              { icon: '☝️', name: '1 Finger' },
              { icon: '🖖', name: '4 Fingers' }
            ].map((gesture, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <span>{gesture.icon}</span>
                <span>{gesture.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestureDisplay;