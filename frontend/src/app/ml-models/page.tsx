'use client'

import { useState } from 'react'
import { Activity, Brain, Mic, Video, Zap, CheckCircle, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ML_MODELS, TEXT_MODEL_PERFORMANCE, VOICE_MODEL_PERFORMANCE, VIDEO_MODEL_PERFORMANCE, TRAINING_HISTORY } from '@/data/ml-data'

export default function MLModelsPage() {
  const [selectedModel, setSelectedModel] = useState(ML_MODELS[0])
  
  const getModelIcon = (type: string) => {
    switch(type) {
      case 'text': return <Brain className="w-4 h-4" />
      case 'voice': return <Mic className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'multimodal': return <Zap className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
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
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">ML Models</h1>
            <p className="text-[11px] text-gray-500">Monitor and manage emotion detection models</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {ML_MODELS.filter(m => m.status === 'active').length} active · {ML_MODELS.length} total
        </div>
      </div>

      {/* Model Selector Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {ML_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className={`p-3.5 rounded-xl border-2 transition-all text-left ${
              selectedModel.id === model.id
                ? 'border-black bg-gray-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${selectedModel.id === model.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'} transition-colors`}>
                {getModelIcon(model.type)}
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                model.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {model.status}
              </span>
            </div>
            <h3 className="font-semibold text-xs text-gray-900 mb-0.5 truncate">{model.name}</h3>
            <p className="text-[10px] text-gray-400 mb-1.5">{model.version}</p>
            <div className="text-xl font-bold text-gray-900">{(model.accuracy * 100).toFixed(1)}%</div>
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Charts and Metrics */}
        <div className="lg:col-span-2 space-y-4">
          {/* Performance Metrics Row */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Performance Metrics</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Accuracy', value: performance.accuracy },
                { label: 'Precision', value: performance.precision },
                { label: 'Recall', value: performance.recall },
                { label: 'F1 Score', value: performance.f1Score },
              ].map((metric) => (
                <div key={metric.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-[11px] text-gray-500 mb-1">{metric.label}</div>
                  <div className="text-lg font-bold text-gray-900">{(metric.value * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Training History Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Training History</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trainingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="epoch" stroke="#a3a3a3" tick={{ fontSize: 11 }} />
                <YAxis stroke="#a3a3a3" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line 
                  type="monotone" 
                  dataKey="trainAcc" 
                  stroke="#000000" 
                  strokeWidth={2}
                  name="Train Acc"
                  dot={{ fill: '#000000', r: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="valAcc" 
                  stroke="#a3a3a3" 
                  strokeWidth={2}
                  name="Val Acc"
                  dot={{ fill: '#a3a3a3', r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Confusion Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-1.5 text-left font-medium text-gray-500 text-[10px]">True / Pred</th>
                    {performance.classLabels.map((label) => (
                      <th key={label} className="p-1.5 text-center font-medium text-gray-500 text-[10px] capitalize">
                        {label.slice(0, 4)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {performance.confusionMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-1.5 font-medium text-gray-700 text-[10px] capitalize">
                        {performance.classLabels[i]}
                      </td>
                      {row.map((value, j) => (
                        <td 
                          key={j} 
                          className={`p-1.5 text-center text-[10px] rounded ${
                            i === j 
                              ? 'bg-black text-white font-bold' 
                              : value > 10 
                                ? 'bg-red-50 text-red-700 font-medium' 
                                : 'bg-gray-50 text-gray-600'
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

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Model Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Model Details</h2>
            <div className="space-y-3">
              {[
                { label: 'Name', value: selectedModel.name },
                { label: 'Version', value: selectedModel.version },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[11px] text-gray-500">{item.label}</div>
                  <div className="text-sm font-medium text-gray-900">{item.value}</div>
                </div>
              ))}
              <div>
                <div className="text-[11px] text-gray-500">Type</div>
                <div className="flex items-center gap-1.5">
                  {getModelIcon(selectedModel.type)}
                  <span className="text-sm font-medium capitalize text-gray-900">{selectedModel.type}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">Status</div>
                <div className="flex items-center gap-1.5">
                  {selectedModel.status === 'active' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span className="text-sm font-medium capitalize text-gray-900">{selectedModel.status}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">Last Trained</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(selectedModel.lastTrained).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">Total Predictions</div>
                <div className="text-sm font-medium text-gray-900">{selectedModel.totalPredictions.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Per-Class Accuracy */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Per-Class Accuracy</h2>
            <div className="space-y-2">
              {performance.classLabels.map((label, i) => {
                const total = performance.confusionMatrix[i].reduce((a, b) => a + b, 0)
                const correct = performance.confusionMatrix[i][i]
                const accuracy = (correct / total * 100).toFixed(1)
                
                return (
                  <div key={label}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="capitalize text-gray-700">{label}</span>
                      <span className="font-semibold text-gray-900">{accuracy}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Actions</h2>
            <div className="space-y-2">
              <button className="w-full py-2 px-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium">
                Retrain Model
              </button>
              <button className="w-full py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700">
                Export Model
              </button>
              <button className="w-full py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700">
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
