package com.husc.timemanager.scheduler;

import com.husc.timemanager.model.entity.Task;
import com.husc.timemanager.repository.TaskRepository;
import com.husc.timemanager.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@EnableScheduling
public class ReminderScheduler {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private EmailService emailService;

    // Quét DB mỗi 60 giây (60000 ms) một lần
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processTaskReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Task> tasks = taskRepository.findTasksToRemind(now);

        if (tasks.isEmpty()) {
            return; // Nếu không có task nào cần nhắc thì dừng lại luôn cho nhẹ hệ thống
        }

        for (Task task : tasks) {
            try {
                // Kiểm tra User và Email hợp lệ trước khi gửi
                if (task.getUser() != null && task.getUser().getEmail() != null) {
                    String toEmail = task.getUser().getEmail();

                    // Thực hiện gửi mail
                    emailService.sendReminderEmail(toEmail, task.getTitle(), task.getDescription());

                    // Đánh dấu thành công để không bị gửi lặp lại vào phút tiếp theo
                    task.setReminderSent(true);
                    taskRepository.save(task);

                    System.out.println("[SUCCESS] Đã gửi email nhắc nhở Task ID: " + task.getId() + " tới " + toEmail);
                }
            } catch (Exception e) {
                System.err.println("[ERROR] Lỗi khi gửi email cho Task ID: " + task.getId() + " - Chi tiết: " + e.getMessage());
            }
        }
    }

    // Quét DB mỗi phút để cập nhật các task sắp đến hạn (dưới 24h) thành KHẨN CẤP
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void promoteUrgentTasks() {
        LocalDateTime threshold = LocalDateTime.now().plusHours(24);
        List<Task> tasks = taskRepository.findNonUrgentTasksApproachingDeadline(threshold);
        
        if (tasks.isEmpty()) {
            return;
        }

        for (Task task : tasks) {
            String currentMatrix = task.getEisenhowerMatrix();
            if ("NOT_URGENT_IMPORTANT".equals(currentMatrix)) {
                task.setEisenhowerMatrix("URGENT_IMPORTANT");
            } else if ("NOT_URGENT_NOT_IMPORTANT".equals(currentMatrix)) {
                task.setEisenhowerMatrix("URGENT_NOT_IMPORTANT");
            }
            taskRepository.save(task);
            System.out.println("[INFO] Đã chuyển Task ID " + task.getId() + " sang Khẩn cấp do sắp đến hạn (<24h).");
        }
    }
}