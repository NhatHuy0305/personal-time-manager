import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // Bổ sung import này
import { taskApi } from '../api/taskApi';
import api from '../api/axios'; 

const TaskList = () => {
    // Sử dụng hook để đọc và ghi URL params
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // State phục vụ cho Lọc, Tìm kiếm và Phân trang
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        priority: '',
        // Lấy categoryId từ URL nếu có, nếu không thì rỗng
        categoryId: searchParams.get('categoryId') || '',
        page: 0,
        size: 10
    });

    const [totalPages, setTotalPages] = useState(0);

    // Load danh mục khi mới vào
    useEffect(() => {
        fetchCategories();
    }, []);

    // Lắng nghe thay đổi từ thanh URL (Khi bấm từ Sidebar)
    useEffect(() => {
        const urlCategoryId = searchParams.get('categoryId') || '';
        // Nếu categoryId trên URL khác với state hiện tại thì cập nhật state
        if (urlCategoryId !== filters.categoryId) {
            setFilters(prev => ({
                ...prev,
                categoryId: urlCategoryId,
                page: 0 // Khi đổi danh mục thì reset về trang 1
            }));
        }
    }, [searchParams]);

    // Gọi API load công việc mỗi khi bộ lọc thay đổi
    useEffect(() => {
        loadTasks();
    }, [filters]);

    // Gọi API lấy danh mục để fill vào Dropdown Filter
    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories'); 
            setCategories(res.data);
        } catch (error) {
            console.error("Không tải được danh sách danh mục", error);
        }
    };

    // Gọi API Load Task có kèm Params
    const loadTasks = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                size: filters.size
            };
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.status) params.status = filters.status;
            if (filters.priority) params.priority = Number(filters.priority);
            if (filters.categoryId) params.categoryId = Number(filters.categoryId);

            const response = await taskApi.getAllTasks(params);
            
            setTasks(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
        } catch (error) {
            console.error("Lỗi khi tải danh sách công việc:", error);
        } finally {
            setLoading(false);
        }
    };

    // Lắng nghe thay đổi input/select
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Nếu người dùng chọn Danh mục từ Dropdown, ta cập nhật cả URL để đồng bộ với Sidebar
        if (name === 'categoryId') {
            if (value) {
                setSearchParams({ categoryId: value });
            } else {
                setSearchParams({}); // Xóa param nếu chọn "Tất cả"
            }
        }

        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 0 // Reset về trang đầu tiên khi bộ lọc thay đổi
        }));
    };

    // Reset toàn bộ bộ lọc
    const handleClearFilters = () => {
        setFilters({
            keyword: '',
            status: '',
            priority: '',
            categoryId: '',
            page: 0,
            size: 10
        });
        // Xóa sạch params trên thanh URL
        setSearchParams({});
    };

    // Chuyển trang
    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    // BỔ SUNG ĐỦ 4 CẤP ĐỘ ƯU TIÊN VỚI MÀU SẮC RIÊNG BIỆT
    const getPriorityLabel = (p) => {
        switch(p) {
            case 1: 
                return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded font-bold">P1 - Rất cao</span>;
            case 2: 
                return <span className="bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded font-bold">P2 - Cao</span>;
            case 3: 
                return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded font-bold">P3 - Trung bình</span>;
            case 4: 
                return <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded font-bold">P4 - Thấp</span>;
            default: 
                return <span className="bg-gray-50 text-gray-400 text-xs px-2 py-1 rounded">-</span>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto transition-colors">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Tra cứu & Lọc công việc</h1>

            {/* BỘ LỌC CÔNG VIỆC */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 transition-colors">
                {/* Tìm kiếm từ khóa */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Từ khóa</label>
                    <input
                        type="text"
                        name="keyword"
                        value={filters.keyword}
                        onChange={handleInputChange}
                        placeholder="Tên công việc..."
                        className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Trạng thái */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Trạng thái</label>
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleInputChange}
                        className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-900 dark:text-white"
                    >
                        <option value="">Tất cả</option>
                        <option value="TODO">Cần làm (TODO)</option>
                        <option value="IN_PROGRESS">Đang làm</option>
                        <option value="DONE">Đã xong (DONE)</option>
                        <option value="OVERDUE">Quá hạn</option>
                    </select>
                </div>

                {/* Mức độ ưu tiên (Cập nhật đủ 4 Priority) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Độ ưu tiên</label>
                    <select
                        name="priority"
                        value={filters.priority}
                        onChange={handleInputChange}
                        className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-900 dark:text-white"
                    >
                        <option value="">Tất cả</option>
                        <option value="1">P1 - Rất cao</option>
                        <option value="2">P2 - Cao</option>
                        <option value="3">P3 - Trung bình</option>
                        <option value="4">P4 - Thấp</option>
                    </select>
                </div>

                {/* Danh mục */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Danh mục</label>
                    <select
                        name="categoryId"
                        value={filters.categoryId}
                        onChange={handleInputChange}
                        className="w-full text-sm border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-900 dark:text-white"
                    >
                        <option value="">Tất cả</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Button Clear */}
                <div className="flex items-end">
                    <button
                        onClick={handleClearFilters}
                        className="w-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-medium py-2 px-4 rounded-lg text-sm transition duration-150 cursor-pointer"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </div>

            {/* DANH SÁCH CÔNG VIỆC */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 dark:text-slate-500">Đang tải dữ liệu...</div>
                ) : tasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 dark:text-slate-500">Không tìm thấy công việc nào phù hợp với điều kiện lọc.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 text-xs font-semibold uppercase border-b border-gray-100 dark:border-slate-700">
                                    <th className="p-4">Tên công việc</th>
                                    <th className="p-4">Danh mục</th>
                                    <th className="p-4">Độ ưu tiên</th>
                                    <th className="p-4">Trạng thái</th>
                                    <th className="p-4">Hạn chót</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-700 dark:text-slate-300">
                                {tasks.map(task => (
                                    <tr key={task.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                                            {task.title}
                                            {task.description && <p className="text-xs text-gray-400 dark:text-slate-500 font-normal mt-0.5">{task.description}</p>}
                                        </td>
                                        <td className="p-4">
                                            {task.category ? (
                                                <span 
                                                    className="px-2 py-1 rounded text-xs font-medium"
                                                    style={{ backgroundColor: `${task.category.colorCode}20`, color: task.category.colorCode }}
                                                >
                                                    {task.category.name}
                                                </span>
                                            ) : <span className="text-gray-300 dark:text-slate-600">-</span>}
                                        </td>
                                        <td className="p-4">{getPriorityLabel(task.priority)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                task.status === 'DONE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                                            }`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-slate-400 text-xs">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleString('vi-VN') : 'Không có'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION (PHÂN TRANG) */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
                        <div>
                            Trang <span className="font-semibold text-gray-800 dark:text-white">{filters.page + 1}</span> / {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                disabled={filters.page === 0}
                                onClick={() => handlePageChange(filters.page - 1)}
                                className="px-3 py-1 rounded border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                                Trước
                            </button>
                            <button
                                disabled={filters.page >= totalPages - 1}
                                onClick={() => handlePageChange(filters.page + 1)}
                                className="px-3 py-1 rounded border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskList;