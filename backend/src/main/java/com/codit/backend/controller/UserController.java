package com.codit.backend.controller;

import com.codit.backend.dto.UserProfile;
import com.codit.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> getMyInfo(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(userService.getMyInfo(userId));
    }
}
