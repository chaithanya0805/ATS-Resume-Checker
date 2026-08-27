import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from '../config';

interface HistoryItem {
  id: number;
  fileName: string;
  atsScore: number;
}

export const HistoryList = ({ refreshTrigger = 0 }: { refreshTrigger?: number }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: "",
    type: "success",
    visible: false
  });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/resume/history`
        );
        setHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [refreshTrigger]);

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800); // Disappears after ~2.8 seconds (within 2.5-3s range)
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete !== null) {
      const idToDelete = itemToDelete;
      const previousHistory = [...history];

      // Optimistic update: remove item from UI immediately
      setHistory((prev) => prev.filter((item) => item.id !== idToDelete));
      setDeletingIds((prev) => [...prev, idToDelete]);
      setItemToDelete(null);

      try {
        await axios.delete(`${API_BASE_URL}/api/v1/resume/history/${idToDelete}`);
        showToastMessage("Analysis deleted successfully.", "success");
      } catch (error) {
        console.error("Failed to delete history item", error);
        // Rollback on failure
        setHistory(previousHistory);
        showToastMessage("Unable to delete the analysis. Please try again.", "error");
      } finally {
        setDeletingIds((prev) => prev.filter((id) => id !== idToDelete));
      }
    }
  };

  if (loading) return <p className="text-gray-400 text-center py-4">Loading...</p>;

  return (
    <div className="mt-10 p-6 bg-white/10 backdrop-blur rounded-xl relative">
      <h2 className="text-xl mb-4 text-white">History</h2>

      {history.length === 0 ? (
        <div className="text-center py-10 opacity-75">
          <div className="text-4xl mb-4">📂</div>
          <h3 className="text-lg font-bold text-white mb-2">No Analysis History</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            Your analyzed resumes will appear here.<br/>
            Upload a resume and check ATS compatibility to build your history.
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-hidden">
          <AnimatePresence initial={false}>
            {history.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 1, height: "auto" }}
                exit={{ 
                  opacity: 0, 
                  height: 0, 
                  paddingTop: 0, 
                  paddingBottom: 0, 
                  marginTop: 0, 
                  marginBottom: 0,
                  borderWidth: 0,
                  overflow: "hidden" 
                }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="p-4 border border-gray-700 rounded-xl flex items-center justify-between group hover:border-gray-500 transition-colors bg-white/[0.02]"
              >
                <div>
                  <p className="text-white font-medium flex items-center gap-2">📄 {item.fileName}</p>
                  <p className="text-gray-400 text-sm mt-1">Score: <span className="font-semibold text-primary">{item.atsScore}%</span></p>
                </div>
                <button
                  onClick={() => setItemToDelete(item.id)}
                  disabled={deletingIds.includes(item.id)}
                  className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Delete analysis"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Modal */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-white/10 shadow-2xl text-left">
            <h3 className="text-xl font-bold text-white mb-2">Delete Analysis</h3>
            <p className="text-gray-400 text-sm mb-6 text-gray-300">
              Are you sure you want to permanently delete this analysis from your history?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-danger hover:bg-danger/80 text-white font-medium text-sm transition-all shadow-lg hover:shadow-danger/25"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (Top-Right, Fixed position, Framer Motion Animated) */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-sm font-medium backdrop-blur-md
              ${toast.type === 'success' ? 'border-success/30 bg-success/15 text-success' : 'border-danger/30 bg-danger/15 text-danger'}`}
          >
            <span className="text-base">{toast.type === 'success' ? '✅' : '⚠'}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};