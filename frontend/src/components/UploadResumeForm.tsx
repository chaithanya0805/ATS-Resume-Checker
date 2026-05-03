import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, X } from 'lucide-react';

interface UploadResumeFormProps {
  file: File | null;
  setFile: (file: File | null) => void;
}

export const UploadResumeForm: React.FC<UploadResumeFormProps> = ({ file, setFile }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">1. Upload Resume</h2>
        <p className="text-gray-400 text-sm">Upload your resume in PDF format.</p>
      </div>

      {!file ? (
        <div
          {...getRootProps()}
          className={`glass-card p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center group
            ${isDragActive ? 'border-primary bg-primary/10 scale-105' : 'border-gray-600 hover:border-secondary hover:bg-white/5'}`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <UploadCloud className={`w-16 h-16 mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400 group-hover:text-secondary'} transition-colors duration-300`} />
          </motion.div>
          <p className="text-lg font-medium text-gray-200">
            {isDragActive ? "Drop it like it's hot!" : "Drag & drop your resume here"}
          </p>
          <p className="text-sm text-gray-500 mt-2">or click to browse files</p>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-6 rounded-2xl flex items-center justify-between border border-primary/50 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center space-x-4 relative z-10">
            <div className="p-3 bg-primary/20 rounded-xl">
              <FileText className="text-primary w-8 h-8" />
            </div>
            <div>
              <p className="font-medium text-gray-100">{file.name}</p>
              <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            onClick={() => setFile(null)}
            className="p-2 hover:bg-danger/20 rounded-full transition-colors relative z-10"
            title="Remove file"
          >
            <X className="text-danger w-6 h-6" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};
