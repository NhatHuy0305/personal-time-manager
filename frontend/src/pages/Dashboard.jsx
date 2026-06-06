import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  PlusIcon, TrashIcon, PencilSquareIcon, CalendarIcon, BellIcon, MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import AddTaskModal from '../components/AddTaskModal';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Tìm kiếm & Bộ lọc
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // State quản lý Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // State quản lý Thông báo công việc hôm nay
  const [todayTasks, setTodayTasks] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  // ==========================================
  // Lấy danh sách Task (Có đính kèm keyword và bộ lọc)
  // ==========================================
  const fetchTasks = async () => {
    try {
      // Truyền thêm keyword và bộ lọc vào params
      const response = await api.get('/tasks', { 
        params: { 
          size: 100,
          keyword: keyword.trim() || undefined,
          categoryId: categoryFilter || undefined,
          priority: priorityFilter || undefined
        } 
      });
      let taskList = [];
      if (Array.isArray(response.data)) taskList = response.data; 
      else if (response.data?.content) taskList = response.data.content; 
      else if (response.data?.data) taskList = response.data.data; 
      setTasks(taskList);

      // KIỂM TRA VÀ HIỂN THỊ THÔNG BÁO CÔNG VIỆC HÔM NAY (Chỉ hiện 1 lần mỗi phiên đăng nhập)
      if (!sessionStorage.getItem('hasSeenTodayTasksAlert')) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const tasksDueToday = taskList.filter(t => {
          if (!t.dueDate || t.completed) return false;
          const due = new Date(t.dueDate);
          return due >= startOfDay && due <= endOfDay;
        });

        if (tasksDueToday.length > 0) {
          setTodayTasks(tasksDueToday);
          setShowNotification(true);
        } else {
          // Nếu không có việc hôm nay, lưu luôn để không kiểm tra lại nữa
          sessionStorage.setItem('hasSeenTodayTasksAlert', 'true');
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách task:", error);
      setTasks([]); 
    } finally {
      setLoading(false);
    }
  };

  // 1. Gọi API với Debounce khi gõ tìm kiếm hoặc bộ lọc thay đổi
  useEffect(() => { 
    const delayDebounceFn = setTimeout(() => {
      fetchTasks();
    }, 500); // Đợi 500ms sau khi ngừng gõ mới gọi API

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, categoryFilter, priorityFilter]);

  // 2. Tự động làm mới dữ liệu mỗi 60 giây (60000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 60000);

    // Cleanup interval khi component unmount hoặc keyword/filter thay đổi
    return () => clearInterval(interval);
  }, [keyword, categoryFilter, priorityFilter]);

  // 3. Lấy danh sách Category
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  // Các hàm xử lý Task
  const handleToggleComplete = async (task) => {
    try {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
      await api.put(`/tasks/${task.id}`, {
        ...task,
        completed: !task.completed,
        status: !task.completed ? "DONE" : "TODO"
      });
    } catch (error) { fetchTasks(); }
  };

  const handleOpenEdit = (task) => { setTaskToEdit(task); setIsTaskModalOpen(true); };
  const handleOpenAdd = () => { setTaskToEdit(null); setIsTaskModalOpen(true); };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;
    try {
      setTasks(tasks.filter(t => t.id !== taskId));
      await api.delete(`/tasks/${taskId}`);
    } catch (error) { fetchTasks(); }
  };

  const getTasksByQuadrant = (quadrant) => {
    if (!Array.isArray(tasks)) return []; 
    return tasks
      .filter(t => (t.eisenhowerMatrix || t.eisenhower_matrix) === quadrant)
      .sort((a, b) => {
        const pA = a.priority || 4; const pB = b.priority || 4;
        if (pA !== pB) return pA - pB; 
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return a.dueDate ? -1 : (b.dueDate ? 1 : 0);
      });
  };

  // UI Helpers
  const renderPriorityBadge = (p) => {
    const badges = {
      1: <span className="bg-red-50 text-red-600 border border-red-200 font-bold text-[9px] px-1.5 py-0.5 rounded-md">P1</span>,
      2: <span className="bg-orange-50 text-orange-600 border border-orange-200 font-bold text-[9px] px-1.5 py-0.5 rounded-md">P2</span>,
      3: <span className="bg-blue-50 text-blue-600 border border-blue-200 font-bold text-[9px] px-1.5 py-0.5 rounded-md">P3</span>
    };
    return badges[p] || <span className="bg-gray-50 text-gray-500 border border-gray-200 font-bold text-[9px] px-1.5 py-0.5 rounded-md">P4</span>;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // ==========================================
  // Component Quadrant
  // ==========================================
  const Quadrant = ({ title, type, headerBg, accentColor, tasks }) => {
    const [quickTitle, setQuickTitle] = useState('');
    const [quickDueDate, setQuickDueDate] = useState('');
    const [quickPriority, setQuickPriority] = useState(3);
    const [isSaving, setIsSaving] = useState(false);

    const handleQuickAdd = async (e) => {
      // Allow trigger on Enter key, or if no event/key is provided (button click)
      if (e && e.key && e.key !== 'Enter') return;
      
      if (quickTitle.trim() !== '') {
        setIsSaving(true);
        try {
          await api.post('/tasks', { 
            title: quickTitle.trim(), 
            eisenhowerMatrix: type, 
            eisenhower_matrix: type, 
            priority: Number(quickPriority), 
            dueDate: quickDueDate ? new Date(quickDueDate).toISOString() : null,
            status: "TODO" 
          });
          setQuickTitle(''); 
          setQuickDueDate('');
          setQuickPriority(3);
          fetchTasks(); 
        } catch (err) { 
          alert("Lưu thất bại! Vui lòng kiểm tra lại kết nối."); 
          console.error(err);
        } finally {
          setIsSaving(false);
        }
      }
    };

    return (
      <div className="flex flex-col h-[420px] bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100/80 dark:border-slate-700 overflow-hidden transition-colors">
        <div className={`p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center ${headerBg} dark:bg-opacity-20`}>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
            <h3 className="font-bold text-gray-800 dark:text-white text-sm tracking-wide">{title}</h3>
          </div>
          <span className="bg-white/80 dark:bg-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-600 dark:text-slate-300 border border-gray-200/50 dark:border-slate-600">{tasks.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/30 dark:bg-slate-900/30">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-slate-500 text-sm italic font-light">Chưa có công việc</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`group p-3.5 bg-white dark:bg-slate-800/80 border rounded-xl relative flex items-start gap-3 hover:border-blue-200 dark:hover:border-blue-500/50 transition-colors ${task.completed ? 'border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/30 opacity-60' : 'border-gray-200/60 dark:border-slate-700'}`}>
                <input type="checkbox" checked={task.completed || false} onChange={() => handleToggleComplete(task)} className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <div className="flex-1 pr-14 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-400 dark:text-slate-500 font-normal' : 'text-gray-800 dark:text-slate-200'}`}>{task.title}</p>
                  
                  {/* Danh sách nhãn (Badges) */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {renderPriorityBadge(task.priority)}
                    {task.category?.name && <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium">{task.category.name}</span>}
                    
                    {/* Hạn chót */}
                    {task.dueDate && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium bg-amber-50/50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-100">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDateTime(task.dueDate)}
                      </span>
                    )}

                    {/* Hiển thị Nhắc nhở (Reminder) */}
                    {(task.reminderTime || task.reminder_time) && (
                      <span className="text-[10px] flex items-center gap-1 font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                        <BellIcon className="h-3 w-3 animate-pulse" />
                        {formatDateTime(task.reminderTime || task.reminder_time)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white/90 dark:bg-slate-800/90 pl-1.5 py-0.5 rounded-lg border border-gray-100 dark:border-slate-700">
                  <button onClick={() => handleOpenEdit(task)} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"><PencilSquareIcon className="h-3.5 w-3.5" /></button>
                  <button onClick={(e) => handleDeleteTask(task.id, e)} className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"><TrashIcon className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))
          )}
          
          {/* Ô INPUT THÊM NHANH */}
          <div className="pt-2 mt-2 border-t border-gray-100/50 flex flex-col gap-1.5">
            <input 
              type="text" 
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={handleQuickAdd}
              disabled={isSaving}
              placeholder={isSaving ? "Đang lưu..." : "+ Tên công việc..."} 
              className="w-full py-1.5 px-2.5 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="datetime-local"
                value={quickDueDate}
                onChange={(e) => setQuickDueDate(e.target.value)}
                onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                disabled={isSaving}
                className="flex-1 py-1 px-1.5 border border-gray-200 dark:border-slate-600 rounded-md text-[10px] text-gray-600 dark:text-slate-300 focus:outline-none focus:border-blue-400 bg-white/80 dark:bg-slate-800/80 [color-scheme:light_dark] cursor-pointer"
              />
              <select
                value={quickPriority}
                onChange={(e) => setQuickPriority(Number(e.target.value))}
                disabled={isSaving}
                className="w-16 py-1 px-1 border border-gray-200 dark:border-slate-600 rounded-md text-[10px] text-gray-600 dark:text-slate-300 focus:outline-none focus:border-blue-400 bg-white/80 dark:bg-slate-800/80 cursor-pointer"
              >
                <option value={1}>P1</option>
                <option value={2}>P2</option>
                <option value={3}>P3</option>
                <option value={4}>P4</option>
              </select>
              <button 
                onClick={(e) => handleQuickAdd(e)}
                disabled={isSaving || !quickTitle.trim()}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-500 font-medium">Đang tải không gian làm việc...</div>;

  return (
    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen relative transition-colors">
      
      {/* THÔNG BÁO CÔNG VIỆC HÔM NAY (Góc phải trên cùng) */}
      {showNotification && (
        <div className="fixed top-6 right-6 z-50 bg-white dark:bg-slate-800 border-l-4 border-blue-500 shadow-xl rounded-xl p-4 max-w-sm w-full transition-all duration-500 ease-out translate-y-0 opacity-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-full">
                <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">Công việc hôm nay</h3>
            </div>
            <button 
              onClick={() => {
                setShowNotification(false);
                sessionStorage.setItem('hasSeenTodayTasksAlert', 'true');
              }}
              className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-3">
            Bạn có <span className="font-bold text-blue-600 dark:text-blue-400">{todayTasks.length}</span> công việc cần hoàn thành trong hôm nay:
          </p>
          <ul className="mt-2 text-xs text-gray-700 dark:text-slate-300 space-y-2 bg-gray-50/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-slate-700 max-h-[200px] overflow-y-auto custom-scrollbar">
            {todayTasks.slice(0, 3).map(t => (
              <li key={t.id} className="flex flex-col gap-1 border-b border-gray-100/80 dark:border-slate-700/80 pb-1.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0"></span>
                  <span className="truncate font-medium text-gray-800 dark:text-slate-200">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 pl-3.5">
                  {renderPriorityBadge(t.priority)}
                  {t.dueDate && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 bg-gray-100/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-slate-600/50">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(t.dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </li>
            ))}
            {todayTasks.length > 3 && (
              <li className="text-blue-500 italic mt-1 font-medium pl-3">+ {todayTasks.length - 3} công việc khác...</li>
            )}
          </ul>
        </div>
      )}

      <div className="max-w-7xl mx-auto pb-16">
        
        {/* HEADER CHÍNH CÓ TÍCH HỢP THANH TÌM KIẾM */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200/80 dark:border-slate-700/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Không gian làm việc</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Quản lý ma trận công việc của bạn</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
            {/* THANH TÌM KIẾM VÀ BỘ LỌC */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all shadow-xs cursor-pointer text-gray-600 dark:text-slate-200"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all shadow-xs cursor-pointer text-gray-600 dark:text-slate-200"
              >
                <option value="">Mọi độ ưu tiên</option>
                <option value="1">P1 - Cao nhất</option>
                <option value="2">P2 - Cao</option>
                <option value="3">P3 - Trung bình</option>
                <option value="4">P4 - Thấp</option>
              </select>

              <div className="relative w-full sm:w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-slate-500" />
                <input 
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm kiếm công việc..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all shadow-xs text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <button 
              onClick={handleOpenAdd}
              className="w-full sm:w-auto bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <PlusIcon className="h-4 w-4 stroke-[2.5]" /> Công việc
            </button>
          </div>
        </header>

        {/* LƯỚI MA TRẬN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Quadrant title="KHẨN CẤP & QUAN TRỌNG" type="URGENT_IMPORTANT" headerBg="bg-red-50/80" accentColor="bg-red-500" tasks={getTasksByQuadrant('URGENT_IMPORTANT')} />
          <Quadrant title="QUAN TRỌNG, KHÔNG KHẨN CẤP" type="NOT_URGENT_IMPORTANT" headerBg="bg-blue-50/80" accentColor="bg-blue-500" tasks={getTasksByQuadrant('NOT_URGENT_IMPORTANT')} />
          <Quadrant title="KHẨN CẤP, KHÔNG QUAN TRỌNG" type="URGENT_NOT_IMPORTANT" headerBg="bg-amber-50/80" accentColor="bg-amber-500" tasks={getTasksByQuadrant('URGENT_NOT_IMPORTANT')} />
          <Quadrant title="KHÔNG KHẨN, KHÔNG QUAN TRỌNG" type="NOT_URGENT_NOT_IMPORTANT" headerBg="bg-slate-100/80" accentColor="bg-slate-400" tasks={getTasksByQuadrant('NOT_URGENT_NOT_IMPORTANT')} />
        </div>

      </div>

      {/* MODAL THÊM/SỬA TASK */}
      <AddTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onTaskAdded={fetchTasks} taskToEdit={taskToEdit} />

    </div>
  );
};

export default Dashboard;