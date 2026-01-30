import React, { useState } from 'react';
import { GlassCard } from './GlassCard';

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [usernameInput, setUsernameInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      onLogin(usernameInput.trim());
    }
  };

  return (
    <GlassCard noGlow={true} className="max-w-md w-full text-center p-10">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Identify</h2>
        <p className="text-gray-400 text-sm">Enter your callsign to access the exchange.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input 
          type="text" 
          value={usernameInput} 
          onChange={(e) => setUsernameInput(e.target.value)} 
          placeholder="AGENT NAME" 
          className="w-full bg-black/50 border border-gray-700 rounded-xl px-6 py-4 text-white text-center font-mono text-lg focus:border-gold-500 focus:outline-none transition-colors placeholder:text-gray-700" 
        />
        <button 
          type="submit" 
          disabled={!usernameInput.trim()} 
          className="w-full py-4 bg-gold-600 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect
        </button>
      </form>
    </GlassCard>
  );
};