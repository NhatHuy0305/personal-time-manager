package com.husc.timemanager.repository;

import com.husc.timemanager.model.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserId(Long userId);

    // Thêm hàm này để kiểm tra đúng chủ sở hữu khi Sửa/Xóa
    Optional<Category> findByIdAndUserId(Long id, Long userId);
}