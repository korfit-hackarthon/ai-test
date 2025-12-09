import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  Edit3,
  RotateCcw,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecruitData {
  title: string;
  companyImageUrl: string;
  companyName: string;
  zipcode: string;
  address1: string;
  address2: string;
  companyType: string;
  representativeName: string;
  establishedDate: string | null;
  businessType: string;
  jobRoles: string[];
  languageTypes: string[];
  visas: string[];
  isAlwaysRecruiting: boolean;
  recruitStartDate: string;
  recruitEndDate: string;
  contractType: string;
  directInputContractType: string;
  jobCategories: string[];
  workType: string;
  directInputWorkType: string;
  workDayType: string;
  directInputWorkDayType: string;
  workStartTime: string;
  workEndTime: string;
  directInputWorkTime: string;
  salaryType: string;
  salary: number;
  directInputSalaryType: string;
  posterImageUrl: string;
  mainTasks: string;
  qualifications: string;
  preferences: string;
  others: string;
  applicationMethod: string;
  directInputApplicationMethod: string;
  recruitPublishStatus: string;
}

interface StreamEvent {
  type: string;
  message?: string;
  content?: string;
  chunkIndex?: number;
  currentLength?: number;
  data?: RecruitData[];
  count?: number;
  error?: string;
  step?: string;
}

interface RegisterResult {
  title: string;
  success: boolean;
  error?: string;
  jobCategories?: string[];
  jobRoles?: string[];
}

type Step = 'input' | 'analyzing' | 'review' | 'submitting' | 'complete';

export default function AutoRecruit() {
  const [step, setStep] = useState<Step>('input');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [companyImageUrl, setCompanyImageUrl] = useState<string>('');
  const [applicationUrl, setApplicationUrl] = useState<string>('');

  // 스트리밍 상태
  const [streamLogs, setStreamLogs] = useState<StreamEvent[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  // 리뷰/수정 상태
  const [recruitDataList, setRecruitDataList] = useState<RecruitData[]>([]);
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // 제출 결과
  const [submitResults, setSubmitResults] = useState<RegisterResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 스트리밍 로그 자동 스크롤
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [streamLogs, streamingContent]);

  // JSON 텍스트 변경 시 유효성 검사
  useEffect(() => {
    if (!jsonText) {
      setJsonError('');
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setJsonError('JSON은 배열 형식이어야 합니다.');
        return;
      }
      setJsonError('');
      setRecruitDataList(parsed);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'JSON 파싱 오류');
    }
  }, [jsonText]);

  // PDF 파일 선택
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('PDF 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setPdfFile(file);
    setStep('input');
    setRecruitDataList([]);
    setJsonText('');
    setSubmitResults([]);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPdfBase64(base64 || '');
    };
    reader.readAsDataURL(file);

    toast.success(`${file.name} 파일이 선택되었습니다.`);
  };

  // 유효성 검사
  const validateInputs = (): boolean => {
    if (!pdfBase64) {
      toast.error('PDF 파일을 선택해주세요.');
      return false;
    }
    if (!companyImageUrl) {
      toast.error('회사 이미지 URL을 입력해주세요.');
      return false;
    }
    try {
      new URL(companyImageUrl);
    } catch {
      toast.error('올바른 회사 이미지 URL을 입력해주세요.');
      return false;
    }
    if (!applicationUrl) {
      toast.error('지원 사이트 주소를 입력해주세요.');
      return false;
    }
    try {
      new URL(applicationUrl);
    } catch {
      toast.error('올바른 지원 사이트 주소를 입력해주세요.');
      return false;
    }
    return true;
  };

  // 스트리밍 분석 시작
  const handleAnalyze = async () => {
    if (!validateInputs()) return;

    setStep('analyzing');
    setStreamLogs([]);
    setStreamingContent('');
    setIsStreaming(true);
    setRecruitDataList([]);
    setJsonText('');
    setJsonError('');

    abortControllerRef.current = new AbortController();

    try {
      console.log('[Frontend] 스트리밍 요청 시작...');
      const response = await fetch('/api/auto-recruit/preview-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          companyImageUrl,
          directInputApplicationMethod: applicationUrl,
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log('[Frontend] 응답 수신, 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Frontend] 응답 에러:', errorText);
        throw new Error(
          `스트리밍 요청 실패 (${response.status}): ${errorText}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('스트림을 읽을 수 없습니다.');
      }

      let buffer = '';
      let chunkCount = 0;

      console.log('[Frontend] 스트리밍 읽기 시작...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[Frontend] 스트리밍 완료, 총 청크:', chunkCount);
          break;
        }

        const decodedValue = decoder.decode(value, { stream: true });
        buffer += decodedValue;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamEvent = JSON.parse(line.slice(6));
              chunkCount++;

              if (data.type === 'chunk') {
                setStreamingContent((prev) => prev + (data.content || ''));
              } else if (data.type === 'keepalive') {
                // Keep-alive 이벤트 - 연결 유지용, 로그만 표시
                console.log('[Frontend] Keep-alive:', data.message);
                setStreamLogs((prev) => [...prev, data]);
              } else if (data.type === 'complete' || data.type === 'parsed') {
                console.log('[Frontend] 분석 완료 이벤트 수신:', data.type);
                setStreamLogs((prev) => [...prev, data]);
                if (data.data) {
                  setRecruitDataList(data.data);
                  setJsonText(JSON.stringify(data.data, null, 2));
                  setStep('review');
                }
              } else if (data.type === 'error') {
                console.error('[Frontend] 에러 이벤트 수신:', data);
                setStreamLogs((prev) => [...prev, data]);
                toast.error(data.message || '분석 중 오류가 발생했습니다.');
                setStep('input');
              } else {
                console.log('[Frontend] 이벤트:', data.type, data.message);
                setStreamLogs((prev) => [...prev, data]);
              }
            } catch (parseError) {
              console.warn('[Frontend] JSON 파싱 실패:', line, parseError);
            }
          }
        }
      }

      // 스트리밍이 끝났는데 recruitDataList가 비어있으면 에러
      // (complete 이벤트에서 setStep('review')와 setRecruitDataList가 호출됨)
      console.log(
        '[Frontend] 스트리밍 종료 시점 - 데이터 수신 완료 여부 확인 필요'
      );
    } catch (error) {
      console.error('[Frontend] 스트리밍 에러:', error);
      if ((error as Error).name !== 'AbortError') {
        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류';
        toast.error(`분석 중 오류가 발생했습니다: ${errorMessage}`);
        setStep('input');
      }
    } finally {
      setIsStreaming(false);
      console.log('[Frontend] 스트리밍 종료');
    }
  };

  // 분석 취소
  const handleCancelAnalysis = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStep('input');
    toast.info('분석이 취소되었습니다.');
  };

  // JSON 복사
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      toast.success('JSON이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  // JSON 포맷팅
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      toast.success('JSON이 정리되었습니다.');
    } catch {
      toast.error('유효하지 않은 JSON입니다.');
    }
  };

  // 개별 공고 삭제
  const handleDeleteItem = (index: number) => {
    const newList = recruitDataList.filter((_, i) => i !== index);
    setRecruitDataList(newList);
    setJsonText(JSON.stringify(newList, null, 2));
    toast.success('공고가 삭제되었습니다.');
  };

  // 최종 제출
  const handleSubmit = async () => {
    if (jsonError) {
      toast.error('JSON 오류를 먼저 수정해주세요.');
      return;
    }

    if (recruitDataList.length === 0) {
      toast.error('등록할 공고가 없습니다.');
      return;
    }

    setStep('submitting');
    setIsSubmitting(true);
    setSubmitResults([]);

    const results: RegisterResult[] = [];

    for (let i = 0; i < recruitDataList.length; i++) {
      const recruitData = recruitDataList[i];

      try {
        // 서버를 통해 외부 API 호출 (CORS 우회)
        const response = await fetch('/api/auto-recruit/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recruitData),
        });

        const result = await response.json();

        if (result.success) {
          results.push({
            title: recruitData?.title || `공고 ${i + 1}`,
            success: true,
            jobCategories: recruitData?.jobCategories,
            jobRoles: recruitData?.jobRoles,
          });
        } else {
          results.push({
            title: recruitData?.title || `공고 ${i + 1}`,
            success: false,
            error: result.error || '등록 실패',
            jobCategories: recruitData?.jobCategories,
            jobRoles: recruitData?.jobRoles,
          });
        }
      } catch (error) {
        results.push({
          title: recruitData?.title || `공고 ${i + 1}`,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
          jobCategories: recruitData?.jobCategories,
          jobRoles: recruitData?.jobRoles,
        });
      }

      setSubmitResults([...results]);
    }

    setIsSubmitting(false);
    setStep('complete');

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      toast.success(`${successCount}개의 공고가 성공적으로 등록되었습니다.`);
    }
    if (failCount > 0) {
      toast.error(`${failCount}개의 공고 등록에 실패했습니다.`);
    }
  };

  // 처음으로
  const handleReset = () => {
    setPdfFile(null);
    setPdfBase64('');
    setCompanyImageUrl('');
    setApplicationUrl('');
    setStep('input');
    setStreamLogs([]);
    setStreamingContent('');
    setRecruitDataList([]);
    setJsonText('');
    setJsonError('');
    setSubmitResults([]);
  };

  // 다시 분석
  const handleReAnalyze = () => {
    setStep('input');
    setRecruitDataList([]);
    setJsonText('');
    setStreamLogs([]);
    setStreamingContent('');
  };

  return (
    <div className='min-h-screen from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
      <div className='container max-w-6xl mx-auto py-8 px-4'>
        {/* 헤더 */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent'>
              AI 채용 공고 자동 등록
            </h1>
          </div>
          <p className='text-slate-600 dark:text-slate-400'>
            PDF를 업로드하면 AI가 분석하여 채용 공고를 자동으로 생성합니다.
          </p>
        </div>

        {/* 스텝 인디케이터 */}
        <div className='mb-8'>
          <div className='flex items-center justify-between max-w-2xl mx-auto'>
            {[
              { key: 'input', label: 'PDF 업로드', icon: Upload },
              { key: 'analyzing', label: 'AI 분석', icon: Zap },
              { key: 'review', label: '검토 & 수정', icon: Edit3 },
              { key: 'complete', label: '등록 완료', icon: CheckCircle2 },
            ].map((s, i) => {
              const isActive =
                step === s.key || (step === 'submitting' && s.key === 'review');
              const isPast =
                (step === 'analyzing' && i === 0) ||
                (step === 'review' && i <= 1) ||
                (step === 'submitting' && i <= 2) ||
                (step === 'complete' && i <= 2);
              const Icon = s.icon;

              return (
                <div key={s.key} className='flex items-center'>
                  <div className='flex flex-col items-center'>
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                        isActive
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-110'
                          : isPast
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                      )}
                    >
                      <Icon className='w-5 h-5' />
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-2 font-medium transition-colors',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : isPast
                            ? 'text-slate-600 dark:text-slate-400'
                            : 'text-slate-400 dark:text-slate-600'
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div
                      className={cn(
                        'w-20 h-0.5 mx-2 transition-colors',
                        isPast
                          ? 'bg-indigo-300 dark:bg-indigo-700'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: 입력 폼 */}
        {step === 'input' && (
          <Card className='border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Upload className='w-5 h-5 text-indigo-500' />
                공고 정보 입력
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* PDF 업로드 */}
              <div className='space-y-3'>
                <Label className='text-sm font-medium flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-slate-500' />
                  PDF 파일
                </Label>
                <div
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20',
                    pdfFile
                      ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <input
                    id='pdf-upload'
                    type='file'
                    accept='.pdf'
                    onChange={handleFileChange}
                    className='hidden'
                  />
                  {pdfFile ? (
                    <div className='flex items-center justify-center gap-3'>
                      <div className='p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/50'>
                        <FileText className='w-6 h-6 text-indigo-600 dark:text-indigo-400' />
                      </div>
                      <div className='text-left'>
                        <p className='font-medium text-slate-900 dark:text-white'>
                          {pdfFile.name}
                        </p>
                        <p className='text-sm text-slate-500'>
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className='w-10 h-10 mx-auto text-slate-400 mb-3' />
                      <p className='text-slate-600 dark:text-slate-400 font-medium'>
                        클릭하여 PDF 파일 선택
                      </p>
                      <p className='text-sm text-slate-400 mt-1'>최대 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator className='bg-slate-100 dark:bg-slate-800' />

              {/* URL 입력들 */}
              <div className='grid md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <Label className='text-sm font-medium flex items-center gap-2'>
                    <ImageIcon className='w-4 h-4 text-slate-500' />
                    회사 이미지 URL
                  </Label>
                  <Input
                    type='url'
                    placeholder='https://example.com/logo.png'
                    value={companyImageUrl}
                    onChange={(e) => setCompanyImageUrl(e.target.value)}
                    className='h-11 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20'
                  />
                </div>
                <div className='space-y-3'>
                  <Label className='text-sm font-medium flex items-center gap-2'>
                    <LinkIcon className='w-4 h-4 text-slate-500' />
                    지원 사이트 주소
                  </Label>
                  <Input
                    type='url'
                    placeholder='https://example.com/careers'
                    value={applicationUrl}
                    onChange={(e) => setApplicationUrl(e.target.value)}
                    className='h-11 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20'
                  />
                </div>
              </div>

              <Separator className='bg-slate-100 dark:bg-slate-800' />

              <Button
                onClick={handleAnalyze}
                disabled={!pdfBase64}
                size='lg'
                className='w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 text-base font-medium'
              >
                <Zap className='w-5 h-5 mr-2' />
                AI 분석 시작
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI 분석 중 */}
        {step === 'analyzing' && (
          <Card className='border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Loader2 className='w-5 h-5 text-indigo-500 animate-spin' />
                AI 분석 진행 중
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* 진행 상태 로그 */}
              <div
                ref={logContainerRef}
                className='bg-slate-900 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm'
              >
                {streamLogs.map((log, i) => (
                  <div
                    key={i}
                    className={cn(
                      'py-1',
                      log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'complete' || log.type === 'parsed'
                          ? 'text-green-400'
                          : 'text-slate-300'
                    )}
                  >
                    <span className='text-slate-500'>[{log.type}]</span>{' '}
                    {log.message}
                  </div>
                ))}
                {isStreaming && streamingContent && (
                  <div className='py-1 text-indigo-400'>
                    <span className='text-slate-500'>[streaming]</span>{' '}
                    <span className='text-xs text-slate-500'>
                      {streamingContent.length} chars received...
                    </span>
                  </div>
                )}
                {isStreaming && (
                  <div className='flex items-center gap-2 py-2'>
                    <div className='w-2 h-2 bg-indigo-500 rounded-full animate-pulse' />
                    <span className='text-slate-400'>분석 중...</span>
                  </div>
                )}
              </div>

              {/* 실시간 스트리밍 미리보기 */}
              {streamingContent && (
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                    AI 응답 미리보기
                  </Label>
                  <ScrollArea className='h-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'>
                    <pre className='p-4 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all'>
                      {streamingContent}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              <Button
                variant='outline'
                onClick={handleCancelAnalysis}
                className='w-full'
              >
                분석 취소
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: 검토 & 수정 */}
        {(step === 'review' || step === 'submitting') && (
          <div className='space-y-6'>
            {/* 요약 카드 */}
            <div className='grid md:grid-cols-3 gap-4'>
              <Card className='border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'>
                <CardContent className='pt-6'>
                  <div className='text-center'>
                    <div className='text-4xl font-bold'>
                      {recruitDataList.length}
                    </div>
                    <div className='text-indigo-100 text-sm mt-1'>
                      추출된 공고
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className='border-0 bg-white dark:bg-slate-900 shadow-lg'>
                <CardContent className='pt-6'>
                  <div className='text-center'>
                    <div className='text-4xl font-bold text-slate-900 dark:text-white'>
                      {recruitDataList.filter((d) => d.title).length}
                    </div>
                    <div className='text-slate-500 text-sm mt-1'>
                      유효한 제목
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className='border-0 bg-white dark:bg-slate-900 shadow-lg'>
                <CardContent className='pt-6'>
                  <div className='text-center'>
                    <div
                      className={cn(
                        'text-4xl font-bold',
                        jsonError ? 'text-red-500' : 'text-green-500'
                      )}
                    >
                      {jsonError ? '⚠' : '✓'}
                    </div>
                    <div className='text-slate-500 text-sm mt-1'>
                      {jsonError ? 'JSON 오류' : 'JSON 정상'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* JSON 편집기 */}
            <Card className='border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'>
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <Edit3 className='w-5 h-5 text-indigo-500' />
                    JSON 데이터 검토 & 수정
                  </CardTitle>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleFormatJson}
                      className='text-xs'
                    >
                      정렬
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCopyJson}
                      className='text-xs'
                    >
                      {copied ? (
                        <Check className='w-3 h-3 mr-1' />
                      ) : (
                        <Copy className='w-3 h-3 mr-1' />
                      )}
                      복사
                    </Button>
                  </div>
                </div>
                {jsonError && (
                  <div className='flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-600 dark:text-red-400 text-sm mt-2'>
                    <AlertCircle className='w-4 h-4 flex-shrink-0' />
                    {jsonError}
                  </div>
                )}
              </CardHeader>
              <CardContent className='space-y-4'>
                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className={cn(
                    'font-mono text-sm h-96 resize-none border-slate-200 dark:border-slate-700',
                    jsonError &&
                      'border-red-300 dark:border-red-700 focus:ring-red-500/20'
                  )}
                  placeholder='JSON 데이터가 여기에 표시됩니다...'
                />
              </CardContent>
            </Card>

            {/* 공고 목록 미리보기 */}
            <Card className='border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Eye className='w-5 h-5 text-indigo-500' />
                  공고 미리보기
                  <Badge variant='secondary' className='ml-2'>
                    {recruitDataList.length}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {recruitDataList.map((item, index) => (
                    <div
                      key={index}
                      className='border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden'
                    >
                      <div
                        className='flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'
                        onClick={() =>
                          setExpandedIndex(
                            expandedIndex === index ? null : index
                          )
                        }
                      >
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-sm'>
                            {index + 1}
                          </div>
                          <div>
                            <p className='font-medium text-slate-900 dark:text-white'>
                              {item.title || '제목 없음'}
                            </p>
                            <div className='flex gap-2 mt-1'>
                              <Badge variant='outline' className='text-xs'>
                                {item.companyName || '회사명 없음'}
                              </Badge>
                              <Badge variant='secondary' className='text-xs'>
                                {item.contractType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(index);
                            }}
                            className='text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                          {expandedIndex === index ? (
                            <ChevronUp className='w-5 h-5 text-slate-400' />
                          ) : (
                            <ChevronDown className='w-5 h-5 text-slate-400' />
                          )}
                        </div>
                      </div>
                      {expandedIndex === index && (
                        <div className='px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800'>
                          <div className='grid md:grid-cols-2 gap-4 mt-4 text-sm'>
                            <div>
                              <span className='text-slate-500'>주소:</span>{' '}
                              <span className='text-slate-900 dark:text-white'>
                                {item.address1}
                              </span>
                            </div>
                            <div>
                              <span className='text-slate-500'>근무형태:</span>{' '}
                              <span className='text-slate-900 dark:text-white'>
                                {item.workType}
                              </span>
                            </div>
                            <div>
                              <span className='text-slate-500'>급여:</span>{' '}
                              <span className='text-slate-900 dark:text-white'>
                                {item.salaryType}{' '}
                                {item.salary > 0 &&
                                  `- ${item.salary.toLocaleString()}`}
                              </span>
                            </div>
                            <div>
                              <span className='text-slate-500'>채용기간:</span>{' '}
                              <span className='text-slate-900 dark:text-white'>
                                {item.recruitStartDate} ~ {item.recruitEndDate}
                              </span>
                            </div>
                          </div>
                          <div className='mt-4'>
                            <span className='text-slate-500 text-sm'>
                              직무 역할:
                            </span>
                            <div className='flex flex-wrap gap-1 mt-1'>
                              {item.jobRoles?.map((role) => (
                                <Badge
                                  key={role}
                                  variant='secondary'
                                  className='text-xs'
                                >
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className='mt-4'>
                            <span className='text-slate-500 text-sm'>
                              주요 업무:
                            </span>
                            <p className='text-slate-700 dark:text-slate-300 text-sm mt-1 whitespace-pre-wrap'>
                              {item.mainTasks}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 액션 버튼 */}
            <div className='flex gap-4'>
              <Button
                variant='outline'
                onClick={handleReAnalyze}
                className='flex-1'
                disabled={isSubmitting}
              >
                <RotateCcw className='w-4 h-4 mr-2' />
                다시 분석
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting || !!jsonError || recruitDataList.length === 0
                }
                className='flex-[2] h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 text-base font-medium'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                    등록 중... ({submitResults.length}/{recruitDataList.length})
                  </>
                ) : (
                  <>
                    <Send className='w-5 h-5 mr-2' />
                    최종 등록하기 ({recruitDataList.length}개)
                  </>
                )}
              </Button>
            </div>

            {/* 실시간 등록 결과 (제출 중) */}
            {isSubmitting && submitResults.length > 0 && (
              <Card className='border-0 shadow-xl'>
                <CardContent className='pt-6'>
                  <div className='space-y-2'>
                    {submitResults.map((result, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg',
                          result.success
                            ? 'bg-green-50 dark:bg-green-950/30'
                            : 'bg-red-50 dark:bg-red-950/30'
                        )}
                      >
                        {result.success ? (
                          <CheckCircle2 className='w-5 h-5 text-green-500' />
                        ) : (
                          <XCircle className='w-5 h-5 text-red-500' />
                        )}
                        <span className='text-sm font-medium'>
                          {result.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: 등록 완료 */}
        {step === 'complete' && (
          <div className='space-y-6'>
            {/* 결과 요약 */}
            <Card className='border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden'>
              <div className='bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center text-white'>
                <CheckCircle2 className='w-16 h-16 mx-auto mb-4 opacity-90' />
                <h2 className='text-2xl font-bold'>등록 완료!</h2>
                <p className='text-indigo-100 mt-2'>
                  총 {submitResults.length}개 공고 처리 완료
                </p>
              </div>
              <CardContent className='pt-6'>
                <div className='grid md:grid-cols-2 gap-4 mb-6'>
                  <div className='text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-xl'>
                    <div className='text-3xl font-bold text-green-600'>
                      {submitResults.filter((r) => r.success).length}
                    </div>
                    <div className='text-green-600 text-sm'>성공</div>
                  </div>
                  <div className='text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-xl'>
                    <div className='text-3xl font-bold text-red-600'>
                      {submitResults.filter((r) => !r.success).length}
                    </div>
                    <div className='text-red-600 text-sm'>실패</div>
                  </div>
                </div>

                {/* 상세 결과 */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-16'>상태</TableHead>
                      <TableHead>공고 제목</TableHead>
                      <TableHead className='w-32'>결과</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submitResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {result.success ? (
                            <CheckCircle2 className='w-5 h-5 text-green-500' />
                          ) : (
                            <XCircle className='w-5 h-5 text-red-500' />
                          )}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {result.title}
                        </TableCell>
                        <TableCell>
                          {result.success ? (
                            <Badge className='bg-green-500'>성공</Badge>
                          ) : (
                            <div>
                              <Badge variant='destructive'>실패</Badge>
                              {result.error && (
                                <p className='text-xs text-red-500 mt-1 max-w-xs truncate'>
                                  {result.error}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Button
              onClick={handleReset}
              size='lg'
              className='w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            >
              <Plus className='w-5 h-5 mr-2' />
              새로운 공고 등록하기
            </Button>
          </div>
        )}

        {/* 사용 안내 */}
        {step === 'input' && (
          <Card className='mt-6 border-0 bg-slate-50/50 dark:bg-slate-900/50'>
            <CardContent className='pt-6'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 text-slate-400 mt-0.5' />
                <div className='space-y-2 text-sm text-slate-500'>
                  <p className='font-medium text-slate-700 dark:text-slate-300'>
                    사용 방법
                  </p>
                  <ol className='list-decimal list-inside space-y-1'>
                    <li>채용 공고가 담긴 PDF 파일을 업로드합니다.</li>
                    <li>
                      회사 로고 이미지 URL과 지원 페이지 URL을 입력합니다.
                    </li>
                    <li>
                      AI가 분석한 결과를 JSON 형태로 검토하고 필요시 수정합니다.
                    </li>
                    <li>최종 등록 버튼을 눌러 공고를 등록합니다.</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
