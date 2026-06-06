import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Squares2X2Icon, 
  CalendarDaysIcon, 
  ClockIcon, 
  KeyIcon,
  ArrowLeftOnRectangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CalendarIcon,
  SunIcon,
  MoonIcon,
  ChartBarIcon,
  UserCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getCategories, createCategory, deleteCategory } from '../api/categoryApi';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.png';

const Sidebar = ({ onOpenChangePassword, onOpenProfile, isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategoryId = searchParams.get('categoryId');
  const { isDarkMode, toggleDarkMode } = useTheme();

  // --- STATE QUẢN LÝ DANH MỤC ---
  const [categories, setCategories] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');

  const navigation = [
    { name: 'Ma trận Eisenhower', href: '/dashboard', icon: Squares2X2Icon },
    { name: 'Lịch trình', href: '/calendar', icon: CalendarIcon },
    { name: 'Lọc công việc', href: '/tasks', icon: MagnifyingGlassIcon }, 
    { name: 'Theo dõi thói quen', href: '/habits', icon: CalendarDaysIcon },
    { name: 'Đồng hồ Pomodoro', href: '/pomodoro', icon: ClockIcon },
    { name: 'Báo cáo', href: '/reports', icon: ChartBarIcon },
  ];

  // --- EFFECT & HANDLERS DANH MỤC ---
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const response = await createCategory({
        name: newCatName,
        colorCode: newCatColor
      });
      setCategories([...categories, response.data]);
      setNewCatName('');
      setIsAdding(false);
    } catch (error) {
      console.error('Lỗi khi tạo danh mục:', error);
      alert('Không thể tạo danh mục. Vui lòng thử lại!');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này? Các công việc thuộc danh mục này sẽ KHÔNG bị xóa.')) {
      return;
    }
    
    try {
      await deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
      if (activeCategoryId === String(id)) {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Lỗi khi xóa danh mục:', error);
      alert('Lỗi khi xóa danh mục!');
    }
  };

  // --- HANDLER ĐĂNG XUẤT ---
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken'); 
      navigate('/login');
    }
  };

  return (
    <div className={`flex h-screen w-64 flex-col justify-between border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-6 shadow-sm fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      <div className="flex-1 flex flex-col overflow-y-auto pr-1">
        {/* Logo & Tên App */}
        <div className="flex items-center justify-between px-2 mb-8 shrink-0">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
            <img src={logoImg} alt="TimeManager Logo" className="h-8 w-auto object-contain" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">TimeManager</span>
          </div>
          {/* Nút đóng Sidebar chỉ hiện trên Mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items Chính */}
        <nav className="flex flex-col gap-2 mb-8 shrink-0">
          {navigation.map((item) => {
            let isActive = location.pathname.includes(item.href);
            if (item.href === '/tasks' && activeCategoryId) {
              isActive = false; 
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* --- KHU VỰC DANH MỤC CỦA TÔI --- */}
        <div className="flex-1">
          <div className="flex justify-between items-center px-2 mb-3">
            <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Danh mục của tôi</h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              title="Thêm danh mục"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form thêm danh mục */}
          {isAdding && (
            <form onSubmit={handleAddCategory} className="mb-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 shadow-inner">
              <input 
                type="text" 
                placeholder="Tên danh mục..." 
                className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2 bg-white dark:bg-slate-800 dark:text-white"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <input 
                  type="color" 
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white text-sm py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          )}

          {/* Danh sách danh mục */}
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const isSelected = activeCategoryId === String(cat.id);
              
              return (
                <div 
                  key={cat.id} 
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/30 shadow-sm' // Đồng bộ nền và shadow khi Active
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800'     // Đồng bộ nền khi Hover
                  }`}
                >
                  <Link 
                    to={`/tasks?categoryId=${cat.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 truncate flex-1 cursor-pointer"
                  >
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: cat.colorCode }}
                    ></span>
                    <span className={`text-sm font-medium truncate transition-colors ${
                      isSelected 
                        ? 'text-blue-700 dark:text-blue-400' // Đồng bộ chữ khi Active
                        : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white' // Đồng bộ chữ khi Inactive + Hover
                    }`}>
                      {cat.name}
                    </span>
                  </Link>

                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs font-medium text-red-400 hover:text-red-600 transition-opacity cursor-pointer px-2"
                    title="Xóa danh mục"
                  >
                    Xóa
                  </button>
                </div>
              );
            })}
            {categories.length === 0 && !isAdding && (
              <p className="text-xs text-gray-400 px-3 italic">Chưa có danh mục nào.</p>
            )}
          </div>
        </div>
      </div>

      {/* Khối phía dưới: Tài khoản (Đổi mật khẩu & Đăng xuất) */}
      <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex flex-col gap-1 shrink-0 bg-white dark:bg-slate-900 transition-colors">
        
        {/* Nút bật tắt Dark Mode */}
        <button
          onClick={toggleDarkMode} 
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-slate-400 transition-all hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white text-left cursor-pointer mb-2"
        >
          {isDarkMode ? (
            <>
              <SunIcon className="h-5 w-5 text-amber-500" />
              Chế độ Sáng
            </>
          ) : (
            <>
              <MoonIcon className="h-5 w-5 text-gray-400" />
              Chế độ Tối
            </>
          )}
        </button>

        <button
          onClick={onOpenProfile}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-slate-400 transition-all hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white text-left cursor-pointer"
        >
          <UserCircleIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
          Hồ sơ cá nhân
        </button>

        <button
          onClick={onOpenChangePassword} 
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-slate-400 transition-all hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white text-left cursor-pointer"
        >
          <KeyIcon className="h-5 w-5 text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-slate-400" />
          Đổi mật khẩu
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 text-left cursor-pointer"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;