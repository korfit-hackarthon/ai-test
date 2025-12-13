import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Mic,
  Square,
  Upload,
  Trash2,
  ChevronLeft,
  Volume2,
} from 'lucide-react';
import { audioBlobToWavBase64, formatSeconds } from '@/lib/audio';
import { cn } from '@/lib/utils';

const AI_MODELS = [
  {
    value: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
  },
  {
    value: 'google/gemini-2.5-flash-lite-preview-09-2025',
    label: 'Gemini 2.5 Flash Lite',
  },
  {
    value: 'anthropic/claude-haiku-4.5',
    label: 'Claude Haiku 4.5',
  },
  {
    value: 'mistralai/voxtral-small-24b-2507',
    label: 'Mistral: Voxtral Small 24B 2507',
  },
];

interface Question {
  id: number;
  question: string;
  order: number;
  category: string;
}

interface Message {
  id: string;
  type: 'question' | 'answer' | 'followup' | 'followup-answer' | 'system';
  content: string;
  questionOrder?: number;
  isStreaming?: boolean;
  source?: 'text' | 'audio';
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
  const [selectedModel, setSelectedModel] = useState<string>(
    AI_MODELS[0]?.value || ''
  );
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canSubmit = useMemo(() => {
    if (isSubmitting || isCompleting || isTranscribing) return false;
    if (inputMode === 'text') return !!userAnswer.trim();
    return !!audioBlob;
  }, [
    audioBlob,
    inputMode,
    isCompleting,
    isSubmitting,
    isTranscribing,
    userAnswer,
  ]);

  useEffect(() => {
    fetchInterviewSet();
  }, [setId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createId = () => {
    return (
      (globalThis.crypto as any)?.randomUUID?.() ||
      `m_${Date.now()}_${Math.random().toString(16).slice(2)}`
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordSeconds(0);
  };

  const startRecording = async () => {
    if (isRecording) return;
    resetAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      recordChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (e) {
      toast.error('마이크 권한을 확인해주세요.', { duration: 4000 });
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const handlePickAudioFile = (file: File) => {
    resetAudio();
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const fetchInterviewSet = async () => {
    try {
      const stateQuestions = (location.state as any)?.questions;

      if (stateQuestions && stateQuestions.length > 0) {
        setQuestions(stateQuestions);
        setMessages([
          {
            id: createId(),
            type: 'system',
            content: `면접을 시작합니다. 총 ${stateQuestions.length}개의 질문이 준비되어 있습니다.`,
          },
          {
            id: createId(),
            type: 'question',
            content: stateQuestions[0].question,
            questionOrder: 1,
          },
        ]);
        return;
      }

      const setResponse = await fetch(`/api/interview/sets/${setId}`);
      if (!setResponse.ok) {
        toast.error('면접 세트를 찾을 수 없습니다.', { duration: 5000 });
        return;
      }

      const setData = await setResponse.json();
      // Use setData.questions in real implementation if available, using dummy logic for now as per previous code
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
      ];

      setQuestions(defaultQuestions);

      if (defaultQuestions.length > 0) {
        setMessages([
          {
            id: createId(),
            type: 'system',
            content: `면접을 시작합니다. 총 ${defaultQuestions.length}개의 질문이 준비되어 있습니다.`,
          },
          {
            id: createId(),
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

  const appendUserMessage = (params: {
    type: 'answer' | 'followup-answer';
    content: string;
    source?: 'text' | 'audio';
    isStreaming?: boolean;
  }) => {
    const id = createId();
    setMessages((prev) => [
      ...prev,
      {
        id,
        type: params.type,
        content: params.content,
        source: params.source,
        isStreaming: params.isStreaming,
      },
    ]);
    return id;
  };

  const replaceMessageContent = (id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, isStreaming: false } : m))
    );
  };

  const handleSubmitText = async () => {
    const answerText = userAnswer;
    if (!answerText.trim()) return;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    appendUserMessage({
      type: waitingForFollowUp ? 'followup-answer' : 'answer',
      content: answerText,
      source: 'text',
    });

    setIsSubmitting(true);
    setUserAnswer('');

    try {
      if (waitingForFollowUp && currentAnswerId) {
        const response = await fetch('/api/interview/follow-up-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answerId: currentAnswerId,
            followUpAnswer: answerText,
          }),
        });

        if (!response.ok) throw new Error('Failed to submit follow-up answer');

        setWaitingForFollowUp(false);
        setCurrentAnswerId(null);
        moveToNextQuestion();
      } else {
        const response = await fetch('/api/interview/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setId: parseInt(setId!),
            questionId: currentQuestion.id,
            questionOrder: currentQuestion.order,
            userAnswer: answerText,
            enableFollowUp,
            aiModel: selectedModel,
          }),
        });

        if (!response.ok) throw new Error('Failed to submit answer');

        const data = await response.json();
        setCurrentAnswerId(data.answerId);

        if (data.followUpQuestion) {
          handleFollowUp(data.followUpQuestion, currentQuestion.order);
        } else {
          moveToNextQuestion();
        }
      }
    } catch (error) {
      toast.error('답변 제출에 실패했습니다.', { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAudio = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    if (!audioBlob) return;

    const msgId = appendUserMessage({
      type: waitingForFollowUp ? 'followup-answer' : 'answer',
      content: '음성 답변을 텍스트로 변환 중입니다...',
      source: 'audio',
      isStreaming: true,
    });

    setIsSubmitting(true);
    setIsTranscribing(true);

    try {
      const wavPayload = await audioBlobToWavBase64(audioBlob);

      if (waitingForFollowUp && currentAnswerId) {
        const response = await fetch('/api/interview/follow-up-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answerId: currentAnswerId,
            audio: wavPayload,
          }),
        });
        if (!response.ok) throw new Error('Failed to submit follow-up audio');

        const data = await response.json().catch(() => ({}));
        const transcript = data?.transcript || '(전사 결과 없음)';
        replaceMessageContent(msgId, transcript);

        setWaitingForFollowUp(false);
        setCurrentAnswerId(null);
        resetAudio();
        moveToNextQuestion();
        return;
      }

      const response = await fetch('/api/interview/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: parseInt(setId!),
          questionId: currentQuestion.id,
          questionOrder: currentQuestion.order,
          audio: wavPayload,
          enableFollowUp,
          aiModel: selectedModel,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit audio answer');

      const data = await response.json().catch(() => ({}));
      setCurrentAnswerId(data.answerId);

      const transcript = data?.transcript || '(전사 결과 없음)';
      replaceMessageContent(msgId, transcript);

      resetAudio();

      if (data.followUpQuestion) {
        handleFollowUp(data.followUpQuestion, currentQuestion.order);
      } else {
        moveToNextQuestion();
      }
    } catch (e) {
      toast.error('음성 답변 제출에 실패했습니다.', { duration: 5000 });
      replaceMessageContent(msgId, '음성 답변 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
      setIsTranscribing(false);
    }
  };

  const handleFollowUp = (questionText: string, order: number) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        type: 'system',
        content: 'AI 면접관이 꼬리질문을 생성중입니다...',
        isStreaming: true,
      },
    ]);

    setTimeout(() => {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isStreaming);
        return [
          ...filtered,
          {
            id: createId(),
            type: 'followup',
            content: questionText,
            questionOrder: order,
          },
        ];
      });
      setWaitingForFollowUp(true);
    }, 2000);
  };

  const moveToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          type: 'question',
          content: questions[nextIndex]?.question || '',
          questionOrder: nextIndex + 1,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
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
        id: createId(),
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
    const style =
      category === 'common'
        ? 'bg-blue-500/10 text-blue-600 border-blue-200'
        : category === 'job'
          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
          : 'bg-violet-500/10 text-violet-600 border-violet-200';

    const label =
      category === 'common' ? '공통' : category === 'job' ? '직무' : '외국인';

    return (
      <Badge variant='outline' className={cn('font-medium border', style)}>
        {label}
      </Badge>
    );
  };

  return (
    <div className='flex flex-col h-[calc(100vh-3.5rem)] bg-muted/10'>
      {/* 상단 헤더 */}
      <header className='flex-none border-b bg-background/80 backdrop-blur z-20 sticky top-0 px-4 py-3'>
        <div className='container max-w-5xl mx-auto flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => navigate('/interview/start')}
            >
              <ChevronLeft className='h-5 w-5' />
            </Button>
            <div className='flex flex-col'>
              <div className='flex items-center gap-2'>
                <h1 className='font-semibold text-sm md:text-base'>
                  실전 면접 진행 중
                </h1>
                <Badge
                  variant={waitingForFollowUp ? 'destructive' : 'default'}
                  className='text-[10px] px-1.5 py-0 h-5'
                >
                  {waitingForFollowUp
                    ? '꼬리질문'
                    : `Q.${currentQuestionIndex + 1}`}
                </Badge>
              </div>
              <div className='text-xs text-muted-foreground'>
                {questions.length > 0
                  ? `${currentQuestionIndex + 1} / ${questions.length}번째 질문`
                  : '준비 중...'}
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <div className='hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full'>
              <Switch
                id='followup'
                checked={enableFollowUp}
                onCheckedChange={setEnableFollowUp}
                disabled={waitingForFollowUp || isSubmitting || isCompleting}
                className='scale-75 data-[state=checked]:bg-primary'
              />
              <Label
                htmlFor='followup'
                className='text-xs font-medium cursor-pointer text-muted-foreground'
              >
                꼬리질문
              </Label>
            </div>

            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className='w-[140px] h-8 text-xs bg-background hidden md:flex'>
                <SelectValue placeholder='모델' />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem
                    key={model.value}
                    value={model.value}
                    className='text-xs'
                  >
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* 채팅 영역 */}
      <div
        className='flex-1 overflow-y-auto p-4 scroll-smooth'
        id='chat-container'
      >
        <div className='container max-w-3xl mx-auto space-y-6 py-4'>
          {messages.map((message) => {
            const isUser =
              message.type === 'answer' || message.type === 'followup-answer';
            const isSystem = message.type === 'system';
            const isFollowUp = message.type === 'followup';

            if (isSystem) {
              return (
                <div
                  key={message.id}
                  className='flex justify-center py-2 animate-fade-in'
                >
                  <div className='bg-muted/50 text-muted-foreground text-xs px-4 py-1.5 rounded-full border border-border/50 shadow-sm flex items-center gap-2'>
                    <Bot className='h-3 w-3' />
                    {message.content || '처리 중...'}
                    {message.isStreaming && (
                      <Loader2 className='h-3 w-3 animate-spin ml-1' />
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4 max-w-[90%] md:max-w-[80%] animate-slide-in-up',
                  isUser ? 'ml-auto flex-row-reverse' : ''
                )}
              >
                {/* 아바타 */}
                <div
                  className={cn(
                    'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border',
                    isUser
                      ? 'bg-primary text-primary-foreground border-primary'
                      : isFollowUp
                        ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800'
                        : 'bg-white text-primary border-gray-100 dark:bg-gray-800 dark:border-gray-700'
                  )}
                >
                  {isUser ? (
                    <User className='w-5 h-5' />
                  ) : isFollowUp ? (
                    <AlertCircle className='w-5 h-5' />
                  ) : (
                    <Bot className='w-5 h-5' />
                  )}
                </div>

                {/* 메시지 내용 */}
                <div
                  className={cn(
                    'relative px-5 py-3.5 shadow-sm text-sm leading-relaxed',
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
                      : isFollowUp
                        ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl rounded-tl-sm text-foreground'
                        : 'bg-white dark:bg-card border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-sm text-foreground'
                  )}
                >
                  {!isUser && message.questionOrder && (
                    <div className='text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5'>
                      {isFollowUp ? (
                        <span className='text-amber-600 dark:text-amber-500 flex items-center gap-1'>
                          <AlertCircle className='w-3 h-3' /> 압박 질문
                        </span>
                      ) : (
                        <span>질문 {message.questionOrder}</span>
                      )}
                      {questions[currentQuestionIndex] &&
                        !isFollowUp &&
                        getCategoryBadge(
                          questions[currentQuestionIndex].category
                        )}
                    </div>
                  )}

                  {isUser && message.source === 'audio' && (
                    <div className='flex items-center gap-1.5 text-[10px] bg-black/10 w-fit px-2 py-0.5 rounded-full mb-2'>
                      <Mic className='w-3 h-3' />
                      음성 답변 전사
                    </div>
                  )}

                  <div className='whitespace-pre-wrap'>{message.content}</div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className='h-px' />
        </div>
      </div>

      {/* 입력 영역 (하단 고정) */}
      <div className='flex-none bg-background border-t p-4 pb-6 z-20'>
        <div className='container max-w-3xl mx-auto'>
          <Tabs
            value={inputMode}
            onValueChange={(v) => setInputMode(v as 'text' | 'audio')}
            className='w-full'
          >
            <div className='flex items-center justify-between mb-3 px-1'>
              <TabsList className='h-9 bg-muted/50 p-1'>
                <TabsTrigger value='text' className='text-xs px-4'>
                  텍스트 입력
                </TabsTrigger>
                <TabsTrigger value='audio' className='text-xs px-4'>
                  음성 답변
                </TabsTrigger>
              </TabsList>

              {inputMode === 'audio' && isRecording && (
                <div className='flex items-center gap-2 text-xs font-mono text-red-500 animate-pulse'>
                  <div className='w-2 h-2 bg-red-500 rounded-full' />
                  {formatSeconds(recordSeconds)}
                </div>
              )}
            </div>

            <TabsContent value='text' className='mt-0'>
              <div className='relative flex gap-2'>
                <Textarea
                  placeholder={
                    waitingForFollowUp
                      ? 'AI 면접관의 꼬리질문에 답변해주세요...'
                      : '질문에 대한 답변을 입력하세요...'
                  }
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitText();
                    }
                  }}
                  className='min-h-[80px] resize-none pr-14 py-3 bg-muted/30 border-muted focus-visible:bg-background transition-all shadow-none focus-visible:ring-1'
                  disabled={isSubmitting || isCompleting || isTranscribing}
                />
                <Button
                  onClick={handleSubmitText}
                  disabled={!canSubmit}
                  size='icon'
                  className='absolute bottom-3 right-3 h-8 w-8 rounded-full shadow-sm'
                >
                  {isSubmitting ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Send className='w-4 h-4' />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value='audio' className='mt-0'>
              <div className='bg-muted/30 border border-muted rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4'>
                <div className='flex items-center gap-3 w-full md:w-auto'>
                  {/* 녹음 버튼 */}
                  <Button
                    size='lg'
                    variant={isRecording ? 'destructive' : 'default'}
                    className={cn(
                      'rounded-full w-14 h-14 shrink-0 shadow-lg transition-all',
                      isRecording
                        ? 'animate-pulse ring-4 ring-destructive/20'
                        : 'hover:scale-105'
                    )}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isSubmitting || isCompleting || isTranscribing}
                  >
                    {isRecording ? (
                      <Square className='w-6 h-6 fill-current' />
                    ) : (
                      <Mic className='w-6 h-6' />
                    )}
                  </Button>

                  <div className='flex flex-col gap-1'>
                    <div className='font-medium text-sm'>
                      {isRecording
                        ? '녹음 중...'
                        : audioBlob
                          ? '녹음 완료'
                          : '음성 답변 시작'}
                    </div>
                    <div className='text-xs text-muted-foreground flex items-center gap-2'>
                      {isRecording
                        ? '버튼을 눌러 중지하세요'
                        : audioBlob
                          ? `${formatSeconds(recordSeconds)} 녹음됨`
                          : '마이크 버튼을 눌러 답변하세요'}
                    </div>
                  </div>
                </div>

                {/* 오디오 컨트롤 및 업로드 */}
                <div className='flex items-center gap-2 w-full md:w-auto justify-end'>
                  {audioUrl && !isRecording && (
                    <div className='flex items-center gap-2 mr-2 bg-background rounded-full border px-3 py-1.5 shadow-sm'>
                      <Volume2 className='w-4 h-4 text-primary' />
                      <audio
                        src={audioUrl}
                        controls
                        className='h-6 w-32 md:w-48 max-w-full'
                      />
                    </div>
                  )}

                  {!isRecording && (
                    <>
                      <Button
                        variant='outline'
                        size='icon'
                        className='rounded-full h-10 w-10 border-muted-foreground/20 hover:bg-background'
                        title='파일 업로드'
                        asChild
                      >
                        <label className='cursor-pointer'>
                          <Upload className='w-4 h-4 text-muted-foreground' />
                          <input
                            type='file'
                            accept='audio/*'
                            className='hidden'
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePickAudioFile(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </Button>

                      {audioBlob && (
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={resetAudio}
                          className='rounded-full h-10 w-10 hover:bg-destructive/10 hover:text-destructive'
                          title='삭제'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      )}

                      <Button
                        onClick={handleSubmitAudio}
                        disabled={!canSubmit}
                        className='rounded-full px-6 shadow-md'
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className='w-4 h-4 animate-spin mr-2' />
                            전사 중
                          </>
                        ) : (
                          <>
                            제출하기
                            <Send className='w-4 h-4 ml-2' />
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className='text-center mt-2 text-[10px] text-muted-foreground/60'>
            Shift + Enter 로 줄바꿈이 가능합니다
          </div>
        </div>
      </div>
    </div>
  );
}
