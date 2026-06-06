import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChangePassword from './ChangePassword';
import ProfileModal from './ProfileModal';

const MainLayout = () => {
  // State quản lý việc đóng/mở Modal Đổi Mật Khẩu và Hồ Sơ
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Thanh điều hướng bên trái */}
      <Sidebar 
        onOpenChangePassword={() => setIsPasswordModalOpen(true)} 
        onOpenProfile={() => setIsProfileModalOpen(true)} 
      />

      {/* Phần nội dung chính bên phải */}
      <main className="flex-1 ml-64 transition-all duration-300">
        <div className="h-full w-full">
          <Outlet />
        </div>
      </main>

      {/* MODAL ĐỔI MẬT KHẨU */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors">
            <button 
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold z-10 p-1 cursor-pointer"
            >
              ✕
            </button>
            
            <ChangePassword onClose={() => setIsPasswordModalOpen(false)} />
          </div>
        </div>
      )}

      {/* MODAL HỒ SƠ CÁ NHÂN */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;