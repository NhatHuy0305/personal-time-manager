package com.husc.timemanager.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // ==================================================
    // 1. Gửi Email OTP (Chức năng cũ)
    // ==================================================
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã OTP khôi phục mật khẩu - Time Manager");
        message.setText("Chào bạn,\n\n"
                + "Mã OTP để khôi phục mật khẩu của bạn là: " + otp + "\n"
                + "Mã này sẽ hết hạn trong vòng 5 phút.\n\n"
                + "Vui lòng không chia sẻ mã này cho bất kỳ ai!\n\n"
                + "Trân trọng,\nĐội ngũ Time Manager.");

        mailSender.send(message);
    }

    // ==================================================
    // 2. Gửi Email Nhắc nhở Task (Chức năng mới thêm)
    // ==================================================
    public void sendReminderEmail(String toEmail, String taskTitle, String description) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("⏰ Nhắc nhở công việc: " + taskTitle);

        String mailBody = "Chào bạn,\n\n"
                + "Hệ thống Time Manager gửi đến bạn lời nhắc cho công việc sắp tới:\n\n"
                + "📌 Tiêu đề: " + taskTitle + "\n"
                + "📝 Chi tiết: " + (description != null && !description.trim().isEmpty() ? description : "(Không có chi tiết)") + "\n\n"
                + "Chúc bạn hoàn thành công việc thật tốt đúng thời hạn!\n\n"
                + "Trân trọng,\nĐội ngũ Time Manager.";

        message.setText(mailBody);
        mailSender.send(message);
    }
}