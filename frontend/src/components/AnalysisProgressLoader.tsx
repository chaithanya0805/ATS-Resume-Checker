import React, { useState, useEffect } from 'react';

interface AnalysisProgressLoaderProps {
  apiActive: boolean;
  onComplete: () => void;
}

export const AnalysisProgressLoader: React.FC<AnalysisProgressLoaderProps> = ({
  apiActive,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (progress >= 100) return;

    let timer: NodeJS.Timeout;

    if (apiActive) {
      if (progress < 93) {
        let intervalTime = 100;
        let increment = 1;

        // Custom progressive SaaS loading ticks
        if (progress < 15) {
          intervalTime = 200; // Slow, natural initial stepping
          increment = 2;
        } else if (progress < 35) {
          intervalTime = 250;
          increment = 2;
        } else if (progress < 55) {
          intervalTime = 350;
          increment = 2;
        } else if (progress < 75) {
          intervalTime = 450;
          increment = 2;
        } else if (progress < 90) {
          intervalTime = 600;
          increment = 1;
        } else {
          intervalTime = 800;
          increment = 1;
        }

        timer = setTimeout(() => {
          setProgress((prev) => Math.min(93, prev + increment));
        }, intervalTime);
      }
    } else {
      // API call completed. Animate to 100% smoothly using fluid ticks
      timer = setTimeout(() => {
        setProgress((prev) => {
          const diff = 100 - prev;
          const step = Math.max(1, Math.ceil(diff * 0.15));
          return Math.min(100, prev + step);
        });
      }, 50);
    }

    return () => clearTimeout(timer);
  }, [progress, apiActive]);

  // Handle completion delay when progress reaches 100%
  useEffect(() => {
    if (progress === 100) {
      const delayTimer = setTimeout(() => {
        onComplete();
      }, 1000); // Show "✔ Analysis Complete" for exactly 1 second (per requirements)
      return () => clearTimeout(delayTimer);
    }
  }, [progress, onComplete]);

  const steps = [
    { label: 'Resume Uploaded', threshold: 15 },
    { label: 'Extracting Resume', threshold: 35 },
    { label: 'Reading Job Description', threshold: 55 },
    { label: 'Matching Keywords', threshold: 75 },
    { label: 'Calculating ATS Score', threshold: 90 },
    { label: 'Generating AI Suggestions', threshold: 100 },
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center p-2">
      {/* Title */}
      <h3 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${progress === 100 ? 'text-success' : 'text-white'}`}>
        {progress === 100 ? '✔ Analysis Complete' : 'Analyzing Resume...'}
      </h3>

      {/* Progress Bar with Centered Percentage */}
      <div className="w-full max-w-sm h-6 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-8 relative flex items-center justify-center">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
        <span className="relative z-10 text-xs font-extrabold text-white select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-wider">
          {progress}%
        </span>
      </div>

      {/* Steps List */}
      <div className="w-full max-w-xs space-y-3.5 text-left border-t border-white/5 pt-6">
        {steps.map((step, idx) => {
          const isCompleted = progress >= step.threshold;
          return (
            <div 
              key={idx} 
              className="flex items-center space-x-3 text-sm md:text-base"
            >
              <span className={`text-base inline-block w-6 text-center ${isCompleted ? 'text-success' : 'text-gray-500'}`}>
                {isCompleted ? '✔' : '⏳'}
              </span>
              <span className={`transition-colors duration-300 ${isCompleted ? 'text-white font-medium' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
