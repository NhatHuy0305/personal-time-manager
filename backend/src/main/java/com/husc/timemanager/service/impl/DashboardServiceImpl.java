package com.husc.timemanager.service.impl;

import com.husc.timemanager.dto.response.CategoryTaskCount;
import com.husc.timemanager.dto.response.DashboardResponse;
import com.husc.timemanager.repository.TaskRepository;
import com.husc.timemanager.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final TaskRepository taskRepository;

    @Override
    public DashboardResponse getDashboardStats(Long userId) {
        DashboardResponse response = new DashboardResponse();

        // Lấy số liệu từ database
        long totalTasks = taskRepository.countByUserId(userId);
        long completedTasks = taskRepository.countByUserIdAndCompleted(userId, true);
        long pendingTasks = totalTasks - completedTasks;

        List<CategoryTaskCount> categoryStats = taskRepository.countTasksByCategory(userId);

        // Đổ dữ liệu vào DTO
        response.setTotalTasks(totalTasks);
        response.setCompletedTasks(completedTasks);
        response.setPendingTasks(pendingTasks);
        response.setTasksByCategory(categoryStats);

        return response;
    }
}