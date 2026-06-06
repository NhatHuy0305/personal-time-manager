package com.husc.timemanager.controller;

import com.husc.timemanager.dto.request.TaskRequest;
import com.husc.timemanager.dto.response.EisenhowerResponse;
import com.husc.timemanager.security.CustomUserDetails;
import com.husc.timemanager.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskRequest request, @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(taskService.createTask(request, currentUser.getUser().getId()));
    }

    @GetMapping
    public ResponseEntity<?> getAllTasks(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer priority,
            @RequestParam(required = false) Long categoryId, // THÊM PARAM CATEGORY_ID
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,asc") String sort
    ) {
        String[] sortParams = sort.split(",");
        Sort.Direction direction = (sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        // Truyền đầy đủ các param bộ lọc xuống tầng service
        return ResponseEntity.ok(taskService.getAllTasks(currentUser.getUser().getId(), status, priority, categoryId, keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(taskService.getTaskById(id, currentUser.getUser().getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody TaskRequest request, @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(taskService.updateTask(id, request, currentUser.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails currentUser) {
        taskService.deleteTask(id, currentUser.getUser().getId());
        return ResponseEntity.ok("Đã xóa công việc!");
    }

    @GetMapping("/eisenhower")
    public ResponseEntity<EisenhowerResponse> getEisenhowerMatrix(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(taskService.getEisenhowerMatrix(currentUser.getUser().getId()));
    }
}