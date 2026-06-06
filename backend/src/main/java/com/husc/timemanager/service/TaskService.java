package com.husc.timemanager.service;

import com.husc.timemanager.dto.request.TaskRequest;
import com.husc.timemanager.dto.response.EisenhowerResponse;
import com.husc.timemanager.dto.response.TaskResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TaskService {
    TaskResponse createTask(TaskRequest request, Long userId);
    TaskResponse updateTask(Long taskId, TaskRequest request, Long userId);
    void deleteTask(Long taskId, Long userId);

    // Bổ sung thêm tham số categoryId vào bộ lọc
    Page<TaskResponse> getAllTasks(Long userId, String status, Integer priority, Long categoryId, String keyword, Pageable pageable);

    TaskResponse getTaskById(Long taskId, Long userId);
    EisenhowerResponse getEisenhowerMatrix(Long userId);
}