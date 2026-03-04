import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '../../store';
import { setUser } from '../../store/userSlice';
import { apiUpdateProfile } from '../../services/api';
import { message, Slider, Switch, Radio } from 'antd';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    interactionTone: user.interactionTone as 'professional' | 'casual' | 'technical' | 'concise',
    responseComplexity: user.responseComplexity,
    voiceModel: user.voiceModel as 'standard' | 'atlas',
    notifyResponseAlerts: true,
    notifyDailyBriefing: true,
  });

  useEffect(() => {
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      interactionTone: user.interactionTone as 'professional' | 'casual' | 'technical' | 'concise',
      responseComplexity: user.responseComplexity,
      voiceModel: user.voiceModel as 'standard' | 'atlas',
      notifyResponseAlerts: true,
      notifyDailyBriefing: true,
    });
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const accessCode = localStorage.getItem('accessCode') || '';
      const result = await apiUpdateProfile({
        accessCode,
        ...formData
      });
      dispatch(setUser(result));
      message.success('Settings saved successfully!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save settings';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/20">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 px-8 py-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
          Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your AI assistant profile and system preferences
        </p>
      </header>

      <div className="w-full px-8 py-10">
        <div className="space-y-12">
          {/* Profile Section */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="material-symbols-outlined text-primary">person</span>
              <h3 className="text-xl font-bold">Profile</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    className="h-full w-full object-cover"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'User')}&background=137fec&color=fff&size=200`}
                    alt="Profile"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Full Name</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Email Address</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-500">Role</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Chief of AI Operations"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* AI Preferences */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="text-xl font-bold">AI Preferences</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-semibold block">Interaction Tone</label>
                <div className="flex flex-wrap gap-2">
                  {['professional', 'casual', 'technical', 'concise'].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setFormData({ ...formData, interactionTone: tone as 'professional' | 'casual' | 'technical' | 'concise' })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.interactionTone === tone
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">Response Complexity</label>
                  <span className="text-xs text-primary font-bold uppercase">
                    {formData.responseComplexity === 1 ? 'Simple' : 
                     formData.responseComplexity === 2 ? 'Simplified' :
                     formData.responseComplexity === 3 ? 'Balanced' :
                     formData.responseComplexity === 4 ? 'Detailed' : 'Expert'}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  value={formData.responseComplexity}
                  onChange={(val) => setFormData({ ...formData, responseComplexity: val })}
                  tooltip={{ open: false }}
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1 uppercase tracking-tighter">
                  <span>Simple</span>
                  <span>Expert</span>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications & Voice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="material-symbols-outlined text-primary">notifications_active</span>
                <h3 className="text-xl font-bold">Notifications</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">System Alerts</span>
                    <span className="text-xs text-slate-500">Critical AI status updates</span>
                  </div>
                  <Switch
                    checked={formData.notifyResponseAlerts}
                    onChange={(checked) => setFormData({ ...formData, notifyResponseAlerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">Daily AI Summaries</span>
                    <span className="text-xs text-slate-500">Every morning at 8:00 AM</span>
                  </div>
                  <Switch
                    checked={formData.notifyDailyBriefing}
                    onChange={(checked) => setFormData({ ...formData, notifyDailyBriefing: checked })}
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="material-symbols-outlined text-primary">mic</span>
                <h3 className="text-xl font-bold">Voice Input</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Voice Model</label>
                  <Radio.Group
                    value={formData.voiceModel}
                    onChange={(e) => setFormData({ ...formData, voiceModel: e.target.value })}
                    className="w-full flex flex-col gap-2"
                  >
                    <Radio.Button value="standard" className="rounded-lg h-10 flex items-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">Nova (Standard)</Radio.Button>
                    <Radio.Button value="atlas" className="rounded-lg h-10 flex items-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">Atlas (Deep Tone)</Radio.Button>
                  </Radio.Group>
                </div>
              </div>
            </section>
          </div>

          {/* Data Management */}
          <section className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 border border-primary/20">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">database</span>
              <h3 className="text-xl font-bold">Data Management</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold mb-1">Export Data</h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">Download all AI logs and personal configurations.</p>
                <button className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all">Export JSON</button>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold mb-1 text-amber-600">Clear Memory</h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">Wipe the short-term contextual memory of the AI.</p>
                <button className="w-full py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all">Clear Context</button>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold mb-1 text-primary">Privacy Mode</h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">Disable data logging for the next 24 hours.</p>
                <button className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all">Go Incognito</button>
              </div>
            </div>
          </section>

          {/* Save Footer */}
          <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-10 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
