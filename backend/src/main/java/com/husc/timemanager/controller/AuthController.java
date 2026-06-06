package com.husc.timemanager.controller;

import com.husc.timemanager.dto.request.LoginRequest;
import com.husc.timemanager.dto.request.SignupRequest;
import com.husc.timemanager.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.login(loginRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        authService.register(signUpRequest);
        return ResponseEntity.ok(Map.of(
                "message", "Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ."
        ));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        return ResponseEntity.ok(authService.googleLogin(token));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        authService.changePassword(
                email,
                request.get("oldPassword"),
                request.get("newPassword")
        );
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        authService.processForgotPassword(request.get("email"));
        return ResponseEntity.ok(Map.of("message", "Mã xác thực OTP đã được gửi vào Email của bạn."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        authService.resetPassword(
                request.get("email"),
                request.get("otp"),
                request.get("newPassword")
        );
        return ResponseEntity.ok(Map.of("message", "Mật khẩu của bạn đã được đặt lại thành công!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(authService.getProfile(email));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        authService.updateProfile(email, request.get("fullName"));
        return ResponseEntity.ok(Map.of("message", "Cập nhật hồ sơ thành công!"));
    }
}