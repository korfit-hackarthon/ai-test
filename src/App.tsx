import { Route, Routes } from 'react-router-dom';
import SignIn from './pages/auth/sign-in';
import SignOut from './pages/auth/sign-out';
import { Layout } from '@/components/layout';
import { menuConfig } from './config/menu';
import { RequireAuth } from './components/require-auth';
import Explanation from './pages/explanation';
import QuestionRegister from './pages/question-register';
import InterviewStart from './pages/interview/start';
import InterviewSession from './pages/interview/session.tsx';
import InterviewResult from './pages/interview/result';
import InterviewHistory from './pages/interview/history';
import AnswerNotes from './pages/answer-notes';

export default function App() {
  return (
    <>
      <Routes>
        <Route path='/auth/sign-in' element={<SignIn />} />
        <Route path='/auth/sign-out' element={<SignOut />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout menuSections={menuConfig} />}>
            <Route path='/' element={<Explanation />} />
            <Route path='/interview/start' element={<InterviewStart />} />
            <Route
              path='/interview/session/:setId'
              element={<InterviewSession />}
            />
            <Route
              path='/interview/result/:setId'
              element={<InterviewResult />}
            />
            <Route path='/interview/history' element={<InterviewHistory />} />
            <Route path='/answer-notes' element={<AnswerNotes />} />
            <Route path='/question-register' element={<QuestionRegister />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
