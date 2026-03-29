import React, { FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const WAITLIST_ENDPOINT = 'https://formsubmit.co/ajax/vald.labs.lisbon@gmail.com';

export const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setMessage('Enter an email address to join the waitlist.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    const formData = new FormData();
    formData.append('email', email.trim());
    formData.append('_subject', 'New Vald Labs waitlist signup');
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');

    try {
      const response = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Waitlist submission failed');
      }

      setStatus('success');
      setMessage('You’re on the list. We’ll be in touch.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Submission failed. Try again in a moment.');
    }
  };

  return (
    <section id="waitlist" className="py-24 px-6 bg-zinc-950 border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl text-white font-jakarta tracking-tighter font-semibold mb-6">
          Shape what’s next.
        </h2>
        <p className="text-lg text-zinc-400 font-space-mono font-light mb-10 max-w-xl mx-auto">
          Join the waitlist for launch updates, early access, and behind-the-scenes development drops across the Våld Labs ecosystem.
        </p>

        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubmit}>
            <div className="relative flex-grow">
                <input 
                    type="email" 
                    name="email"
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={status === 'submitting'}
                    autoComplete="email"
                    className="w-full h-12 bg-zinc-900/50 border border-zinc-800 rounded-md px-4 text-white font-space-mono focus:outline-none focus:border-[#ffff00]/50 focus:ring-1 focus:ring-[#ffff00]/50 transition-all placeholder:text-zinc-600"
                />
            </div>
            <button
                type="submit"
                disabled={status === 'submitting'}
                className="h-12 bg-white text-black px-6 rounded-md font-space-mono font-bold hover:bg-[#ffff00] transition-colors flex items-center justify-center gap-2 group whitespace-nowrap disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
            >
                {status === 'submitting' ? 'Joining...' : 'Join'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </form>

        {message ? (
          <p
            aria-live="polite"
            className={`mt-4 text-sm font-space-mono ${
              status === 'success' ? 'text-[#ffff00]' : 'text-red-400'
            }`}
          >
            {message}
          </p>
        ) : null}
        
        <p className="mt-6 text-xs text-zinc-600 font-space-mono">
            No spam. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
};
