import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnalysisResult } from '../types';
import { CheckCircle2, XCircle, Layout, Activity, Award, TrendingUp, AlertTriangle, Lightbulb, Sparkles, Code } from 'lucide-react';

interface ResultsDisplayProps {
  result: AnalysisResult;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const [displayScore, setDisplayScore] = useState(0);

  const cleanText = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/\*{2,}/g, "") // Remove bold markdown symbols **
      .replace(/#{1,6}\s?/g, "") // Remove header symbols like ###
      .replace(/^\s*[-*+]\s+/mg, "") // Remove list bullets at start of lines
      .replace(/^\s*\d+\.\s+/mg, "") // Remove list numbers at start of lines
      .trim();
  };

  const getArrayField = (field: any, separator: string | RegExp = ','): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) {
      return field.map(cleanText).filter(Boolean);
    }
    if (typeof field === 'string') {
      return field.split(separator).map(s => s.trim()).map(cleanText).filter(Boolean);
    }
    return [];
  };

  const getSkillsFound = () => getArrayField(result.skillsFound, ',');
  const getMissingSkills = () => getArrayField(result.missingSkills, ',');
  const getStrengths = () => getArrayField(result.strengths, '\n');
  const getWeaknesses = () => getArrayField(result.weaknesses, '\n');
  const getSuggestions = () => getArrayField(result.resumeImprovementSuggestions, '\n');

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

      {/* Redesigned Section Analysis */}
      <motion.div variants={itemVariants} className="space-y-8">
        
        {/* Title of Section Analysis */}
        <div className="flex items-center space-x-3 mb-2">
          <Layout className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold text-white tracking-tight">Section Analysis</h3>
        </div>

        {/* 1. Match Overview & Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden md:col-span-1 flex flex-col justify-center items-center text-center bg-white/[0.01]">
            <div className="p-3.5 bg-primary/10 rounded-full mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-2">Match Percentage</h4>
            <span className="text-5xl font-extrabold text-gradient">{result.matchPercentage || result.atsScore}%</span>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden md:col-span-2 text-left bg-white/[0.01]">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <h4 className="text-white font-semibold text-lg flex items-center mb-3">
              <Award className="w-5 h-5 text-primary mr-2" />
              Hiring Recommendation
            </h4>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              {cleanText(result.hiringRecommendation) || "No recommendation provided."}
            </p>
          </div>
        </div>

        {/* 2. Skills Profile */}
        <div className="glass-card rounded-3xl p-6 border border-white/5 text-left relative overflow-hidden bg-white/[0.01]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
          <h4 className="text-white font-semibold text-lg flex items-center mb-6">
            <Code className="w-5 h-5 text-secondary mr-2" />
            Skills Profile
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills Found */}
            <div>
              <h5 className="text-gray-300 font-medium text-sm mb-3 flex items-center">
                <span className="w-2 h-2 rounded-full bg-success mr-2"></span>
                Skills Found
              </h5>
              <div className="flex flex-wrap gap-2">
                {getSkillsFound().length > 0 ? (
                  getSkillsFound().map((skill, i) => (
                    <span key={i} className="px-3 py-1 text-xs rounded-full bg-success/15 text-success border border-success/20">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm italic">No skills identified.</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div>
              <h5 className="text-gray-300 font-medium text-sm mb-3 flex items-center">
                <span className="w-2 h-2 rounded-full bg-danger mr-2"></span>
                Missing Skills
              </h5>
              <div className="flex flex-wrap gap-2">
                {getMissingSkills().length > 0 ? (
                  getMissingSkills().map((skill, i) => (
                    <span key={i} className="px-3 py-1 text-xs rounded-full bg-danger/15 text-danger border border-danger/20">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm italic">None! All matching skills found.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3 & 4. Strengths and Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="glass-card rounded-3xl p-6 border border-white/5 text-left relative overflow-hidden bg-white/[0.01]">
            <div className="absolute top-0 left-0 w-1 h-full bg-success"></div>
            <h4 className="text-white font-semibold text-lg flex items-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-success mr-2" />
              Key Strengths
            </h4>
            <div className="space-y-3">
              {getStrengths().length > 0 ? (
                getStrengths().map((strength, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-success mt-0.5 font-bold">✔</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{strength}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No specific strengths listed.</p>
              )}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="glass-card rounded-3xl p-6 border border-white/5 text-left relative overflow-hidden bg-white/[0.01]">
            <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
            <h4 className="text-white font-semibold text-lg flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-danger mr-2" />
              Areas for Improvement
            </h4>
            <div className="space-y-3">
              {getWeaknesses().length > 0 ? (
                getWeaknesses().map((weakness, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                    <span className="text-danger mt-0.5 font-bold">⚠</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{weakness}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No key weaknesses listed.</p>
              )}
            </div>
          </div>
        </div>

        {/* 5. Resume Improvement Suggestions */}
        <div className="glass-card rounded-3xl p-6 border border-white/5 text-left relative overflow-hidden bg-white/[0.01]">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
          <h4 className="text-white font-semibold text-lg flex items-center mb-4">
            <Lightbulb className="w-5 h-5 text-secondary mr-2" />
            Resume Improvement Suggestions
          </h4>
          <div className="space-y-3.5 pt-2">
            {getSuggestions().length > 0 ? (
              getSuggestions().map((suggestion, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-secondary/20 shadow-md">
                    {i + 1}
                  </div>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">{suggestion}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">No suggestions provided.</p>
            )}
          </div>
        </div>

        {/* 6. Optimized Professional Summary */}
        {result.optimizedProfessionalSummary && (
          <div className="glass-card rounded-3xl p-6 border border-white/5 text-left relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
            <h4 className="text-white font-semibold text-lg flex items-center mb-4">
              <Sparkles className="w-5 h-5 text-primary mr-2" />
              Optimized Professional Summary
            </h4>
            <p className="text-gray-200 text-sm md:text-base leading-relaxed italic font-medium p-4 bg-black/20 rounded-2xl border border-white/5">
              "{cleanText(result.optimizedProfessionalSummary)}"
            </p>
          </div>
        )}

      </motion.div>

    </motion.div>
  );
};
