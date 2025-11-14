import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Explanation() {
  return (
    <div className='container max-w-4xl mx-auto py-12 px-4'>
      <div className='space-y-2 mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tight'>
          KORFIT 면접 시뮬레이터
        </h1>
        <p className='text-lg text-muted-foreground'>
          한국 취업을 준비하는 외국인 유학생을 위한 AI 면접 연습
        </p>
      </div>

      <div className='space-y-6'>
        <h2 className='text-2xl font-bold'>사용 방법</h2>

        <div className='bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6'>
          <h3 className='font-semibold text-amber-900 dark:text-amber-100 mb-2'>
            💡 시작하기 전에
          </h3>
          <p className='text-sm text-amber-800 dark:text-amber-200'>
            <Badge variant='outline' className='mr-2'>
              질문 관리
            </Badge>
            메뉴에서 면접 질문을 먼저 등록해주세요. 질문이 없으면 기본 질문으로
            면접이 진행됩니다. 직무와 레벨에 맞는 맞춤형 면접을 위해서는 질문을
            카테고리별로 등록하는 것을 권장합니다.
          </p>
        </div>

        <div className='space-y-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex gap-4'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0'>
                  1
                </div>
                <div className='space-y-2 flex-1'>
                  <h3 className='font-semibold text-lg'>질문 등록 (선택)</h3>
                  <p className='text-sm text-muted-foreground'>
                    <Badge variant='outline' className='mr-2'>
                      질문 관리
                    </Badge>
                    메뉴에서 면접 질문을 등록합니다. 카테고리(공통/직무/외국인),
                    직무 타입, 레벨을 설정하여 맞춤형 질문 풀을 만들 수
                    있습니다.
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
                  <h3 className='font-semibold text-lg'>직무 선택</h3>
                  <p className='text-sm text-muted-foreground'>
                    <Badge variant='outline' className='mr-2'>
                      면접 시작
                    </Badge>
                    메뉴에서 지원 직무(마케팅/영업/IT)와 레벨(인턴/신입)을
                    선택합니다.
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
                  <h3 className='font-semibold text-lg'>면접 진행</h3>
                  <p className='text-sm text-muted-foreground'>
                    AI가 자동으로 생성한 5개의 질문에 답변합니다. 압박 꼬리질문
                    기능을 켜면 더 실전같은 연습이 가능합니다.
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
                  <h3 className='font-semibold text-lg'>AI 평가 받기</h3>
                  <p className='text-sm text-muted-foreground'>
                    면접 종료 후 논리성, 근거, 직무이해도, 한국어 격식, 완성도
                    5가지 항목으로 상세한 피드백을 받습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex gap-4'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0'>
                  5
                </div>
                <div className='space-y-2 flex-1'>
                  <h3 className='font-semibold text-lg'>답변 개선</h3>
                  <p className='text-sm text-muted-foreground'>
                    피드백을 바탕으로 답변을 수정하고, 답변 노트에 저장하여
                    나만의 면접 답변 라이브러리를 만듭니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20'>
          <h3 className='font-semibold mb-3'>핵심 기능</h3>
          <ul className='space-y-2 text-sm'>
            <li>
              • <strong>맞춤형 질문 생성:</strong> 직무와 레벨에 맞는 실전 질문
              자동 조합
            </li>
            <li>
              • <strong>압박 꼬리질문:</strong> 답변 분석 후 즉시 생성되는 심화
              질문
            </li>
            <li>
              • <strong>5각형 역량 진단:</strong> 논리/근거/직무이해/격식/완성도
              시각화
            </li>
            <li>
              • <strong>답변 노트:</strong> 개선된 답변을 저장하고 관리
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
