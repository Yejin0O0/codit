package com.codit.backend.service;

import com.codit.backend.domain.User;
import com.codit.backend.dto.UserProfile;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserProfile getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException(AuthErrorCode.USER_NOT_FOUND));
        return UserProfile.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .build();
    }
}
