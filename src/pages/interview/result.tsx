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
import {
  ArrowLeft,
  Download,
  BookOpen,
  Save,
  Star,
  Zap,
  Target,
  MessageSquare,
} from 'lucide-react';

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
    <div className='container max-w-6xl mx-auto py-8 px-4 space-y-8'>
      {/* 헤더 */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            면접 분석 리포트
          </h1>
          <div className='flex items-center gap-2 mt-2'>
            <Badge variant='secondary' className='px-2 py-0.5 text-sm'>
              {interviewSet?.jobType && (
                <>
                  {interviewSet.jobType === 'marketing'
                    ? '마케팅'
                    : interviewSet.jobType === 'sales'
                      ? '영업'
                      : '개발(IT)'}
                </>
              )}
            </Badge>
            <span className='text-muted-foreground text-sm'>
              {interviewSet?.level === 'intern' ? '인턴' : '신입'} 지원 · AI
              면접 결과
            </span>
          </div>
        </div>
        <Button variant='outline' onClick={() => navigate('/interview/start')}>
          <ArrowLeft className='mr-2 h-4 w-4' />새 면접 시작
        </Button>
      </div>

      {/* 종합 점수 및 피드백 요약 */}
      <div className='grid gap-6 md:grid-cols-3'>
        <Card className='md:col-span-1 bg-primary/5 border-primary/10'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-medium flex items-center gap-2'>
              <Star className='w-5 h-5 text-primary' />
              종합 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-baseline gap-2'>
              <span className='text-5xl font-bold text-primary tracking-tight'>
                {averageScore}
              </span>
              <span className='text-sm text-muted-foreground'>/ 100</span>
            </div>
            <p className='text-sm text-muted-foreground mt-4'>
              {averageScore >= 80
                ? '탁월한 역량을 보여주셨습니다! 🎉'
                : averageScore >= 60
                  ? '준수한 역량을 갖추고 계십니다. 👍'
                  : '조금 더 준비가 필요합니다. 💪'}
            </p>
          </CardContent>
        </Card>

        <Card className='md:col-span-2'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-medium flex items-center gap-2'>
              <MessageSquare className='w-5 h-5 text-primary' />
              종합 피드백
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap'>
              {evaluation.overallFeedback}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* 역량 진단 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='w-5 h-5 text-primary' />
              역량 분석
            </CardTitle>
            <CardDescription>5대 핵심 역량 진단 결과입니다.</CardDescription>
          </CardHeader>
          <CardContent className='flex items-center justify-center pb-8'>
            <ChartContainer
              config={{
                value: {
                  label: '점수',
                  color: 'hsl(var(--primary))',
                },
              }}
              className='h-[300px] w-full'
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
            <CardTitle className='flex items-center gap-2'>
              <Zap className='w-5 h-5 text-primary' />
              세부 평가
            </CardTitle>
            <CardDescription>항목별 상세 점수 및 분석</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {[
              {
                label: '논리성',
                value: evaluation.logic,
                desc: '답변의 논리적 구조와 일관성',
              },
              {
                label: '근거 제시',
                value: evaluation.evidence,
                desc: '구체적인 사례와 근거 활용',
              },
              {
                label: '직무 이해도',
                value: evaluation.jobUnderstanding,
                desc: '직무에 필요한 핵심 역량 이해',
              },
              {
                label: '의사소통',
                value: evaluation.formality,
                desc: '적절한 어휘 선택과 표현력',
              },
              {
                label: '완성도',
                value: evaluation.completeness,
                desc: '답변의 구체성과 충실도',
              },
            ].map((item) => (
              <div key={item.label} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='text-sm font-medium text-foreground'>
                      {item.label}
                    </span>
                    <span className='text-xs text-muted-foreground ml-2 hidden sm:inline-block'>
                      {item.desc}
                    </span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <span
                      className={`text-base font-bold ${
                        item.value >= 80
                          ? 'text-primary'
                          : item.value >= 60
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {item.value}
                    </span>
                    <span className='text-xs text-muted-foreground'>/100</span>
                  </div>
                </div>
                <div className='relative w-full h-2.5 rounded-full bg-secondary overflow-hidden'>
                  <div
                    className='h-full bg-primary transition-all duration-500 ease-out rounded-full'
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 질문별 상세 피드백 */}
      <div className='space-y-6'>
        <h2 className='text-2xl font-bold tracking-tight mt-8'>상세 피드백</h2>
        <div className='grid gap-6'>
          {evaluation.detailedFeedback?.map((feedback, index) => {
            const relatedAnswer = answers.find(
              (a) => a.questionOrder === feedback.questionOrder
            );

            return (
              <Card key={index} className='overflow-hidden'>
                <CardHeader className='bg-muted/30 pb-4'>
                  <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                      <Badge variant='outline' className='bg-background'>
                        질문 {feedback.questionOrder}
                      </Badge>
                      <h3 className='font-medium text-foreground'>
                        {relatedAnswer?.question?.question || '질문 내용 없음'}
                      </h3>
                    </div>
                    {relatedAnswer && (
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-8'
                        onClick={() => handleSaveToNote(relatedAnswer)}
                      >
                        <Save className='mr-2 h-3.5 w-3.5' />
                        답변노트에 저장
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='p-6 space-y-6'>
                  {/* 나의 답변 */}
                  <div className='space-y-2'>
                    <h4 className='text-sm font-semibold text-muted-foreground'>
                      나의 답변
                    </h4>
                    <div className='bg-muted/30 p-4 rounded-md text-sm leading-relaxed whitespace-pre-wrap'>
                      {relatedAnswer?.userAnswer}
                    </div>
                    {relatedAnswer?.followUpQuestion && (
                      <div className='pl-4 border-l-2 border-primary/20 mt-4 space-y-2'>
                        <p className='text-sm font-medium text-primary'>
                          ↳ 꼬리질문: {relatedAnswer.followUpQuestion}
                        </p>
                        {relatedAnswer.followUpAnswer && (
                          <p className='text-sm text-muted-foreground bg-muted/30 p-3 rounded-md'>
                            {relatedAnswer.followUpAnswer}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* AI 피드백 */}
                  <div className='grid md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <h4 className='text-sm font-semibold text-primary flex items-center gap-2'>
                        <MessageSquare className='w-4 h-4' />
                        AI 평가
                      </h4>
                      <p className='text-sm text-muted-foreground leading-relaxed'>
                        {feedback.feedback}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <h4 className='text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2'>
                        <BookOpen className='w-4 h-4' />
                        개선 제안
                      </h4>
                      <div className='bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-lg p-4'>
                        <p className='text-sm text-muted-foreground leading-relaxed'>
                          {feedback.improvements}
                        </p>
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
