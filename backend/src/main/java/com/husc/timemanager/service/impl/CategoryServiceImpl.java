package com.husc.timemanager.service.impl;

import com.husc.timemanager.dto.request.CategoryRequest;
import com.husc.timemanager.dto.response.CategoryResponse;
import com.husc.timemanager.exception.ResourceNotFoundException;
import com.husc.timemanager.model.entity.Category;
import com.husc.timemanager.model.entity.User;
import com.husc.timemanager.repository.CategoryRepository;
import com.husc.timemanager.repository.UserRepository;
import com.husc.timemanager.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Sử dụng thay cho @Autowired để đồng bộ với AuthServiceImpl
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getUserCategories(Long userId) {
        return categoryRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(Long userId, CategoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Category category = new Category();
        category.setName(request.getName());
        category.setColorCode(request.getColorCode() != null ? request.getColorCode() : "#3B82F6");
        category.setUser(user);

        return mapToResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long categoryId, Long userId, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại hoặc bạn không có quyền!"));

        category.setName(request.getName());
        if (request.getColorCode() != null) {
            category.setColorCode(request.getColorCode());
        }

        return mapToResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId, Long userId) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục để xóa"));

        categoryRepository.delete(category);
    }

    @Override
    @Transactional
    public void createDefaultCategories(User user) {
        Object[][] defaults = {
                {"💼 Công việc", "#3B82F6"},
                {"📚 Học tập", "#F59E0B"},
                {"🏠 Gia đình", "#10B981"},
                {"❤️ Sức khỏe", "#EF4444"}
        };

        for (Object[] def : defaults) {
            Category category = new Category();
            category.setName((String) def[0]);
            category.setColorCode((String) def[1]);
            category.setUser(user);
            categoryRepository.save(category);
        }
    }

    // Hàm phụ để map Entity -> DTO
    private CategoryResponse mapToResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setColorCode(category.getColorCode());
        return response;
    }
}