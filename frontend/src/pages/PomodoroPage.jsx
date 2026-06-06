import React, { useState, useEffect, useRef, useCallback } from 'react';
import { pomodoroApi } from '../api/pomodoroApi';
import { taskApi } from '../api/taskApi';
import {
    PlayIcon, PauseIcon, ArrowPathIcon, Cog6ToothIcon,
    XMarkIcon, ClockIcon, FireIcon,
    BoltIcon, BriefcaseIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

// --- Cấu hình mặc định ---
const DEFAULT_SETTINGS = {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    cyclesBeforeLongBreak: 4, // Số chu kỳ Focus trước khi nghỉ dài
    autoStart: true,          // Tự động bắt đầu phase tiếp theo
};

const MODES = [
    { key: 'focus', label: 'Tập trung', color: 'blue' },
    { key: 'shortBreak', label: 'Nghỉ ngắn', color: 'green' },
    { key: 'longBreak', label: 'Nghỉ dài', color: 'purple' },
];

// SVG vòng tròn đếm ngược
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PomodoroPage = () => {
    // --- Timer State ---
    const [mode, setMode] = useState('focus');
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focus * 60);
    const [totalTime, setTotalTime] = useState(DEFAULT_SETTINGS.focus * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [currentCycle, setCurrentCycle] = useState(1);

    // --- UI State ---
    const [showSettings, setShowSettings] = useState(false);
    const [tempSettings, setTempSettings] = useState(DEFAULT_SETTINGS);
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionSaved, setSessionSaved] = useState(false);
    // Toast notification nội bộ
    const [toast, setToast] = useState(null); // { title, body, type: 'focus'|'break' }
    const toastTimerRef = useRef(null);

    const intervalRef = useRef(null);
    // Dùng ref thay vì state để tránh stale closure gây lưu 2 lần
    const sessionSavedRef = useRef(false);
    const isCompletedRef = useRef(false); // Flag đánh dấu timer vừa complete
    const modeRef = useRef(mode);         // Luôn giữ giá trị mode mới nhất
    const settingsRef = useRef(settings); // Luôn giữ settings mới nhất
    const currentCycleRef = useRef(1);    // Luôn giữ chu kỳ mới nhất

    // --- Fetch data ---
    const fetchData = useCallback(async () => {
        try {
            const [sessionsRes, statsRes, tasksRes] = await Promise.all([
                pomodoroApi.getSessions(),
                pomodoroApi.getStats(),
                // getAllTasks trả về dự liệu phân trang, nên lấy .content
                taskApi.getAllTasks({ page: 0, size: 100 }),
            ]);
            setSessions((sessionsRes.data || []).slice(0, 20));
            setStats(statsRes.data);
            // API tasks trả về Page object, content là mảng tasks
            const taskList = tasksRes.data?.content || tasksRes.data || [];
            setTasks(Array.isArray(taskList) ? taskList : []);
        } catch (err) {
            console.error('Lỗi tải dữ liệu Pomodoro:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Xin quyền thông báo khi mời vào trang
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [fetchData]);

    // Đồng bộ refs với state — để tránh stale closure trong timer effects
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { settingsRef.current = settings; }, [settings]);
    useEffect(() => { currentCycleRef.current = currentCycle; }, [currentCycle]);

    // --- Timer Logic ---
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        // Chỉ đặt flag, KHÔNG gọi async ở đây
                        isCompletedRef.current = true;
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    // Effect riêng để xử lý khi đồng hồ về 0 — luôn gọi handleTimerComplete bất kể mode
    useEffect(() => {
        if (timeLeft === 0 && isCompletedRef.current) {
            isCompletedRef.current = false;
            setIsRunning(false);
            handleTimerComplete();
        }
    }, [timeLeft]);

    const handleTimerComplete = async () => {
        // Dùng refs để lấy giá trị mới nhất, tránh stale closure
        const currentMode = modeRef.current;
        const currentSettings = settingsRef.current;
        const cycle = currentCycleRef.current;

        playBeep();

        if (currentMode === 'focus') {
            sendNotification('Hết giờ Tập trung! 🎯', 'Tuyệt vời! Đã hoàn thành 1 phiên Pomodoro. Đến lúc nghỉ ngơi rồi!', 'focus');
            await saveSession('COMPLETED');

            const maxCycles = currentSettings.cyclesBeforeLongBreak || 4;
            const isLastCycle = cycle >= maxCycles;
            const nextMode = isLastCycle ? 'longBreak' : 'shortBreak';

            const newTime = currentSettings[nextMode] * 60;
            setMode(nextMode);
            setTimeLeft(newTime);
            setTotalTime(newTime);
            setStartTime(null);
            sessionSavedRef.current = false;
            setSessionSaved(false);
            isCompletedRef.current = false;
            setCurrentCycle(isLastCycle ? 1 : cycle + 1);

            if (currentSettings.autoStart) {
                setTimeout(() => setIsRunning(true), 800);
            }
        } else {
            // Break xong → chuyển về Focus
            const breakLabel = currentMode === 'longBreak' ? 'Nghỉ dài' : 'Nghỉ ngắn';
            sendNotification(`Hết giờ ${breakLabel}! ⏰`, 'Sẵn sàng cho phiên tập trung tiếp theo chưa?', 'break');

            const newTime = currentSettings.focus * 60;
            setMode('focus');
            setTimeLeft(newTime);
            setTotalTime(newTime);
            setStartTime(null);
            sessionSavedRef.current = false;
            setSessionSaved(false);
            isCompletedRef.current = false;

            if (currentSettings.autoStart) {
                setTimeout(() => {
                    setStartTime(new Date().toISOString().slice(0, 19));
                    setIsRunning(true);
                }, 800);
            }
        }
    };

    const sendNotification = (title, body, type) => {
        // In-app toast (luôn hoạt động, không cần browser permission)
        clearTimeout(toastTimerRef.current);
        setToast({ title, body, type });
        toastTimerRef.current = setTimeout(() => setToast(null), 5000);

        // Cố gắng gửi browser notification nếu có quyền
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    };

    const playBeep = () => {
        // Tạo beep bằng Web Audio API
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 1.5);
        } catch (e) {}
    };

    const saveSession = async (status) => {
        // Dùng ref để chắn race condition (state update là async, ref là sync)
        if (sessionSavedRef.current) return;
        sessionSavedRef.current = true;
        setSessionSaved(true);
        try {
            await pomodoroApi.saveSession({
                durationMinutes: settings[mode],
                startTime: startTime,
                endTime: new Date().toISOString().slice(0, 19),
                status: status,
                taskId: selectedTaskId ? Number(selectedTaskId) : null,
            });
            await fetchData();
        } catch (err) {
            console.error('Lỗi lưu phiên:', err);
        }
    };

    const handleStart = () => {
        if (!isRunning && timeLeft === totalTime) {
            setStartTime(new Date().toISOString().slice(0, 19));
            // Reset cả 2 flag khi bắt đầu phiên mới
            sessionSavedRef.current = false;
            setSessionSaved(false);
            isCompletedRef.current = false;
        }
        setIsRunning(true);
    };

    const handlePause = async () => {
        setIsRunning(false);
        // Khi tạm dừng, lưu phiên bị gián đoạn nếu đã chạy hơn 1 phút
        if (mode === 'focus' && startTime && totalTime - timeLeft > 60) {
            await saveSession('INTERRUPTED');
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        clearInterval(intervalRef.current);
        const newTime = settings[mode] * 60;
        setTimeLeft(newTime);
        setTotalTime(newTime);
        setStartTime(null);
        // Reset cả 2 flag
        sessionSavedRef.current = false;
        setSessionSaved(false);
        isCompletedRef.current = false;
    };

    const handleModeChange = (newMode) => {
        setIsRunning(false);
        clearInterval(intervalRef.current);
        setMode(newMode);
        const newTime = settings[newMode] * 60;
        setTimeLeft(newTime);
        setTotalTime(newTime);
        setStartTime(null);
        sessionSavedRef.current = false;
        setSessionSaved(false);
        isCompletedRef.current = false;
    };

    const handleSaveSettings = () => {
        setSettings(tempSettings);
        const newTime = tempSettings[mode] * 60;
        setTimeLeft(newTime);
        setTotalTime(newTime);
        setIsRunning(false);
        setShowSettings(false);
    };

    // --- Format time ---
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // --- SVG Progress ---
    const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
    const dashOffset = CIRCUMFERENCE * (1 - progress);

    const currentMode = MODES.find(m => m.key === mode);
    const modeColorMap = {
        blue: { ring: 'stroke-blue-500', text: 'text-blue-500', bg: 'bg-blue-600', tab: 'bg-blue-600 text-white', tabHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
        green: { ring: 'stroke-green-500', text: 'text-green-500', bg: 'bg-green-600', tab: 'bg-green-600 text-white', tabHover: 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400' },
        purple: { ring: 'stroke-purple-500', text: 'text-purple-500', bg: 'bg-purple-600', tab: 'bg-purple-600 text-white', tabHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
    };
    const colors = modeColorMap[currentMode.color];

    return (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen transition-colors">
            {/* ===== IN-APP TOAST NOTIFICATION ===== */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 max-w-sm w-full shadow-2xl rounded-2xl overflow-hidden animate-slide-in`}
                    style={{ animation: 'slideInRight 0.3s ease-out' }}>
                    <div className={`p-4 flex items-start gap-3 ${
                        toast.type === 'focus'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                            : 'bg-gradient-to-r from-green-600 to-green-500'
                    } text-white`}>
                        <div className="text-2xl flex-shrink-0">
                            {toast.type === 'focus' ? '🎯' : '☕'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{toast.title}</p>
                            <p className="text-xs text-white/80 mt-0.5">{toast.body}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="text-white/60 hover:text-white flex-shrink-0 cursor-pointer">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Progress bar tự động đếm ngược 5s */}
                    <div className={`h-1 ${
                        toast.type === 'focus' ? 'bg-blue-300' : 'bg-green-300'
                    }`} style={{ animation: 'shrinkBar 5s linear forwards' }} />
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(110%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes shrinkBar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Đồng hồ Pomodoro</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Tập trung tốt hơn, nghỉ ngơi đúng lúc</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* ========== TIMER PANEL ========== */}
                    <div className="lg:col-span-3 flex flex-col gap-5">
                        {/* Card timer chính */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
                            {/* Tabs chế độ */}
                            <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-slate-700/50 p-1 rounded-xl">
                                {MODES.map(m => (
                                    <button
                                        key={m.key}
                                        onClick={() => handleModeChange(m.key)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${mode === m.key ? modeColorMap[m.color].tab : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Thanh tiến độ chu kỳ */}
                            <div className="flex items-center justify-center gap-2 mb-5">
                                {Array.from({ length: settings.cyclesBeforeLongBreak || 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 rounded-full transition-all ${
                                            mode === 'focus'
                                                ? i < currentCycle - 1
                                                    ? 'w-6 bg-blue-500'
                                                    : i === currentCycle - 1
                                                        ? 'w-8 bg-blue-500 animate-pulse'
                                                        : 'w-6 bg-gray-200 dark:bg-slate-700'
                                                : i < currentCycle - 1
                                                    ? 'w-6 bg-blue-500'
                                                    : 'w-6 bg-gray-200 dark:bg-slate-700'
                                        }`}
                                    />
                                ))}
                                <span className="text-xs text-gray-400 dark:text-slate-500 ml-1 font-medium">
                                    {mode === 'focus' ? `${currentCycle}/${settings.cyclesBeforeLongBreak || 4}` : mode === 'longBreak' ? 'Nghỉ dài!' : 'Nghỉ ngắn'}
                                </span>
                            </div>

                            {/* SVG Countdown */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative w-52 h-52">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                                        {/* Track */}
                                        <circle cx="100" cy="100" r={RADIUS} fill="none" strokeWidth="10"
                                            className="stroke-gray-100 dark:stroke-slate-700" />
                                        {/* Progress */}
                                        <circle cx="100" cy="100" r={RADIUS} fill="none" strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray={CIRCUMFERENCE}
                                            strokeDashoffset={dashOffset}
                                            className={`${colors.ring} transition-all duration-1000`} />
                                    </svg>
                                    {/* Thời gian ở giữa */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-5xl font-bold font-mono ${timeLeft === 0 ? colors.text : 'text-gray-800 dark:text-white'}`}>
                                            {formatTime(timeLeft)}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium uppercase tracking-widest">
                                            {currentMode.label}
                                        </span>
                                        {timeLeft === 0 && (
                                            <span className={`text-xs font-bold mt-1 ${colors.text} animate-pulse`}>Hoàn thành!</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Nút điều khiển */}
                            <div className="flex items-center justify-center gap-4">
                                <button onClick={handleReset} className="p-3 rounded-xl text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" title="Đặt lại">
                                    <ArrowPathIcon className="w-6 h-6" />
                                </button>

                                {isRunning ? (
                                    <button onClick={handlePause} className={`flex items-center gap-2 px-8 py-3 ${colors.bg} text-white rounded-2xl font-bold text-base shadow-md hover:opacity-90 transition-all cursor-pointer`}>
                                        <PauseIcon className="w-6 h-6" /> Tạm dừng
                                    </button>
                                ) : (
                                    <button onClick={handleStart} className={`flex items-center gap-2 px-8 py-3 ${colors.bg} text-white rounded-2xl font-bold text-base shadow-md hover:opacity-90 transition-all cursor-pointer`}>
                                        <PlayIcon className="w-6 h-6" /> {timeLeft < totalTime ? 'Tiếp tục' : 'Bắt đầu'}
                                    </button>
                                )}

                                <button onClick={() => { setTempSettings(settings); setShowSettings(true); }} className="p-3 rounded-xl text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" title="Cài đặt">
                                    <Cog6ToothIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Chọn Task */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                                <BriefcaseIcon className="w-4 h-4" />
                                Đang làm việc
                            </label>
                            <select
                                value={selectedTaskId}
                                onChange={e => setSelectedTaskId(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="">-- Không gắn Task --</option>
                                {tasks.map(task => (
                                    <option key={task.id} value={task.id}>{task.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Thống kê nhanh */}
                        {stats && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <BoltIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Hôm nay</p>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.todaySessions} <span className="text-sm font-normal text-gray-400">phiên</span></p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                        <ClockIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Tổng giờ tập trung</p>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                            {Math.floor(stats.totalMinutes / 60)}g {stats.totalMinutes % 60}p
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ========== HISTORY PANEL ========== */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 h-full">
                            <h2 className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FireIcon className="w-4 h-4 text-orange-500" /> Lịch sử phiên
                            </h2>

                            {loading ? (
                                <p className="text-sm text-gray-400 dark:text-slate-500">Đang tải...</p>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-10">
                                    <ClockIcon className="w-12 h-12 mx-auto text-gray-200 dark:text-slate-700 mb-3" />
                                    <p className="text-sm text-gray-400 dark:text-slate-500">Chưa có phiên nào được ghi lại</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
                                    {sessions.map(session => (
                                        <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                            {session.status === 'COMPLETED' ? (
                                                <CheckCircleIconSolid className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-yellow-400 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                                    {session.taskTitle || 'Phiên tập trung'}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500">
                                                    {session.durationMinutes} phút &bull; {session.createdAt ? new Date(session.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${session.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                                                {session.status === 'COMPLETED' ? 'Xong' : 'Dừng'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== SETTINGS MODAL ========== */}
            {showSettings && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Cog6ToothIcon className="w-5 h-5" /> Tùy chỉnh thời gian
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: 'focus', label: '🎯 Tập trung (phút)' },
                                { key: 'shortBreak', label: '☕ Nghỉ ngắn (phút)' },
                                { key: 'longBreak', label: '🛌 Nghỉ dài (phút)' },
                            ].map(item => (
                                <div key={item.key}>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">{item.label}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={tempSettings[item.key]}
                                        onChange={e => setTempSettings(prev => ({ ...prev, [item.key]: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            ))}

                            {/* Chu kỳ và Auto-start */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">🔄 Số chu kỳ trước nghỉ dài</label>
                                <input
                                    type="number" min="1" max="10"
                                    value={tempSettings.cyclesBeforeLongBreak || 4}
                                    onChange={e => setTempSettings(prev => ({ ...prev, cyclesBeforeLongBreak: Math.max(1, parseInt(e.target.value) || 4) }))}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">⚡ Tự động chuyển Phase</label>
                                <button
                                    type="button"
                                    onClick={() => setTempSettings(prev => ({ ...prev, autoStart: !prev.autoStart }))}
                                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                                        tempSettings.autoStart ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                                    }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                        tempSettings.autoStart ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                                Hủy
                            </button>
                            <button onClick={handleSaveSettings} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all cursor-pointer">
                                Lưu cài đặt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PomodoroPage;
