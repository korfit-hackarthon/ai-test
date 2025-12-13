import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Play,
  Briefcase,
  GraduationCap,
  Sparkles,
  Mic,
  Settings2,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function InterviewStart() {
  const navigate = useNavigate();
  const [jobType, setJobType] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [isCreating, setIsCreating] = useState(false);

  const handleStart = async () => {
    if (!jobType || !level) {
      toast.error('직무와 레벨을 선택해주세요.', { duration: 3000 });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/interview/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType, level, questionCount }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '면접 세트 생성에 실패했습니다.');
      }

      const data = await response.json();
      toast.success('면접 세트가 생성되었습니다!');
      // 질문 목록을 state로 전달
      navigate(`/interview/session/${data.setId}`, {
        state: { questions: data.questions },
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '면접 세트 생성에 실패했습니다.',
        { duration: 5000 }
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className='container max-w-5xl mx-auto py-12 px-4'>
      <div className='mb-10 animate-fade-in'>
        <div className='inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/60'>
          <Sparkles className='h-3.5 w-3.5 text-primary' />
          <span>실전형 질문 · 꼬리질문 · 음성 답변</span>
        </div>
        <h1 className='text-4xl font-bold tracking-tight mt-4'>
          면접 시뮬레이터 설정
        </h1>
        <p className='text-lg text-muted-foreground mt-2 max-w-2xl'>
          지원하려는 직무와 레벨을 선택하면 AI가 최적의 질문을 생성해드립니다.
        </p>
      </div>

      <div className='grid gap-8 lg:grid-cols-[1.5fr_1fr] animate-fade-in-up delay-100'>
        {/* 설정 영역 */}
        <Card className='border-none shadow-md bg-background/60 backdrop-blur ring-1 ring-border/50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <Settings2 className='h-5 w-5 text-primary' />
              기본 설정
            </CardTitle>
            <CardDescription>
              맞춤형 질문 구성을 위한 필수 정보를 선택해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-8'>
            <div className='grid gap-6'>
              <div className='grid gap-3'>
                <Label
                  htmlFor='jobType'
                  className='flex items-center gap-2 text-base'
                >
                  <Briefcase className='h-4 w-4 text-muted-foreground' />
                  지원 직무
                </Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger
                    id='jobType'
                    className='h-12 text-base px-4 border-muted-foreground/20 hover:border-primary/50 transition-colors focus:ring-primary/20'
                  >
                    <SelectValue placeholder='직무를 선택하세요' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='marketing'>
                      마케팅 (Marketing)
                    </SelectItem>
                    <SelectItem value='sales'>영업 (Sales)</SelectItem>
                    <SelectItem value='it'>개발 (IT/Engineering)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-3'>
                <Label
                  htmlFor='level'
                  className='flex items-center gap-2 text-base'
                >
                  <GraduationCap className='h-4 w-4 text-muted-foreground' />
                  지원 레벨
                </Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger
                    id='level'
                    className='h-12 text-base px-4 border-muted-foreground/20 hover:border-primary/50 transition-colors focus:ring-primary/20'
                  >
                    <SelectValue placeholder='레벨을 선택하세요' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='intern'>인턴 (Intern)</SelectItem>
                    <SelectItem value='entry'>신입 (Entry Level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-3'>
                <Label htmlFor='questionCount' className='text-base'>
                  질문 개수
                </Label>
                <div className='flex items-center gap-4'>
                  <Select
                    value={questionCount.toString()}
                    onValueChange={(value) => setQuestionCount(parseInt(value))}
                  >
                    <SelectTrigger
                      id='questionCount'
                      className='h-12 w-full text-base px-4 border-muted-foreground/20 hover:border-primary/50 transition-colors focus:ring-primary/20'
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}개 {num === 3 && '(추천)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className='text-sm text-muted-foreground shrink-0'>
                    * 약 {questionCount * 2}분 소요 예상
                  </div>
                </div>
              </div>
            </div>

            <Separator className='bg-border/50' />

            <div className='flex flex-col gap-4'>
              <Button
                onClick={handleStart}
                disabled={isCreating || !jobType || !level}
                size='lg'
                className='h-14 text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all'
              >
                {isCreating ? (
                  '면접 세트 생성 중...'
                ) : (
                  <>
                    면접 시작하기
                    <ChevronRight className='ml-2 h-5 w-5' />
                  </>
                )}
              </Button>
              <p className='text-center text-sm text-muted-foreground'>
                시작 버튼을 누르면 바로 첫 번째 질문이 시작됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 안내 영역 */}
        <div className='space-y-6'>
          <Card className='bg-primary/5 border-primary/10 shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg text-primary'>
                <Info className='h-5 w-5' />
                진행 가이드
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <GuideItem
                icon={<Check className='h-4 w-4 text-green-500' />}
                text='공통/직무/외국인 질문이 랜덤하게 섞여 출제됩니다.'
              />
              <GuideItem
                icon={<Check className='h-4 w-4 text-green-500' />}
                text='압박 꼬리질문 기능을 켜면 심층적인 답변을 요구받습니다.'
              />
              <GuideItem
                icon={<Mic className='h-4 w-4 text-blue-500' />}
                text='음성으로 답변하면 텍스트로 자동 변환되어 기록됩니다.'
              />
              <GuideItem
                icon={<Check className='h-4 w-4 text-green-500' />}
                text='모든 답변이 끝나면 AI가 5가지 역량을 분석해줍니다.'
              />
            </CardContent>
          </Card>

          <Card className='bg-muted/30 border-none'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base text-muted-foreground'>
                이런 질문이 나와요
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-3'>
                <li className='text-sm p-3 rounded-md bg-background border shadow-sm'>
                  "본인의 강점과 약점을 직무와 연관지어 설명해주세요."
                </li>
                <li className='text-sm p-3 rounded-md bg-background border shadow-sm'>
                  "한국 기업 문화에서 가장 중요하게 생각하는 것은 무엇인가요?"
                </li>
                <li className='text-sm p-3 rounded-md bg-background border shadow-sm'>
                  "입사 후 3년 내에 이루고 싶은 목표가 있다면 말씀해주세요."
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GuideItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className='flex items-start gap-3'>
      <div className='mt-0.5 shrink-0 p-0.5 rounded-full bg-background border shadow-sm'>
        {icon}
      </div>
      <p className='text-sm leading-relaxed text-foreground/80'>{text}</p>
    </div>
  );
}
