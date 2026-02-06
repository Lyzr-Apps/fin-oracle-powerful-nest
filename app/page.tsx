'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  Loader2,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Target,
  Send,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Newspaper,
  Calculator,
  Database,
  Clock,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// ============================================================================
// TYPESCRIPT INTERFACES FROM TEST RESPONSES
// ============================================================================

// Financial Audit Manager Response (Dashboard)
interface ExecutiveSummary {
  total_transactions: number
  total_spending: number
  analysis_period: string
  financial_alignment_score: number
}

interface SpendingBreakdown {
  fixed: number
  lifestyle: number
  future: number
}

interface GhostSubscription {
  merchant: string
  amount: number
  frequency: string
  last_charge_date: string
  total_charges: number
  annual_cost: number
}

interface GhostSubscriptionsSummary {
  count: number
  annual_cost: number
}

interface FinancialAuditResult {
  executive_summary: ExecutiveSummary
  spending_breakdown: SpendingBreakdown
  key_insights: string[]
  ghost_subscriptions_summary: GhostSubscriptionsSummary
  recommendations: string[]
  sub_agent_reports?: {
    data_extraction?: string
    categorization?: string
    pattern_detection?: string
  }
  ghost_subscriptions?: GhostSubscription[]
}

// News Sentinel Agent Response
interface NewsItem {
  headline: string
  source: string
  relevance: string
  date: string
}

interface NewsSentinelResult {
  query_analyzed: string
  search_performed: string
  news_found: boolean
  news_items: NewsItem[]
  context_summary: string
  confidence: 'high' | 'medium' | 'low'
}

// Actuary Agent Response
interface CalculationStep {
  step: string
  formula: string
  result: string
}

interface ActuaryResult {
  calculation_type: string
  input_data: {
    description: string
  }
  calculations: CalculationStep[]
  final_result: {
    value: string
    unit: string
    interpretation: string
  }
  projections?: {
    next_month?: string
    next_quarter?: string
    confidence_interval?: string
  }
}

// Master Orchestrator Agent Response
interface OrchestratorResult {
  query_analysis: {
    user_question: string
    query_type: string
    agents_consulted: string[]
  }
  insights: {
    market_context?: string
    calculations?: string
    data_analysis?: string
  }
  synthesis: {
    explanation: string
    recommendations: string[]
    confidence: 'high' | 'medium' | 'low'
  }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  orchestratorData?: OrchestratorResult
  newsData?: NewsSentinelResult
  actuaryData?: ActuaryResult
}

// ============================================================================
// AGENT IDS
// ============================================================================

const AGENT_IDS = {
  FINANCIAL_AUDIT_MANAGER: '69858cabe17e33c11eed1a1d',
  MASTER_ORCHESTRATOR: '6985916de5d25ce3f598cb4b',
  NEWS_SENTINEL: '6985913de17e33c11eed1a61',
  ACTUARY: '69859153e17e33c11eed1a66'
}

// ============================================================================
// QUICK QUERY CHIPS (ENHANCED)
// ============================================================================

const QUICK_QUERIES = [
  "Why did my electricity bill spike?",
  "Can I afford a ₹15,000 purchase?",
  "Show fuel price trends affecting my travel budget",
  "What's my 3-month spending projection?",
  "Any market news affecting my subscriptions?"
]

// ============================================================================
// INLINE COMPONENTS
// ============================================================================

// Agent Badge Component
const AgentBadge = ({ agents }: { agents: string[] }) => {
  const getAgentIcon = (agent: string) => {
    const agentLower = agent.toLowerCase()
    if (agentLower.includes('news') || agentLower.includes('sentinel')) {
      return <Newspaper className="h-3 w-3" />
    }
    if (agentLower.includes('actuary') || agentLower.includes('calculation')) {
      return <Calculator className="h-3 w-3" />
    }
    if (agentLower.includes('data')) {
      return <Database className="h-3 w-3" />
    }
    return <Info className="h-3 w-3" />
  }

  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {agents.map((agent, idx) => (
        <div
          key={idx}
          className="inline-flex items-center gap-1 bg-[#1a1f36] border border-[#00d4aa] rounded-full px-2 py-0.5 text-xs text-[#00d4aa]"
        >
          {getAgentIcon(agent)}
          <span>{agent}</span>
        </div>
      ))}
    </div>
  )
}

// News Insight Card Component
const NewsInsightCard = ({ newsItem }: { newsItem: NewsItem }) => {
  return (
    <div className="bg-[#1a1f36] border border-amber-500/30 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-amber-500 font-medium">{newsItem.source}</span>
          </div>
          <h4 className="text-sm font-medium text-white mb-1">{newsItem.headline}</h4>
          <p className="text-xs text-gray-400">{newsItem.relevance}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{new Date(newsItem.date).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

// Calculation Breakdown Component
const CalculationBreakdown = ({ calculations }: { calculations: CalculationStep[] }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-[#1a1f36] border border-green-500/30 rounded-lg p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-white">Calculation Details</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {calculations.map((calc, idx) => (
            <div key={idx} className="border-l-2 border-green-500 pl-3 py-1">
              <p className="text-xs font-medium text-green-400">{calc.step}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{calc.formula}</p>
              <p className="text-xs text-white mt-0.5">= {calc.result}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Market Context Timeline Component
const MarketContextTimeline = ({ news }: { news: NewsSentinelResult }) => {
  if (!news.news_found || news.news_items.length === 0) {
    return (
      <Card className="bg-[#2a2f46] border-gray-700">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Info className="h-5 w-5" />
            <span className="text-sm">No market news found for this period</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#2a2f46] border-amber-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-amber-500" />
          Market Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-sm text-amber-100">{news.context_summary}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-amber-400">Search: {news.search_performed}</span>
            <span className="text-xs text-amber-400">•</span>
            <span className="text-xs text-amber-400">Confidence: {news.confidence}</span>
          </div>
        </div>
        <div className="space-y-2">
          {news.news_items.map((item, idx) => (
            <NewsInsightCard key={idx} newsItem={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard')

  // Dashboard state
  const [file, setFile] = useState<File | null>(null)
  const [goals, setGoals] = useState<string>('')
  const [goalChips, setGoalChips] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [auditResult, setAuditResult] = useState<FinancialAuditResult | null>(null)
  const [uploadDate, setUploadDate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [marketNews, setMarketNews] = useState<NewsSentinelResult | null>(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file')
        return
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setFile(droppedFile)
      setError(null)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleAddGoal = () => {
    if (goals.trim() && !goalChips.includes(goals.trim())) {
      setGoalChips([...goalChips, goals.trim()])
      setGoals('')
    }
  }

  const handleRemoveGoal = (goal: string) => {
    setGoalChips(goalChips.filter(g => g !== goal))
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a CSV file first')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // First, upload the file
      const uploadResult = await uploadFiles(file)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'File upload failed')
      }

      // Read CSV content
      const csvContent = await file.text()

      // Build the message with CSV data and goals
      let message = `Analyze this CSV data:\n${csvContent}`
      if (goalChips.length > 0) {
        message += `\n\nUser's financial goals: ${goalChips.join(', ')}`
      }

      // Call Financial Audit Manager
      const result = await callAIAgent(
        message,
        AGENT_IDS.FINANCIAL_AUDIT_MANAGER,
        { assets: uploadResult.asset_ids }
      )

      if (result.success && result.response.status === 'success') {
        setAuditResult(result.response.result as FinancialAuditResult)
        setUploadDate(new Date())

        // Fetch market context news for spending categories
        fetchMarketContext()
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const fetchMarketContext = async () => {
    try {
      const newsQuery = "Check for recent market news affecting household expenses, subscriptions, and utility bills in India"
      const newsResult = await callAIAgent(newsQuery, AGENT_IDS.NEWS_SENTINEL)

      if (newsResult.success && newsResult.response.status === 'success') {
        setMarketNews(newsResult.response.result as NewsSentinelResult)
      }
    } catch (err) {
      console.error('Failed to fetch market context:', err)
    }
  }

  const handleClearData = () => {
    setFile(null)
    setGoalChips([])
    setAuditResult(null)
    setUploadDate(null)
    setError(null)
    setMarketNews(null)
    setChatMessages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExportReport = () => {
    if (!auditResult) return

    const report = JSON.stringify(auditResult, null, 2)
    const blob = new Blob([report], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || chatInput.trim()
    if (!messageToSend) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      // Build context from uploaded data if available
      let contextMessage = messageToSend
      if (file) {
        const csvContent = await file.text()
        contextMessage = `Based on my transaction history:\n${csvContent}\n\nQuery: ${messageToSend}`
      }

      // Call Master Orchestrator Agent
      const result = await callAIAgent(contextMessage, AGENT_IDS.MASTER_ORCHESTRATOR)

      if (result.success && result.response.status === 'success') {
        const orchestratorResult = result.response.result as OrchestratorResult

        // Build comprehensive response
        let responseContent = orchestratorResult.synthesis.explanation

        // Add recommendations if available
        if (orchestratorResult.synthesis.recommendations.length > 0) {
          responseContent += '\n\nRecommendations:\n'
          orchestratorResult.synthesis.recommendations.forEach((rec, idx) => {
            responseContent += `${idx + 1}. ${rec}\n`
          })
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          orchestratorData: orchestratorResult
        }

        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(result.error || 'Query failed')
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleQuickQuery = (query: string) => {
    handleSendMessage(query)
  }

  return (
    <div className="min-h-screen bg-[#1a1f36] text-white">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#00d4aa] mb-2">SpendSense AI</h1>
          <p className="text-gray-400">AI-Powered Financial Intelligence with Real-Time Market Context</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dashboard' | 'chat')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-[#2a2f46]">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#00d4aa] data-[state=active]:text-[#1a1f36]">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-[#00d4aa] data-[state=active]:text-[#1a1f36]">
              Chat Assistant
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* File Upload & Goals Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card className="bg-[#2a2f46] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-[#00d4aa]" />
                    Upload Transaction Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#00d4aa] transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    {file ? (
                      <div>
                        <p className="text-[#00d4aa] font-medium">{file.name}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-300 mb-2">Drop CSV file here or click to browse</p>
                        <p className="text-gray-500 text-sm">Max 10MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Goals Input */}
              <Card className="bg-[#2a2f46] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#00d4aa]" />
                    Financial Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                        placeholder="e.g., Save ₹50,000 for vacation"
                        className="bg-[#1a1f36] border-gray-600 text-white placeholder:text-gray-500"
                      />
                      <Button
                        onClick={handleAddGoal}
                        className="bg-[#00d4aa] hover:bg-[#00bfa0] text-[#1a1f36]"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[100px]">
                      {goalChips.map((goal, idx) => (
                        <div
                          key={idx}
                          className="bg-[#1a1f36] border border-[#00d4aa] rounded-full px-3 py-1 text-sm flex items-center gap-2"
                        >
                          <span>{goal}</span>
                          <button
                            onClick={() => handleRemoveGoal(goal)}
                            className="hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
                className="bg-[#00d4aa] hover:bg-[#00bfa0] text-[#1a1f36] font-semibold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analyze Finances
                  </>
                )}
              </Button>
              <Button
                onClick={handleClearData}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-[#2a2f46]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Data
              </Button>
              {auditResult && (
                <Button
                  onClick={handleExportReport}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-[#2a2f46]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <Card className="bg-red-900/20 border-red-700">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {auditResult ? (
              <div className="space-y-6">
                {/* Market Context Section */}
                {marketNews && (
                  <MarketContextTimeline news={marketNews} />
                )}

                {/* Executive Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="bg-[#2a2f46] border-gray-700">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">Total Transactions</p>
                        <p className="text-3xl font-bold text-white">
                          {auditResult.executive_summary.total_transactions}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#2a2f46] border-gray-700">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">Total Spending</p>
                        <p className="text-3xl font-bold text-white">
                          ₹{auditResult.executive_summary.total_spending.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#2a2f46] border-gray-700">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">Analysis Period</p>
                        <p className="text-lg font-medium text-white">
                          {auditResult.executive_summary.analysis_period}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#2a2f46] border-gray-700">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">Alignment Score</p>
                        <div className="relative inline-flex items-center justify-center">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="#3a3f56"
                              strokeWidth="8"
                              fill="none"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              stroke="#00d4aa"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - auditResult.executive_summary.financial_alignment_score / 100)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-2xl font-bold text-[#00d4aa]">
                            {auditResult.executive_summary.financial_alignment_score}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Spending Breakdown */}
                <Card className="bg-[#2a2f46] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Spending Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-center mb-6">
                        <svg width="200" height="200" viewBox="0 0 200 200">
                          {(() => {
                            const total = auditResult.spending_breakdown.fixed +
                                         auditResult.spending_breakdown.lifestyle +
                                         auditResult.spending_breakdown.future
                            const fixedPercent = (auditResult.spending_breakdown.fixed / total) * 100
                            const lifestylePercent = (auditResult.spending_breakdown.lifestyle / total) * 100
                            const futurePercent = (auditResult.spending_breakdown.future / total) * 100

                            const fixedAngle = (fixedPercent / 100) * 360
                            const lifestyleAngle = (lifestylePercent / 100) * 360

                            const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
                              const rad = (angle - 90) * Math.PI / 180
                              return {
                                x: cx + r * Math.cos(rad),
                                y: cy + r * Math.sin(rad)
                              }
                            }

                            const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
                              const start = polarToCartesian(cx, cy, r, endAngle)
                              const end = polarToCartesian(cx, cy, r, startAngle)
                              const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
                              return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`
                            }

                            return (
                              <>
                                <path d={describeArc(100, 100, 80, 0, fixedAngle)} fill="#00d4aa" />
                                <path d={describeArc(100, 100, 80, fixedAngle, fixedAngle + lifestyleAngle)} fill="#7c3aed" />
                                <path d={describeArc(100, 100, 80, fixedAngle + lifestyleAngle, 360)} fill="#f59e0b" />
                                <circle cx="100" cy="100" r="50" fill="#1a1f36" />
                              </>
                            )
                          })()}
                        </svg>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-[#00d4aa]"></div>
                            <span className="text-gray-400 text-sm">Fixed</span>
                          </div>
                          <p className="text-xl font-bold text-white">
                            ₹{auditResult.spending_breakdown.fixed.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-[#7c3aed]"></div>
                            <span className="text-gray-400 text-sm">Lifestyle</span>
                          </div>
                          <p className="text-xl font-bold text-white">
                            ₹{auditResult.spending_breakdown.lifestyle.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                            <span className="text-gray-400 text-sm">Future</span>
                          </div>
                          <p className="text-xl font-bold text-white">
                            ₹{auditResult.spending_breakdown.future.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Insights */}
                <Card className="bg-[#2a2f46] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#00d4aa]" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {auditResult.key_insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300">
                          <CheckCircle className="h-5 w-5 text-[#00d4aa] mt-0.5 flex-shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Ghost Subscriptions */}
                <Card className="bg-[#2a2f46] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-[#00d4aa]" />
                      Ghost Subscriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                        <div>
                          <p className="text-gray-400 text-sm">Total Subscriptions</p>
                          <p className="text-2xl font-bold text-white">
                            {auditResult.ghost_subscriptions_summary.count}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">Annual Cost</p>
                          <p className="text-2xl font-bold text-red-400">
                            ₹{auditResult.ghost_subscriptions_summary.annual_cost.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {auditResult.ghost_subscriptions && auditResult.ghost_subscriptions.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                                <th className="pb-2">Merchant</th>
                                <th className="pb-2">Amount</th>
                                <th className="pb-2">Frequency</th>
                                <th className="pb-2">Annual Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auditResult.ghost_subscriptions.map((sub, idx) => (
                                <tr key={idx} className="border-b border-gray-700 text-gray-300">
                                  <td className="py-3">{sub.merchant}</td>
                                  <td className="py-3">₹{sub.amount}</td>
                                  <td className="py-3 capitalize">{sub.frequency}</td>
                                  <td className="py-3 text-red-400">₹{sub.annual_cost.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-[#2a2f46] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#00d4aa]" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {auditResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-300 bg-[#1a1f36] p-3 rounded-lg">
                          <span className="text-[#00d4aa] font-bold">{idx + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-[#2a2f46] border-gray-700">
                <CardContent className="py-16">
                  <div className="text-center text-gray-400">
                    <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">No Analysis Available</p>
                    <p className="text-sm">Upload a CSV file and click "Analyze Finances" to get started</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            {/* Context Indicator */}
            {uploadDate && (
              <Card className="bg-[#2a2f46] border-gray-700">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle className="h-4 w-4 text-[#00d4aa]" />
                    <span>Analyzing data from {uploadDate.toLocaleDateString()}</span>
                    <span className="text-gray-600">•</span>
                    <span>Powered by Master Orchestrator with News + Math agents</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Query Chips */}
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">Quick Queries:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUERIES.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuery(query)}
                    disabled={isChatLoading}
                    className="bg-[#2a2f46] hover:bg-[#3a3f56] border border-gray-700 hover:border-[#00d4aa] rounded-full px-4 py-2 text-sm text-gray-300 transition-colors disabled:opacity-50"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat History */}
            <Card className="bg-[#2a2f46] border-gray-700">
              <CardContent className="p-0">
                <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-16">
                      <Send className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl mb-2">Start a Conversation</p>
                      <p className="text-sm">Ask me anything about your finances!</p>
                      <p className="text-xs mt-2 text-gray-500">Powered by Master Orchestrator, News Sentinel, and Actuary agents</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            msg.role === 'user'
                              ? 'bg-[#00d4aa] text-[#1a1f36]'
                              : 'bg-[#1a1f36] text-gray-300 border border-gray-700'
                          }`}
                        >
                          {msg.role === 'assistant' && msg.orchestratorData && (
                            <AgentBadge agents={msg.orchestratorData.query_analysis.agents_consulted} />
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-[#1a1f36]/70' : 'text-gray-500'}`}>
                            {msg.timestamp.toLocaleTimeString()}
                            {msg.role === 'assistant' && msg.orchestratorData && (
                              <span className="ml-2">• Confidence: {msg.orchestratorData.synthesis.confidence}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#1a1f36] text-gray-300 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-[#00d4aa]" />
                          <span className="text-sm text-gray-400">Consulting agents...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </CardContent>
            </Card>

            {/* Chat Input */}
            <Card className="bg-[#2a2f46] border-gray-700">
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask about your spending, market news, or financial calculations..."
                    disabled={isChatLoading}
                    className="bg-[#1a1f36] border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="bg-[#00d4aa] hover:bg-[#00bfa0] text-[#1a1f36]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
