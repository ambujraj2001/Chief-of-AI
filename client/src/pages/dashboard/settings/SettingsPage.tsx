import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { type RootState } from "../../../store";
import { setUser } from "../../../store/userSlice";
import {
  apiUpdateProfile,
  apiGenerate2FA,
  apiEnable2FA,
  apiDisable2FA,
  type BootConfigResult,
} from "../../../services/api";
import { message, Slider, Switch, Modal, Input } from "antd";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    interactionTone: user.interactionTone as
      | "professional"
      | "casual"
      | "technical"
      | "concise",
    responseComplexity: user.responseComplexity,
    voiceModel: user.voiceModel as "standard" | "atlas",
    notifyResponseAlerts: true,
    notifyDailyBriefing: true,
  });

  // 2FA State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      interactionTone: user.interactionTone as
        | "professional"
        | "casual"
        | "technical"
        | "concise",
      responseComplexity: user.responseComplexity,
      voiceModel: user.voiceModel as "standard" | "atlas",
      notifyResponseAlerts: true,
      notifyDailyBriefing: true,
    });
  }, [user]);

  const handleInit2FA = useCallback(async () => {
    try {
      const accessCode = localStorage.getItem("accessCode") || "";
      const { secret, qrCodeUrl } = await apiGenerate2FA(accessCode);
      setTwoFactorSecret(secret);
      setQrCodeUrl(qrCodeUrl);
      setShow2FAModal(true);
    } catch {
      message.error("Failed to initialize 2FA setup");
    }
  }, []);

  const handleVerifyEnable2FA = useCallback(async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      message.warning("Please enter a valid 6-digit code");
      return;
    }
    setIsVerifying(true);
    try {
      const accessCode = localStorage.getItem("accessCode") || "";
      await apiEnable2FA(accessCode, twoFactorSecret, verificationCode);
      message.success("2FA enabled successfully!");
      setShow2FAModal(false);
      setVerificationCode("");
      // Update local state
      dispatch(
        setUser({
          preferences: {
            interactionTone: user.interactionTone,
            responseComplexity: user.responseComplexity,
            voiceModel: user.voiceModel,
            notifyResponseAlerts: user.notifyResponseAlerts,
            notifyDailyBriefing: user.notifyDailyBriefing,
            showDemo: user.showDemo,
            twoFactorEnabled: true,
          },
        } as BootConfigResult),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to enable 2FA";
      message.error(msg);
    } finally {
      setIsVerifying(false);
    }
  }, [verificationCode, twoFactorSecret, dispatch, user]);

  const handleDisable2FA = useCallback(async () => {
    Modal.confirm({
      title: "Disable Two-Factor Authentication?",
      content: "This will reduce your account security. Are you sure?",
      okText: "Yes, Disable",
      okType: "danger",
      onOk: async () => {
        try {
          const accessCode = localStorage.getItem("accessCode") || "";
          await apiDisable2FA(accessCode);
          message.success("2FA disabled");
          dispatch(
            setUser({
              preferences: {
                interactionTone: user.interactionTone,
                responseComplexity: user.responseComplexity,
                voiceModel: user.voiceModel,
                notifyResponseAlerts: user.notifyResponseAlerts,
                notifyDailyBriefing: user.notifyDailyBriefing,
                showDemo: user.showDemo,
                twoFactorEnabled: false,
              },
            } as BootConfigResult),
          );
        } catch {
          message.error("Failed to disable 2FA");
        }
      },
    });
  }, [dispatch, user]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      const accessCode = localStorage.getItem("accessCode") || "";
      const result = await apiUpdateProfile({
        accessCode,
        ...formData,
      });
      dispatch(setUser(result));
      message.success("Settings saved successfully!");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save settings";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [formData, dispatch]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, fullName: e.target.value }));
    },
    [],
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, email: e.target.value }));
    },
    [],
  );

  const handleRoleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, role: e.target.value }));
    },
    [],
  );

  const handleToneChange = useCallback(
    (tone: "professional" | "casual" | "technical" | "concise") => {
      setFormData((prev) => ({ ...prev, interactionTone: tone }));
    },
    [],
  );

  const handleComplexityChange = useCallback((val: number) => {
    setFormData((prev) => ({ ...prev, responseComplexity: val }));
  }, []);

  const handleAlertsChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, notifyResponseAlerts: checked }));
  }, []);

  const handleBriefingChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, notifyDailyBriefing: checked }));
  }, []);

  const handleVoiceChange = useCallback((value: "standard" | "atlas") => {
    setFormData((prev) => ({
      ...prev,
      voiceModel: value,
    }));
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full   font-[Inter]">
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-primary mb-2">
          <span className="material-symbols-outlined text-base">settings</span>
          <span className="text-xs font-bold uppercase tracking-widest">
            Account Preferences
          </span>
        </div>
        <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mt-1">
          Manage your AI assistant profile and system preferences
        </p>
      </div>

      <div className="space-y-8 pb-12">
        {/* Profile Section */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-primary text-[22px]">
              person
            </span>
            <h3 className="text-xl font-bold tracking-tight">Profile</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {formData.fullName
                ? formData.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "U"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 flex-1 w-full">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  className="w-full bg-[#FAFAFA] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                  type="text"
                  value={formData.fullName}
                  onChange={handleNameChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Email Address
                </label>
                <input
                  className="w-full bg-[#FAFAFA] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Role
                </label>
                <input
                  className="w-full bg-[#EEF2FF] dark:bg-primary/5 border border-[#D1E0FF] dark:border-primary/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-primary"
                  type="text"
                  value={formData.role}
                  onChange={handleRoleChange}
                  placeholder="e.g. Chief of AI Operations"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Preferences */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <span className="material-symbols-outlined text-primary text-[22px]">
                psychology
              </span>
              <h3 className="text-xl font-bold tracking-tight">
                AI Preferences
              </h3>
            </div>
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Interaction Tone
                </label>
                <div className="flex flex-wrap gap-2">
                  {["professional", "casual", "technical", "concise"].map(
                    (tone) => (
                      <button
                        key={tone}
                        onClick={() =>
                          handleToneChange(
                            tone as
                              | "professional"
                              | "casual"
                              | "technical"
                              | "concise",
                          )
                        }
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                          formData.interactionTone === tone
                            ? "bg-primary text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Response Complexity
                  </label>
                </div>
                <div className="px-1 relative pb-6">
                  <Slider
                    min={1}
                    max={5}
                    value={formData.responseComplexity}
                    onChange={handleComplexityChange}
                    tooltip={{ open: false }}
                    className="settings-slider"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span
                      className={`text-[10px] font-bold uppercase transition-colors ${formData.responseComplexity === 1 ? "text-slate-900" : "text-slate-400"}`}
                    >
                      Simple
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase transition-colors ${formData.responseComplexity === 3 ? "text-primary" : "text-slate-400"}`}
                    >
                      Balanced
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase transition-colors ${formData.responseComplexity === 5 ? "text-slate-900" : "text-slate-400"}`}
                    >
                      Expert
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Voice Input */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <span className="material-symbols-outlined text-primary text-[22px]">
                mic_none
              </span>
              <h3 className="text-xl font-bold tracking-tight">Voice Input</h3>
            </div>
            <div className="space-y-4 text-left">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Voice Model
                </label>
                <div className="space-y-3">
                  {[
                    { id: "standard", label: "Nova (Standard)" },
                    { id: "atlas", label: "Atlas (Deep Tone)" },
                  ].map((model) => (
                    <button
                      key={model.id}
                      onClick={() =>
                        handleVoiceChange(model.id as "standard" | "atlas")
                      }
                      className={`w-full px-5 py-4 rounded-xl border flex items-center justify-between group transition-all ${
                        formData.voiceModel === model.id
                          ? "bg-[#EEF2FF] border-primary text-primary"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-sm font-bold">{model.label}</span>
                      <span
                        className={`material-symbols-outlined text-lg transition-transform ${formData.voiceModel === model.id ? "translate-x-0" : "text-slate-300 group-hover:translate-x-1"}`}
                      >
                        chevron_right
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <span className="material-symbols-outlined text-primary text-[22px]">
                notifications_none
              </span>
              <h3 className="text-xl font-bold tracking-tight">
                Notifications
              </h3>
            </div>
            <div className="space-y-6">
              {[
                {
                  id: "alerts",
                  label: "System Alerts",
                  desc: "Critical AI status updates",
                  checked: formData.notifyResponseAlerts,
                  onChange: handleAlertsChange,
                },
                {
                  id: "summaries",
                  label: "Daily AI Summaries",
                  desc: "Every morning at 8:00 AM",
                  checked: formData.notifyDailyBriefing,
                  onChange: handleBriefingChange,
                },
              ].map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between pb-6 ${idx === 0 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {item.desc}
                    </p>
                  </div>
                  <Switch checked={item.checked} onChange={item.onChange} />
                </div>
              ))}
            </div>
          </section>

          {/* Security */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <span className="material-symbols-outlined text-primary text-[22px]">
                verified_user
              </span>
              <h3 className="text-xl font-bold tracking-tight">Security</h3>
            </div>
            <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Two-Factor Authentication
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Status:
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-widest ${user.twoFactorEnabled ? "text-green-500" : "text-amber-500"}`}
                  >
                    {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[240px]">
                  Add extra security via TOTP authenticator apps.
                </p>
              </div>
              <button
                onClick={
                  user.twoFactorEnabled ? handleDisable2FA : handleInit2FA
                }
                className="px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all whitespace-nowrap"
              >
                {user.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </div>
          </section>
        </div>

        {/* Data Management */}
        <section className="bg-[#EEF2FF] dark:bg-primary/10 rounded-3xl p-6 sm:p-10 border border-[#D1E0FF] dark:border-primary/20">
          <div className="flex items-center gap-3 mb-10">
            <span className="material-symbols-outlined text-primary text-[24px]">
              database
            </span>
            <h3 className="text-xl font-bold tracking-tight">
              Data Management
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-4">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-slate-900 dark:text-white text-[24px]">
                  download
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Export Data
                </p>
                <p className="text-[11px] text-slate-400 font-medium px-4">
                  Download all AI logs and configurations.
                </p>
              </div>
              <button className="w-full py-3.5 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Export JSON
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-4">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[24px]">
                  delete_sweep
                </span>
                <p className="text-sm font-bold text-amber-600">Clear Memory</p>
                <p className="text-[11px] text-slate-400 font-medium px-4">
                  Wipe the short-term contextual memory.
                </p>
              </div>
              <button className="w-full py-3.5 bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all">
                Clear Context
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-4">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  visibility_off
                </span>
                <p className="text-sm font-bold text-primary">Privacy Mode</p>
                <p className="text-[11px] text-slate-400 font-medium px-4">
                  Disable data logging for the next 24 hours.
                </p>
              </div>
              <button className="w-full py-3.5 bg-[#EEF2FF] dark:bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-[#E0E7FF] transition-all">
                Go Incognito
              </button>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 pb-12">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-10 py-3.5 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">Saving...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">
                  save
                </span>
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>

      <Modal
        title="Setup Authenticator App"
        open={show2FAModal}
        onCancel={() => setShow2FAModal(false)}
        footer={null}
        width={400}
        centered
        className="settings-modal"
      >
        <div className="space-y-6 py-2">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-4">
              Scan this QR code with your authenticator app (Google
              Authenticator, Microsoft Authenticator, Authy, etc.)
            </p>
            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block">
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            )}
            <div className="mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Manual Secret Key
              </p>
              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-primary text-xs font-mono">
                {twoFactorSecret}
              </code>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">Verification Code</label>
            <Input
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))
              }
              maxLength={6}
              className="text-center text-lg tracking-[0.5em] py-3 rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>

          <button
            onClick={handleVerifyEnable2FA}
            disabled={isVerifying || verificationCode.length !== 6}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isVerifying ? "Verifying..." : "Verify & Enable 2FA"}
          </button>
        </div>
      </Modal>
    </main>
  );
};

export default SettingsPage;
