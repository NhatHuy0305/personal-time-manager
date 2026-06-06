package com.husc.timemanager.repository;

import com.husc.timemanager.model.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {
    // Lấy danh sách các thói quen đang theo dõi của một user
    List<Habit> findByUserId(Long userId);
}