package com.husc.timemanager.service.impl;

import com.husc.timemanager.dto.request.LoginRequest;
import com.husc.timemanager.dto.request.SignupRequest;
import com.husc.timemanager.dto.response.JwtAuthResponse;
import com.husc.timemanager.model.entity.User;
import com.husc.timemanager.repository.UserRepository;
import com.husc.timemanager.security.CustomUserDetails;
import com.husc.timemanager.security.JwtTokenProvider;
import com.husc.timemanager.service.AuthService;
import com.husc.timemanager.service.CategoryService;
import com.husc.timemanager.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;
    private final CategoryService categoryService;

    @Override
    public JwtAuthResponse login(LoginRequest request) {
        // 1. Xác thực thông tin đăng nhập
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        // 2. Lưu thông tin vào Security Context
        SecurityContextHolder.getContext().setAuthentication(auth);

        // 3. Tạo và trả về JWT Token
        return new JwtAuthResponse(tokenProvider.generateToken(auth));
    }

    @Override
    @Transactional
    public void register(SignupRequest request) {
        // 1. Kiểm tra email tồn tại
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng bởi tài khoản khác!");
        }

        // 2. Tạo User mới
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        // 3. Tự động tạo danh mục mặc định (Seeding)
        categoryService.createDefaultCategories(savedUser);
    }

    @Override
    @Transactional
    public JwtAuthResponse googleLogin(String googleToken) {
        // 1. Gọi Google API để kiểm tra token
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + googleToken;

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = restTemplate.getForObject(url, Map.class);

            if (userInfo == null || userInfo.get("email") == null) {
                throw new RuntimeException("Xác thực Google không hợp lệ!");
            }

            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");

            // 2. Tìm User trong DB, nếu không thấy thì tạo mới
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setFullName(name);
                // Tạo mật khẩu ngẫu nhiên cho user Google
                newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                User saved = userRepository.save(newUser);

                // Seeding danh mục cho user mới
                categoryService.createDefaultCategories(saved);
                return saved;
            });

            // 3. Tạo Authentication để sinh JWT
            CustomUserDetails userDetails = new CustomUserDetails(user);
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            return new JwtAuthResponse(tokenProvider.generateToken(auth));

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi kết nối với Google: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void changePassword(String email, String oldPw, String newPw) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (!passwordEncoder.matches(oldPw, user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }

        user.setPassword(passwordEncoder.encode(newPw));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void processForgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống!"));

        // 1. Tạo mã OTP 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // 2. Lưu OTP và thời gian hết hạn (5 phút)
        user.setResetOtp(otp);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // 3. Gửi email
        emailService.sendOtpEmail(email, otp);
    }

    @Override
    @Transactional
    public void resetPassword(String email, String otp, String newPw) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        // 1. Kiểm tra OTP
        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            throw new RuntimeException("Mã OTP không chính xác!");
        }

        // 2. Kiểm tra hết hạn
        if (user.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn, vui lòng yêu cầu mã mới!");
        }

        // 3. Cập nhật mật khẩu và xóa dấu vết OTP
        user.setPassword(passwordEncoder.encode(newPw));
        user.setResetOtp(null);
        user.setOtpExpiryTime(null);
        userRepository.save(user);
    }

    @Override
    public Map<String, Object> getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        Map<String, Object> profile = new java.util.LinkedHashMap<>();
        profile.put("email", user.getEmail());
        profile.put("fullName", user.getFullName());
        profile.put("avatarUrl", user.getAvatarUrl());
        profile.put("authProvider", user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL");
        profile.put("createdAt", user.getCreatedAt());
        return profile;
    }

    @Override
    @Transactional
    public void updateProfile(String email, String fullName) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }
        userRepository.save(user);
    }
}