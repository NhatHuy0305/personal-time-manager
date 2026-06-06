package com.husc.timemanager.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String status;

    private int priority;

    @Column(name = "reminder_time")
    private LocalDateTime reminderTime;

    private LocalDateTime dueDate;

    // ĐÂY LÀ DÒNG MỚI THÊM VÀO ĐỂ KHỚP VỚI DATABASE
    @Column(name = "completed", nullable = false, columnDefinition = "boolean default false")
    private boolean completed = false;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "eisenhower_matrix", length = 50) // Thêm độ dài cho an toàn
    private String eisenhowerMatrix;
    // Nếu bạn có dùng Enum thì khai báo kiểu Enum, không thì tạm dùng String

    private boolean reminderSent = false;
}