import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

interface JobDescriptionInputProps {
  jobDescription: string;
  setJobDescription: (text: string) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ jobDescription, setJobDescription }) => {
  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full mt-8"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-primary" />
            2. Paste Job Description
          </h2>
          <p className="text-gray-400 text-sm">Paste the full job description text below.</p>
        </div>
        <div className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-300 backdrop-blur-md">
          {wordCount} words
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here... (Requirements, qualifications, skills, etc.)"
          className="relative w-full h-64 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
        />
      </div>
    </motion.div>
  );
};
