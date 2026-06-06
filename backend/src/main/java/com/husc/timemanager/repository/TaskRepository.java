package com.husc.timemanager.repository;

import com.husc.timemanager.dto.response.CategoryTaskCount;
import com.husc.timemanager.model.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // 1. Lọc và tìm kiếm công việc (Hỗ trợ Keyword, Status, Priority, Category)
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
            "AND (:status IS NULL OR t.status = :status) " +
            "AND (:priority IS NULL OR t.priority = :priority) " +
            "AND (:categoryId IS NULL OR t.category.id = :categoryId) " +
            "AND (:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Task> filterTasks(
            @Param("userId") Long userId,
            @Param("status") String status,
            @Param("priority") Integer priority,
            @Param("categoryId") Long categoryId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // 2. Lọc công việc quá hạn (dueDate < hiện tại VÀ chưa hoàn thành)
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
            "AND t.completed = false " +
            "AND t.dueDate IS NOT NULL " +
            "AND t.dueDate < CURRENT_TIMESTAMP " +
            "AND (:priority IS NULL OR t.priority = :priority) " +
            "AND (:categoryId IS NULL OR t.category.id = :categoryId) " +
            "AND (:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Task> filterOverdueTasks(
            @Param("userId") Long userId,
            @Param("priority") Integer priority,
            @Param("categoryId") Long categoryId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    Optional<Task> findByIdAndUserId(Long id, Long userId);

    // Tìm các task chưa hoàn thành để đưa vào Ma trận Eisenhower
    List<Task> findByUserIdAndCompleted(Long userId, boolean completed);

    // Thống kê cho Dashboard
    long countByUserId(Long userId);
    long countByUserIdAndCompleted(Long userId, boolean completed);

    @Query("SELECT new com.husc.timemanager.dto.response.CategoryTaskCount(c.name, COUNT(t.id)) " +
            "FROM Task t JOIN t.category c " +
            "WHERE t.user.id = :userId " +
            "GROUP BY c.name")
    List<CategoryTaskCount> countTasksByCategory(@Param("userId") Long userId);

    // Query cho Báo cáo: Lấy task hoàn thành trong khoảng thời gian
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.completed = true " +
           "AND t.dueDate >= :from AND t.dueDate <= :to")
    List<Task> findCompletedBetween(@Param("userId") Long userId,
                                    @Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);

    // Query cho Báo cáo: Đếm tất cả task trong khoảng thời gian
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
           "AND t.dueDate >= :from AND t.dueDate <= :to")
    List<Task> findAllBetween(@Param("userId") Long userId,
                              @Param("from") LocalDateTime from,
                              @Param("to") LocalDateTime to);

    // ---------------------------------------------------------------------
    // Phục vụ cho tính năng Scheduler Gửi Email Nhắc nhở
    // ---------------------------------------------------------------------
    @Query("SELECT t FROM Task t WHERE t.reminderSent = false " +
            "AND t.completed = false " +
            "AND t.reminderTime IS NOT NULL " +
            "AND t.reminderTime <= :now")
    List<Task> findTasksToRemind(@Param("now") LocalDateTime now);

    // ---------------------------------------------------------------------
    // Phục vụ cho tính năng tự động chuyển trạng thái Khẩn cấp
    // ---------------------------------------------------------------------
    @Query("SELECT t FROM Task t WHERE t.completed = false " +
           "AND t.dueDate IS NOT NULL " +
           "AND t.dueDate <= :threshold " +
           "AND t.eisenhowerMatrix IN ('NOT_URGENT_IMPORTANT', 'NOT_URGENT_NOT_IMPORTANT')")
    List<Task> findNonUrgentTasksApproachingDeadline(@Param("threshold") LocalDateTime threshold);
}