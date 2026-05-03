import { useEffect, useState } from "react";
import axios from "axios";

interface HistoryItem {
  id: number;
  fileName: string;
  atsScore: number;
}

export const HistoryList = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8082/api/v1/resume/history"
        );
        setHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="mt-10 p-6 bg-white/10 backdrop-blur rounded-xl">
      <h2 className="text-xl mb-4 text-white">History</h2>

      {history.length === 0 ? (
        <p>No history available</p>
      ) : (
        history.map((item) => (
          <div
            key={item.id}
            className="mb-3 p-3 border border-gray-700 rounded"
          >
            <p>📄 {item.fileName}</p>
            <p>Score: {item.atsScore}%</p>
          </div>
        ))
      )}
    </div>
  );
};