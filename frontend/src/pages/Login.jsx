import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { GoogleLogin } from '@react-oauth/google'; 
import RegisterModal from '../components/RegisterModal';
import logoImg from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Trạng thái đóng mở Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);

  // 1. Xử lý Đăng nhập truyền thống
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Kiểm tra các trường token có thể trả về từ Backend
      const token = response.data.jwt || response.data.token || response.data.accessToken;
      
      if (token) {
        localStorage.setItem('token', token);
        navigate('/dashboard');
      } else {
        setError('Không nhận được mã xác thực từ máy chủ.');
      }
    } catch (err) {
      console.error("Login Error:", err);
      // Hiển thị lỗi cụ thể từ Backend nếu có, nếu không thì hiện lỗi mặc định
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác!');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Xử lý Đăng nhập Google thành công
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/google', { token: credentialResponse.credential });
      
      const token = response.data.jwt || response.data.token || response.data.accessToken;
      
      if (token) {
        localStorage.setItem('token', token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError('Lỗi xác thực Google với hệ thống. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* CỘT TRÁI: Giới thiệu (Ẩn trên mobile) */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <h1 className="text-5xl font-bold mb-6 leading-tight">Quản Lý Thời Gian <br /> Hiệu Quả Hơn</h1>
          <p className="text-xl text-blue-100 mb-8">Áp dụng ma trận Eisenhower để tối ưu hóa công việc và làm chủ cuộc sống.</p>
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
            <p className="italic text-lg">"Điều quan trọng thì hiếm khi khẩn cấp, và điều khẩn cấp thì hiếm khi quan trọng."</p>
            <p className="mt-4 font-semibold text-right">- Dwight D. Eisenhower -</p>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: Form Đăng nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-white lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-3xl shadow-sm lg:shadow-none border border-gray-100 lg:border-none">
          
          <div className="mb-8 text-center lg:text-left">
            {/* Logo hiển thị trên mobile */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
                <img src={logoImg} alt="TimeManager Logo" className="h-10 w-auto object-contain" />
                <span className="text-2xl font-bold text-gray-800">TimeManager</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại! 👋</h2>
            <p className="text-gray-500 text-sm sm:text-base">Vui lòng đăng nhập vào tài khoản của bạn.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                placeholder="Ví dụ: user@gmail.com" 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Mật khẩu</label>
                <button 
                  type="button"
                  onClick={() => setIsForgotPassOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors border-none bg-transparent cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input 
                type="password" 
                placeholder="Nhập mật khẩu" 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg disabled:bg-gray-400"
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>

          {/* Ngăn cách HOẶC */}
          <div className="mt-8 mb-6 flex items-center justify-center space-x-4">
            <span className="h-px w-full bg-gray-200"></span>
            <span className="text-sm font-medium text-gray-500">HOẶC</span>
            <span className="h-px w-full bg-gray-200"></span>
          </div>

          {/* Nút Google */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Đăng nhập Google thất bại.')}
              useOneTap
              shape="rectangular"
              theme="outline"
              size="large"
            />
          </div>

          {/* Footer: Chuyển sang Đăng ký */}
          <div className="mt-8 text-center text-gray-600">
            Chưa có tài khoản?{' '}
            <button 
              type="button"
              onClick={() => setIsRegisterOpen(true)} 
              className="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </div>
          
        </div>
      </div>

      {/* Các Modal nằm ngoài luồng render chính */}
      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
      />

      <ForgotPasswordModal 
        isOpen={isForgotPassOpen} 
        onClose={() => setIsForgotPassOpen(false)} 
      />
      
    </div>
  );
};

export default Login;