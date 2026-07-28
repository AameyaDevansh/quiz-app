'use client';

export const clerkAppearance = {
  variables: {
    colorPrimary: '#ff3e9a',
    colorBackground: '#1e1440',
    colorText: '#ffffff',
    colorTextSecondary: '#b6a8de',
    colorInputBackground: '#150e2b',
    colorInputText: '#ffffff',
    borderRadius: '14px',
    fontFamily: 'Fredoka, sans-serif',
  },
  elements: {
    card: {
      boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
      border: '1px solid #3d2b72',
    },
    formButtonPrimary: {
      backgroundColor: '#ff3e9a',
      boxShadow: '0 4px 0 #4a1638',
      '&:hover': { backgroundColor: '#ff6bb5' },
    },
    footerActionLink: { color: '#ff6bb5' },
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, var(--accent-dim) 0%, var(--bg) 60%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '60px 60px', opacity: 0.3,
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
      }} />
      <div style={{ position: 'relative' }} className="animate-fade-up">
        {children}
      </div>
    </main>
  );
}
