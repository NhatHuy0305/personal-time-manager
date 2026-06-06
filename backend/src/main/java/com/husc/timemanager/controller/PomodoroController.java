package com.husc.timemanager.controller;

import com.husc.timemanager.dto.request.PomodoroSessionDTO;
import com.husc.timemanager.dto.response.PomodoroSessionResponseDTO;
import com.husc.timemanager.dto.response.PomodoroStatsDTO;
import com.husc.timemanager.model.entity.User;
import com.husc.timemanager.security.CustomUserDetails;
import com.husc.timemanager.service.PomodoroService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pomodoro")
@RequiredArgsConstructor
public class PomodoroController {

    private final PomodoroService pomodoroService;

    // LÆ°u má»™t phiĂªn Pomodoro sau khi káº¿t thĂºc
    @PostMapping("/sessions")
    public ResponseEntity<PomodoroSessionResponseDTO> saveSession(
            @RequestBody PomodoroSessionDTO dto,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        PomodoroSessionResponseDTO saved = pomodoroService.saveSession(dto, user);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // Láº¥y toĂ n bá»™ lá»‹ch sá»­ phiĂªn cá»§a user
    @GetMapping("/sessions")
    public ResponseEntity<List<PomodoroSessionResponseDTO>> getSessions(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        List<PomodoroSessionResponseDTO> sessions = pomodoroService.getSessionsByUser(user.getId());
        return ResponseEntity.ok(sessions);
    }

    // Láº¥y thá»‘ng kĂª tá»•ng há»£p
    @GetMapping("/stats")
    public ResponseEntity<PomodoroStatsDTO> getStats(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        PomodoroStatsDTO stats = pomodoroService.getStats(user.getId());
        return ResponseEntity.ok(stats);
    }
}
