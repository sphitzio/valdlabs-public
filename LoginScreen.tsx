import React, { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'vald_labs') {
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10 gap-4">
             <img 
                src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/df76b444-7f90-4e1e-9c20-de09704ac295_320w.png" 
                alt="Våld Labs" 
                className="w-auto h-8 opacity-90 invert-0" 
              />
              <div className="h-px w-12 bg-white/10 my-2"></div>
              <p className="text-zinc-500 font-space-mono text-xs tracking-widest uppercase flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Restricted Access
              </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative group">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="ENTER ACCESS CODE"
              className={`w-full h-12 bg-zinc-900/50 border ${error ? 'border-red-900/50 text-red-500 focus:border-red-500 placeholder:text-red-900' : 'border-zinc-800 text-white focus:border-[#ffff00]/50 placeholder:text-zinc-700'} rounded-md px-4 font-space-mono focus:outline-none focus:ring-1 focus:ring-[#ffff00]/20 transition-all text-center tracking-widest text-sm`}
              autoFocus
            />
          </div>
          
          <button 
            type="submit"
            className="h-12 bg-white hover:bg-[#ffff00] text-black font-space-mono font-bold rounded-md transition-all flex items-center justify-center gap-2 group text-sm uppercase tracking-wide hover:shadow-[0_0_20px_rgba(255,255,0,0.3)]"
          >
            Authenticate <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

           {error && (
            <p className="text-red-500 text-[10px] font-space-mono text-center uppercase tracking-wider mt-2">
              // Access Denied: Invalid Key
            </p>
          )}
        </form>
        
        <div className="mt-12 text-center">
            <p className="text-[10px] text-zinc-800 font-space-mono">
                SECURE GATEWAY v1.0
            </p>
        </div>
      </div>
    </div>
  );
};
