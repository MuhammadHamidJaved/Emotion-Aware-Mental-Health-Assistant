'use client'

import { useState } from 'react'
import { Activity, Brain, Mic, Video, TrendingUp, Zap, CheckCircle, Clock } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ML_MODELS, TEXT_MODEL_PERFORMANCE, VOICE_MODEL_PERFORMANCE, VIDEO_MODEL_PERFORMANCE, TRAINING_HISTORY } from '@/data/ml-data'

export default function MLModelsPage() {
  const [selectedModel, setSelectedModel] = useState(ML_MODELS[0])
  
  const getModelIcon = (type: string) => {
    switch(type) {
      case 'text': return <Brain className="w-5 h-5" />
      case 'voice': return <Mic className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'multimodal': return <Zap className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const getPerformanceData = (modelType: string) => {
    switch(modelType) {
      case 'text': return TEXT_MODEL_PERFORMANCE
      case 'voice': return VOICE_MODEL_PERFORMANCE
      case 'video': return VIDEO_MODEL_PERFORMANCE
      default: return TEXT_MODEL_PERFORMANCE
    }
  }

  const getTrainingData = (modelType: string) => {
    switch(modelType) {
      case 'text': return TRAINING_HISTORY.textModel
      case 'voice': return TRAINING_HISTORY.voiceModel
      default: return TRAINING_HISTORY.textModel
    }
  }

  const performance = getPerformanceData(selectedModel.type)
  const trainingData = getTrainingData(selectedModel.type)

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ML Models Dashboard</h1>
          <p className="text-neutral-600">Monitor and manage emotion detection models</p>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {ML_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedModel.id === model.id
                  ? 'border-black bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white border border-neutral-200 rounded-lg">
                  {getModelIcon(model.type)}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  model.status === 'active' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {model.status}
                </span>
              </div>
              <h3 className="font-semibold mb-1">{model.name}</h3>
              <p className="text-xs text-neutral-500 mb-2">{model.version}</p>
              <div className="text-2xl font-bold">{(model.accuracy * 100).toFixed(1)}%</div>
              <p className="text-xs text-neutral-600">Accuracy</p>
            </button>
          ))}
        </div>

        {/* Selected Model Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="text-sm text-neutral-600 mb-1">Accuracy</div>
                  <div className="text-2xl font-bold">{(performance.accuracy * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="text-sm text-neutral-600 mb-1">Precision</div>
                  <div className="text-2xl font-bold">{(performance.precision * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="text-sm text-neutral-600 mb-1">Recall</div>
                  <div className="text-2xl font-bold">{(performance.recall * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="text-sm text-neutral-600 mb-1">F1 Score</div>
                  <div className="text-2xl font-bold">{(performance.f1Score * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Training History Chart */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Training History</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trainingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="epoch" stroke="#737373" />
                  <YAxis stroke="#737373" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="trainAcc" 
                    stroke="#000000" 
                    strokeWidth={2}
                    name="Training Accuracy"
                    dot={{ fill: '#000000' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valAcc" 
                    stroke="#737373" 
                    strokeWidth={2}
                    name="Validation Accuracy"
                    dot={{ fill: '#737373' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Confusion Matrix */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Confusion Matrix</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-medium text-neutral-600">True / Pred</th>
                      {performance.classLabels.map((label) => (
                        <th key={label} className="p-2 text-center font-medium text-neutral-600 text-xs">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {performance.confusionMatrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-neutral-700 text-xs">
                          {performance.classLabels[i]}
                        </td>
                        {row.map((value, j) => (
                          <td 
                            key={j} 
                            className={`p-2 text-center text-xs ${
                              i === j 
                                ? 'bg-black text-white font-bold' 
                                : value > 10 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-neutral-50'
                            }`}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Model Info Sidebar */}
          <div className="space-y-6">
            {/* Model Details */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Model Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Model Name</div>
                  <div className="font-medium">{selectedModel.name}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Version</div>
                  <div className="font-medium">{selectedModel.version}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Type</div>
                  <div className="flex items-center gap-2">
                    {getModelIcon(selectedModel.type)}
                    <span className="font-medium capitalize">{selectedModel.type}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    {selectedModel.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="font-medium capitalize">{selectedModel.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Last Trained</div>
                  <div className="font-medium">
                    {new Date(selectedModel.lastTrained).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Total Predictions</div>
                  <div className="font-medium">{selectedModel.totalPredictions.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Actions</h2>
              <div className="space-y-3">
                <button className="w-full py-2 px-4 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium">
                  Retrain Model
                </button>
                <button className="w-full py-2 px-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium">
                  Export Model
                </button>
                <button className="w-full py-2 px-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium">
                  View Logs
                </button>
                <button className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                  Deactivate Model
                </button>
              </div>
            </div>

            {/* Class Distribution */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Class Distribution</h2>
              <div className="space-y-2">
                {performance.classLabels.map((label, i) => {
                  const total = performance.confusionMatrix[i].reduce((a, b) => a + b, 0)
                  const correct = performance.confusionMatrix[i][i]
                  const accuracy = (correct / total * 100).toFixed(1)
                  
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{label}</span>
                        <span className="font-medium">{accuracy}%</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black transition-all"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
