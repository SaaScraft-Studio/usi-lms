'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/apiRequest'
import { useAuthStore } from '@/stores/authStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Star,
  ThumbsUp,
  AlertCircle,
  Sparkles,
  BarChart3,
  Clock,
} from 'lucide-react'

/* ================= TYPES ================= */
type FeedbackQuestion = {
  _id: string
  feedbackName: string
  options: string[]
}

type SubmittedAnswer = {
  feedbackId: string
  selectedOption: string
}

/* ================= COMPONENT ================= */
export default function Feedback({ webinarId }: { webinarId: string }) {
  const user = useAuthStore((s) => s.user)

  const [questions, setQuestions] = useState<FeedbackQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [otherFeedback, setOtherFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  /* ================= FETCH FEEDBACK ================= */
  useEffect(() => {
    if (!webinarId || !user?.id) return

    const fetchFeedback = async () => {
      try {
        const res = await apiRequest<any>({
          endpoint: `/api/webinars/${webinarId}/feedback`,
          method: 'GET',
        })

        const data = res?.data

        const mappedQuestions: FeedbackQuestion[] =
          data?.feedbacks?.map((f: any) => ({
            _id: f._id,
            feedbackName: f.feedbackName,
            options: f.options || [],
          })) || []

        setQuestions(mappedQuestions)

        if (data?.sendFeedbacks?.length) {
          const prevAnswers: Record<string, string> = {}
          data.sendFeedbacks.forEach((f: SubmittedAnswer) => {
            prevAnswers[f.feedbackId] = f.selectedOption
          })
          setAnswers(prevAnswers)
          setOtherFeedback(data.sendOtherFeedback || '')
          setSubmitted(true)
        }
      } catch (err) {
        console.error(err)
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [webinarId, user?.id])

  /* ================= HANDLERS ================= */
  const onSelect = (feedbackId: string, option: string) => {
    if (submitted) return
    setAnswers((prev) => ({
      ...prev,
      [feedbackId]: option,
    }))
  }

  const allAnswered =
    questions.length > 0 && questions.every((q) => Boolean(answers[q._id]))

  const completionPercentage =
    questions.length > 0
      ? Math.round((Object.keys(answers).length / questions.length) * 100)
      : 0

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Please login to submit feedback')
      return
    }

    if (!allAnswered) {
      toast.error('Please answer all feedback questions')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        userId: user.id,
        sendFeedbacks: questions.map((q) => ({
          feedbackId: q._id,
          feedbackName: q.feedbackName,
          selectedOption: answers[q._id],
        })),
        sendOtherFeedback: otherFeedback.trim(),
      }

      await apiRequest({
        endpoint: `/api/webinars/${webinarId}/send-feedback`,
        method: 'POST',
        body: payload,
      })

      toast.success('Thank you for your valuable feedback!', {
        description: 'Your insights help us improve future webinars.',
      })
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  /* ================= EMPTY ================= */
  if (!questions.length) {
    return (
      <div className="text-center py-12 max-w-2xl mx-auto">
        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Feedback Questions</h3>
        <p className="text-muted-foreground">
          This webinar doesn't have any feedback questions yet.
        </p>
      </div>
    )
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Webinar Feedback</h1>
            <p className="text-muted-foreground">
              Share your experience to help us improve
            </p>
          </div>
        </div>
      </div>

      {/* PROGRESS & STATUS */}
      {!submitted && (
        <Card className="border-primary/10 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Completion Progress</span>
                </div>
                <span className="font-bold text-lg">
                  {completionPercentage}%
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Takes about 2 minutes to complete</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {submitted && (
        <Card className="border-green-200 bg-green-50/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-bold text-lg text-green-800">
                  Feedback Submitted!
                </h3>
                <p className="text-green-700">
                  Thank you for sharing your valuable feedback. Your insights
                  are greatly appreciated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QUESTIONS */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <Card
            key={q._id}
            className={`transition-all duration-200 hover:shadow-md ${
              submitted ? 'opacity-90' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div
                  className={`
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold
                  ${
                    submitted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-primary text-white'
                  }
                `}
                >
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">{q.feedbackName}</CardTitle>
                  <CardDescription>
                    Select the option that best matches your experience
                  </CardDescription>
                </div>
                {answers[q._id] && !submitted && (
                  <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
                    Answered
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q._id] === opt
                  const icon =
                    optIdx === 0 ? (
                      <Star className="h-4 w-4" />
                    ) : optIdx === 1 ? (
                      <ThumbsUp className="h-4 w-4" />
                    ) : optIdx === 2 ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => !submitted && onSelect(q._id, opt)}
                      disabled={submitted}
                      className={`
                        group flex items-center gap-4 p-4 rounded-lg border text-left transition-all
                        ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                        }
                        ${
                          submitted
                            ? 'cursor-default opacity-80'
                            : 'cursor-pointer'
                        }
                      `}
                    >
                      <div
                        className={`
                        flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                        ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary'
                        }
                      `}
                      >
                        {icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{opt}</div>
                        {isSelected && !submitted && (
                          <div className="text-xs text-primary mt-1">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                      <div
                        className={`
                        flex h-5 w-5 items-center justify-center rounded-full border
                        ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-gray-300 bg-white'
                        }
                      `}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ADDITIONAL COMMENTS */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Additional Comments</CardTitle>
              <CardDescription>
                Share any additional thoughts, suggestions, or feedback
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="relative">
            <textarea
              value={otherFeedback}
              onChange={(e) => setOtherFeedback(e.target.value)}
              disabled={submitted}
              rows={5}
              className={`
                w-full border rounded-xl p-4 text-sm resize-none focus:outline-none
                transition-all duration-200 peer placeholder:text-gray-400
                ${
                  submitted
                    ? 'bg-gray-50 border-gray-200'
                    : 'border-gray-300 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20'
                }
              `}
              placeholder="What did you like most? Any suggestions for improvement? Topics you'd like to see in the future..."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Your feedback helps us create better content
              </span>
              <span className="text-xs text-muted-foreground">
                {otherFeedback.length}/500 characters
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SUBMIT BUTTON */}
      {!submitted && (
        <div className="sticky bottom-6 z-10">
          <Card className="shadow-lg border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium">Ready to submit?</div>
                  <div className="text-sm text-muted-foreground">
                    {allAnswered
                      ? 'All questions answered ✓'
                      : `${
                          questions.length - Object.keys(answers).length
                        } questions remaining`}
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !allAnswered}
                  size="lg"
                  className="gap-2 min-w-[200px] shadow-md hover:shadow-lg transition-shadow"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* IMPORTANCE NOTE */}
      {!submitted && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                Why your feedback matters
              </h4>
              <p className="text-sm text-blue-700">
                Your responses help us understand what content resonates most
                with our audience, identify areas for improvement, and shape
                future webinar topics. Each submission contributes to creating
                better learning experiences for everyone.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
