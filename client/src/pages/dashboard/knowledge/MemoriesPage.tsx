import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Spin, message, Modal, Input, Button } from "antd";
import {
  apiGetMemories,
  apiShareMemory,
  apiJoinMemory,
  type MemoryEntry,
} from "../../../services/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const MemoriesPage: React.FC = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [sharingMemory, setSharingMemory] = useState(false);
  const [currentSharedMemory, setCurrentSharedMemory] = useState<MemoryEntry | null>(null);

  const [sharedUsersModalVisible, setSharedUsersModalVisible] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [joiningMemory, setJoiningMemory] = useState(false);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const accessCode = localStorage.getItem("accessCode") || "";
        if (!accessCode) {
          message.error("Access code not found.");
          setLoading(false);
          return;
        }

        const data = await apiGetMemories(accessCode);
        setMemories(data.memories || []);
      } catch (err: unknown) {
        message.error(
          err instanceof Error ? err.message : "Failed to fetch memories",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, []);

  const handleShare = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setSharingMemory(true);
      const accessCode = localStorage.getItem("accessCode") || "";
      if (!accessCode) return;
      
      const data = await apiShareMemory(accessCode, id);
      setShareCode(data.shareCode);
      const memory = memories.find((m) => m.id === id) || null;
      setCurrentSharedMemory(memory);
      setShareModalVisible(true);
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : "Failed to generate share code",
      );
    } finally {
      setSharingMemory(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      setJoiningMemory(true);
      const accessCode = localStorage.getItem("accessCode") || "";
      if (!accessCode) return;
      
      await apiJoinMemory(accessCode, joinCode.trim());
      message.success("Successfully joined memory!");
      setJoinCode("");
      
      setLoading(true);
      const data = await apiGetMemories(accessCode);
      setMemories(data.memories || []);
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : "Failed to join memory",
      );
    } finally {
      setJoiningMemory(false);
      setLoading(false);
    }
  };

  const getIcon = (title: string | null) => {
    const defaultIcon = "neurology";
    if (!title) return defaultIcon;
    const t = title.toLowerCase();
    if (t.includes("wifi") || t.includes("password") || t.includes("code"))
      return "vpn_key";
    if (
      t.includes("coffee") ||
      t.includes("drink") ||
      t.includes("food") ||
      t.includes("restaurant")
    )
      return "coffee";
    if (t.includes("flight") || t.includes("passport") || t.includes("travel"))
      return "flight";
    if (t.includes("birthday") || t.includes("cake") || t.includes("party"))
      return "cake";
    if (
      t.includes("commute") ||
      t.includes("work") ||
      t.includes("office") ||
      t.includes("job")
    )
      return "work";
    if (t.includes("gym") || t.includes("workout") || t.includes("fitness"))
      return "fitness_center";
    if (t.includes("health") || t.includes("allergy") || t.includes("doctor"))
      return "medical_services";
    return defaultIcon;
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full bg-background-light dark:bg-background-dark">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-base">
              cloud_done
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Secure Sync Active
            </span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            Memory Vault
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            A secure storage of your preferences, data points, and context
            notes.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <Input 
          placeholder="Enter Memory Code (e.g. MEM-XXXXXX)" 
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="max-w-xs"
        />
        <Button 
          type="primary" 
          onClick={handleJoin} 
          loading={joiningMemory}
          disabled={!joinCode.trim()}
        >
          Join Memory
        </Button>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary mt-1">
            info
          </span>
          <div>
            <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">
              Read-only View
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              This view is currently read-only. To modify these notes, ask me to{" "}
              <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">
                "update"
              </span>{" "}
              or{" "}
              <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">
                "forget"
              </span>{" "}
              items in the Chat.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="whitespace-nowrap inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
        >
          Go to Chat
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Spin size="large" />
        </div>
      ) : memories.length === 0 ? (
        <div className="mt-12 text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl mb-4">
            psychology
          </span>
          <h4 className="text-slate-400 dark:text-slate-600 font-medium">
            Have something new to remember?
          </h4>
          <p className="text-slate-400 dark:text-slate-600 text-sm mb-6">
            Just mention it in the chat and I'll store it here automatically.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            Start a conversation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                <span className="material-symbols-outlined text-primary text-sm">
                  {getIcon(memory.title)}
                </span>
              </div>
              <h3 className="text-slate-900 dark:text-slate-100 font-bold mb-2 pr-6">
                {memory.title || "Untitled Memory"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed line-clamp-4">
                {memory.content}
              </p>
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-1 items-start justify-center">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-xs">
                      auto_fix
                    </span>
                    <span>
                      Saved by AI • {dayjs(memory.created_at).fromNow()}
                    </span>
                  </div>
                  {memory.shared_by ? (
                    <div className="flex items-center gap-1 text-[10px] text-primary/80 font-bold bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                      <span className="material-symbols-outlined text-[10px]">group</span>
                      Shared by {memory.shared_by.full_name.split(' ')[0]}
                    </div>
                  ) : memory.shared_with && memory.shared_with.length > 0 ? (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentSharedMemory(memory);
                        setSharedUsersModalVisible(true);
                      }}
                      className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full mt-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[10px]">group</span>
                      Shared with {memory.shared_with.length} {memory.shared_with.length === 1 ? 'person' : 'people'}
                    </button>
                  ) : null}
                </div>
                {!memory.shared_by && (
                  <button
                    onClick={(e) => handleShare(memory.id, e)}
                    title="Share Memory"
                    disabled={sharingMemory}
                    className="text-primary hover:text-primary/80 font-bold text-sm bg-primary/10 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 self-end"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      share
                    </span>
                    Share
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={null}
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
        centered
        width={400}
        destroyOnClose
        className="dark-modal"
      >
        <div className="text-center py-6">
          <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">share</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            Share Memory
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 px-4">
            Anyone with this code can access this memory.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 w-[90%] mx-auto flex flex-col gap-4">
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white tracking-widest text-center">{shareCode}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareCode);
                message.success("Code copied to clipboard!");
                setShareModalVisible(false);
              }}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-display"
            >
              Copy Code & Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        title={null}
        open={sharedUsersModalVisible}
        onCancel={() => setSharedUsersModalVisible(false)}
        footer={null}
        centered
        width={400}
        destroyOnClose
        className="dark-modal"
      >
        <div className="text-center py-6">
          <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">group</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            Shared With
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 px-4">
            People who have access to this memory.
          </p>
          
          {currentSharedMemory?.shared_with && currentSharedMemory.shared_with.length > 0 ? (
            <div className="w-[90%] mx-auto text-left">
              <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {currentSharedMemory.shared_with.map((u, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border-2 border-slate-100 dark:border-slate-600">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=10b981&color=fff`} className="w-full h-full object-cover" alt={u.full_name} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{u.full_name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{u.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="text-slate-500 dark:text-slate-400 text-sm">No one has joined this memory yet.</div>
          )}
          <div className="mt-6 px-4">
            <button
              onClick={() => setSharedUsersModalVisible(false)}
              className="w-[90%] mx-auto block py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-display"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default MemoriesPage;
