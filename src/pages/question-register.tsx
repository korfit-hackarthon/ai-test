import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Question {
  id: number;
  question: string;
  category: 'common' | 'job' | 'foreigner';
  jobType?: 'marketing' | 'sales' | 'it';
  level?: 'intern' | 'entry';
  modelAnswer: string;
  reasoning: string;
  createdAt: string;
  updatedAt: string;
}

export default function QuestionRegister() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    category: 'common' as 'common' | 'job' | 'foreigner',
    jobType: '' as 'marketing' | 'sales' | 'it' | '',
    level: '' as 'intern' | 'entry' | '',
    modelAnswer: '',
    reasoning: '',
  });

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || '질문 목록을 불러오는데 실패했습니다.'
        );
      }
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '질문 목록을 불러오는데 실패했습니다.',
        {
          duration: 5000,
        }
      );
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId ? `/api/questions/${editingId}` : '/api/questions';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '저장에 실패했습니다.');
      }

      toast.success(
        editingId ? '질문이 수정되었습니다.' : '질문이 등록되었습니다.'
      );
      resetForm();
      fetchQuestions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '저장에 실패했습니다.',
        {
          duration: 5000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setFormData({
      question: question.question,
      category: question.category,
      jobType: question.jobType || '',
      level: question.level || '',
      modelAnswer: question.modelAnswer,
      reasoning: question.reasoning,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/questions/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '삭제에 실패했습니다.');
      }

      toast.success('질문이 삭제되었습니다.');
      fetchQuestions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '삭제에 실패했습니다.',
        {
          duration: 5000,
        }
      );
    } finally {
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      category: 'common',
      jobType: '',
      level: '',
      modelAnswer: '',
      reasoning: '',
    });
    setEditingId(null);
  };

  return (
    <div className='container max-w-7xl mx-auto py-8 px-4 space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>질문 관리</h1>
        <p className='text-muted-foreground'>
          학습용 질문과 모범답안을 등록하고 관리합니다.
        </p>
      </div>

      <div className='grid gap-8 lg:grid-cols-2'>
        {/* 등록/수정 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {editingId ? (
                <Edit className='h-5 w-5' />
              ) : (
                <Plus className='h-5 w-5' />
              )}
              {editingId ? '질문 수정' : '새 질문 등록'}
            </CardTitle>
            <CardDescription>
              {editingId
                ? '선택한 질문을 수정합니다.'
                : '새로운 학습 질문을 등록합니다.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <Label htmlFor='category'>카테고리</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'common' | 'job' | 'foreigner') =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id='category'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='common'>공통</SelectItem>
                      <SelectItem value='job'>직무</SelectItem>
                      <SelectItem value='foreigner'>외국인 특화</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='jobType'>직무 (선택)</Label>
                  <Select
                    value={formData.jobType || 'none'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        jobType:
                          value === 'none'
                            ? ''
                            : (value as 'marketing' | 'sales' | 'it'),
                      })
                    }
                  >
                    <SelectTrigger id='jobType'>
                      <SelectValue placeholder='선택 안함' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>선택 안함</SelectItem>
                      <SelectItem value='marketing'>마케팅</SelectItem>
                      <SelectItem value='sales'>영업</SelectItem>
                      <SelectItem value='it'>개발(IT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='level'>레벨 (선택)</Label>
                  <Select
                    value={formData.level || 'none'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        level:
                          value === 'none' ? '' : (value as 'intern' | 'entry'),
                      })
                    }
                  >
                    <SelectTrigger id='level'>
                      <SelectValue placeholder='선택 안함' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>선택 안함</SelectItem>
                      <SelectItem value='intern'>인턴</SelectItem>
                      <SelectItem value='entry'>신입</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='question'>질문</Label>
                <Textarea
                  id='question'
                  placeholder='학습자에게 제시할 질문을 입력하세요...'
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  required
                  rows={3}
                  className='resize-none'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='modelAnswer'>모범답안</Label>
                <Textarea
                  id='modelAnswer'
                  placeholder='이 질문에 대한 모범답안을 입력하세요...'
                  value={formData.modelAnswer}
                  onChange={(e) =>
                    setFormData({ ...formData, modelAnswer: e.target.value })
                  }
                  required
                  rows={4}
                  className='resize-none'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='reasoning'>모범답안의 논리와 이유</Label>
                <Textarea
                  id='reasoning'
                  placeholder='모범답안이 왜 올바른지, 어떤 논리에 기반하는지 설명하세요...'
                  value={formData.reasoning}
                  onChange={(e) =>
                    setFormData({ ...formData, reasoning: e.target.value })
                  }
                  required
                  rows={5}
                  className='resize-none'
                />
              </div>

              <div className='flex gap-2'>
                <Button type='submit' disabled={isLoading} className='flex-1'>
                  <Save className='mr-2 h-4 w-4' />
                  {isLoading
                    ? '저장 중...'
                    : editingId
                      ? '수정하기'
                      : '등록하기'}
                </Button>
                {editingId && (
                  <Button type='button' variant='outline' onClick={resetForm}>
                    <X className='mr-2 h-4 w-4' />
                    취소
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 등록된 질문 목록 */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold'>등록된 질문 목록</h2>
            <span className='text-sm text-muted-foreground'>
              총 {questions.length}개
            </span>
          </div>

          <div className='space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto pr-2'>
            {questions.length === 0 ? (
              <Card>
                <CardContent className='py-12 text-center'>
                  <p className='text-muted-foreground'>
                    등록된 질문이 없습니다.
                  </p>
                  <p className='text-sm text-muted-foreground mt-2'>
                    왼쪽 폼에서 첫 번째 질문을 등록해보세요.
                  </p>
                </CardContent>
              </Card>
            ) : (
              questions.map((q) => (
                <Card
                  key={q.id}
                  className={editingId === q.id ? 'border-primary' : ''}
                >
                  <CardContent className='pt-6'>
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Badge variant='outline'>
                          {q.category === 'common'
                            ? '공통'
                            : q.category === 'job'
                              ? '직무'
                              : '외국인'}
                        </Badge>
                        {q.jobType && (
                          <Badge variant='secondary'>
                            {q.jobType === 'marketing'
                              ? '마케팅'
                              : q.jobType === 'sales'
                                ? '영업'
                                : '개발(IT)'}
                          </Badge>
                        )}
                        {q.level && (
                          <Badge variant='secondary'>
                            {q.level === 'intern' ? '인턴' : '신입'}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <p className='text-sm font-medium text-muted-foreground mb-1'>
                          질문
                        </p>
                        <p className='text-sm font-medium'>{q.question}</p>
                      </div>

                      <Separator />

                      <div>
                        <p className='text-sm font-medium text-muted-foreground mb-1'>
                          모범답안
                        </p>
                        <p className='text-sm line-clamp-2'>{q.modelAnswer}</p>
                      </div>

                      <div>
                        <p className='text-sm font-medium text-muted-foreground mb-1'>
                          논리/이유
                        </p>
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {q.reasoning}
                        </p>
                      </div>

                      <div className='flex items-center justify-between pt-2'>
                        <span className='text-xs text-muted-foreground'>
                          {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleEdit(q)}
                          >
                            <Edit className='h-3 w-3 mr-1' />
                            수정
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='text-destructive hover:text-destructive'
                            onClick={() => setDeleteId(q.id)}
                          >
                            <Trash2 className='h-3 w-3 mr-1' />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>질문을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 질문과 관련된 모든 학습 기록이 함께
              삭제될 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
