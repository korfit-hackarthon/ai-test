import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        // React Query v5에서 undefined 방지
        throwOnError: false,
      },
    },
  });
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme='system' storageKey='exfrp-ui-theme'>
          {children}
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
