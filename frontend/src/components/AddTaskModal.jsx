import React, { useState, useEffect } from 'react';
import api from '../api/axios';      
import { taskApi } from '../api/taskApi'; 

const AddTaskModal = ({ isOpen, onClose, onTaskAdded, taskToEdit }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '', 
        dueDate: '',
        reminderTime: '', // THÊM STATE QUẢN LÝ THỜI GIAN NHẮC NHỞ
        priority: 1, 
        eisenhowerMatrix: 'URGENT_IMPORTANT', 
    });

    // ==========================================
    // TẢI DANH MỤC CÔNG VIỆC
    // ==========================================
    useEffect(() => {
        if (isOpen) {
            api.get('/categories')
               .then(res => setCategories(res.data))
               .catch(err => console.log("Lỗi tải danh mục:", err));
        }
    }, [isOpen]);

    // ==========================================
    // ĐIỀN DỮ LIỆU KHI MỞ MODAL (THÊM / SỬA)
    // ==========================================
    useEffect(() => {
        if (taskToEdit) {
            let formattedDueDate = '';
            let formattedReminder = '';

            // Chuẩn hóa chuỗi Due Date
            if (taskToEdit.dueDate || taskToEdit.due_date) {
                const rawDue = taskToEdit.dueDate || taskToEdit.due_date;
                formattedDueDate = rawDue.replace(' ', 'T').substring(0, 16);
            }

            // Chuẩn hóa chuỗi Reminder Time
            if (taskToEdit.reminderTime || taskToEdit.reminder_time) {
                const rawRemind = taskToEdit.reminderTime || taskToEdit.reminder_time;
                formattedReminder = rawRemind.replace(' ', 'T').substring(0, 16);
            }

            const currentMatrix = taskToEdit.eisenhowerMatrix || taskToEdit.eisenhower_matrix || 'URGENT_IMPORTANT';
            const currentCategory = taskToEdit.category?.id || taskToEdit.categoryId || taskToEdit.category_id || '';

            setFormData({
                title: taskToEdit.title || '',
                description: taskToEdit.description || '',
                categoryId: currentCategory,
                dueDate: formattedDueDate,
                reminderTime: formattedReminder, // BINDING DỮ LIỆU CŨ ĐỂ SỬA
                priority: taskToEdit.priority || 1,
                eisenhowerMatrix: currentMatrix,
            });
        } else {
            setFormData({
                title: '',
                description: '',
                categoryId: '',
                dueDate: '',
                reminderTime: '',
                priority: 1,
                eisenhowerMatrix: 'URGENT_IMPORTANT',
            });
        }
    }, [taskToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ==========================================
    // GỬI DỮ LIỆU (TẠO MỚI HOẶC CẬP NHẬT)
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const catId = formData.categoryId ? parseInt(formData.categoryId) : null;
        const due = formData.dueDate ? `${formData.dueDate}:00` : null;
        const remind = formData.reminderTime ? `${formData.reminderTime}:00` : null;

        // Gửi dự phòng đồng thời cả 2 kiểu key (camelCase & snake_case)
        const payload = {
            title: formData.title,
            description: formData.description || null,
            categoryId: catId,
            category_id: catId,
            dueDate: due,
            due_date: due,
            reminderTime: remind,      // GỬI LÊN BACKEND THAM SỐ REMINDER
            reminder_time: remind,
            priority: parseInt(formData.priority),
            eisenhowerMatrix: formData.eisenhowerMatrix,
            eisenhower_matrix: formData.eisenhowerMatrix, 
            status: taskToEdit ? (taskToEdit.status || 'TODO') : 'TODO', 
            completed: taskToEdit ? (taskToEdit.completed || false) : false
        };

        try {
            if (taskToEdit && taskToEdit.id) {
                await api.put(`/tasks/${taskToEdit.id}`, payload);
            } else {
                if (taskApi && typeof taskApi.createTask === 'function') {
                    await taskApi.createTask(payload);
                } else {
                    await api.post('/tasks', payload);
                }
            }

            // Reset form sau khi thành công
            setFormData({
                title: '',
                description: '',
                categoryId: '',
                dueDate: '',
                reminderTime: '',
                priority: 1,
                eisenhowerMatrix: 'URGENT_IMPORTANT',
            });
            onTaskAdded(); 
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xử lý công việc!');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-slate-700 transform transition-all overflow-y-auto max-h-[90vh] custom-scrollbar">
                <h2 className="text-lg font-bold mb-5 text-gray-900 dark:text-white tracking-tight">
                    {taskToEdit ? 'Cập nhật công việc' : 'Thêm công việc mới'}
                </h2>
                
                {error && <div className="mb-4 p-2.5 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tiêu đề */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Tiêu đề *</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ví dụ: Lên kế hoạch tuần tới..."
                            className="w-full p-2.5 bg-gray-50/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Mô tả chi tiết</label>
                        <textarea
                            name="description"
                            rows="2"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Ghi chú thêm về tác vụ này..."
                            className="w-full p-2.5 bg-gray-50/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                        ></textarea>
                    </div>

                    {/* Danh mục */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Danh mục</label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            className="w-full p-2.5 bg-gray-50/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                        >
                            <option value="">-- Không chọn danh mục --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Lưới chứa Ngày hết hạn & Nhắc nhở */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Hạn chót (Due Date)</label>
                            <input
                                type="datetime-local"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                onClick={(e) => { try { e.target.showPicker(); } catch(y) {} }}
                                className="w-full p-2.5 bg-gray-50/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white [color-scheme:light_dark] cursor-pointer"
                            />
                        </div>

                        {/* TRƯỜNG THỜI GIAN NHẮC NHỞ */}
                        <div>
                            <label className="block text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">⏰ Thời gian nhắc nhở</label>
                            <input
                                type="datetime-local"
                                name="reminderTime"
                                value={formData.reminderTime}
                                onChange={handleChange}
                                onClick={(e) => { try { e.target.showPicker(); } catch(y) {} }}
                                className="w-full p-2.5 bg-purple-50/30 dark:bg-purple-900/20 border border-purple-200/80 dark:border-purple-800/50 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 dark:text-white [color-scheme:light_dark] cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Mức độ ưu tiên & Ma trận */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Mức ưu tiên</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                            >
                                <option value="1">P1 - Cao nhất</option>
                                <option value="2">P2 - Cao</option>
                                <option value="3">P3 - Trung bình</option>
                                <option value="4">P4 - Thấp</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Ô Eisenhower</label>
                            <select
                                name="eisenhowerMatrix"
                                value={formData.eisenhowerMatrix}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                            >
                                <option value="URGENT_IMPORTANT">Khẩn cấp & Quan trọng</option>
                                <option value="NOT_URGENT_IMPORTANT">Quan trọng, ko khẩn</option>
                                <option value="URGENT_NOT_IMPORTANT">Khẩn cấp, ko quan trọng</option>
                                <option value="NOT_URGENT_NOT_IMPORTANT">Ko khẩn, ko quan trọng</option>
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            disabled={loading}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xs transition-all flex items-center"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : (taskToEdit ? 'Cập nhật' : 'Lưu công việc')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;