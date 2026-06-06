package com.husc.timemanager.repository;

import com.husc.timemanager.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Tìm user theo email để kiểm tra đăng nhập
    Optional<User> findByEmail(String email);

    // Kiểm tra email đã tồn tại chưa khi đăng ký
    Boolean existsByEmail(String email);

}