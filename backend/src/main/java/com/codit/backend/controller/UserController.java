package com.codit.backend.controller;

import com.codit.backend.dto.UserProfile;
import com.codit.backend.security.CurrentUserId;
import com.codit.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> getMyInfo(@CurrentUserId Long userId) {
        return null;
    }
}
