package com.husc.timemanager.repository;

import com.husc.timemanager.model.entity.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {
    // Tìm kiếm log của một thói quen trong một ngày cụ thể (để biết user check-in chưa)
    Optional<HabitLog> findByHabitIdAndLogDate(Long habitId, LocalDate logDate);

    // Lấy toàn bộ lịch sử check-in của một thói quen
    List<HabitLog> findByHabitId(Long habitId);

    // Lấy lịch sử check-in trong khoảng thời gian
    List<HabitLog> findByHabitIdAndLogDateBetween(Long habitId, LocalDate from, LocalDate to);
}