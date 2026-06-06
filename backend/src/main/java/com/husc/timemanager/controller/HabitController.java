package com.husc.timemanager.controller;

import com.husc.timemanager.dto.request.HabitDTO;
import com.husc.timemanager.dto.request.HabitLogDTO;
import com.husc.timemanager.dto.response.HabitResponseDTO;
import com.husc.timemanager.model.entity.User;
import com.husc.timemanager.security.CustomUserDetails;
import com.husc.timemanager.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @PostMapping
    public ResponseEntity<HabitResponseDTO> createHabit(
            @Valid @RequestBody HabitDTO habitDTO,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        HabitResponseDTO createdHabit = habitService.createHabit(habitDTO, user);
        return new ResponseEntity<>(createdHabit, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<HabitResponseDTO>> getHabits(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        List<HabitResponseDTO> habits = habitService.getHabitsByUser(user.getId());
        return ResponseEntity.ok(habits);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponseDTO> updateHabit(
            @PathVariable Long id,
            @Valid @RequestBody HabitDTO habitDTO,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        HabitResponseDTO updatedHabit = habitService.updateHabit(id, habitDTO, user);
        return ResponseEntity.ok(updatedHabit);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        habitService.deleteHabit(id, user);
        return ResponseEntity.noContent().build();
    }

    // Toggle check-in cho má»™t ngĂ y
    @PostMapping("/{id}/checkin")
    public ResponseEntity<HabitLogDTO> checkInHabit(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        if (date == null) {
            date = LocalDate.now();
        }
        HabitLogDTO log = habitService.checkInHabit(id, date, user);
        return ResponseEntity.ok(log);
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<HabitLogDTO>> getHabitLogs(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        User user = currentUser.getUser();
        List<HabitLogDTO> logs = habitService.getHabitLogs(id, user);
        return ResponseEntity.ok(logs);
    }
}
