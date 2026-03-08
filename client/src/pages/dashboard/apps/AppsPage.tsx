import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Spin, message, Modal, Input } from "antd";
import { apiGetApps, apiJoinApp, type AppEntry } from "../../../services/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const AppsPage: React.FC = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const accessCode = localStorage.getItem("accessCode") || "";

  const fetchApps = useCallback(async () => {
    try {
      if (!accessCode) {
        message.error("Access code not found.");
        setLoading(false);
        return;
      }
      const data = await apiGetApps(accessCode);
      setApps(data.apps || []);
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : "Failed to fetch apps",
      );
    } finally {
      setLoading(false);
    }
  }, [accessCode]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      message.warning("Please enter a join code.");
      return;
    }

    setJoining(true);
    try {
      const result = await apiJoinApp(accessCode, code);

      if (result.status === "already_member") {
        message.info(result.message);
        setJoinModalOpen(false);
        setJoinCode("");
        navigate(`/dashboard/app/${result.appId}`);
        return;
      }

      message.success(result.message);
      setJoinModalOpen(false);
      setJoinCode("");
      await fetchApps();
      navigate(`/dashboard/app/${result.appId}`);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Failed to join app");
    } finally {
      setJoining(false);
    }
  };

  return (
    <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-base">apps</span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Your Workspace
            </span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            Apps
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            AI-powered mini-apps created through natural language.
          </p>
        </div>
        <button
          onClick={() => setJoinModalOpen(true)}
          className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">group_add</span>
          Join App
        </button>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary mt-1">
            auto_awesome
          </span>
          <div>
            <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">
              Create apps through Chat
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Describe what you want to build in the Chat and the AI will create
              an app for you automatically.
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
      ) : apps.length === 0 ? (
        <div className="mt-12 text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl mb-4">
            apps
          </span>
          <h4 className="text-slate-400 dark:text-slate-600 font-medium">
            No apps yet
          </h4>
          <p className="text-slate-400 dark:text-slate-600 text-sm mb-6">
            Ask the AI to create an app for you in the Chat, or join an existing
            app with an invite code.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all"
            >
              Start a conversation
            </Link>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-6 py-2.5 rounded-lg text-sm font-bold hover:border-primary hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined text-base">
                group_add
              </span>
              Join with Code
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Link
              key={app.id}
              to={`/dashboard/app/${app.id}`}
              className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group relative overflow-hidden no-underline"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full flex items-end justify-start pl-2 pb-2 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                <span className="material-symbols-outlined text-primary text-lg">
                  open_in_new
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">
                    apps
                  </span>
                </div>
                <h3 className="text-slate-900 dark:text-slate-100 font-bold text-base leading-tight pr-8">
                  {app.name}
                </h3>
              </div>

              {app.description && (
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">
                  {app.description}
                </p>
              )}

              <div className="mt-auto flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-xs">
                  schedule
                </span>
                <span>Created {dayjs(app.created_at).fromNow()}</span>
                {app.join_code && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">
                      •
                    </span>
                    <span className="font-mono text-primary/70">
                      {app.join_code}
                    </span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Join App Modal */}
      <Modal
        open={joinModalOpen}
        onCancel={() => {
          setJoinModalOpen(false);
          setJoinCode("");
        }}
        footer={null}
        centered
        width={420}
        closable
      >
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">
              group_add
            </span>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Join an App
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter the invite code shared with you to join a collaborative app.
            </p>
          </div>

          <Input
            placeholder="e.g. SPLT-8A2F"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onPressEnter={handleJoin}
            size="large"
            maxLength={12}
            className="text-center font-mono text-lg tracking-widest"
            style={{ letterSpacing: "0.15em" }}
            autoFocus
          />

          <button
            onClick={handleJoin}
            disabled={!joinCode.trim() || joining}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {joining ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">login</span>
                Join App
              </>
            )}
          </button>
        </div>
      </Modal>
    </main>
  );
};

export default AppsPage;
