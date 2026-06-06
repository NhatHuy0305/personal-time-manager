package com.husc.timemanager.controller;

import com.husc.timemanager.dto.request.CategoryRequest;
import com.husc.timemanager.dto.response.CategoryResponse;
import com.husc.timemanager.security.CustomUserDetails;
import com.husc.timemanager.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(categoryService.getUserCategories(currentUser.getUser().getId()));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                           @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(currentUser.getUser().getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable Long id,
                                                           @AuthenticationPrincipal CustomUserDetails currentUser,
                                                           @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, currentUser.getUser().getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id,
                                            @AuthenticationPrincipal CustomUserDetails currentUser) {
        categoryService.deleteCategory(id, currentUser.getUser().getId());
        return ResponseEntity.ok(Map.of("message", "Xóa danh mục thành công"));
    }
}