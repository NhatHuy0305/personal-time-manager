import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChangePassword from './ChangePassword';
import ProfileModal from './ProfileModal';
import { Bars3Icon } from '@heroicons/react/24/outline';
import logoImg from '../assets/logo.png';

const MainLayout = () => {
  // State quản lý việc đóng/mở Modal Đổi Mật Khẩu và Hồ Sơ
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
          <img src={logoImg} alt="TimeManager" className="h-8 w-auto object-contain" />
          <span className="text-xl font-bold text-gray-800 dark:text-white">TimeManager</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay background when mobile sidebar is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Thanh điều hướng bên trái */}
      <Sidebar 
        onOpenChangePassword={() => { setIsPasswordModalOpen(true); setIsMobileMenuOpen(false); }} 
        onOpenProfile={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Phần nội dung chính bên phải */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 transition-all duration-300 w-full overflow-x-hidden">
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