package com.husc.timemanager.service.impl;

import com.husc.timemanager.dto.request.TaskRequest;
import com.husc.timemanager.dto.response.CategoryResponse;
import com.husc.timemanager.dto.response.EisenhowerResponse;
import com.husc.timemanager.dto.response.TaskResponse;
import com.husc.timemanager.exception.ResourceNotFoundException;
import com.husc.timemanager.model.entity.Category;
import com.husc.timemanager.model.entity.Task;
import com.husc.timemanager.model.entity.User;
import com.husc.timemanager.repository.CategoryRepository;
import com.husc.timemanager.repository.TaskRepository;
import com.husc.timemanager.repository.UserRepository;
import com.husc.timemanager.service.TaskService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public TaskResponse createTask(TaskRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());

        // Gán thời gian nhắc nhở (Reminder Time)
        task.setReminderTime(request.getReminderTime());

        // 1. XỬ LÝ PRIORITY (THỨ TỰ SẮP XẾP TRONG Ô):
        if (request.getPriority() != null && request.getPriority() > 0) {
            task.setPriority(request.getPriority());
        } else {
            task.setPriority(3); // P3 - Mức trung bình lý tưởng để sắp xếp
        }

        task.setUser(user);
        task.setStatus("TODO");
        task.setCompleted(false);

        // 2. XỬ LÝ MA TRẬN EISENHOWER:
        if (request.getEisenhowerMatrix() != null && !request.getEisenhowerMatrix().trim().isEmpty()) {
            task.setEisenhowerMatrix(request.getEisenhowerMatrix().toUpperCase());
        } else {
            task.setEisenhowerMatrix("URGENT_IMPORTANT");
        }

        // 3. XỬ LÝ DANH MỤC (CATEGORY):
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại"));
            if (!category.getUser().getId().equals(userId)) {
                throw new RuntimeException("Bạn không có quyền sử dụng danh mục này");
            }
            task.setCategory(category);
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long taskId, TaskRequest request, Long userId) {
        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc!"));

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());

        // Cập nhật thời gian nhắc nhở
        task.setReminderTime(request.getReminderTime());

        if (request.getPriority() != null) task.setPriority(request.getPriority());

        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            task.setCompleted("DONE".equalsIgnoreCase(request.getStatus()));
        }

        if (request.getEisenhowerMatrix() != null) {
            task.setEisenhowerMatrix(request.getEisenhowerMatrix());
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại"));
            task.setCategory(category);
        } else {
            task.setCategory(null);
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Override
    public void deleteTask(Long taskId, Long userId) {
        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc"));
        taskRepository.delete(task);
    }

    // [ĐÃ CẬP NHẬT] - Bổ sung categoryId, xử lý chuỗi trống thành null, và hỗ trợ lọc "OVERDUE"
    @Override
    public Page<TaskResponse> getAllTasks(Long userId, String status, Integer priority, Long categoryId, String keyword, Pageable pageable) {
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status : null;
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword : null;

        // Nếu status là "OVERDUE" → gọi query riêng lọc công việc quá hạn
        if ("OVERDUE".equalsIgnoreCase(cleanStatus)) {
            return taskRepository.filterOverdueTasks(userId, priority, categoryId, cleanKeyword, pageable)
                    .map(this::mapToResponse);
        }

        return taskRepository.filterTasks(userId, cleanStatus, priority, categoryId, cleanKeyword, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public TaskResponse getTaskById(Long taskId, Long userId) {
        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc ID: " + taskId));
        return mapToResponse(task);
    }

    @Override
    public EisenhowerResponse getEisenhowerMatrix(Long userId) {
        List<Task> pendingTasks = taskRepository.findByUserIdAndCompleted(userId, false);

        Map<String, List<TaskResponse>> groupedTasks = pendingTasks.stream()
                .collect(Collectors.groupingBy(
                        task -> {
                            String matrix = task.getEisenhowerMatrix();
                            return (matrix == null || matrix.trim().isEmpty())
                                    ? "URGENT_IMPORTANT"
                                    : matrix.toUpperCase();
                        },
                        Collectors.mapping(this::mapToResponse, Collectors.toList())
                ));

        EisenhowerResponse matrix = new EisenhowerResponse();

        matrix.setDoFirst(groupedTasks.getOrDefault("URGENT_IMPORTANT", Collections.emptyList()));
        matrix.setSchedule(groupedTasks.getOrDefault("NOT_URGENT_IMPORTANT", Collections.emptyList()));
        matrix.setDelegate(groupedTasks.getOrDefault("URGENT_NOT_IMPORTANT", Collections.emptyList()));
        matrix.setEliminate(groupedTasks.getOrDefault("NOT_URGENT_NOT_IMPORTANT", Collections.emptyList()));

        return matrix;
    }

    private TaskResponse mapToResponse(Task task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setDueDate(task.getDueDate());

        // Map thông tin reminderTime từ Entity ra Response
        response.setReminderTime(task.getReminderTime());

        response.setPriority(task.getPriority());
        response.setStatus(task.getStatus());
        response.setCompleted(task.isCompleted());
        response.setEisenhowerMatrix(task.getEisenhowerMatrix());

        if (task.getCategory() != null) {
            CategoryResponse cr = new CategoryResponse();
            cr.setId(task.getCategory().getId());
            cr.setName(task.getCategory().getName());
            cr.setColorCode(task.getCategory().getColorCode());
            response.setCategory(cr);
        }
        return response;
    }
}