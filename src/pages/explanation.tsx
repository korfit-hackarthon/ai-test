import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Mic,
  Sparkles,
  Target,
  FileText,
} from 'lucide-react';

export default function Explanation() {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-background'>
      {/* Hero Section */}
      <section className='relative overflow-hidden py-20 px-4 md:py-32'>
        <div className='absolute inset-0 bg-linear-to-b from-primary/5 to-transparent -z-10' />
        <div className='container max-w-5xl mx-auto text-center space-y-8'>
          <div className='inline-flex items-center gap-2 rounded-full border bg-background/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur animate-fade-in'>
            <Sparkles className='h-4 w-4 text-primary' />
            <span>AI 기반 실전 면접 시뮬레이터</span>
          </div>

          <h1 className='text-4xl font-bold tracking-tight sm:text-6xl bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent animate-fade-in-up'>
            KORFIT 면접 시뮬레이터
          </h1>

          <p className='text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100'>
            외국인 유학생을 위한 맞춤형 면접 연습.
            <br className='hidden sm:block' />
            AI 면접관과 함께 실전처럼 대화하고, 상세한 피드백을 받아보세요.
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200'>
            <Button
              size='lg'
              onClick={() => navigate('/interview/start')}
              className='h-12 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all'
            >
              지금 바로 시작하기
              <ArrowRight className='ml-2 h-5 w-5' />
            </Button>
            <Button
              size='lg'
              variant='outline'
              onClick={() => navigate('/interview/history')}
              className='h-12 px-8 text-lg rounded-full'
            >
              내 기록 보기
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className='py-20 px-4 bg-muted/30'>
        <div className='container max-w-5xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl font-bold tracking-tight mb-4'>
              왜 KORFIT인가요?
            </h2>
            <p className='text-muted-foreground text-lg'>
              단순한 질문 답변을 넘어, 합격을 위한 체계적인 훈련을 제공합니다.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <FeatureCard
              icon={<Target className='h-6 w-6 text-primary' />}
              title='맞춤형 질문'
              description='지원 직무(마케팅/영업/IT)와 레벨(인턴/신입)에 딱 맞는 질문을 AI가 자동으로 구성합니다.'
            />
            <FeatureCard
              icon={<BrainCircuit className='h-6 w-6 text-primary' />}
              title='압박 꼬리질문'
              description='나의 답변 내용을 분석하여, 실제 면접관처럼 날카로운 추가 질문을 던집니다.'
            />
            <FeatureCard
              icon={<Mic className='h-6 w-6 text-primary' />}
              title='음성 답변 지원'
              description='실제 면접처럼 말로 답변해보세요. 음성을 텍스트로 변환하여 정확하게 분석합니다.'
            />
            <FeatureCard
              icon={<Bot className='h-6 w-6 text-primary' />}
              title='5대 역량 진단'
              description='논리성, 근거제시, 직무이해, 한국어 격식, 완성도 5가지 지표로 실력을 점검합니다.'
            />
            <FeatureCard
              icon={<FileText className='h-6 w-6 text-primary' />}
              title='상세 피드백'
              description='단순한 점수가 아닌, 구체적인 개선점과 모범 답안 가이드를 제공합니다.'
            />
            <FeatureCard
              icon={<Sparkles className='h-6 w-6 text-primary' />}
              title='답변 노트'
              description='피드백을 바탕으로 나만의 답변을 수정하고 저장하여 면접 직전 복기할 수 있습니다.'
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className='py-20 px-4'>
        <div className='container max-w-4xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl font-bold tracking-tight mb-4'>
              사용 방법
            </h2>
            <p className='text-muted-foreground text-lg'>
              5단계로 완성하는 완벽한 면접 대비
            </p>
          </div>

          <div className='relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent'>
            <StepItem
              number='1'
              title='질문 세팅'
              description='직무와 레벨을 선택하면 AI가 최적의 질문 세트를 생성합니다. 원한다면 직접 질문을 등록할 수도 있습니다.'
            />
            <StepItem
              number='2'
              title='모의 면접 진행'
              description='AI 면접관의 질문에 텍스트 또는 음성으로 답변합니다. 꼬리질문 옵션을 켜면 심층 면접이 진행됩니다.'
            />
            <StepItem
              number='3'
              title='실시간 분석'
              description='답변이 제출되면 AI가 즉시 내용을 분석하고, 다음 질문이나 꼬리질문을 준비합니다.'
            />
            <StepItem
              number='4'
              title='결과 리포트'
              description='면접이 끝나면 종합 점수와 항목별 상세 피드백이 담긴 리포트가 발행됩니다.'
            />
            <StepItem
              number='5'
              title='복기 및 개선'
              description='부족했던 답변은 피드백을 참고하여 다시 작성하고, 나만의 답변 노트에 저장하세요.'
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='py-24 px-4 border-t bg-muted/20'>
        <div className='container max-w-3xl mx-auto text-center space-y-8'>
          <h2 className='text-3xl font-bold tracking-tight'>
            지금 바로 시작해보세요
          </h2>
          <p className='text-muted-foreground text-lg'>
            수많은 유학생들이 KORFIT과 함께 취업에 성공했습니다.
          </p>
          <Button
            size='lg'
            onClick={() => navigate('/interview/start')}
            className='h-12 px-10 text-lg rounded-full'
          >
            면접 연습 시작하기
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className='border-none shadow-md bg-background/60 backdrop-blur hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
      <CardHeader>
        <div className='mb-2 w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center'>
          {icon}
        </div>
        <CardTitle className='text-xl'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className='text-base leading-relaxed'>
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className='relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active'>
      <div className='flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-lg'>
        {number}
      </div>

      <Card className='w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border-muted/50 shadow-sm hover:shadow-md transition-shadow'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg'>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
