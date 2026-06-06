package com.husc.timemanager.service;

import com.husc.timemanager.dto.request.CategoryRequest;
import com.husc.timemanager.dto.response.CategoryResponse;
import com.husc.timemanager.model.entity.User;
import java.util.List;

public interface CategoryService {
    // Thay đổi ở đây: Nhận CategoryRequest, trả về CategoryResponse
    CategoryResponse createCategory(Long userId, CategoryRequest request);

    // Thay đổi ở đây: Trả về List<CategoryResponse>
    List<CategoryResponse> getUserCategories(Long userId);

    // Thay đổi ở đây: Nhận CategoryRequest
    CategoryResponse updateCategory(Long categoryId, Long userId, CategoryRequest request);

    void deleteCategory(Long categoryId, Long userId);

    void createDefaultCategories(User user);
}