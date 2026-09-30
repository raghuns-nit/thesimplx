import { createContext, useContext, useState, type ReactNode } from 'react';

interface LoaderContextValue {
  show: (msg?: string) => void;
  hide: () => void;
  message: string | null;
}

const LoaderContext = createContext<LoaderContextValue>({
  show: () => {},
  hide: () => {},
  message: null,
});

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const show = (msg = 'Loading...') => setMessage(msg);
  const hide = () => setMessage(null);

  return (
    <LoaderContext.Provider value={{ show, hide, message }}>
      {children}
      {message && (
        <div className="loader-overlay">
          <div className="spinner" />
          <p style={{ fontWeight: 600 }}>{message}</p>
        </div>
      )}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  return useContext(LoaderContext);
}
