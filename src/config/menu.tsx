import { BookOpen, FileEdit, MessageSquareText } from 'lucide-react';
import type { MenuSection } from '@/components/layout';

export const menuConfig: MenuSection[] = [
  {
    items: [
      {
        title: '사용 설명',
        href: '/',
        icon: BookOpen,
      },
      {
        title: '질문 관리',
        href: '/question-register',
        icon: FileEdit,
      },
      {
        title: 'AI 가상 면접',
        href: '/ai/qanda',
        icon: MessageSquareText,
      },
    ],
  },
];
