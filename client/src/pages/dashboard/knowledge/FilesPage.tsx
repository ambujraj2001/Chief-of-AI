import React, { useState, useEffect, useCallback } from "react";
import { Button, List, message, Popconfirm, Empty, Tooltip } from "antd";
import dayjs from "dayjs";
import type { FileEntry } from "../../../services/api";
import { apiGetFiles, apiDeleteFile } from "../../../services/api";

const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const accessCode = localStorage.getItem("accessCode") || "";

  const fetchFiles = useCallback(async () => {
    if (!accessCode) return;
    setLoading(true);
    try {
      const res = await apiGetFiles(accessCode);
      setFiles(res.files);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch files";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [accessCode]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (fileId: string) => {
    try {
      await apiDeleteFile(accessCode, fileId);
      message.success("File deleted successfully");
      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete file";
      message.error(errorMsg);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "picture_as_pdf";
      case "docx":
        return "description";
      case "txt":
      case "md":
        return "article";
      case "csv":
        return "table_view";
      default:
        return "insert_drive_file";
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="material-symbols-outlined text-base">
                folder_open
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">
                Document Center
              </span>
            </div>
            <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
              Files
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Access your documents and AI context files. Upload new files via
              chat.
            </p>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Loading your files...
              </p>
            </div>
          ) : files.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={files}
              className="p-2"
              renderItem={(file) => (
                <List.Item
                  className="px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                  actions={[
                    <Tooltip title="Summarize with AI">
                      <Button
                        type="text"
                        icon={
                          <span className="material-symbols-outlined text-purple-500 hover:text-purple-600">
                            auto_awesome
                          </span>
                        }
                        onClick={() => {
                          const prompt = `Summarize this file: ${file.file_name} (ID: ${file.id})`;
                          // Navigate to dashboard/chat which is at "/" or "/dashboard"
                          window.location.href = `/dashboard?prompt=${encodeURIComponent(prompt)}`;
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="View File">
                      <Button
                        type="text"
                        icon={
                          <span className="material-symbols-outlined text-slate-400 hover:text-primary">
                            visibility
                          </span>
                        }
                        href={file.file_url}
                        target="_blank"
                      />
                    </Tooltip>,
                    <Popconfirm
                      title="Delete File"
                      description="Are you sure you want to delete this file?"
                      onConfirm={() => handleDelete(file.id)}
                      okText="Yes"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          danger
                          icon={
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          }
                        />
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-2xl">
                          {getFileIcon(file.file_name)}
                        </span>
                      </div>
                    }
                    title={
                      <span className="text-slate-900 dark:text-white font-bold block mb-0.5">
                        {file.file_name}
                      </span>
                    }
                    description={
                      <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">
                          calendar_today
                        </span>
                        {dayjs(file.created_at).format("MMM D, YYYY • h:mm A")}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div className="p-20 text-center">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-2">
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                      No files yet
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                      Upload a document in the chat to see it here!
                    </p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default FilesPage;
