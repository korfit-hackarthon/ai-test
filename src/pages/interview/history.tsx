import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar,
  Briefcase,
  ArrowRight,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterviewSet {
  id: number;
  jobType: string;
  level: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [sets, setSets] = useState<InterviewSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>(
    'all'
  );

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/interview/sets');
      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();
      setSets(data);
    } catch (error) {
      toast.error('면접 기록을 불러오는데 실패했습니다.', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    const labels: Record<string, string> = {
      marketing: '마케팅',
      sales: '영업',
      it: '개발 (IT)',
    };
    return labels[jobType] || jobType;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      intern: '인턴',
      entry: '신입',
    };
    return labels[level] || level;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className='container max-w-5xl mx-auto py-20 px-4 flex flex-col items-center justify-center gap-4'>
        <div className='w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin' />
        <p className='text-muted-foreground animate-pulse'>
          기록을 불러오는 중...
        </p>
      </div>
    );
  }

  const filteredSets =
    filter === 'all' ? sets : sets.filter((s) => s.status === filter);

  return (
    <div className='container max-w-5xl mx-auto py-12 px-4 space-y-8 animate-fade-in'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>면접 보관함</h1>
          <p className='text-muted-foreground max-w-lg'>
            진행 중인 면접을 이어가거나, 완료된 리포트를 통해 내 답변을
            점검해보세요.
          </p>
        </div>
        <Button
          onClick={() => navigate('/interview/start')}
          size='lg'
          className='shadow-lg hover:shadow-primary/20 transition-all'
        >
          새 면접 시작
          <ArrowRight className='ml-2 h-4 w-4' />
        </Button>
      </div>

      {/* Filter & Count */}
      <div className='flex items-center justify-between gap-4 border-b pb-4'>
        <Tabs
          value={filter}
          onValueChange={(v) =>
            setFilter(v as 'all' | 'in_progress' | 'completed')
          }
          className='w-full md:w-auto'
        >
          <TabsList className='bg-muted/50'>
            <TabsTrigger value='all' className='px-6'>
              전체
            </TabsTrigger>
            <TabsTrigger value='in_progress' className='px-6'>
              진행중
            </TabsTrigger>
            <TabsTrigger value='completed' className='px-6'>
              완료됨
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className='hidden md:block text-sm text-muted-foreground'>
          총{' '}
          <span className='font-medium text-foreground'>
            {filteredSets.length}
          </span>
          개의 기록
        </div>
      </div>

      {/* Content Grid */}
      {filteredSets.length === 0 ? (
        <Card className='border-dashed shadow-none bg-muted/30'>
          <CardContent className='py-20 text-center space-y-4 flex flex-col items-center'>
            <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2'>
              <FileText className='w-8 h-8 text-muted-foreground/50' />
            </div>
            <div className='space-y-1'>
              <p className='text-lg font-semibold text-foreground'>
                {filter === 'all'
                  ? '아직 진행한 면접이 없습니다.'
                  : filter === 'in_progress'
                    ? '진행 중인 면접이 없습니다.'
                    : '완료된 면접이 없습니다.'}
              </p>
              <p className='text-muted-foreground max-w-sm mx-auto'>
                새로운 면접을 시작하여 실전 감각을 익혀보세요.
              </p>
            </div>
            {filter === 'all' && (
              <Button
                onClick={() => navigate('/interview/start')}
                variant='outline'
                className='mt-4'
              >
                첫 면접 시작하기
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredSets.map((set, idx) => (
            <Card
              key={set.id}
              className={cn(
                'group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted-foreground/10',
                set.status === 'completed'
                  ? 'bg-background'
                  : 'bg-primary/5 border-primary/20'
              )}
            >
              <div
                className={cn(
                  'absolute top-0 left-0 w-1 h-full transition-colors',
                  set.status === 'completed' ? 'bg-muted' : 'bg-primary'
                )}
              />

              <CardContent className='p-6 space-y-4'>
                <div className='flex items-start justify-between'>
                  <Badge
                    variant={
                      set.status === 'completed' ? 'secondary' : 'default'
                    }
                    className={cn(
                      'font-medium tracking-wide',
                      set.status === 'in_progress' && 'animate-pulse'
                    )}
                  >
                    {set.status === 'completed' ? '완료됨' : '진행중'}
                  </Badge>
                  {set.status === 'completed' && (
                    <div className='text-muted-foreground/40'>
                      <CheckCircle2 className='w-5 h-5' />
                    </div>
                  )}
                </div>

                <div className='space-y-1'>
                  <h3 className='font-bold text-xl flex items-center gap-2'>
                    {getJobTypeLabel(set.jobType)}
                    <span className='text-muted-foreground font-normal text-sm'>
                      {getLevelLabel(set.level)}
                    </span>
                  </h3>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Calendar className='w-3 h-3' />
                    <span>{formatDate(set.createdAt)}</span>
                    <span className='w-0.5 h-0.5 rounded-full bg-muted-foreground' />
                    <Clock className='w-3 h-3' />
                    <span>{formatTime(set.createdAt)}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className='p-4 pt-0 flex justify-end'>
                {set.status === 'completed' ? (
                  <Button
                    variant='ghost'
                    className='w-full justify-between group-hover:bg-muted/50'
                    onClick={() => navigate(`/interview/result/${set.id}`)}
                  >
                    리포트 보기
                    <ArrowRight className='w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0' />
                  </Button>
                ) : (
                  <Button
                    className='w-full shadow-md'
                    onClick={() => navigate(`/interview/session/${set.id}`)}
                  >
                    이어서 진행하기
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
