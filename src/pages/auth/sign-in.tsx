import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { orpc } from '@/lib/orpc';

const DURATION = 5000;
const POSITION = 'top-center';

const signInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      await orpc.auth.login({
        username: data.username,
        password: data.password,
      });

      navigate('/');
    } catch (err) {
      toast.error('Sign in failed', {
        duration: DURATION,
        position: POSITION,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className='flex min-h-screen bg-zinc-50 px-4 dark:bg-transparent'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]'
      >
        <div className='bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6'>
          <div className='text-center'>
            <div className='mx-auto block w-fit'>
              <img src='/public/logo.png' alt='logo' className='w-24' />
            </div>
            <h1 className='mb-1 mt-4 text-xl font-semibold'>Sign In</h1>
          </div>

          <div className='mt-6 space-y-4'>
            {/* Username Field */}
            <div className='space-y-2'>
              <Label htmlFor='username' className='block text-sm'>
                Username
              </Label>
              <div className='relative'>
                <Input
                  type='text'
                  id='username'
                  disabled={isLoading}
                  {...register('username')}
                  className={errors.username ? 'border-destructive' : ''}
                />
              </div>
              {errors.username && (
                <p className='text-destructive text-xs'>
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className='space-y-2'>
              <Label htmlFor='password' className='text-sm'>
                Password
              </Label>
              <div className='relative'>
                <Input
                  type='password'
                  id='password'
                  disabled={isLoading}
                  {...register('password')}
                  className={errors.password ? 'border-destructive' : ''}
                />
              </div>
              {errors.password && (
                <p className='text-destructive text-xs'>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading && <Spinner className='mr-2' />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </div>

        <div className='p-3'>
          <p className='text-accent-foreground text-center text-sm'>
            Don't have an account?
            <Button
              asChild={!isLoading}
              variant='link'
              className='px-2'
              disabled={isLoading}
            >
              {isLoading ? (
                <span className='opacity-50'>Create account</span>
              ) : (
                <Link to='/auth/sign-up'>Create account</Link>
              )}
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}
