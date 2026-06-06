package com.husc.timemanager.model.entity;

import com.husc.timemanager.model.enums.HabitLogStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "habit_logs",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "unique_habit_date",
                        columnNames = {"habit_id", "log_date"}
                )
        }
)
@Getter
@Setter
public class HabitLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id", nullable = false)
    private Habit habit;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Enumerated(EnumType.STRING)
    private HabitLogStatus status = HabitLogStatus.COMPLETED;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}