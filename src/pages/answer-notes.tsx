import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { BookOpen, Edit, Trash2, Save } from 'lucide-react';
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

interface AnswerNote {
  id: number;
  questionId: number;
  initialAnswer: string;
  firstFeedback?: string;
  secondFeedback?: string;
  finalAnswer?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AnswerNotes() {
  const [notes, setNotes] = useState<AnswerNote[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    finalAnswer: '',
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/answer-notes');
      if (!response.ok) throw new Error('Failed to fetch notes');

      const data = await response.json();
      setNotes(data);
    } catch (error) {
      toast.error('답변 노트를 불러오는데 실패했습니다.', { duration: 5000 });
    }
  };

  const handleEdit = (note: AnswerNote) => {
    setEditingId(note.id);
    setEditData({
      finalAnswer: note.finalAnswer || '',
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/answer-notes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) throw new Error('Failed to update note');

      toast.success('답변 노트가 수정되었습니다.');
      setEditingId(null);
      fetchNotes();
    } catch (error) {
      toast.error('수정에 실패했습니다.', { duration: 5000 });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/answer-notes/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');

      toast.success('답변 노트가 삭제되었습니다.');
      fetchNotes();
    } catch (error) {
      toast.error('삭제에 실패했습니다.', { duration: 5000 });
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className='container max-w-5xl mx-auto py-8 px-4 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>나의 답변 노트</h1>
        <p className='text-muted-foreground'>
          면접 답변을 저장하고 개선하여 나만의 답변 라이브러리를 만드세요.
        </p>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <BookOpen className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-muted-foreground mb-4'>
              아직 저장된 답변 노트가 없습니다.
            </p>
            <p className='text-sm text-muted-foreground'>
              면접 결과 페이지에서 답변을 저장하면 여기에 표시됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-lg'>
                      질문 #{note.questionId}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(note.updatedAt)}
                    </CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    {editingId === note.id ? (
                      <>
                        <Button size='sm' onClick={handleSave}>
                          <Save className='mr-2 h-4 w-4' />
                          저장
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleEdit(note)}
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          수정
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-destructive hover:text-destructive'
                          onClick={() => setDeleteId(note.id)}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          삭제
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <div className='flex items-center gap-2 mb-2'>
                    <Badge>초기 답변</Badge>
                  </div>
                  <div className='bg-muted/50 rounded-lg p-4 border'>
                    <p className='text-sm whitespace-pre-wrap'>
                      {note.initialAnswer}
                    </p>
                  </div>
                </div>

                {note.firstFeedback && (
                  <>
                    <Separator />
                    <div>
                      <div className='flex items-center gap-2 mb-2'>
                        <Badge>AI 평가</Badge>
                      </div>
                      <div className='bg-muted/30 rounded-lg p-4 border'>
                        <p className='text-sm whitespace-pre-wrap text-muted-foreground'>
                          {note.firstFeedback}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {note.secondFeedback && (
                  <>
                    <Separator />
                    <div>
                      <div className='flex items-center gap-2 mb-2'>
                        <Badge>개선 제안</Badge>
                      </div>
                      <div className='bg-muted/30 rounded-lg p-4 border'>
                        <p className='text-sm whitespace-pre-wrap text-muted-foreground'>
                          {note.secondFeedback}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <div className='flex items-center gap-2 mb-2'>
                    <Badge variant='default'>최종 답변</Badge>
                  </div>
                  {editingId === note.id ? (
                    <Textarea
                      value={editData.finalAnswer}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          finalAnswer: e.target.value,
                        })
                      }
                      rows={8}
                      className='resize-none'
                      placeholder='개선된 최종 답변을 작성하세요...'
                    />
                  ) : (
                    <div className='bg-primary/5 rounded-lg p-4 border-2 border-primary/20'>
                      <p className='text-sm whitespace-pre-wrap'>
                        {note.finalAnswer ||
                          '아직 최종 답변이 작성되지 않았습니다.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>답변 노트를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
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
