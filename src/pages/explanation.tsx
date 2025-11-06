import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Explanation() {
  return (
    <div className='container max-w-4xl mx-auto py-12 px-4'>
      <div className='space-y-2 mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tight'>
          AI 가상 면접 테스트
        </h1>
      </div>

      <div className='space-y-6'>
        <h2 className='text-2xl font-bold'>사용 방법</h2>

        <div className='space-y-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex gap-4'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0'>
                  1
                </div>
                <div className='space-y-2 flex-1'>
                  <h3 className='font-semibold text-lg'>면접 질문 등록</h3>
                  <p className='text-sm text-muted-foreground'>
                    <Badge variant='outline' className='mr-2'>
                      질문 관리
                    </Badge>
                    메뉴에서 면접 질문과 모범답변을 등록합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex gap-4'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0'>
                  2
                </div>
                <div className='space-y-2 flex-1'>
                  <h3 className='font-semibold text-lg'>질문 선택</h3>
                  <p className='text-sm text-muted-foreground'>
                    <Badge variant='outline' className='mr-2'>
                      AI 가상 면접
                    </Badge>
                    메뉴에서 연습할 질문과 사용할 AI 모델을 선택합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex gap-4'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0'>
                  3
                </div>
                <div className='space-y-2 flex-1'>
                  <h3 className='font-semibold text-lg'>답변 작성</h3>
                  <p className='text-sm text-muted-foreground'>
                    면접 질문에 대한 답변을 작성하고 제출합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex gap-4'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0'>
                  4
                </div>
                <div className='space-y-2 flex-1'>
                  <h3 className='font-semibold text-lg'>AI 평가 확인</h3>
                  <p className='text-sm text-muted-foreground'>
                    AI가 제공하는 점수와 피드백을 확인하고 답변을 개선합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
