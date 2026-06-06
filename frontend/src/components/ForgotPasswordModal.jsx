import React, { useState } from 'react';
import { forgotPassword, resetPassword } from '../api/authApi';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP & Pass mới
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    // Bước 1: Gửi yêu cầu lấy OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            setMessage({ type: 'success', text: 'Mã OTP đã được gửi vào email của bạn!' });
            setStep(2);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Không tìm thấy email này!' });
        } finally { setLoading(false); }
    };

    // Bước 2: Xác nhận OTP và đổi mật khẩu
    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await resetPassword({ email, otp, newPassword });
            setMessage({ type: 'success', text: 'Đổi mật khẩu thành công! Hãy đăng nhập lại.' });
            setTimeout(() => { onClose(); setStep(1); setMessage({ type: '', text: '' }); }, 2500);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Mã OTP không đúng!' });
        } finally { setLoading(false); }
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <button onClick={onClose} style={closeButtonStyle}>&times;</button>
                <h3>{step === 1 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}</h3>

                {message.text && <p style={{ color: message.type === 'success' ? 'green' : 'red', fontSize: '14px' }}>{message.text}</p>}

                <form onSubmit={step === 1 ? handleSendOtp : handleReset} style={formStyle}>
                    {step === 1 ? (
                        <input type="email" placeholder="Nhập email của bạn" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                    ) : (
                        <>
                            <input type="text" placeholder="Nhập mã OTP 6 số" required value={otp} onChange={(e) => setOtp(e.target.value)} style={inputStyle} />
                            <input type="password" placeholder="Mật khẩu mới" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
                        </>
                    )}
                    <button type="submit" disabled={loading} style={submitButtonStyle}>
                        {loading ? 'Đang xử lý...' : (step === 1 ? 'Gửi mã OTP' : 'Xác nhận thay đổi')}
                    </button>
                </form>
            </div>
        </div>
    );
};

// CSS tương tự RegisterModal
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '350px', position: 'relative' };
const closeButtonStyle = { position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' };
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' };
const submitButtonStyle = { padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default ForgotPasswordModal;