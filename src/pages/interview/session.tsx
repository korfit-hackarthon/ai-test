import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  order: number;
  category: string;
}

interface Message {
  type: 'question' | 'answer' | 'followup' | 'followup-answer' | 'system';
  content: string;
  questionOrder?: number;
  isStreaming?: boolean;
}

export default function InterviewSession() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableFollowUp, setEnableFollowUp] = useState(true);
  const [waitingForFollowUp, setWaitingForFollowUp] = useState(false);
  const [currentAnswerId, setCurrentAnswerId] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInterviewSet();
  }, [setId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchInterviewSet = async () => {
    try {
      // location.state에서 질문 목록 가져오기 (start 페이지에서 전달)
      const stateQuestions = (location.state as any)?.questions;

      if (stateQuestions && stateQuestions.length > 0) {
        // 새로 생성된 면접
        setQuestions(stateQuestions);
        setMessages([
          {
            type: 'system',
            content: `면접을 시작합니다. 총 ${stateQuestions.length}개의 질문이 준비되어 있습니다.`,
          },
          {
            type: 'question',
            content: stateQuestions[0].question,
            questionOrder: 1,
          },
        ]);
        return;
      }

      // state가 없으면 기존 면접 (history에서 이어하기)
      const setResponse = await fetch(`/api/interview/sets/${setId}`);
      if (!setResponse.ok) {
        toast.error('면접 세트를 찾을 수 없습니다.', { duration: 5000 });
        return;
      }

      const setData = await setResponse.json();

      // 기본 질문 사용 (임시)
      const defaultQuestions: Question[] = [
        {
          id: 1,
          question: '자기소개를 해주세요.',
          order: 1,
          category: 'common',
        },
        {
          id: 2,
          question: '우리 회사에 지원한 동기는 무엇인가요?',
          order: 2,
          category: 'common',
        },
        {
          id: 3,
          question: '본인의 강점과 약점을 말씀해주세요.',
          order: 3,
          category: 'common',
        },
        {
          id: 4,
          question: '한국에서 일하고 싶은 이유는 무엇인가요?',
          order: 4,
          category: 'foreigner',
        },
        {
          id: 5,
          question: '5년 후 자신의 모습은 어떨 것 같나요?',
          order: 5,
          category: 'common',
        },
      ];

      setQuestions(defaultQuestions);

      // 첫 질문 표시
      if (defaultQuestions.length > 0) {
        setMessages([
          {
            type: 'system',
            content: `면접을 시작합니다. 총 ${defaultQuestions.length}개의 질문이 준비되어 있습니다.`,
          },
          {
            type: 'question',
            content: defaultQuestions[0]?.question || '',
            questionOrder: 1,
          },
        ]);
      }
    } catch (error) {
      toast.error('면접 세트를 불러오는데 실패했습니다.', { duration: 5000 });
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // 사용자 답변 표시
    setMessages((prev) => [
      ...prev,
      {
        type: waitingForFollowUp ? 'followup-answer' : 'answer',
        content: userAnswer,
      },
    ]);

    setIsSubmitting(true);
    setUserAnswer('');

    try {
      if (waitingForFollowUp && currentAnswerId) {
        // 꼬리질문 답변 제출
        const response = await fetch('/api/interview/follow-up-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answerId: currentAnswerId,
            followUpAnswer: userAnswer,
          }),
        });

        if (!response.ok) throw new Error('Failed to submit follow-up answer');

        setWaitingForFollowUp(false);
        setCurrentAnswerId(null);

        // 다음 질문으로
        moveToNextQuestion();
      } else {
        // 일반 답변 제출
        const response = await fetch('/api/interview/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setId: parseInt(setId!),
            questionId: currentQuestion.id,
            questionOrder: currentQuestion.order,
            userAnswer,
            enableFollowUp,
          }),
        });

        if (!response.ok) throw new Error('Failed to submit answer');

        const data = await response.json();
        setCurrentAnswerId(data.answerId);

        // 꼬리질문이 있으면 표시
        if (data.followUpQuestion) {
          // AI 입력 중 표시
          setMessages((prev) => [
            ...prev,
            {
              type: 'system',
              content: 'AI 면접관이 입력 중입니다...',
              isStreaming: true,
            },
          ]);

          // 3초 후 꼬리질문 표시
          setTimeout(() => {
            setMessages((prev) => {
              const filtered = prev.filter((m) => !m.isStreaming);
              return [
                ...filtered,
                {
                  type: 'followup',
                  content: data.followUpQuestion,
                  questionOrder: currentQuestion.order,
                },
              ];
            });
            setWaitingForFollowUp(true);
          }, 3000);
        } else {
          // 다음 질문으로
          moveToNextQuestion();
        }
      }
    } catch (error) {
      toast.error('답변 제출에 실패했습니다.', { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      // 다음 질문 표시
      setCurrentQuestionIndex(nextIndex);
      setMessages((prev) => [
        ...prev,
        {
          type: 'question',
          content: questions[nextIndex]?.question || '',
          questionOrder: nextIndex + 1,
        },
      ]);
    } else {
      // 면접 완료
      setMessages((prev) => [
        ...prev,
        {
          type: 'system',
          content: '모든 질문이 완료되었습니다. 평가를 시작합니다...',
        },
      ]);
      completeInterview();
    }
  };

  const completeInterview = async () => {
    setIsCompleting(true);

    try {
      const response = await fetch(`/api/interview/sets/${setId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to complete interview');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let streamingMessage: Message = {
        type: 'system',
        content: '',
        isStreaming: true,
      };

      setMessages((prev) => [...prev, streamingMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk') {
              streamingMessage.content += data.content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...streamingMessage };
                return newMessages;
              });
            } else if (data.type === 'complete') {
              // 평가 완료
              toast.success('면접 평가가 완료되었습니다!');
              setTimeout(() => {
                navigate(`/interview/result/${setId}`);
              }, 1000);
            } else if (data.type === 'error') {
              toast.error(data.message, { duration: 5000 });
            }
          }
        }
      }
    } catch (error) {
      toast.error('면접 완료 처리에 실패했습니다.', { duration: 5000 });
    } finally {
      setIsCompleting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      common: 'bg-blue-500',
      job: 'bg-green-500',
      foreigner: 'bg-purple-500',
    };
    const labels = {
      common: '공통',
      job: '직무',
      foreigner: '외국인',
    };
    return (
      <Badge
        className={`${colors[category as keyof typeof colors]} text-white`}
      >
        {labels[category as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className='container max-w-5xl mx-auto py-6 px-4 h-[calc(100vh-4rem)]'>
      <div className='flex flex-col h-full gap-4'>
        {/* 헤더 */}
        <Card>
          <CardContent className='py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='text-sm'>
                  <span className='font-semibold'>진행률:</span>{' '}
                  <span className='text-primary font-bold'>
                    {currentQuestionIndex + 1} / {questions.length}
                  </span>
                </div>
                <Separator orientation='vertical' className='h-6' />
                <div className='flex items-center gap-2'>
                  <Switch
                    id='followup'
                    checked={enableFollowUp}
                    onCheckedChange={setEnableFollowUp}
                    disabled={waitingForFollowUp}
                  />
                  <Label htmlFor='followup' className='text-sm cursor-pointer'>
                    압박 꼬리질문 {enableFollowUp ? 'ON' : 'OFF'}
                  </Label>
                </div>
              </div>
              {questions[currentQuestionIndex] && (
                <div>
                  {getCategoryBadge(questions[currentQuestionIndex].category)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 메시지 영역 */}
        <Card className='flex-1 overflow-hidden'>
          <CardContent className='h-full p-6 overflow-y-auto'>
            <div className='space-y-4'>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.type === 'answer' ||
                    message.type === 'followup-answer'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  {(message.type === 'question' ||
                    message.type === 'followup' ||
                    message.type === 'system') && (
                    <div className='shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center'>
                      <Bot className='w-5 h-5 text-primary-foreground' />
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.type === 'answer' ||
                      message.type === 'followup-answer'
                        ? 'bg-primary text-primary-foreground'
                        : message.type === 'system'
                          ? 'bg-muted text-muted-foreground italic'
                          : message.type === 'followup'
                            ? 'bg-amber-50 dark:bg-amber-950 border-2 border-amber-500'
                            : 'bg-muted'
                    }`}
                  >
                    {message.questionOrder && message.type === 'question' && (
                      <div className='text-xs font-semibold mb-2 opacity-70'>
                        질문 {message.questionOrder}
                      </div>
                    )}
                    {message.type === 'followup' && (
                      <div className='flex items-center gap-2 text-xs font-semibold mb-2 text-amber-700 dark:text-amber-400'>
                        <AlertCircle className='w-4 h-4' />
                        꼬리질문
                      </div>
                    )}
                    <p className='whitespace-pre-wrap'>{message.content}</p>
                    {message.isStreaming && (
                      <Loader2 className='w-4 h-4 animate-spin mt-2' />
                    )}
                  </div>

                  {(message.type === 'answer' ||
                    message.type === 'followup-answer') && (
                    <div className='shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center'>
                      <User className='w-5 h-5' />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* 입력 영역 */}
        <Card>
          <CardContent className='py-4'>
            <div className='flex gap-2'>
              <Textarea
                placeholder={
                  waitingForFollowUp
                    ? '꼬리질문에 답변해주세요...'
                    : '답변을 입력하세요...'
                }
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
                rows={3}
                className='resize-none'
                disabled={isSubmitting || isCompleting}
              />
              <Button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || isCompleting || !userAnswer.trim()}
                size='lg'
                className='px-6'
              >
                {isSubmitting ? (
                  <Loader2 className='w-5 h-5 animate-spin' />
                ) : (
                  <Send className='w-5 h-5' />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
