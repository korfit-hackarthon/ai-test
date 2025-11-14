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
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ArrowLeft, Download, BookOpen, Save } from 'lucide-react';

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
      // 해당 답변에 대한 피드백 찾기
      const feedback = evaluation?.detailedFeedback?.find(
        (f) => f.questionOrder === answer.questionOrder
      );

      // 질문과 답변을 하나의 문자열로 구성
      let fullAnswer = `[질문]\n${answer.question?.question || '질문 정보 없음'}\n\n[답변]\n${answer.userAnswer}`;

      // 꼬리질문이 있으면 추가
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
          finalAnswer: '', // 사용자가 나중에 작성
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
      <div className='container max-w-5xl mx-auto py-12 px-4 text-center'>
        <p className='text-muted-foreground'>결과를 불러오는 중...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className='container max-w-5xl mx-auto py-12 px-4 text-center'>
        <p className='text-muted-foreground'>평가 결과가 없습니다.</p>
        <Button onClick={() => navigate('/interview/start')} className='mt-4'>
          새 면접 시작하기
        </Button>
      </div>
    );
  }

  const radarData = [
    { subject: '논리성', value: evaluation.logic, fullMark: 100 },
    { subject: '근거', value: evaluation.evidence, fullMark: 100 },
    {
      subject: '직무이해도',
      value: evaluation.jobUnderstanding,
      fullMark: 100,
    },
    { subject: '한국어격식', value: evaluation.formality, fullMark: 100 },
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
    <div className='container max-w-6xl mx-auto py-8 px-4 space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>면접 평가 결과</h1>
          <p className='text-muted-foreground mt-1'>
            {interviewSet?.jobType && (
              <>
                {interviewSet.jobType === 'marketing'
                  ? '마케팅'
                  : interviewSet.jobType === 'sales'
                    ? '영업'
                    : '개발(IT)'}
                {' · '}
                {interviewSet.level === 'intern' ? '인턴' : '신입'}
              </>
            )}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => navigate('/interview/start')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />새 면접 시작
          </Button>
        </div>
      </div>

      {/* 종합 점수 */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <CardTitle>종합 평가</CardTitle>
              <CardDescription>전체 항목 평균 점수</CardDescription>
            </div>
            <div className='flex items-baseline gap-2'>
              <span className='text-4xl font-bold text-foreground'>
                {averageScore}
              </span>
              <span className='text-xl text-muted-foreground'>/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground'>
            {evaluation.overallFeedback}
          </p>
        </CardContent>
      </Card>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* 5각형 역량 진단 */}
        <Card>
          <CardHeader>
            <CardTitle>역량 진단</CardTitle>
            <CardDescription>5가지 항목별 점수 분석</CardDescription>
          </CardHeader>
          <CardContent className='flex items-center justify-center'>
            <ChartContainer
              config={{
                value: {
                  label: '점수',
                  color: 'hsl(var(--primary))',
                },
              }}
              className='h-[350px] w-full'
            >
              <RadarChart
                data={radarData}
                margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
              >
                <PolarGrid
                  stroke='rgb(148, 163, 184)'
                  strokeWidth={2}
                  className='dark:stroke-slate-500'
                />
                <PolarAngleAxis
                  dataKey='subject'
                  tick={{
                    fill: 'rgb(15, 23, 42)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  className='dark:[&_text]:fill-slate-200'
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{
                    fill: 'rgb(71, 85, 105)',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                  stroke='rgb(148, 163, 184)'
                  strokeWidth={1.5}
                  className='dark:[&_text]:fill-slate-400 dark:stroke-slate-500'
                />
                <Radar
                  name='점수'
                  dataKey='value'
                  stroke='rgb(59, 130, 246)'
                  fill='rgb(59, 130, 246)'
                  fillOpacity={0.4}
                  strokeWidth={3}
                  dot={{
                    fill: 'rgb(59, 130, 246)',
                    r: 5,
                    strokeWidth: 3,
                    stroke: 'rgb(255, 255, 255)',
                  }}
                  className='dark:stroke-blue-400 dark:fill-blue-400'
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.15 }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 세부 점수 */}
        <Card>
          <CardHeader>
            <CardTitle>세부 점수</CardTitle>
            <CardDescription>항목별 상세 점수</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {[
              { label: '논리성', value: evaluation.logic },
              { label: '근거', value: evaluation.evidence },
              { label: '직무이해도', value: evaluation.jobUnderstanding },
              { label: '한국어 격식', value: evaluation.formality },
              { label: '완성도', value: evaluation.completeness },
            ].map((item) => (
              <div key={item.label} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-foreground'>
                    {item.label}
                  </span>
                  <div className='flex items-center gap-1'>
                    <span className='text-base font-semibold text-foreground'>
                      {item.value}
                    </span>
                    <span className='text-xs text-muted-foreground'>/100</span>
                  </div>
                </div>
                <div className='relative w-full h-2 rounded-full bg-secondary'>
                  <div
                    className='h-full bg-primary rounded-full transition-all duration-300'
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 질문별 상세 피드백 */}
      <Card>
        <CardHeader>
          <CardTitle>질문별 상세 피드백</CardTitle>
          <CardDescription>각 답변에 대한 구체적인 개선 제안</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {evaluation.detailedFeedback?.map((feedback, index) => (
            <div key={index}>
              {index > 0 && <Separator className='my-6' />}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>질문 {feedback.questionOrder}</Badge>
                  <h3 className='font-semibold'>평가</h3>
                </div>
                <p className='text-sm'>{feedback.feedback}</p>
                <div className='bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4'>
                  <h4 className='text-sm font-semibold mb-2 flex items-center gap-2'>
                    <BookOpen className='h-4 w-4' />
                    개선 제안
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    {feedback.improvements}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 나의 답변 */}
      <Card>
        <CardHeader>
          <CardTitle>나의 답변</CardTitle>
          <CardDescription>면접에서 작성한 모든 답변</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {answers.map((answer, index) => (
            <div key={index}>
              {index > 0 && <Separator className='my-4' />}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Badge variant='outline'>질문 {answer.questionOrder}</Badge>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleSaveToNote(answer)}
                  >
                    <Save className='mr-2 h-4 w-4' />
                    답변노트에 저장
                  </Button>
                </div>
                <div className='bg-muted/50 rounded-lg p-4'>
                  <p className='text-sm font-medium text-muted-foreground mb-2'>
                    {answer.question?.question || '질문 정보 없음'}
                  </p>
                  <p className='text-sm whitespace-pre-wrap'>
                    {answer.userAnswer}
                  </p>
                </div>
                {answer.followUpQuestion && (
                  <>
                    <div className='ml-4 space-y-2'>
                      <p className='text-sm font-medium text-amber-600 dark:text-amber-400'>
                        꼬리질문: {answer.followUpQuestion}
                      </p>
                      {answer.followUpAnswer && (
                        <div className='bg-amber-50 dark:bg-amber-950 rounded-lg p-3'>
                          <p className='text-sm'>{answer.followUpAnswer}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
