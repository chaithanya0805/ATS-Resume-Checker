import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnalysisResult } from '../types';
import { CheckCircle2, XCircle, Layout, Activity } from 'lucide-react';

interface ResultsDisplayProps {
  result: AnalysisResult;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animated counter for the score
    const duration = 1500;
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayScore(Math.round(easeOutQuart * result.atsScore));

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayScore(result.atsScore);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [result.atsScore]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]';
    if (score >= 50) return 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]';
    return 'text-danger drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 50) return 'bg-yellow-400';
    return 'bg-danger';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full mt-12 mb-20 space-y-8"
      id="results-section"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Activity className="mr-3 text-primary" /> Analysis Complete
        </h2>
        <p className="text-gray-400">Here is how your resume matches the job description.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Score Card */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <div className="glass-card rounded-3xl p-8 h-full flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50"></div>
            
            <div className="relative z-10 text-center">
              <h3 className="text-lg font-medium text-gray-300 mb-6 uppercase tracking-wider">ATS Match Score</h3>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96" cy="96" r="80"
                    stroke="currentColor" strokeWidth="12" fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="96" cy="96" r="80"
                    stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={502}
                    strokeDashoffset={502 - (502 * displayScore) / 100}
                    className={`${getProgressColor(result.atsScore)} transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-6xl font-bold font-outfit ${getScoreColor(displayScore)}`}>
                    {displayScore}%
                  </span>
                </div>
              </div>
              <p className="mt-6 text-sm text-gray-400">
                {displayScore >= 80 ? "Excellent Match!" : displayScore >= 50 ? "Good, but needs improvement." : "Major revisions needed."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Keywords Breakdown */}
        <motion.div variants={itemVariants} className="md:col-span-2 flex flex-col space-y-6">
          
          {/* Matched Keywords */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-success"></div>
             <h3 className="text-lg font-semibold text-white flex items-center mb-4">
               <CheckCircle2 className="w-5 h-5 text-success mr-2" />
               Matched Keywords ({result.matchedKeywords.length})
             </h3>
             <div className="flex flex-wrap gap-2">
               {result.matchedKeywords.length > 0 ? (
                 result.matchedKeywords.map((kw, i) => (
                   <span key={i} className="px-3 py-1 text-sm rounded-full bg-success/20 text-success border border-success/30">
                     {kw}
                   </span>
                 ))
               ) : (
                 <p className="text-gray-500 text-sm italic">No matched keywords found.</p>
               )}
             </div>
          </div>

          {/* Missing Keywords */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
             <h3 className="text-lg font-semibold text-white flex items-center mb-4">
               <XCircle className="w-5 h-5 text-danger mr-2" />
               Missing Keywords ({result.missingKeywords.length})
             </h3>
             <div className="flex flex-wrap gap-2">
               {result.missingKeywords.length > 0 ? (
                 result.missingKeywords.map((kw, i) => (
                   <span key={i} className="px-3 py-1 text-sm rounded-full bg-danger/20 text-danger border border-danger/30">
                     {kw}
                   </span>
                 ))
               ) : (
                 <p className="text-gray-500 text-sm italic">Great job! No missing keywords.</p>
               )}
             </div>
          </div>

        </motion.div>
      </div>

      {/* Section Analysis */}
      <motion.div variants={itemVariants} className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
        <h3 className="text-xl font-bold text-white flex items-center mb-4">
          <Layout className="w-6 h-6 text-primary mr-3" />
          Section Analysis
        </h3>
        <p className="text-gray-300 leading-relaxed text-lg">
          {result.sectionAnalysis || "No section analysis available."}
        </p>
      </motion.div>

    </motion.div>
  );
};
