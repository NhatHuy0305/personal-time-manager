package com.husc.timemanager.service;

import com.husc.timemanager.dto.request.LoginRequest;
import com.husc.timemanager.dto.request.SignupRequest;
import com.husc.timemanager.dto.response.JwtAuthResponse;
import java.util.Map;

public interface AuthService {
    JwtAuthResponse login(LoginRequest loginRequest);
    void register(SignupRequest signupRequest);
    JwtAuthResponse googleLogin(String googleToken);
    void changePassword(String email, String oldPw, String newPw);
    void processForgotPassword(String email);
    void resetPassword(String email, String otp, String newPw);

    // Hồ sơ cá nhân
    Map<String, Object> getProfile(String email);
    void updateProfile(String email, String fullName);
}