import { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Space,
  message,
  Empty,
  Timeline,
  Spin,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  ExperimentOutlined,
  LoadingOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  apiGetRoutines,
  apiCreateRoutine,
  apiUpdateRoutine,
  apiDeleteRoutine,
  apiGetRoutineRuns,
  apiGenerateCron,
} from "../../services/api";
import type { AIRoutineEntry, AIRoutineRunEntry } from "../../services/api";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const AIRoutinesPage = () => {
  const [routines, setRoutines] = useState<AIRoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<AIRoutineEntry | null>(
    null,
  );
  const [form] = Form.useForm();
  const accessCode = useSelector((state: RootState) => state.user.accessCode);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<AIRoutineEntry | null>(
    null,
  );
  const [runs, setRuns] = useState<AIRoutineRunEntry[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [isGeneratingCron, setIsGeneratingCron] = useState(false);

  const fetchRoutines = useCallback(async () => {
    if (!accessCode) return;
    try {
      setLoading(true);
      const data = await apiGetRoutines(accessCode);
      setRoutines(data.routines);
    } catch {
      message.error("Failed to load routines");
    } finally {
      setLoading(false);
    }
  }, [accessCode]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleGenerateCron = async () => {
    const prompt = form.getFieldValue("aiSchedule");
    if (!prompt) {
      message.warning("Please describe your schedule first.");
      return;
    }

    try {
      setIsGeneratingCron(true);
      const { cronExpression } = await apiGenerateCron(prompt);
      form.setFieldsValue({ cronExpression });
      message.success("Schedule generated!");
    } catch {
      message.error("Failed to generate schedule.");
    } finally {
      setIsGeneratingCron(false);
    }
  };

  interface RoutineFormValues {
    name: string;
    instruction: string;
    cronExpression: string;
  }

  const handleSave = async (values: RoutineFormValues) => {
    if (!accessCode) return;
    try {
      if (editingRoutine) {
        await apiUpdateRoutine(editingRoutine.id, {
          name: values.name,
          instruction: values.instruction,
          cronExpression: values.cronExpression,
        });
        message.success("Routine updated successfully");
      } else {
        await apiCreateRoutine(
          accessCode,
          values.name,
          values.instruction,
          values.cronExpression,
        );
        message.success("Routine created successfully");
      }
      setIsModalVisible(false);
      setEditingRoutine(null);
      form.resetFields();
      fetchRoutines();
    } catch {
      message.error("Failed to save routine");
    }
  };

  const handleToggleStatus = async (routine: AIRoutineEntry) => {
    try {
      await apiUpdateRoutine(routine.id, { isActive: !routine.is_active });
      message.success(`Routine ${routine.is_active ? "paused" : "resumed"}`);
      fetchRoutines();
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleEdit = (routine: AIRoutineEntry) => {
    setEditingRoutine(routine);
    form.setFieldsValue({
      name: routine.name,
      instruction: routine.instruction,
      cronExpression: routine.cron_expression,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteRoutine(id);
      message.success("Routine deleted");
      fetchRoutines();
    } catch {
      message.error("Failed to delete routine");
    }
  };

  const viewHistory = async (routine: AIRoutineEntry) => {
    setSelectedRoutine(routine);
    setHistoryModalVisible(true);
    setRunsLoading(true);
    try {
      const data = await apiGetRoutineRuns(routine.id);
      setRuns(data.runs);
    } catch {
      message.error("Failed to load execution history");
    } finally {
      setRunsLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-base">
              schedule
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              AI Routine Management
            </span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            AI Routines
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Automate your AI tasks with scheduled workflows.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20"
          onClick={() => {
            setEditingRoutine(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Create Routine
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Spin size="large" />
        </div>
      ) : routines.length === 0 ? (
        <div className="mb-16 text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-6xl mb-4">
            auto_schedule
          </span>
          <h4 className="text-slate-500 dark:text-slate-400 font-bold text-xl">
            No routines scheduled yet
          </h4>
          <p className="text-slate-400 dark:text-slate-500 text-md mt-2 mb-8 max-w-md mx-auto">
            Create automated workflows to handle repetitive tasks for you.
          </p>
          <Button
            type="primary"
            size="large"
            onClick={() => setIsModalVisible(true)}
            className="h-12 px-8 rounded-xl font-bold"
          >
            Set Up Your First Routine
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mb-16">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row items-center gap-6 group hover:border-primary/50 transition-all shadow-sm"
            >
              {/* Routine Image/Icon Placeholder */}
              <div className="size-24 md:size-28 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                <div className="bg-primary/10 size-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl opacity-50">
                    smart_toy
                  </span>
                </div>
              </div>

              {/* Routine Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                  <Tag
                    color={routine.is_active ? "success" : "default"}
                    className="m-0 font-bold text-[10px] uppercase rounded-md px-2"
                  >
                    {routine.is_active ? "Active" : "Paused"}
                  </Tag>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                    <ClockCircleOutlined className="text-[10px]" />
                    {routine.cron_expression}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {routine.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl">
                  {routine.instruction}
                </p>
                {routine.last_run && (
                  <Text
                    type="secondary"
                    className="text-[10px] block mt-2 opacity-60 italic"
                  >
                    Last active: {dayjs(routine.last_run).fromNow()}
                  </Text>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-shrink-0 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                <Button
                  icon={
                    routine.is_active ? (
                      <PauseCircleOutlined />
                    ) : (
                      <PlayCircleOutlined />
                    )
                  }
                  onClick={() => handleToggleStatus(routine)}
                  className="bg-white dark:bg-slate-900 border-none shadow-sm hover:scale-105 transition-transform"
                />
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(routine)}
                  className="bg-white dark:bg-slate-900 border-none shadow-sm hover:scale-105 transition-transform"
                />
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => viewHistory(routine)}
                  className="bg-white dark:bg-slate-900 border-none shadow-sm hover:scale-105 transition-transform"
                />
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDelete(routine.id)}
                  className="bg-red-50 dark:bg-red-900/10 border-none shadow-sm hover:scale-105 transition-transform"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 mb-12 border-t border-slate-100 dark:border-slate-800 pt-12">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Efficiency
            </span>
            <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-2.5 rounded-xl">
              bolt
            </span>
          </div>
          <div className="flex items-end gap-2 text-slate-900 dark:text-white">
            <span className="text-4xl font-black leading-none tracking-tight">
              {routines.filter((r) => r.is_active).length * 12} hrs
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-4 font-medium">
            Estimated time saved this month
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-green-500/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Automations
            </span>
            <span className="material-symbols-outlined text-green-500 bg-green-500/10 p-2.5 rounded-xl">
              check_circle
            </span>
          </div>
          <div className="flex items-end gap-2 text-slate-900 dark:text-white">
            <span className="text-4xl font-black leading-none tracking-tight">
              {routines.length * 42}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-4 font-medium">
            Auto-actions processed today
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Connected
            </span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-xl">
              settings_input_component
            </span>
          </div>
          <div className="flex items-end gap-2 text-slate-900 dark:text-white">
            <span className="text-4xl font-black leading-none tracking-tight">
              {routines.length > 0 ? 8 : 0}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-4 font-medium">
            Active agent tool connections
          </p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={editingRoutine ? "Edit AI Routine" : "Automate an AI Routine"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRoutine(null);
        }}
        onOk={() => form.submit()}
        width={600}
        className="dark-modal"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Routine Name"
            rules={[
              { required: true, message: "Please give your routine a name" },
            ]}
          >
            <Input
              placeholder="e.g., Daily Tech News Summary"
              className="rounded-lg h-10"
            />
          </Form.Item>

          <Form.Item
            name="instruction"
            label="What should the AI do?"
            rules={[{ required: true, message: "Please enter instructions" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="e.g., Get the latest tech news from today and summarize it into 3 key bullet points."
              className="rounded-lg"
            />
          </Form.Item>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-6 border border-blue-100 dark:border-blue-800">
            <Title
              level={5}
              className="!mt-0 !mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400"
            >
              <ExperimentOutlined />
              AI Schedule Helper
            </Title>
            <Text type="secondary" className="block mb-3 text-xs">
              Describe when you want this to run in plain English.
            </Text>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item name="aiSchedule" noStyle>
                <Input
                  placeholder="e.g., every morning at 9am"
                  className="h-10 rounded-l-lg"
                />
              </Form.Item>
              <Button
                type="primary"
                onClick={handleGenerateCron}
                loading={isGeneratingCron}
                icon={isGeneratingCron ? <LoadingOutlined /> : null}
                className="h-10 rounded-r-lg font-bold"
              >
                Generate
              </Button>
            </Space.Compact>
          </div>

          <Form.Item
            name="cronExpression"
            label="Schedule (Cron Expression)"
            rules={[{ required: true, message: "Please enter a schedule" }]}
            help="Example: '0 17 * * *' for Daily at 5 PM."
          >
            <Input
              placeholder="0 17 * * *"
              readOnly={isGeneratingCron}
              className="h-10 rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* History Modal */}
      <Modal
        title={`Execution History: ${selectedRoutine?.name}`}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={700}
      >
        {runsLoading ? (
          <div className="p-8 text-center">
            <Spin />
          </div>
        ) : runs.length === 0 ? (
          <Empty description="No runs recorded yet." />
        ) : (
          <Timeline
            items={runs.map((run) => ({
              children: (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <Text
                      strong
                      className="text-xs text-slate-400 uppercase tracking-widest"
                    >
                      {dayjs(run.executed_at).format("MMM DD, YYYY · HH:mm")}
                    </Text>
                  </div>
                  <Paragraph className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap m-0 text-sm">
                    {run.result}
                  </Paragraph>
                </div>
              ),
            }))}
          />
        )}
      </Modal>
    </main>
  );
};

export default AIRoutinesPage;
