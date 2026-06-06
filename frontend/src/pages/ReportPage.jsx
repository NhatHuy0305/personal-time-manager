import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../api/reportApi';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ChartBarIcon, ClockIcon, FireIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const ReportPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tasks');
    const [timeRange, setTimeRange] = useState('7days');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const end = new Date();
            const start = new Date();
            if (timeRange === '7days') {
                start.setDate(end.getDate() - 6);
            } else if (timeRange === '30days') {
                start.setDate(end.getDate() - 29);
            }

            const from = start.toISOString().split('T')[0];
            const to = end.toISOString().split('T')[0];

            const response = await reportApi.getSummary(from, to);
            setData(response.data);
        } catch (error) {
            console.error("Lỗi tải báo cáo:", error);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading && !data) return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
            <ArrowPathIcon className="w-10 h-10 animate-spin text-blue-500" />
        </div>
    );

    if (!data) return null;

    // --- Biểu đồ Task ---
    const taskTrendData = {
        labels: data.taskStats.completedTrend.map(d => d.date.split('-').slice(1).join('/')),
        datasets: [{
            label: 'Task hoàn thành',
            data: data.taskStats.completedTrend.map(d => d.value),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const taskCategoryData = {
        labels: data.taskStats.byCategory.map(c => c.categoryName),
        datasets: [{
            data: data.taskStats.byCategory.map(c => c.taskCount),
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)'
            ],
            borderWidth: 0
        }]
    };

    // --- Biểu đồ Pomodoro ---
    const pomodoroTrendData = {
        labels: data.pomodoroStats.durationTrend.map(d => d.date.split('-').slice(1).join('/')),
        datasets: [{
            label: 'Phút tập trung',
            data: data.pomodoroStats.durationTrend.map(d => d.value),
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderRadius: 6
        }]
    };

    const tabs = [
        { id: 'tasks', label: 'Công việc', icon: CheckCircleIcon },
        { id: 'pomodoro', label: 'Tập trung', icon: ClockIcon },
        { id: 'habits', label: 'Thói quen', icon: FireIcon },
    ];

    return (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Báo cáo & Thống kê</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Đo lường năng suất của bạn</p>
                    </div>

                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <button
                            onClick={() => setTimeRange('7days')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${timeRange === '7days' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                            7 ngày qua
                        </button>
                        <button
                            onClick={() => setTimeRange('30days')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${timeRange === '30days' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                            30 ngày qua
                        </button>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700 pb-px overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in">
                    {activeTab === 'tasks' && (
                        <div className="space-y-6">
                            {/* Stats row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Tỷ lệ hoàn thành</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.taskStats.completionRate}%</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Đã xong</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{data.taskStats.completed}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Đang chờ</p>
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{data.taskStats.pending}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Quá hạn</p>
                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{data.taskStats.overdue}</p>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Xu hướng hoàn thành ({timeRange === '7days' ? '7 ngày' : '30 ngày'})</h3>
                                    <div className="h-72">
                                        <Line data={taskTrendData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Theo danh mục</h3>
                                    <div className="h-64 flex items-center justify-center">
                                        {data.taskStats.byCategory.length > 0 ? (
                                            <Doughnut data={taskCategoryData} options={{ maintainAspectRatio: false, cutout: '70%' }} />
                                        ) : (
                                            <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pomodoro' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Tổng phút tập trung</p>
                                    <p className="text-3xl font-bold text-orange-500 mt-2">{data.pomodoroStats.totalMinutes} <span className="text-base font-normal text-gray-400">phút</span></p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Số phiên Pomodoro</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.pomodoroStats.totalSessions}</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Biểu đồ thời gian tập trung (Phút)</h3>
                                <div className="h-80">
                                    <Bar data={pomodoroTrendData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'habits' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">Hiệu suất Thói quen</h3>
                                {data.habitStats.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-10">Bạn chưa có thói quen nào</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-slate-700 text-sm text-gray-500 dark:text-slate-400">
                                                    <th className="py-3 px-4 font-semibold">Tên thói quen</th>
                                                    <th className="py-3 px-4 font-semibold">Tỷ lệ duy trì ({timeRange === '7days' ? '7d' : '30d'})</th>
                                                    <th className="py-3 px-4 font-semibold">Số ngày hoàn thành</th>
                                                    <th className="py-3 px-4 font-semibold text-orange-500">Chuỗi hiện tại (Streak)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.habitStats.map(habit => (
                                                    <tr key={habit.habitId} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                        <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{habit.name}</td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-green-500" style={{ width: `${habit.completionRate}%` }} />
                                                                </div>
                                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{habit.completionRate}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-slate-400">{habit.completedDays} ngày</td>
                                                        <td className="py-4 px-4 font-bold text-orange-500 flex items-center gap-1">
                                                            <FireIcon className="w-4 h-4" /> {habit.currentStreak}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ReportPage;
