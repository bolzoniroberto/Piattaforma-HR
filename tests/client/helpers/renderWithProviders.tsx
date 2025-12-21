import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, ReactNode } from 'react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
  initialRoute?: string;
}

export function AllTheProviders({
  children,
  initialRoute = '/'
}: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();
  const { hook } = memoryLocation({ path: initialRoute });

  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={hook}>
        {children}
      </Router>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialRoute?: string }
) {
  const { initialRoute, ...renderOptions } = options || {};

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllTheProviders initialRoute={initialRoute}>
          {children}
        </AllTheProviders>
      ),
      ...renderOptions,
    }),
  };
}
