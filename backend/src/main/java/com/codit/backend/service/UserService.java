package com.codit.backend.service;

import com.codit.backend.dto.UserProfile;

public interface UserService {

    UserProfile getMyInfo(Long userId);
}
