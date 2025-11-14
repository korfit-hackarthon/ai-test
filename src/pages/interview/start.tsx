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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Play, Briefcase, GraduationCap } from 'lucide-react';

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
    <div className='container max-w-4xl mx-auto py-12 px-4'>
      <div className='space-y-2 mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tight'>
          KORFIT 면접 시뮬레이터
        </h1>
        <p className='text-lg text-muted-foreground'>
          AI 면접관과 함께하는 실전 면접 연습
        </p>
      </div>

      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-2xl'>
            <Play className='h-6 w-6 text-primary' />
            면접 시작하기
          </CardTitle>
          <CardDescription>
            직무와 레벨을 선택하면 맞춤형 면접 질문이 자동으로 생성됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='jobType' className='flex items-center gap-2'>
                <Briefcase className='h-4 w-4' />
                지원 직무
              </Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger id='jobType'>
                  <SelectValue placeholder='직무를 선택하세요' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='marketing'>마케팅</SelectItem>
                  <SelectItem value='sales'>영업</SelectItem>
                  <SelectItem value='it'>개발(IT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='level' className='flex items-center gap-2'>
                <GraduationCap className='h-4 w-4' />
                지원 레벨
              </Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id='level'>
                  <SelectValue placeholder='레벨을 선택하세요' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='intern'>인턴</SelectItem>
                  <SelectItem value='entry'>신입</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='questionCount'>질문 개수</Label>
              <Select
                value={questionCount.toString()}
                onValueChange={(value) => setQuestionCount(parseInt(value))}
              >
                <SelectTrigger id='questionCount'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>1개</SelectItem>
                  <SelectItem value='2'>2개</SelectItem>
                  <SelectItem value='3'>3개 (추천)</SelectItem>
                  <SelectItem value='4'>4개</SelectItem>
                  <SelectItem value='5'>5개</SelectItem>
                  <SelectItem value='6'>6개</SelectItem>
                  <SelectItem value='7'>7개</SelectItem>
                  <SelectItem value='8'>8개</SelectItem>
                  <SelectItem value='9'>9개</SelectItem>
                  <SelectItem value='10'>10개</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='bg-muted/50 rounded-lg p-4 space-y-2'>
            <h3 className='font-semibold text-sm'>면접 구성</h3>
            <ul className='text-sm text-muted-foreground space-y-1'>
              <li>• 공통 질문 (40%): 자기소개, 지원동기 등</li>
              <li>• 직무 질문 (30%): 선택한 직무 관련 질문</li>
              <li>• 외국인 특화 (30%): 외국인 지원자 단골 질문</li>
            </ul>
          </div>

          <Button
            onClick={handleStart}
            disabled={isCreating || !jobType || !level}
            className='w-full'
            size='lg'
          >
            {isCreating ? '면접 세트 생성 중...' : '면접 시작하기'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
