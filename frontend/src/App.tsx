import { useState, useEffect } from 'react';
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
  const [diagLogs, setDiagLogs] = useState<string[]>([]);
  const [showDiagPanel, setShowDiagPanel] = useState(true);

  const addDiagLog = (message: string) => {
    const timeStr = new Date().toLocaleTimeString();
    console.log(message);
    setDiagLogs((prev) => [...prev, `[${timeStr}] ${message}`]);
  };

  useEffect(() => {
    addDiagLog(`[STARTUP] Active API Base URL: ${API_BASE_URL}`);
  }, []);

  const runTestJson = async () => {
    const startTime = Date.now();
    const url = `${API_BASE_URL}/api/v1/resume/test-json`;
    addDiagLog(`[TEST-JSON] TEST STARTED | URL: ${url} | Method: POST | Type: JSON | Start: ${new Date(startTime).toISOString()}`);
    try {
      const res = await axios.post(url, { testKey: "testValue" }, { timeout: 30000 });
      const duration = Date.now() - startTime;
      addDiagLog(`[TEST-JSON] SUCCESS | Status: ${res.status} | Duration: ${duration}ms | Data: ${JSON.stringify(res.data)}`);
    } catch (err: any) {
      const duration = Date.now() - startTime;
      addDiagLog(`[TEST-JSON] FAILURE | Duration: ${duration}ms | ErrorName: ${err.name} | ErrorMessage: ${err.message} | Code: ${err.code} | Status: ${err.response?.status} | Data: ${JSON.stringify(err.response?.data)}`);
    }
  };

  const runTestMultipartText = async () => {
    const startTime = Date.now();
    const url = `${API_BASE_URL}/api/v1/resume/test-multipart-text`;
    addDiagLog(`[TEST-MULTIPART-TEXT] TEST STARTED | URL: ${url} | Method: POST | Type: Multipart (Text) | Start: ${new Date(startTime).toISOString()}`);
    try {
      const textFile = new File(["Hello World from mobile diagnostics"], "test.txt", { type: "text/plain" });
      const fData = new FormData();
      fData.append("file", textFile);
      fData.append("description", "Testing tiny multipart text from mobile device");

      const res = await axios.post(url, fData, { timeout: 30000 });
      const duration = Date.now() - startTime;
      addDiagLog(`[TEST-MULTIPART-TEXT] SUCCESS | Status: ${res.status} | Duration: ${duration}ms | Data: ${JSON.stringify(res.data)}`);
    } catch (err: any) {
      const duration = Date.now() - startTime;
      addDiagLog(`[TEST-MULTIPART-TEXT] FAILURE | Duration: ${duration}ms | ErrorName: ${err.name} | ErrorMessage: ${err.message} | Code: ${err.code} | Status: ${err.response?.status} | Data: ${JSON.stringify(err.response?.data)}`);
    }
  };

  const runTestSelectedFile = async () => {
    if (!file) {
      addDiagLog("[TEST-FILE] Selected File test aborted: No file selected! Please select a file first.");
      return;
    }
    const startTime = Date.now();
    const url = `${API_BASE_URL}/api/v1/resume/test-multipart-file`;
    addDiagLog(`[TEST-FILE] TEST STARTED | URL: ${url} | Method: POST | Type: Multipart (Selected Resume File) | Start: ${new Date(startTime).toISOString()}`);
    addDiagLog(`[TEST-FILE] File properties: Name=${file.name}, Size=${file.size} bytes, Type=${file.type}`);
    try {
      addDiagLog("[TEST-FILE] [BEFORE] FormData constructor");
      const fData = new FormData();
      addDiagLog("[TEST-FILE] [AFTER] FormData constructor");
      
      addDiagLog("[TEST-FILE] [BEFORE] file append");
      fData.append("file", file);
      addDiagLog("[TEST-FILE] [AFTER] file append");

      addDiagLog("[TEST-FILE] [BEFORE] axios request creation");
      const targetUrl = url;
      addDiagLog("[TEST-FILE] [AFTER] axios request creation");

      addDiagLog(`[TEST-FILE] [BEFORE] axios request invocation to: ${targetUrl}`);
      const res = await axios.post(targetUrl, fData, { 
        timeout: 60000 
      });
      addDiagLog("[TEST-FILE] [AFTER] axios request invocation resolved");
      
      const duration = Date.now() - startTime;
      addDiagLog(`[TEST-FILE] SUCCESS | Status: ${res.status} | Duration: ${duration}ms | Data: ${JSON.stringify(res.data)}`);
    } catch (err: any) {
      const duration = Date.now() - startTime;
      addDiagLog(`[TEST-FILE] FAILURE | Duration: ${duration}ms`);
      addDiagLog(`[TEST-FILE] error.name: ${err.name}`);
      addDiagLog(`[TEST-FILE] error.message: ${err.message}`);
      addDiagLog(`[TEST-FILE] error.code: ${err.code}`);
      addDiagLog(`[TEST-FILE] error.response: ${err.response ? JSON.stringify(err.response.data) : 'undefined'}`);
      addDiagLog(`[TEST-FILE] error.request exists: ${!!err.request}`);
      addDiagLog(`[TEST-FILE] navigator.onLine: ${navigator.onLine}`);
    }
  };

  const handleAnalyze = async () => {
    try {
      addDiagLog("[MOBILE-DIAG-01] Button clicked: handleAnalyze invoked.");
      
      if (!file) {
        setError('Please upload a resume (PDF).');
        addDiagLog("[MOBILE-DIAG-01-ABORT] Validation failed: No file selected.");
        return;
      }
      if (!jobDescription.trim()) {
        setError('Please provide a job description.');
        addDiagLog("[MOBILE-DIAG-01-ABORT] Validation failed: No job description.");
        return;
      }

      addDiagLog("[MOBILE-DIAG-02] Validation passed.");
      addDiagLog(`[MOBILE-DIAG-03] File exists. Name: ${file.name}`);
      addDiagLog(`[MOBILE-DIAG-04] File instanceof File: ${file instanceof File}`);

      setError(null);
      setLoading(true);
      setShowProgressLoader(true);
      setApiActive(true);
      setTempResult(null);

      const startTime = Date.now();
      addDiagLog("[MOBILE-DIAG-05] Before health check.");

      // Ping health endpoint before the main request to diagnose API accessibility and trigger Render cold start wake up
      try {
        addDiagLog(`[MOBILE-DIAG-05A] Health request started. URL: ${API_BASE_URL}/api/v1/resume/health`);
        addDiagLog(`[MOBILE-DIAG-BEFORE-HEALTH] Invoking health check GET...`);
        const healthRes = await axios.get(`${API_BASE_URL}/api/v1/resume/health`, { timeout: 120000 });
        addDiagLog(`[MOBILE-DIAG-AFTER-HEALTH] Health check GET resolved.`);
        addDiagLog(`[MOBILE-DIAG-05B] Health response received. Status: ${healthRes.status}, Data: ${JSON.stringify(healthRes.data)}`);
      } catch (healthErr: any) {
        addDiagLog(`[MOBILE-DIAG-05C] Health request failed. Error: ${healthErr.message}`);
      }

      addDiagLog("[MOBILE-DIAG-06] Health check processing completed. Execution continuing...");

      addDiagLog("[MOBILE-DIAG-07] Before FormData creation.");
      addDiagLog("[MOBILE-DIAG-BEFORE-FORM-DATA-CONSTRUCTOR] Instantiating FormData...");
      const formData = new FormData();
      addDiagLog("[MOBILE-DIAG-AFTER-FORM-DATA-CONSTRUCTOR] FormData instantiated.");
      
      addDiagLog("[MOBILE-DIAG-BEFORE-FILE-APPEND] Appending file...");
      formData.append('file', file);
      addDiagLog("[MOBILE-DIAG-AFTER-FILE-APPEND] File appended.");
      
      addDiagLog("[MOBILE-DIAG-BEFORE-JD-APPEND] Appending job description...");
      formData.append('jobDescription', jobDescription);
      addDiagLog("[MOBILE-DIAG-AFTER-JD-APPEND] Job description appended.");

      addDiagLog("[MOBILE-DIAG-08] FormData created.");
      
      addDiagLog("[MOBILE-DIAG-BEFORE-FORM-DATA-INSPECTION] Inspecting FormData keys...");
      try {
        for (let key of (formData as any).keys()) {
          addDiagLog(`[MOBILE-DIAG-08-KEY] FormData entry key: ${key}`);
        }
      } catch (fdErr: any) {
        addDiagLog(`[MOBILE-DIAG-08-ERR] Failed to iterate keys: ${fdErr.message}`);
      }
      addDiagLog("[MOBILE-DIAG-AFTER-FORM-DATA-INSPECTION] FormData keys inspected.");

      const targetEndpoint = `${API_BASE_URL}/api/v1/resume/check`;
      addDiagLog(`[MOBILE-DIAG-09] Immediately before axios.post(). Params: ` +
        `URL=${targetEndpoint}, ` +
        `Method=POST, ` +
        `FileName=${file.name}, ` +
        `FileSize=${file.size} bytes, ` +
        `FileType=${file.type}, ` +
        `navigator.onLine=${navigator.onLine}, ` +
        `AbortSignalAttached=false, ` +
        `Timeout=120000ms`);

      try {
        addDiagLog(`[MOBILE-DIAG-10] Invoking axios.post() to target: ${targetEndpoint}`);
        addDiagLog(`[MOBILE-DIAG-BEFORE-AXIOS-POST] Triggering axios.post...`);
        const response = await axios.post<AnalysisResult>(targetEndpoint, formData, {
          timeout: 120000 // 120 seconds timeout to handle Render cold start wakeup times
        });
        addDiagLog(`[MOBILE-DIAG-AFTER-AXIOS-POST] axios.post resolved.`);
        
        const duration = Date.now() - startTime;
        addDiagLog(`[MOBILE-DIAG-11] POST success! Status: ${response.status}, Duration: ${duration}ms`);
        
        setTempResult(response.data);
        setApiActive(false);

      } catch (err: any) {
        const duration = Date.now() - startTime;
        addDiagLog(`[MOBILE-DIAG-12] POST error! Duration: ${duration}ms.`);
        
        // Detailed Axios error diagnostics (Phase 2):
        console.error(`[DIAGNOSTIC ERROR] Full Axios error:`, err);
        addDiagLog(`[DIAGNOSTIC ERROR] error.name: ${err.name}`);
        addDiagLog(`[DIAGNOSTIC ERROR] error.message: ${err.message}`);
        addDiagLog(`[DIAGNOSTIC ERROR] error.code: ${err.code}`);
        addDiagLog(`[DIAGNOSTIC ERROR] error.response?.status: ${err.response?.status}`);
        addDiagLog(`[DIAGNOSTIC ERROR] error.response?.data: ${JSON.stringify(err.response?.data)}`);
        addDiagLog(`[DIAGNOSTIC ERROR] error.request exists: ${!!err.request}`);
        addDiagLog(`[DIAGNOSTIC ERROR] error.cause: ${err.cause ? err.cause.message || err.cause : 'none'}`);
        addDiagLog(`[DIAGNOSTIC ERROR] navigator.onLine: ${navigator.onLine}`);

        let errorMessage = 'An error occurred during analysis.';
        if (err.response) {
          const status = err.response.status;
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
          const isOffline = !window.navigator.onLine;
          if (isOffline) {
            errorMessage = 'Network connection lost. Please check your internet connectivity on your mobile device.';
          } else if (duration >= 120000) {
            errorMessage = `Request timed out after ${(duration / 1000).toFixed(1)} seconds. The Render server took too long to respond (likely due to cold start wakeup). Please try again.`;
          } else {
            errorMessage = `No response received from the backend at ${API_BASE_URL}. This can happen due to:\n` +
              `1. Deployed Render server cold start (waking up from sleep mode, which can take up to 60-90 seconds).\n` +
              `2. CORS policy restrictions preventing requests from this domain.\n` +
              `3. Secure connection issues (HTTPS/SSL validation on mobile).\n\n` +
              `Raw error details: ${err.message || 'Unknown network error'}`;
          }
        } else {
          errorMessage = `Request Error: ${err.message}`;
        }

        setError(errorMessage);
        setShowProgressLoader(false);
        setLoading(false);
      }
    } catch (outerErr: any) {
      console.error("[OUTER DIAGNOSTIC ERROR] Caught uncaught error inside handleAnalyze:", outerErr);
      addDiagLog(`[OUTER-DIAG-ERROR] Uncaught JavaScript exception! Name: ${outerErr.name} | Message: ${outerErr.message} | Stack: ${outerErr.stack}`);
      setError(`Uncaught Client Error: ${outerErr.message}`);
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

        {/* Collapsible Mobile Diagnostics Panel */}
        <div className="mt-10 p-6 bg-yellow-950/20 border border-yellow-500/20 backdrop-blur rounded-xl text-left">
          <button 
            onClick={() => setShowDiagPanel(!showDiagPanel)}
            className="text-yellow-500 font-bold flex items-center justify-between w-full text-base md:text-lg"
          >
            <span>🛠 Mobile Diagnostics Panel (Temporary)</span>
            <span>{showDiagPanel ? "▲ Hide" : "▼ Show"}</span>
          </button>
          
          {showDiagPanel && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={runTestJson} 
                  className="px-4 py-2 bg-yellow-600/30 text-yellow-300 border border-yellow-500/30 rounded-lg text-xs md:text-sm font-semibold hover:bg-yellow-600/50 transition-all"
                >
                  Test A: JSON POST
                </button>
                <button 
                  onClick={runTestMultipartText} 
                  className="px-4 py-2 bg-yellow-600/30 text-yellow-300 border border-yellow-500/30 rounded-lg text-xs md:text-sm font-semibold hover:bg-yellow-600/50 transition-all"
                >
                  Test B: Multipart Text
                </button>
                <button 
                  onClick={runTestSelectedFile} 
                  className="px-4 py-2 bg-yellow-600/30 text-yellow-300 border border-yellow-500/30 rounded-lg text-xs md:text-sm font-semibold hover:bg-yellow-600/50 transition-all"
                >
                  Test C: PDF/Doc Upload
                </button>
                <button 
                  onClick={() => setDiagLogs([])} 
                  className="px-4 py-2 bg-red-950/30 text-red-300 border border-red-500/30 rounded-lg text-xs md:text-sm font-semibold hover:bg-red-950/50 transition-all ml-auto"
                >
                  Clear Logs
                </button>
              </div>
              
              <div className="bg-black/40 p-4 rounded-lg border border-white/5 font-mono text-[10px] md:text-xs text-yellow-400/90 max-h-60 overflow-y-auto space-y-1">
                {diagLogs.length === 0 ? (
                  <div className="text-gray-500">No logs generated. Click a test or run the resume analyzer.</div>
                ) : (
                  diagLogs.map((logStr, idx) => <div key={idx}>{logStr}</div>)
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="mt-16 pt-8 border-t border-white/10 text-center text-xs space-y-1">
          <p className="text-gray-300">© 2026 Chaithanya</p>
          <p className="text-gray-400">ATS Resume Checker • Version 1.0</p>
        </footer>

      </main>
    </div>
  );
}

export default App;
