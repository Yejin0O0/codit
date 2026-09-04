package com.codit.backend.service;

import com.codit.backend.dto.UserProfile;
import com.codit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserProfile getMyInfo(Long userId) {
        return null;
    }
}
