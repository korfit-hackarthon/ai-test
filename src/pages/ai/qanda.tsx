import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Send, Sparkles, ThumbsUp, AlertCircle, Loader2 } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  modelAnswer: string;
  reasoning: string;
}

interface Evaluation {
  score: number;
  hints: string;
  strengths?: string;
  improvements?: string;
  historyId: number;
}

interface HistoryItem {
  id: number;
  questionId: number;
  userAnswer: string;
  aiModel: string;
  aiResponse: string;
  score: number;
  hints: string;
  createdAt: string;
}

const AI_MODELS = [
  {
    value: 'google/gemini-2.5-flash-preview-09-2025',
    label: 'Gemini 2.5 flash',
  },
  {
    value: 'google/gemini-2.5-flash-lite-preview-09-2025',
    label: 'Gemini 2.5 flash lite',
  },
  {
    value: 'anthropic/claude-haiku-4.5',
    label: 'Claude Haiku 4.5',
  },
  {
    value: 'openai/gpt-5-chat',
    label: 'GPT-5 Chat',
  },
  {
    value: 'openai/gpt-5-mini',
    label: 'GPT-5 Mini',
  },
  {
    value: 'openai/gpt-5-nano',
    label: 'GPT-5 Nano',
  },
  {
    value: 'x-ai/grok-4-fast',
    label: 'Grok 4 Fast',
  },
  {
    value: 'qwen/qwen3-vl-235b-a22b-thinking',
    label: 'Qwen 3 VL 235B A22B Thinking',
  },
  {
    value: 'qwen/qwen3-next-80b-a3b-thinking',
    label: 'Qwen 3 Next 80B A3B Thinking',
  },
];

export default function QAndA() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    AI_MODELS[0]?.value || ''
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const selectedQuestion =
    questions.find((q) => q.id === selectedQuestionId) || null;

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (selectedQuestionId) {
      setEvaluation(null);
      setUserAnswer('');
      setShowModelAnswer(false);
    }
  }, [selectedQuestionId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || '질문 목록을 불러오는데 실패했습니다.'
        );
      }
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '질문 목록을 불러오는데 실패했습니다.',
        {
          duration: 5000,
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionId || !userAnswer.trim()) return;

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const response = await fetch('/api/questions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestionId,
          userAnswer,
          aiModel: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '평가에 실패했습니다.');
      }

      const data = await response.json();
      setEvaluation(data);
      toast.success('답변이 평가되었습니다!');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '평가에 실패했습니다. 다시 시도해주세요.',
        {
          duration: 5000,
        }
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className='container max-w-7xl mx-auto py-8 px-4 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>AI 가상 면접</h1>
        <p className='text-muted-foreground'>
          면접 질문에 답변하고 AI로부터 즉각적인 피드백을 받아보세요.
        </p>
      </div>

      <div className='max-w-5xl mx-auto space-y-6'>
        {/* 질문 선택 */}
        <Card>
          <CardHeader>
            <CardTitle>면접 질문 선택</CardTitle>
            <CardDescription>
              연습할 면접 질문과 사용할 AI 모델을 선택하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='question-select'>질문</Label>
                <Select
                  value={selectedQuestionId?.toString()}
                  onValueChange={(value) =>
                    setSelectedQuestionId(parseInt(value))
                  }
                >
                  <SelectTrigger id='question-select' className='w-full'>
                    <SelectValue placeholder='질문을 선택하세요' />
                  </SelectTrigger>
                  <SelectContent className='max-w-[calc(100vw-2rem)] sm:max-w-md'>
                    {questions.map((q) => (
                      <SelectItem
                        key={q.id}
                        value={q.id.toString()}
                        className='max-w-full'
                      >
                        <span className='block truncate'>{q.question}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='model-select'>AI 모델</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id='model-select'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedQuestion && (
              <Card className='bg-muted/50'>
                <CardContent className='pt-6'>
                  <p className='text-sm font-medium mb-2 text-muted-foreground'>
                    선택된 질문
                  </p>
                  <p className='text-base font-medium'>
                    {selectedQuestion.question}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* 답변 입력 */}
        {selectedQuestion && (
          <Card>
            <CardHeader>
              <CardTitle>답변 작성</CardTitle>
              <CardDescription>
                질문에 대한 당신의 답변을 작성하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <Textarea
                  placeholder='여기에 답변을 입력하세요...'
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  rows={8}
                  className='resize-none'
                  disabled={isEvaluating}
                />
                <div className='flex gap-2'>
                  <Button
                    type='submit'
                    disabled={isEvaluating || !userAnswer.trim()}
                    className='flex-1'
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        평가 중...
                      </>
                    ) : (
                      <>
                        <Send className='mr-2 h-4 w-4' />
                        답변 제출
                      </>
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                  >
                    {showModelAnswer ? '모범답안 숨기기' : '모범답안 보기'}
                  </Button>
                </div>
              </form>

              {showModelAnswer && (
                <Card className='mt-4 border-primary'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Sparkles className='h-4 w-4' />
                      모범답안
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div>
                      <p className='text-sm font-medium mb-1'>답변</p>
                      <p className='text-sm'>{selectedQuestion.modelAnswer}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className='text-sm font-medium mb-1'>논리와 이유</p>
                      <p className='text-sm text-muted-foreground'>
                        {selectedQuestion.reasoning}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* 평가 결과 */}
        {evaluation && (
          <Card className='border-primary shadow-lg'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkles className='h-5 w-5 text-primary' />
                  AI 평가 결과
                </CardTitle>
                <Badge
                  variant='outline'
                  className={`text-lg font-bold ${getScoreColor(evaluation.score)}`}
                >
                  {evaluation.score}점
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium'>모범답안 유사도</span>
                  <span className='text-sm text-muted-foreground'>
                    {evaluation.score}/100
                  </span>
                </div>
                <div className='relative w-full h-2 rounded-full bg-secondary overflow-hidden'>
                  <div
                    className={`h-full transition-all ${getScoreBgColor(evaluation.score)}`}
                    style={{ width: `${evaluation.score}%` }}
                  />
                </div>
              </div>

              <Separator />

              {evaluation.strengths && (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400'>
                    <ThumbsUp className='h-4 w-4' />
                    잘한 점
                  </div>
                  <p className='text-sm pl-6'>{evaluation.strengths}</p>
                </div>
              )}

              {evaluation.improvements && (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400'>
                    <AlertCircle className='h-4 w-4' />
                    개선이 필요한 점
                  </div>
                  <p className='text-sm pl-6'>{evaluation.improvements}</p>
                </div>
              )}

              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  <Sparkles className='h-4 w-4' />
                  힌트 및 피드백
                </div>
                <Card className='bg-muted/50'>
                  <CardContent className='pt-4'>
                    <p className='text-sm whitespace-pre-wrap'>
                      {evaluation.hints}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
