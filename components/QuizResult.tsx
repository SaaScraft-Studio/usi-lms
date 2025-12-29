'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/apiRequest'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import {
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  Clock,
  BarChart,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

type QuizResultItem = {
  questionId: string
  questionName: string
  options: string[]
  selectedOption: string
  correctAnswer: string
  isCorrect: boolean
}

type QuizData = {
  quizId: string
  totalQuestions: number
  correctAnswers: number
  scorePercentage: number
  result: QuizResultItem[]
}

export default function QuizResult({ quizId }: { quizId: string }) {
  const [resultData, setResultData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resultRes = await apiRequest({
          endpoint: `/api/quizzes/${quizId}/result`,
          method: 'GET',
        })
        setResultData(resultRes.data)
      } catch (error) {
        console.error('Failed to fetch quiz result:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [quizId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!resultData) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Result not available yet.</p>
        </CardContent>
      </Card>
    )
  }

  const { correctAnswers, totalQuestions, scorePercentage, result } = resultData

  // Data for pie chart
  const pieData = [
    { name: 'Correct', value: correctAnswers, color: '#10b981' },
    {
      name: 'Incorrect',
      value: totalQuestions - correctAnswers,
      color: '#ef4444',
    },
  ]

  const isPassed = scorePercentage >= 70

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER WITH SCORE */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl md:text-4xl font-bold">Quiz Results</h1>
        </div>
        <p className="text-muted-foreground">
          Review your performance and answers
        </p>
      </div>

      {/* MAIN SCORE CARD */}
      <Card className="border-2 border-primary/10 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: PIE CHART */}
            <div className="lg:col-span-1">
              <div className="h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} questions`, '']}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RIGHT: SCORE DETAILS */}
            <div className="lg:col-span-2 space-y-6">
              {/* MAIN SCORE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Your Score</h2>
                    <p className="text-muted-foreground">
                      Based on {totalQuestions} questions
                    </p>
                  </div>
                  <div
                    className={`text-4xl md:text-5xl font-bold ${
                      isPassed ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {scorePercentage}%
                  </div>
                </div>

                <Progress
                  value={scorePercentage}
                  className="h-3"
                />

                <div className="flex justify-center">
                  <Badge
                    className={`px-4 py-2 text-base ${
                      isPassed
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}
                  >
                    {isPassed ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Congratulations! You Passed
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Needs Improvement
                      </span>
                    )}
                  </Badge>
                </div>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-green-600">
                      {correctAnswers}
                    </div>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-red-600">
                      {totalQuestions - correctAnswers}
                    </div>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-blue-600">
                      {totalQuestions}
                    </div>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-4">
                    <div
                      className={`text-3xl font-bold ${
                        isPassed ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPassed ? 'PASS' : 'FAIL'}
                    </div>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DETAILED REVIEW */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Detailed Review</CardTitle>
          </div>
          <CardDescription>
            Question-by-question breakdown of your answers
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {result.map((item: QuizResultItem, index: number) => (
              <div
                key={item.questionId}
                className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                  item.isCorrect
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-red-200 bg-red-50/50'
                }`}
              >
                {/* QUESTION HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        item.isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-semibold text-lg">
                      {item.questionName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Correct
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Incorrect
                      </Badge>
                    )}
                  </div>
                </div>

                {/* OPTIONS GRID - RESPONSIVE */}
                <div className="mb-4">
                  <p className="font-medium mb-2 text-gray-700">Options:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.options.map((option, optIndex) => {
                      const isSelected = option === item.selectedOption
                      const isCorrect = option === item.correctAnswer

                      let bgClass = 'bg-white border-gray-200'
                      let textClass = 'text-gray-700'
                      let borderClass = 'border'

                      if (isSelected && isCorrect) {
                        bgClass = 'bg-green-50 border-green-300'
                        textClass = 'text-green-700'
                        borderClass = 'border-2'
                      } else if (isSelected && !isCorrect) {
                        bgClass = 'bg-red-50 border-red-300'
                        textClass = 'text-red-700'
                        borderClass = 'border-2'
                      } else if (isCorrect) {
                        bgClass = 'bg-blue-50 border-blue-300'
                        textClass = 'text-blue-700'
                        borderClass = 'border'
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg ${borderClass} ${bgClass} flex items-start gap-3`}
                        >
                          {/* OPTION INDICATOR */}
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              isSelected && isCorrect
                                ? 'bg-green-600 text-white'
                                : isSelected && !isCorrect
                                ? 'bg-red-600 text-white'
                                : isCorrect
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}
                          </div>

                          {/* OPTION TEXT */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm md:text-base break-words ${textClass}`}
                            >
                              {option}
                            </p>

                            {/* BADGES */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {isSelected && (
                                <Badge variant="outline" className="text-xs">
                                  Your Choice
                                </Badge>
                              )}
                              {isCorrect && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                                >
                                  Correct Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ANSWER SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      item.isCorrect
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-600 mb-1">
                      Your Answer
                    </p>
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-semibold ${
                          item.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {item.selectedOption || 'Not Answered'}
                      </p>
                      {!item.selectedOption && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          Skipped
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="font-medium text-sm text-gray-600 mb-1">
                      Correct Answer
                    </p>
                    <p className="font-semibold text-blue-700">
                      {item.correctAnswer}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />
              </div>
            ))}
          </div>

          {/* SUMMARY AT BOTTOM */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-600">Quiz Completed</p>
                <p className="text-lg font-semibold">
                  You answered {correctAnswers} out of {totalQuestions}{' '}
                  questions correctly
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  isPassed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {scorePercentage}% Score
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TIPS SECTION */}
      {!isPassed && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tips for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-amber-700">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>
                  Review the questions you got wrong and understand the correct
                  answers
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Take notes on topics where you struggled</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>
                  Practice similar questions to improve your knowledge
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>
                  You need {Math.ceil(totalQuestions * 0.7) - correctAnswers}{' '}
                  more correct answers to pass
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
