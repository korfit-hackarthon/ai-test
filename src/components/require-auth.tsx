import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Loader from './kokonutui/loader';
import { orpc } from '@/lib/orpc';

export function RequireAuth() {
  const {
    data: session,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const result = await orpc.auth.getSession();
        return result ?? null;
      } catch (error) {
        console.error('Session fetch error:', error);
        return null;
      }
    },
  });

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader />
      </div>
    );
  }

  if (isError) {
    return <Navigate to='/auth/sign-in' replace />;
  }

  if (!session) {
    return <Navigate to='/auth/sign-in' replace />;
  }

  return <Outlet />;
}
