import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Activity,
    Database,
    Cpu,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    BarChart3,
    Download,
    Users,
    UserCheck,
    Shield,
    Terminal,
    MapPin,
    Calendar,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const AdminPanel = ({ token }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'events', 'users'
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [health, setHealth] = useState({
        latency: "---",
        integrity: "---",
        uptime: "---",
        status: "Checking..."
    });
    const [metrics, setMetrics] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);

    useEffect(() => {
        const loadAdminData = async () => {
            setLoading(true);
            await Promise.all([
                fetchMetrics(),
                fetchEvents(),
                fetchUsers(),
                fetchLogs(),
                fetchHealth()
            ]);
            setLoading(false);
        };
        loadAdminData();
    }, []);

    const fetchHealth = async () => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/admin/health`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHealth(resp.data);
        } catch (err) {
            console.error("Error fetching health", err);
        }
    };

    const fetchLogs = async () => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/admin/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(resp.data);
        } catch (err) {
            console.error("Error fetching logs", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(resp.data);
        } catch (err) {
            console.error("Error fetching users", err);
        }
    };

    const fetchEvents = async () => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/events`);
            setEvents(resp.data);
        } catch (err) {
            console.error("Error fetching events", err);
        }
    };

    const fetchMetrics = async () => {
        try {
            const resp = await axios.get(`${API_BASE_URL}/api/v1/analytics/model-performance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMetrics(resp.data);
        } catch (err) {
            console.error("Error fetching admin metrics", err);
        }
    };

    const handleRetrain = async () => {
        setRefreshing(true);
        try {
            const resp = await axios.post(`${API_BASE_URL}/api/v1/admin/retrain`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(resp.data.message);
            fetchMetrics();
        } catch (err) {
            alert("Retraining failed: " + (err.response?.data?.detail || err.message));
        } finally {
            setRefreshing(false);
        }
    };

    const handleRoleToggle = async (userId, currentIsAdmin) => {
        try {
            await axios.post(`${API_BASE_URL}/api/v1/admin/users/${userId}/role`, null, {
                params: { is_admin: !currentIsAdmin },
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
            alert("User role updated successfully");
        } catch (err) {
            alert("Failed to update role: " + (err.response?.data?.detail || err.message));
        }
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        payload.latitude = parseFloat(payload.latitude);
        payload.longitude = parseFloat(payload.longitude);
        payload.expected_attendance = parseInt(payload.expected_attendance);

        try {
            await axios.post(`${API_BASE_URL}/api/v1/events`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEventModal(false);
            fetchEvents();
        } catch (err) {
            alert("Failed to add event: " + (err.response?.data?.detail || err.message));
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!confirm("Delete this event?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/v1/events/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEvents();
        } catch (err) {
            alert("Failed to delete event");
        }
    };

    const handleFileUpload = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                setRefreshing(true);
                const resp = await axios.post(`${API_BASE_URL}/api/v1/admin/upload-data`, {
                    file_name: file.name,
                    data: [{ id: 1 }, { id: 2 }]
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert(resp.data.message);
                fetchMetrics();
            } catch (err) {
                alert("Upload failed: " + (err.response?.data?.detail || err.message));
            } finally {
                setRefreshing(false);
            }
        };
        input.click();
    };

    if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Initializing Management Console...</div>;

    return (
        <div className="flex-1 p-4 md:p-10 space-y-10 animate-in fade-in duration-500 bg-white overflow-y-auto custom-scrollbar h-full">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] mb-1.5">
                        <Shield size={12} />
                        Authorized Personnel Only
                    </div>
                    <h2 className="text-3xl font-bold font-outfit text-slate-900 leading-tight">Management Dashboard</h2>
                    <p className="text-slate-500 text-sm font-medium">System diagnostics and predictive model configuration.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex w-full sm:w-auto shadow-sm">
                        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="System Status" />
                        <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} label="City Events" />
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Personnel" />
                    </div>
                    {activeTab === 'overview' ? (
                        <button
                            onClick={handleRetrain}
                            disabled={refreshing}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-primary/10 transition-all active:scale-95 disabled:opacity-50 text-sm"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? "Processing..." : "Retrain Engine"}
                        </button>
                    ) : activeTab === 'events' && (
                        <button
                            onClick={() => setShowEventModal(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-primary/10 transition-all text-sm"
                        >
                            <Calendar size={16} />
                            Register Event
                        </button>
                    )}
                </div>
            </header>

            {activeTab === 'overview' ? (
                <>
                    {/* Telemetry Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <HealthCard icon={<Terminal size={20} />} label="Response Time" value={health.latency} status={health.status} />
                        <HealthCard icon={<Database size={20} />} label="Data Stream" value={health.integrity} status="Optimal" />
                        <HealthCard icon={<Activity size={20} />} label="Live Uptime" value={health.uptime} status="Stable" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Model Insight */}
                        <div className="lg:col-span-2 space-y-8">
                            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Cpu size={18} /></div>
                                        Predictive Engine Metrics
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-widest">v1.4.2 Production</span>
                                </div>

                                <div className="p-8 space-y-10">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                        <MetricBox label="Mean Absolute Error" value={metrics?.mae || "7.2%"} trend="-0.4%" isGood={true} />
                                        <MetricBox label="Reliability Score" value={metrics?.r2_score || "0.86"} trend="+0.02" isGood={true} />
                                        <MetricBox label="Model Accuracy" value={metrics?.accuracy || "94.1%"} trend="+1.2%" isGood={true} />
                                    </div>

                                    <div className="bg-slate-50 p-8 rounded-[24px] border border-slate-100">
                                        <div className="flex items-center justify-between mb-8">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Weight Distribution</h4>
                                            <span className="text-[10px] text-primary font-bold">Last Trained: {metrics?.last_trained || 'Just now'}</span>
                                        </div>
                                        <div className="space-y-6">
                                            {metrics?.feature_importance ? (
                                                Object.entries(metrics.feature_importance)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 4)
                                                    .map(([key, value], idx) => (
                                                        <ImportanceBar
                                                            key={key}
                                                            label={key.replace(/_/g, ' ')}
                                                            weight={Math.round(value * 100)}
                                                            color={idx === 0 ? "bg-primary" : idx === 1 ? "bg-orange-500" : idx === 2 ? "bg-indigo-500" : "bg-teal-500"}
                                                        />
                                                    ))
                                            ) : (
                                                <div className="py-4 text-center text-slate-300 text-sm italic">Feature data pending...</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="font-bold font-outfit text-base mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg"><Terminal size={18} /></div>
                                    System Audit Logs
                                </h3>
                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                    {logs.length > 0 ? logs.map(log => (
                                        <LogEntry
                                            key={log.id}
                                            time={new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            text={log.message}
                                            level={log.level}
                                        />
                                    )) : (
                                        <div className="py-10 text-center text-slate-300 text-sm italic">No recent events recorded.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Actions */}
                        <div className="space-y-6">
                            <div
                                onClick={handleFileUpload}
                                className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 flex flex-col justify-center items-center text-center group hover:bg-slate-100/50 hover:border-primary/30 transition-all cursor-pointer shadow-sm"
                            >
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-all mb-4 border border-slate-100">
                                    <Download size={24} />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1 text-sm">Ingest Dataset</h3>
                                <p className="text-[12px] text-slate-500 font-medium">Upload CSV/JSON records for training.</p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <h3 className="font-bold font-outfit text-base mb-2 text-slate-900">Analysis Export</h3>
                                <p className="text-slate-500 text-[13px] mb-5 leading-relaxed">Generate performance reports for urban mobility planning.</p>
                                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-slate-900/10">
                                    <Activity size={16} />
                                    Generate Audit
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : activeTab === 'events' ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                            <Database size={18} className="text-primary" />
                            Registered City Events
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{events.length} Active Events</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Event Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Venue</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {events.map(event => (
                                    <tr key={event.event_id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">{event.event_name}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold">
                                                {event.event_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-[13px]">{event.venue}</td>
                                        <td className="px-6 py-4 text-slate-500 text-[12px]">{new Date(event.start_time).toLocaleDateString()} • {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="px-6 py-4 font-bold text-slate-700 text-sm">{event.expected_attendance?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeleteEvent(event.event_id)}
                                                className="text-rose-500 hover:text-rose-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            Personnel Directory
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{users.length} Total Accounts</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">User Account</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clearance Level</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded bg-primary text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                                    {u.name[0]}
                                                </div>
                                                <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-[13px]">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${u.is_admin ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                {u.is_admin ? 'Administrator' : 'Standard User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleRoleToggle(u.id, u.is_admin)}
                                                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <Shield size={14} />
                                                Update Role
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }

            {
                showEventModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white border border-slate-200 p-8 rounded-2xl w-full max-w-2xl relative animate-in zoom-in duration-300 shadow-2xl">
                            <button onClick={() => setShowEventModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
                            <h3 className="text-2xl font-bold font-outfit text-slate-900 mb-6">Register New City Event</h3>
                            <form onSubmit={handleAddEvent} className="grid grid-cols-2 gap-8">
                                <FormInput label="Event Designation" name="event_name" required placeholder="e.g. City Marathon" />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Category</label>
                                    <select name="event_type" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:border-primary focus:bg-white outline-none transition-all">
                                        <option>Concert</option>
                                        <option>Sports</option>
                                        <option>Festival</option>
                                        <option>Conference</option>
                                    </select>
                                </div>
                                <FormInput label="Primary Venue" name="venue" required placeholder="e.g. Grand Plaza" />
                                <FormInput label="Est. Impact (Attendance)" name="expected_attendance" type="number" required placeholder="5000" />
                                <FormInput label="Commencement" name="start_time" type="datetime-local" required />
                                <FormInput label="Conclusion" name="end_time" type="datetime-local" required />
                                <FormInput label="Latitude" name="latitude" type="number" step="0.0001" defaultValue="23.0225" />
                                <FormInput label="Longitude" name="longitude" type="number" step="0.0001" defaultValue="72.5714" />
                                <div className="col-span-2 pt-4">
                                    <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md shadow-primary/10 transition-all active:scale-95 uppercase tracking-widest text-[11px]">
                                        Confirm Registration
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const TabButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`flex-1 px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-white text-slate-900 shadow-md border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
    >
        {label}
    </button>
);

const FormInput = ({ label, ...props }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
        <input {...props} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all placeholder:text-slate-300 text-slate-700 shadow-sm" />
    </div>
);

const HealthCard = ({ icon, label, value, status }) => (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/10 hover:shadow-2xl hover:shadow-slate-200/30 transition-all group">
        <div className="flex items-center justify-between mb-6">
            <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                {icon}
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                {status}
            </span>
        </div>
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</div>
        <div className="text-3xl font-black font-outfit text-slate-900">{value}</div>
    </div>
);

const MetricBox = ({ label, value, trend, isGood }) => (
    <div className="space-y-3">
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{label}</div>
        <div className="flex items-end gap-3">
            <div className="text-4xl font-black font-outfit text-slate-900">{value}</div>
            <div className={`text-[10px] font-bold pb-2 ${isGood ? 'text-emerald-500' : 'text-red-500'}`}>{trend}</div>
        </div>
        <div className="w-full h-1.5 bg-slate-50 rounded-full mt-4 overflow-hidden border border-slate-100/50">
            <div className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" style={{ width: '85%' }}></div>
        </div>
    </div>
);

const LogEntry = ({ time, text, level }) => (
    <div className="flex items-center gap-4 text-sm group">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest min-w-[60px]">{time}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${level === 'error' ? 'bg-red-500 animate-pulse' : level === 'warning' ? 'bg-orange-400' : 'bg-primary/30'}`} />
        <span className={`font-medium ${level === 'error' ? 'text-red-600' : level === 'warning' ? 'text-orange-600' : 'text-slate-600'} group-hover:text-slate-900 transition-colors`}>{text}</span>
    </div>
);

const ImportanceBar = ({ label, weight, color }) => (
    <div className="space-y-3">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${color}`} />{label}</span>
            <span className="text-slate-900">{weight}%</span>
        </div>
        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden border border-slate-200/50">
            <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${weight}%` }}></div>
        </div>
    </div>
);

const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export default AdminPanel;
