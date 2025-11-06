import { Route, Routes } from 'react-router-dom';
import SignIn from './pages/auth/sign-in';
import SignOut from './pages/auth/sign-out';
import { Layout } from '@/components/layout';
import { menuConfig } from './config/menu';
import { RequireAuth } from './components/require-auth';
import Explanation from './pages/explanation';
import QuestionRegister from './pages/question-register';
import QAndA from './pages/ai/qanda';

export default function App() {
  return (
    <>
      <Routes>
        <Route path='/auth/sign-in' element={<SignIn />} />
        <Route path='/auth/sign-out' element={<SignOut />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout menuSections={menuConfig} />}>
            <Route path='/' element={<Explanation />} />
            <Route path='/question-register' element={<QuestionRegister />} />
            <Route path='/ai/qanda' element={<QAndA />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
