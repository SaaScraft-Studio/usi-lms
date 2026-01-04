'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/apiRequest'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuizStore } from '@/stores/useQuizStore'
import { useAuthStore } from '@/stores/authStore'
import QuizRunner from '@/components/QuizRunner'
import QuizResult from '@/components/QuizResult'

type QuizQuestion = {
  _id: string
  questionName: string
  options: string[]
  correctAnswer: string
}

type QuizItem = {
  _id: string
  quizQuestions: QuizQuestion[]
  quizduration: string
}

export default function QuizTab({
  webinarId,
  webinarTitle,
}: {
  webinarId: string
  webinarTitle: string
}) {
  const user = useAuthStore((s) => s.user)
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Subscribe to store changes to force re-render when quiz is submitted
  const store = useQuizStore()
  const getAttempt = useQuizStore((s) => s.getAttempt)

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await apiRequest({
          endpoint: `/api/webinars/${webinarId}/quizzes`,
          method: 'GET',
        })
        setQuizzes(res.data || [])
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [webinarId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (!quizzes.length || !user?.id) {
    return <p className="text-muted-foreground">No quizzes available.</p>
  }

  const activeQuiz = quizzes[activeIndex]
  const attempt = getAttempt(user.id, activeQuiz._id)

  // This console.log will help debug - remove in production
  console.log('QuizTab render:', {
    quizId: activeQuiz._id,
    attempt,
    isSubmitted: attempt?.submitted
  })

  return (
    <div className="space-y-6">
      {/* QUIZ TABS */}
      {quizzes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {quizzes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                idx === activeIndex
                  ? 'bg-orange-600 hover:bg-orange-700 rounded-xl text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quiz {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* FLOW - KEY POINT: The key forces re-render when store changes */}
      <div key={store.attempts ? Object.keys(store.attempts).length : 0}>
        {!attempt ? (
          <QuizRunner
            mode="intro"
            webinarTitle={webinarTitle}
            quizIndex={activeIndex + 1}
            quiz={activeQuiz}
            webinarId={webinarId}
            onStart={() => {
              // Force re-render by updating state
              setLoading(prev => !prev)
            }}
          />
        ) : attempt.submitted ? (
          <QuizResult 
            quizId={activeQuiz._id} 
            key={`result-${activeQuiz._id}-${attempt.submittedAt || Date.now()}`}
          />
        ) : (
          <QuizRunner
            mode="run"
            webinarId={webinarId}
            quiz={activeQuiz}
            key={`quiz-${user.id}-${activeQuiz._id}-${attempt.currentQuestionIndex}`}
          />
        )}
      </div>
    </div>
  )
}