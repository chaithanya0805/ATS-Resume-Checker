import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScanLine, Loader2, RotateCcw } from 'lucide-react';

import { UploadResumeForm } from './components/UploadResumeForm';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { HistoryList } from './components/HistoryList';
import { AnalysisResult } from './types';
import { AnalysisProgressLoader } from './components/AnalysisProgressLoader';
import { API_BASE_URL } from './config';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Progress loader state
  const [showProgressLoader, setShowProgressLoader] = useState(false);
  const [apiActive, setApiActive] = useState(false);
  const [tempResult, setTempResult] = useState<AnalysisResult | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a resume (PDF).');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }

    setError(null);
    setLoading(true);
    setShowProgressLoader(true);
    setApiActive(true);
    setTempResult(null);

    const startTime = Date.now();
    console.log(`[API REQUEST] Starting ATS check at ${new Date(startTime).toISOString()}`);
    console.log(`[API REQUEST] Target URL: ${API_BASE_URL}/api/v1/resume/check`);
    console.log(`[API REQUEST] File Name: ${file.name}`);
    console.log(`[API REQUEST] File Size: ${file.size} bytes`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobDescription', jobDescription);

    try {
      // NOTE: We do not set the 'Content-Type' header manually. Letting Axios set it automatically
      // allows the browser to properly generate the boundary parameter, which fixes failures on mobile.
      const response = await axios.post<AnalysisResult>(`${API_BASE_URL}/api/v1/resume/check`, formData);
      
      const duration = Date.now() - startTime;
      console.log(`[API RESPONSE] Success! Status: ${response.status}, Duration: ${duration}ms`);
      
      setTempResult(response.data);
      setApiActive(false);

    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(`[API ERROR] Request failed after ${duration}ms. Details:`, err);

      let errorMessage = 'An error occurred during analysis.';
      if (err.response) {
        // The server responded with a status code outside the 2xx range
        const status = err.response.status;
        console.error(`[API RESPONSE ERROR] Status: ${status}, Body:`, err.response.data);
        
        if (status === 400) {
          errorMessage = `Bad Request (400): ${typeof err.response.data === 'string' ? err.response.data : err.response.data.message || 'Please check your inputs.'}`;
        } else if (status === 413) {
          errorMessage = 'File too large (413). Please upload a smaller resume (max 10MB).';
        } else if (status === 500) {
          errorMessage = 'Internal Server Error (500). The AI service encountered an issue.';
        } else if (status === 503 || status === 504) {
          errorMessage = 'Server is currently busy or timed out (503/504). Please try again in a moment.';
        } else {
          errorMessage = `Server Error (${status}): ${err.response.data.message || err.message}`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('[API NETWORK ERROR] No response received:', err.request);
        
        if (duration > 25000) {
          errorMessage = `Connection timed out after ${(duration / 1000).toFixed(1)} seconds. This usually happens if the backend server is waking up from a sleep state. Please try again.`;
        } else if (!window.navigator.onLine) {
          errorMessage = 'Network connection lost. Please check your internet connectivity.';
        } else {
          errorMessage = 'No response from the backend. This might be due to a server wakeup cold start or CORS issues. Please ensure the backend server is running and accessible.';
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[API SETUP ERROR] Error message:', err.message);
        errorMessage = `Request Error: ${err.message}`;
      }

      setError(errorMessage);
      setShowProgressLoader(false);
      setLoading(false);
    }
  };

  const handleProgressComplete = () => {
    if (tempResult) {
      setResult(tempResult);
      setShowProgressLoader(false);
      setLoading(false);
      setHistoryRefreshTrigger(prev => prev + 1);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    document.getElementById('hero-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none"></div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/5 py-3 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-lg animate-pulse-slow">
            <ScanLine className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ATS <span className="text-gradient">Analyzer</span>
          </h1>
        </div>
        <div className="hidden md:flex items-center text-sm text-gray-400">
          <Sparkles className="w-4 h-4 mr-2 text-secondary" />
          Designed & Developed by Chaithanya
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20 max-w-5xl relative z-10">
        
        <div id="hero-section" className="text-center mb-16 scroll-mt-24">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            Optimize Your Resume for <br className="hidden md:block"/>
            <span className="text-gradient">Applicant Tracking Systems</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Upload your resume and the job description to get an instant ATS compatibility score, keyword analysis, and actionable feedback.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex flex-col space-y-8">
            <UploadResumeForm file={file} setFile={setFile} />
            <JobDescriptionInput jobDescription={jobDescription} setJobDescription={setJobDescription} />
            
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center
                ${loading ? 'bg-surface border border-white/10 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-primary/50'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-3 w-6 h-6" />
                  Analyzing Match...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 w-6 h-6" />
                  Check ATS Score
                </>
              )}
            </motion.button>
          </div>

          <div className="flex flex-col space-y-8">
            <div className="glass-card rounded-3xl p-8 border border-white/5 h-full flex flex-col items-center justify-center text-center">
               {showProgressLoader ? (
                 <AnalysisProgressLoader 
                   apiActive={apiActive} 
                   onComplete={handleProgressComplete} 
                 />
               ) : !result ? (
                 <div className="opacity-50">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-32 h-32 mx-auto mb-6 opacity-20">
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
                        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-medium text-gray-300">Ready to Analyze</h3>
                    <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">Complete the steps on the left to see your comprehensive ATS report.</p>
                 </div>
               ) : (
                 <div className="w-full">
                    <h3 className="text-xl font-bold text-success mb-2">Analysis Complete!</h3>
                    <p className="text-gray-400 text-sm mb-6">Scroll down to view your detailed results.</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <>
              <ResultsDisplay result={result} />
              <div className="flex justify-center mt-12 mb-16">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white hover:shadow-primary/50"
                >
                  <RotateCcw className="mr-3 w-5 h-5" />
                  Analyze Another Resume
                </motion.button>
              </div>
            </>
          )}
        </AnimatePresence>

        <HistoryList refreshTrigger={historyRefreshTrigger} />

        <footer className="mt-16 pt-8 border-t border-white/10 text-center text-xs space-y-1">
          <p className="text-gray-300">© 2026 Chaithanya</p>
          <p className="text-gray-400">ATS Resume Checker • Version 1.0</p>
        </footer>

      </main>
    </div>
  );
}

export default App;
