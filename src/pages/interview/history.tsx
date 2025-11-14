import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, Calendar, Briefcase } from 'lucide-react';

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
      it: '개발(IT)',
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
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className='container max-w-5xl mx-auto py-12 px-4 text-center'>
        <p className='text-muted-foreground'>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className='container max-w-5xl mx-auto py-8 px-4 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>면접 기록</h1>
        <p className='text-muted-foreground'>
          지금까지 진행한 모든 면접 기록을 확인할 수 있습니다.
        </p>
      </div>

      {sets.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-muted-foreground mb-4'>아직 진행한 면접이 없습니다.</p>
            <Button onClick={() => navigate('/interview/start')}>
              첫 면접 시작하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {sets.map((set) => (
            <Card key={set.id} className='hover:border-primary transition-colors'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Briefcase className='h-5 w-5 text-muted-foreground' />
                    <div>
                      <CardTitle className='text-lg'>
                        {getJobTypeLabel(set.jobType)} · {getLevelLabel(set.level)}
                      </CardTitle>
                      <div className='flex items-center gap-2 mt-1'>
                        <Calendar className='h-3 w-3 text-muted-foreground' />
                        <p className='text-xs text-muted-foreground'>
                          {formatDate(set.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {set.status === 'completed' ? (
                      <>
                        <Badge className='bg-green-500'>완료</Badge>
                        <Button
                          size='sm'
                          onClick={() => navigate(`/interview/result/${set.id}`)}
                        >
                          <Eye className='mr-2 h-4 w-4' />
                          결과 보기
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge className='bg-yellow-500'>진행중</Badge>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => navigate(`/interview/session/${set.id}`)}
                        >
                          이어하기
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

