import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  ArrowLeft,
  BookOpen,
  Save,
  Star,
  Zap,
  Target,
  MessageSquare,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Evaluation {
  logic: number;
  evidence: number;
  jobUnderstanding: number;
  formality: number;
  completeness: number;
  overallFeedback: string;
  detailedFeedback: Array<{
    questionOrder: number;
    feedback: string;
    improvements: string;
  }>;
}

interface InterviewSet {
  id: number;
  jobType: string;
  level: string;
  status: string;
  createdAt: string;
}

interface Answer {
  questionId: number;
  questionOrder: number;
  userAnswer: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
  question?: {
    question: string;
  };
}

export default function InterviewResult() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [interviewSet, setInterviewSet] = useState<InterviewSet | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [setId]);

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/interview/sets/${setId}`);
      if (!response.ok) throw new Error('Failed to fetch result');

      const data = await response.json();
      setInterviewSet(data.set);
      setAnswers(data.answers || []);
      setEvaluation(data.evaluation);
    } catch (error) {
      toast.error('결과를 불러오는데 실패했습니다.', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNote = async (answer: Answer) => {
    try {
      const feedback = evaluation?.detailedFeedback?.find(
        (f) => f.questionOrder === answer.questionOrder
      );

      let fullAnswer = `[질문]\n${answer.question?.question || '질문 정보 없음'}\n\n[답변]\n${answer.userAnswer}`;

      if (answer.followUpQuestion) {
        fullAnswer += `\n\n[꼬리질문]\n${answer.followUpQuestion}`;
        if (answer.followUpAnswer) {
          fullAnswer += `\n\n[꼬리질문 답변]\n${answer.followUpAnswer}`;
        }
      }

      const response = await fetch('/api/answer-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: answer.questionId,
          initialAnswer: fullAnswer,
          firstFeedback: feedback?.feedback || '',
          secondFeedback: feedback?.improvements || '',
          finalAnswer: '',
        }),
      });

      if (!response.ok) throw new Error('Failed to save note');

      toast.success('답변노트에 저장되었습니다!');
    } catch (error) {
      toast.error('저장에 실패했습니다.', { duration: 5000 });
    }
  };

  if (isLoading) {
    return (
      <div className='container max-w-5xl mx-auto py-20 px-4 flex flex-col items-center justify-center gap-4'>
        <div className='w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin' />
        <p className='text-muted-foreground animate-pulse'>
          분석 리포트를 생성하는 중...
        </p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className='container max-w-5xl mx-auto py-20 px-4 text-center space-y-4'>
        <div className='w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4'>
          <AlertCircle className='w-8 h-8 text-muted-foreground' />
        </div>
        <h2 className='text-2xl font-bold'>평가 결과가 없습니다</h2>
        <p className='text-muted-foreground'>
          아직 면접이 완료되지 않았거나 데이터를 불러올 수 없습니다.
        </p>
        <Button onClick={() => navigate('/interview/start')} className='mt-4'>
          새 면접 시작하기
        </Button>
      </div>
    );
  }

  const radarData = [
    { subject: '논리성', value: evaluation.logic, fullMark: 100 },
    { subject: '근거제시', value: evaluation.evidence, fullMark: 100 },
    { subject: '직무이해', value: evaluation.jobUnderstanding, fullMark: 100 },
    { subject: '표현력', value: evaluation.formality, fullMark: 100 },
    { subject: '완성도', value: evaluation.completeness, fullMark: 100 },
  ];

  const averageScore = Math.round(
    (evaluation.logic +
      evaluation.evidence +
      evaluation.jobUnderstanding +
      evaluation.formality +
      evaluation.completeness) /
      5
  );

  return (
    <div className='container max-w-6xl mx-auto py-10 px-4 space-y-10 animate-fade-in'>
      {/* Header Action Bar */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b -mx-4 px-4 md:mx-0 md:px-0 md:border-none'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <span className='font-medium text-foreground'>
              {interviewSet?.jobType === 'marketing'
                ? '마케팅'
                : interviewSet?.jobType === 'sales'
                  ? '영업'
                  : '개발(IT)'}
            </span>
            <span>·</span>
            <span>{interviewSet?.level === 'intern' ? '인턴' : '신입'}</span>
            <span>·</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            면접 역량 분석 리포트
            <Badge variant='outline' className='text-xs font-normal ml-2'>
              AI Analysis
            </Badge>
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/interview/history')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            목록으로
          </Button>
          <Button variant='outline' size='sm'>
            <Share2 className='mr-2 h-4 w-4' />
            공유
          </Button>
          <Button size='sm' onClick={() => navigate('/interview/start')}>
            다시 도전하기
          </Button>
        </div>
      </div>

      {/* Score Overview */}
      <div className='grid gap-6 md:grid-cols-12'>
        {/* Total Score */}
        <Card className='md:col-span-4 bg-linear-to-br from-primary/5 via-background to-background border-primary/20 shadow-md relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-medium flex items-center gap-2 text-muted-foreground'>
              <Trophy className='w-5 h-5 text-yellow-500' />
              종합 역량 점수
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col justify-end h-[calc(100%-4rem)]'>
            <div className='flex items-baseline gap-2 mt-4'>
              <span className='text-6xl font-black tracking-tighter text-foreground'>
                {averageScore}
              </span>
              <span className='text-xl text-muted-foreground font-medium'>
                / 100
              </span>
            </div>
            <div className='mt-6 space-y-2'>
              <div className='h-2 w-full bg-muted/50 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-primary transition-all duration-1000 ease-out'
                  style={{ width: `${averageScore}%` }}
                />
              </div>
              <p className='text-sm text-muted-foreground font-medium'>
                {averageScore >= 80
                  ? '🎉 상위 10% 수준의 탁월한 답변입니다.'
                  : averageScore >= 60
                    ? '👍 안정적이나 일부 보완이 필요합니다.'
                    : '💪 핵심 역량을 중심으로 준비가 필요합니다.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className='md:col-span-4 flex flex-col'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-medium flex items-center gap-2'>
              <Target className='w-5 h-5 text-primary' />
              역량 밸런스
            </CardTitle>
            <CardDescription>5대 핵심 지표 분석</CardDescription>
          </CardHeader>
          <CardContent className='flex-1 flex items-center justify-center min-h-[250px]'>
            <ChartContainer
              config={{
                value: {
                  label: '점수',
                  color: 'hsl(var(--primary))',
                },
              }}
              className='aspect-square w-full max-h-[250px]'
            >
              <RadarChart
                data={radarData}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <PolarGrid className='stroke-muted' />
                <PolarAngleAxis
                  dataKey='subject'
                  tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 600 }}
                  className='fill-muted-foreground'
                />
                <Radar
                  name='점수'
                  dataKey='value'
                  stroke='hsl(var(--primary))'
                  fill='hsl(var(--primary))'
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Overall Feedback */}
        <Card className='md:col-span-4 flex flex-col'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-medium flex items-center gap-2'>
              <MessageSquare className='w-5 h-5 text-primary' />
              AI 총평
            </CardTitle>
          </CardHeader>
          <CardContent className='flex-1'>
            <div className='bg-muted/30 rounded-xl p-4 h-full text-sm leading-relaxed text-muted-foreground overflow-y-auto max-h-[250px] scrollbar-hide'>
              {evaluation.overallFeedback}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className='space-y-6'>
        <div className='flex items-center gap-3'>
          <div className='h-8 w-1 bg-primary rounded-full' />
          <h2 className='text-2xl font-bold tracking-tight'>상세 피드백</h2>
        </div>

        <div className='grid gap-8'>
          {evaluation.detailedFeedback?.map((feedback, index) => {
            const relatedAnswer = answers.find(
              (a) => a.questionOrder === feedback.questionOrder
            );

            if (!relatedAnswer) return null;

            return (
              <Card
                key={index}
                className='overflow-hidden border-none shadow-md ring-1 ring-border/50'
              >
                <CardHeader className='bg-muted/30 pb-4 border-b'>
                  <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div className='flex items-start gap-3'>
                      <Badge
                        variant='outline'
                        className='bg-background mt-0.5 shrink-0'
                      >
                        Q{feedback.questionOrder}
                      </Badge>
                      <h3 className='font-semibold text-lg leading-tight'>
                        {relatedAnswer?.question?.question || '질문 내용 없음'}
                      </h3>
                    </div>
                    {relatedAnswer && (
                      <Button
                        size='sm'
                        variant='ghost'
                        className='shrink-0 hover:bg-background shadow-sm border'
                        onClick={() => handleSaveToNote(relatedAnswer)}
                      >
                        <Save className='mr-2 h-3.5 w-3.5' />
                        답변노트에 저장
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className='p-0'>
                  <div className='grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x'>
                    {/* User Answer Column */}
                    <div className='p-6 bg-background space-y-4'>
                      <div className='flex items-center gap-2 mb-2'>
                        <div className='w-2 h-2 rounded-full bg-blue-500' />
                        <span className='text-sm font-semibold text-muted-foreground'>
                          나의 답변
                        </span>
                      </div>
                      <div className='bg-muted/20 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-border/50'>
                        {relatedAnswer?.userAnswer}
                      </div>

                      {relatedAnswer?.followUpQuestion && (
                        <div className='mt-4 pt-4 border-t border-dashed'>
                          <div className='flex items-center gap-2 mb-2'>
                            <AlertCircle className='w-4 h-4 text-amber-500' />
                            <span className='text-sm font-medium text-amber-600 dark:text-amber-500'>
                              압박 꼬리질문
                            </span>
                          </div>
                          <p className='text-sm font-medium mb-2 pl-6'>
                            {relatedAnswer.followUpQuestion}
                          </p>
                          {relatedAnswer.followUpAnswer && (
                            <div className='bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-sm text-muted-foreground ml-6 border border-amber-100 dark:border-amber-900/50'>
                              {relatedAnswer.followUpAnswer}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI Feedback Column */}
                    <div className='p-6 bg-muted/5 space-y-6'>
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2'>
                          <Star className='w-4 h-4 text-primary' />
                          <h4 className='text-sm font-semibold'>
                            분석 및 평가
                          </h4>
                        </div>
                        <p className='text-sm text-muted-foreground leading-relaxed pl-6'>
                          {feedback.feedback}
                        </p>
                      </div>

                      <div className='space-y-3'>
                        <div className='flex items-center gap-2'>
                          <BookOpen className='w-4 h-4 text-green-600 dark:text-green-500' />
                          <h4 className='text-sm font-semibold'>개선 제안</h4>
                        </div>
                        <div className='bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-xl p-4 ml-6'>
                          <p className='text-sm text-muted-foreground leading-relaxed'>
                            {feedback.improvements}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
