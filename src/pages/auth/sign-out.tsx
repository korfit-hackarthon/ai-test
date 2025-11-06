import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Loader from '@/components/kokonutui/loader';
import { orpc } from '@/lib/orpc';

export default function SignOut() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const signOut = async () => {
      await orpc.auth.logout();
      setIsLoading(false);
    };
    signOut();
  }, []);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader
          title='Signing out...'
          subtitle='Please wait while we sign you out'
        />
      </div>
    );
  }

  return <Navigate to='/auth/sign-in' replace />;
}
