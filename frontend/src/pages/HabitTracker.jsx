import React, { useState, useEffect } from 'react';
import { habitApi } from '../api/habitApi';
import { PlusIcon, FireIcon, CheckCircleIcon, TrashIcon, PencilSquareIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { FireIcon as FireIconSolid, CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const HabitTracker = () => {
    const [habits, setHabits] = useState([]);
    const [logsMap, setLogsMap] = useState({}); // Dạng: { habitId: ['YYYY-MM-DD', ...] }
    const [loading, setLoading] = useState(true);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    // State để lùi thời gian cho TỪNG habit (mỗi đơn vị là 12 tuần)
    // Cấu trúc: { habitId: offset }
    const [offsets, setOffsets] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const getOffset = (habitId) => {
        return offsets[habitId] || 0;
    };

    const getCalendarDaysForHabit = (habitId) => {
        const days = [];
        const offset = getOffset(habitId);
        
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let firstDayOfWeek = new Date(year, month, 1).getDay();
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const currentDay = new Date(year, month, d, 12, 0, 0); 
            const dateStr = currentDay.toISOString().split('T')[0];
            const displayStr = currentDay.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
            
            const isToday = currentDay.toDateString() === now.toDateString();
            
            days.push({ dateStr, displayStr, isToday, dayOfMonth: d });
        }

        return { monthStr: `${month + 1}/${year}`, days };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await habitApi.getAllHabits();
            setHabits(res.data);
            
            // Lấy logs cho từng habit
            const newLogsMap = {};
            await Promise.all(res.data.map(async (habit) => {
                const logsRes = await habitApi.getHabitLogs(habit.id);
                newLogsMap[habit.id] = logsRes.data.map(log => log.logDate);
            }));
            setLogsMap(newLogsMap);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu Habit", error);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý Form Modal
    const handleOpenModal = (habit = null) => {
        if (habit) {
            setTaskToEdit(habit);
            setFormData({ name: habit.name, description: habit.description || '' });
        } else {
            setTaskToEdit(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (taskToEdit) {
                await habitApi.updateHabit(taskToEdit.id, formData);
            } else {
                await habitApi.createHabit(formData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Lỗi khi lưu habit", error);
            alert("Lỗi khi lưu thói quen!");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thói quen này và toàn bộ lịch sử điểm danh?")) {
            try {
                await habitApi.deleteHabit(id);
                fetchData();
            } catch (error) {
                console.error("Lỗi khi xóa", error);
            }
        }
    };

    // Đánh dấu check-in
    const handleCheckIn = async (habitId, dateStr) => {
        try {
            await habitApi.checkIn(habitId, dateStr);
            // Sau khi toggle, tải lại data để cập nhật streak chuẩn xác từ Backend
            fetchData();
        } catch (error) {
            console.error("Lỗi check-in", error);
        }
    };

    return (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen transition-colors">
            <div className="max-w-7xl mx-auto pb-8">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Theo dõi Thói quen</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Xây dựng thói quen tốt mỗi ngày</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm"
                    >
                        <PlusIcon className="w-5 h-5" /> Thêm Thói quen
                    </button>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-40 text-gray-500 dark:text-slate-400">Đang tải dữ liệu...</div>
                ) : habits.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center shadow-sm border border-gray-100 dark:border-slate-700">
                        <FireIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Chưa có thói quen nào</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Hãy bắt đầu hành trình cải thiện bản thân bằng cách thiết lập một thói quen mới!</p>
                        <button onClick={() => handleOpenModal()} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-6 py-2 rounded-xl font-medium border border-blue-100 dark:border-blue-800">
                            Tạo thói quen đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {habits.map(habit => {
                            const habitLogs = logsMap[habit.id] || [];
                            const { monthStr, days: habitCalendarDays } = getCalendarDaysForHabit(habit.id);
                            const currentOffset = getOffset(habit.id);
                            
                            return (
                                <div key={habit.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {habit.name}
                                            </h3>
                                            {habit.description && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{habit.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(habit)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700">
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(habit.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Thống kê Streak */}
                                    <div className="flex gap-4 mb-5">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                                            habit.currentStreak > 0 
                                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/50' 
                                            : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-100 dark:border-slate-700'
                                        }`}>
                                            {habit.currentStreak > 0 ? <FireIconSolid className="w-4 h-4" /> : <FireIcon className="w-4 h-4" />}
                                            <span>{habit.currentStreak} ngày</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                                            <span>Đỉnh nhất: <strong className="text-gray-800 dark:text-white">{habit.longestStreak}</strong></span>
                                        </div>
                                    </div>

                                    {/* Lịch điểm danh (Calendar) */}
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3 w-full justify-between">
                                                <span className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                                                    Tháng {monthStr}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => setOffsets(prev => ({...prev, [habit.id]: currentOffset - 1}))} 
                                                        className="p-1.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer text-gray-500 dark:text-slate-400"
                                                        title="Tháng trước"
                                                    >
                                                        <ChevronLeftIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setOffsets(prev => ({...prev, [habit.id]: currentOffset + 1}))} 
                                                        className="p-1.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer text-gray-500 dark:text-slate-400"
                                                        title="Tháng sau"
                                                    >
                                                        <ChevronRightIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                                <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 dark:text-slate-500">{day}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                            {habitCalendarDays.map((dayObj, index) => {
                                                if (!dayObj) {
                                                    return <div key={`empty-${index}`} className="w-full aspect-square"></div>;
                                                }

                                                const isChecked = habitLogs.includes(dayObj.dateStr);
                                                const canCheckIn = dayObj.isToday;
                                                
                                                return (
                                                    <button 
                                                        key={index}
                                                        onClick={() => {
                                                            if (!canCheckIn) {
                                                                alert('Bạn chỉ có thể điểm danh cho ngày hôm nay!');
                                                                return;
                                                            }
                                                            handleCheckIn(habit.id, dayObj.dateStr);
                                                        }}
                                                        className={`w-full aspect-square flex items-center justify-center rounded-lg text-[11px] sm:text-xs font-semibold transition-all shadow-xs ${
                                                            isChecked 
                                                            ? 'bg-green-500 text-white hover:bg-green-600' 
                                                            : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                                                        } ${dayObj.isToday ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800' : ''} ${canCheckIn ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                                                        title={`${dayObj.displayStr}${isChecked ? ' (Đã điểm danh)' : canCheckIn ? ' (Bấm để điểm danh)' : ' (Chỉ điểm danh hôm nay)'}`}
                                                    >
                                                        {dayObj.dayOfMonth}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Thêm/Sửa Thói quen */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-slate-700">
                        <h2 className="text-lg font-bold mb-5 text-gray-900 dark:text-white tracking-tight">
                            {taskToEdit ? 'Cập nhật Thói quen' : 'Thêm Thói quen mới'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Tên thói quen *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="VD: Đọc sách 30 phút..."
                                    className="w-full p-2.5 bg-gray-50/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Mô tả chi tiết</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Lý do hoặc ghi chú..."
                                    className="w-full p-2.5 bg-gray-50/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xs transition-all cursor-pointer"
                                >
                                    {taskToEdit ? 'Cập nhật' : 'Tạo thói quen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HabitTracker;
