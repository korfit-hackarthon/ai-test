import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { orpc } from '@/lib/orpc';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export function UserButton() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const session = await orpc.auth.getSession();
      return session;
    },
  });

  const handleSignOut = async () => {
    await navigate('/auth/sign-out');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='relative h-10 w-full justify-start gap-2 px-2'
        >
          <Avatar className='h-7 w-7'>
            <AvatarImage src={''} alt={session?.username || ''} />
            <AvatarFallback className='text-xs'>
              {session?.username?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col items-start text-sm'>
            <span className='font-medium leading-none'>
              {session?.username}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>
              {session?.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className='mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
              <Moon className='absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
              <span>테마</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) =>
                  setTheme(value as 'light' | 'dark' | 'system')
                }
              >
                <DropdownMenuRadioItem value='light'>
                  <Sun className='mr-2 h-4 w-4' />
                  <span>Light</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='dark'>
                  <Moon className='mr-2 h-4 w-4' />
                  <span>Dark</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='system'>
                  <Monitor className='mr-2 h-4 w-4' />
                  <span>System</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className='text-red-600 dark:text-red-400'
        >
          <LogOut className='mr-2 h-4 w-4' />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
