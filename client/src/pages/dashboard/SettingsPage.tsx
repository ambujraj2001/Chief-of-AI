import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { type RootState } from "../../store";
import { setUser } from "../../store/userSlice";
import {
  apiUpdateProfile,
  apiGenerate2FA,
  apiEnable2FA,
  apiDisable2FA,
  type BootConfigResult,
} from "../../services/api";
import {
  message,
  Slider,
  Switch,
  Radio,
  type RadioChangeEvent,
  Modal,
  Input,
} from "antd";

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

  const handleVoiceChange = useCallback((e: RadioChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      voiceModel: e.target.value as "standard" | "atlas",
    }));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/20">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
          Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your AI assistant profile and system preferences
        </p>
      </header>

      <div className="w-full px-4 sm:px-8 py-6 sm:py-10">
        <div className="space-y-8 sm:space-y-12">
          {/* Profile Section */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="material-symbols-outlined text-primary">
                person
              </span>
              <h3 className="text-lg sm:text-xl font-bold">Profile</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start">
              <div className="relative group shrink-0">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    className="h-full w-full object-cover"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || "User")}&background=3c83f6&color=fff&size=200`}
                    alt="Profile"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-slate-500">
                    Full Name
                  </label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-sm sm:text-base"
                    type="text"
                    value={formData.fullName}
                    onChange={handleNameChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-slate-500">
                    Email Address
                  </label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-sm sm:text-base"
                    type="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-500">
                    Role
                  </label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-sm sm:text-base"
                    type="text"
                    value={formData.role}
                    onChange={handleRoleChange}
                    placeholder="e.g. Chief of AI Operations"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* AI Preferences */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="material-symbols-outlined text-primary">
                psychology
              </span>
              <h3 className="text-lg sm:text-xl font-bold">AI Preferences</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-semibold block">
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
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                          formData.interactionTone === tone
                            ? "bg-primary text-white shadow-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">
                    Response Complexity
                  </label>
                  <span className="text-[10px] sm:text-xs text-primary font-bold uppercase">
                    {formData.responseComplexity === 1
                      ? "Simple"
                      : formData.responseComplexity === 2
                        ? "Simplified"
                        : formData.responseComplexity === 3
                          ? "Balanced"
                          : formData.responseComplexity === 4
                            ? "Detailed"
                            : "Expert"}
                  </span>
                </div>
                <div className="px-1">
                  <Slider
                    min={1}
                    max={5}
                    value={formData.responseComplexity}
                    onChange={handleComplexityChange}
                    tooltip={{ open: false }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1 uppercase tracking-tighter">
                  <span>Simple</span>
                  <span>Expert</span>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications & Voice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="material-symbols-outlined text-primary">
                  notifications_active
                </span>
                <h3 className="text-lg sm:text-xl font-bold">Notifications</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-left">
                      System Alerts
                    </span>
                    <span className="text-[10px] text-slate-500 text-left">
                      Critical AI status updates
                    </span>
                  </div>
                  <Switch
                    size="small"
                    checked={formData.notifyResponseAlerts}
                    onChange={handleAlertsChange}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-left">
                      Daily AI Summaries
                    </span>
                    <span className="text-[10px] text-slate-500 text-left">
                      Every morning at 8:00 AM
                    </span>
                  </div>
                  <Switch
                    size="small"
                    checked={formData.notifyDailyBriefing}
                    onChange={handleBriefingChange}
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="material-symbols-outlined text-primary">
                  mic
                </span>
                <h3 className="text-lg sm:text-xl font-bold">Voice Input</h3>
              </div>
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Voice Model
                  </label>
                  <Radio.Group
                    value={formData.voiceModel}
                    onChange={handleVoiceChange}
                    className="w-full flex flex-col gap-2"
                  >
                    <Radio.Button
                      value="standard"
                      className="text-xs sm:text-sm rounded-lg h-10 flex items-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    >
                      Nova (Standard)
                    </Radio.Button>
                    <Radio.Button
                      value="atlas"
                      className="text-xs sm:text-sm rounded-lg h-10 flex items-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    >
                      Atlas (Deep Tone)
                    </Radio.Button>
                  </Radio.Group>
                </div>
              </div>
            </section>
          </div>

          {/* Security Section */}
          <section className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">
                security
              </span>
              <h3 className="text-lg sm:text-xl font-bold">Security</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:shadow-md">
              <div className="flex flex-col mb-4 sm:mb-0">
                <span className="text-sm font-bold text-left">
                  Two-Factor Authentication
                </span>
                <span className="text-[10px] text-slate-500 text-left">
                  Status:{" "}
                  <span
                    className={
                      user.twoFactorEnabled
                        ? "text-green-500 font-bold"
                        : "text-amber-500 font-bold"
                    }
                  >
                    {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </span>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
                  Add an extra layer of security to your account using TOTP
                  authenticator apps.
                </p>
              </div>
              <button
                onClick={
                  user.twoFactorEnabled ? handleDisable2FA : handleInit2FA
                }
                className={`w-full sm:w-auto px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                  user.twoFactorEnabled
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100"
                    : "bg-primary text-white hover:opacity-90"
                }`}
              >
                {user.twoFactorEnabled
                  ? "Disable 2FA"
                  : "Enable Authenticator App"}
              </button>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 sm:p-8 border border-primary/20">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">
                database
              </span>
              <h3 className="text-lg sm:text-xl font-bold">Data Management</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                <h4 className="text-sm font-bold mb-1">Export Data</h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                  Download all AI logs and personal configurations.
                </p>
                <button className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all text-center">
                  Export JSON
                </button>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                <h4 className="text-sm font-bold mb-1 text-amber-600">
                  Clear Memory
                </h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                  Wipe the short-term contextual memory of the AI.
                </p>
                <button className="w-full py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all text-center">
                  Clear Context
                </button>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                <h4 className="text-sm font-bold mb-1 text-primary">
                  Privacy Mode
                </h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                  Disable data logging for the next 24 hours.
                </p>
                <button className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all text-center">
                  Go Incognito
                </button>
              </div>
            </div>
          </section>

          <Modal
            title="Setup Authenticator App"
            open={show2FAModal}
            onCancel={() => setShow2FAModal(false)}
            footer={null}
            width={400}
            centered
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
                <p className="text-[10px] text-slate-500 text-center">
                  Enter the code generated by your app to verify setup.
                </p>
              </div>

              <button
                onClick={handleVerifyEnable2FA}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Verify & Enable 2FA"}
              </button>
            </div>
          </Modal>

          {/* Save Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-slate-200 dark:border-slate-800 pb-10">
            <button
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
