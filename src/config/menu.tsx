import {
  BookOpen,
  FileEdit,
  Play,
  BarChart3,
  BookMarked,
  Upload,
} from 'lucide-react';
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
        title: '면접 시작',
        href: '/interview/start',
        icon: Play,
      },
      {
        title: '면접 기록',
        href: '/interview/history',
        icon: BarChart3,
      },
      {
        title: '답변 노트',
        href: '/answer-notes',
        icon: BookMarked,
      },
      {
        title: '질문 관리',
        href: '/question-register',
        icon: FileEdit,
      },
      {
        title: '자동 공고 등록',
        href: '/auto-recruit',
        icon: Upload,
      },
    ],
  },
];
