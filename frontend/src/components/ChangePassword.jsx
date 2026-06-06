import React, { useState } from 'react';
import { changePassword } from '../api/authApi';

// Nhận thêm props onClose từ Dashboard truyền vào
const ChangePassword = ({ onClose }) => {
  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword.length < 6) return setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
    if (formData.newPassword !== formData.confirmPassword) return setError('Mật khẩu xác nhận không trùng khớp.');
    if (formData.oldPassword === formData.newPassword) return setError('Mật khẩu mới không được trùng với mật khẩu cũ.');

    setLoading(true); setError(''); setSuccess('');

    try {
      const response = await changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      const successMsg = typeof response.data === 'string' ? response.data : 'Đổi mật khẩu thành công!';
      setSuccess(successMsg);
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      
      // Tự động đóng Modal sau 1.5 giây nếu thành công
      if (onClose) {
        setTimeout(() => { onClose(); }, 1500);
      }
    } catch (err) {
      const errMsg = err.response?.data || 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.';
      setError(typeof errMsg === 'string' ? errMsg : 'Đổi mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Đã bỏ border và shadow ngoài cùng để vừa vặn khi nằm trong Modal */
    <div className="p-6 bg-white">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Đổi Mật Khẩu</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Mật khẩu hiện tại</label>
          <input
            type="password" name="oldPassword" value={formData.oldPassword} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Mật khẩu mới</label>
          <input
            type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 font-medium">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-600 text-xs rounded-xl border border-green-100 font-medium">{success}</div>}

        <div className="flex gap-2 pt-2">
          {/* Bổ sung nút Hủy để tiện đóng Popup */}
          {onClose && (
            <button 
              type="button" onClick={onClose}
              className="w-1/3 py-2.5 px-4 rounded-xl text-gray-600 font-semibold text-sm bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Hủy
            </button>
          )}
          <button
            type="submit" disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-xl shadow-xs text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Đang xử lý...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;