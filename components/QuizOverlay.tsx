import React from 'react';
import { Question } from '../types';
import { GlassCard } from './GlassCard';

interface QuizOverlayProps {
  question: Question;
  selectedOption: number | null;
  showExplanation: boolean;
  aiTip: string;
  loadingAi: boolean;
  onAnswer: (index: number) => void;
  onClose: () => void;
}

export const QuizOverlay: React.FC<QuizOverlayProps> = ({
  question,
  selectedOption,
  showExplanation,
  aiTip,
  loadingAi,
  onAnswer,
  onClose
}) => {
  return (
    // Fixed positioning ensures it covers the viewport without causing scroll on the body
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <GlassCard 
        noGlow={false} 
        className="max-w-3xl w-full bg-black/90 border-red-500/30 max-h-[90vh] flex flex-col"
        contentClassName="p-6 md:p-8 flex flex-col h-full overflow-hidden"
      >
        {/* Header - Fixed */}
        <div className="flex-none flex items-center gap-4 mb-4 text-red-500 border-b border-red-900/50 pb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          <h3 className="font-mono text-xl tracking-widest font-bold uppercase">Firewall Intrusion Detected</h3>
        </div>

        {/* Question - Fixed or shrinkable */}
        <div className="flex-none mb-6">
          <span className="inline-block px-3 py-1 rounded bg-gray-800 text-xs font-mono text-gray-400 mb-2">{question.category}</span>
          <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{question.question}</h2>
        </div>

        {/* Options - Scrollable if too many/screen too small */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2 custom-scrollbar">
          {question.options.map((option, index) => {
            // Logic for styling buttons after selection
            let btnClass = "w-full p-4 rounded-lg border text-left font-mono text-sm transition-all ";
            if (selectedOption === null) {
              btnClass += "border-gray-700 bg-gray-900/50 hover:bg-gray-800 hover:border-gold-500 text-gray-300";
            } else {
              if (index === question.correctAnswer) btnClass += "border-emerald-500 bg-emerald-900/20 text-emerald-400";
              else if (index === selectedOption) btnClass += "border-red-500 bg-red-900/20 text-red-400";
              else btnClass += "border-gray-800 bg-black/50 text-gray-600 opacity-50";
            }

            return (
              <button 
                key={index}
                disabled={selectedOption !== null}
                onClick={() => onAnswer(index)}
                className={btnClass}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Footer (Explanation + Action) - Fixed at bottom if space permits, or flows naturally */}
        {showExplanation && (
          <div className="flex-none mt-4 pt-4 border-t border-gray-800 animate-in slide-in-from-bottom-2">
            <div className={`p-3 rounded border-l-2 max-h-[150px] overflow-y-auto ${selectedOption === question.correctAnswer ? 'border-emerald-500 bg-emerald-900/10' : 'border-red-500 bg-red-900/10'}`}>
              <p className="text-sm text-gray-300 leading-relaxed">{question.explanation}</p>
              
              {/* AI Tip Section */}
              {selectedOption !== question.correctAnswer && (
                <div className="text-xs font-mono text-gold-500/80 mt-2">
                  {loadingAi ? "Decrypting AI Analysis..." : aiTip ? `AI: "${aiTip}"` : ""}
                </div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="mt-4 w-full py-3 bg-white text-black font-bold font-mono uppercase tracking-widest hover:bg-gold-400 transition-colors"
            >
              {selectedOption === question.correctAnswer ? 'INITIATE OVERCLOCK >>' : 'REBOOT SYSTEM >>'}
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};