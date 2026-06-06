import React, { useState } from 'react';
import { register } from '../api/authApi';

const RegisterModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    if (!isOpen) return null; // Nếu không mở thì không vẽ gì cả

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            const response = await register(formData);
            // SỬA Ở ĐÂY: Chỉ lấy thuộc tính 'message' từ Object trả về
            setMessage({ type: 'success', text: response.data?.message || 'Đăng ký thành công!' });
            
            // Sau 2 giây thành công thì tự đóng popup cho chuyên nghiệp
            setTimeout(() => { onClose(); setMessage({ type: '', text: '' }); }, 2000);
        } catch (err) {
            // SỬA Ở ĐÂY: Đảm bảo chỉ lấy string ra để in, không lấy Object
            const errorMessage = err.response?.data?.message || 
                                (typeof err.response?.data === 'string' ? err.response.data : 'Đăng ký thất bại!');
            setMessage({ type: 'error', text: errorMessage });
        }
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <button onClick={onClose} style={closeButtonStyle}>&times;</button>
                <h3>Đăng ký tài khoản</h3>

                {message.text && (
                    <p style={{ color: message.type === 'success' ? 'green' : 'red', marginTop: '10px', marginBottom: '10px' }}>
                        {message.text}
                    </p>
                )}

                <form onSubmit={handleSubmit} style={formStyle}>
                    <input 
                        type="text" placeholder="Họ và tên" required
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                    <input 
                        type="email" placeholder="Email" required
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                    <input 
                        type="password" placeholder="Mật khẩu" required
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button type="submit" style={submitButtonStyle}>Tham gia ngay</button>
                </form>
            </div>
        </div>
    );
};

// --- CSS "mì ăn liền" để test ---
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
    backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '350px', position: 'relative'
};
const closeButtonStyle = {
    position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer'
};
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const submitButtonStyle = { padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default RegisterModal;