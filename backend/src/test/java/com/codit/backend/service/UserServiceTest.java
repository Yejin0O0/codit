package com.codit.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.codit.backend.domain.Role;
import com.codit.backend.domain.User;
import com.codit.backend.dto.UserProfile;
import com.codit.backend.exception.AuthErrorCode;
import com.codit.backend.exception.AuthException;
import com.codit.backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    @DisplayName("userId가 존재하면 UserProfile을 반환해야 한다")
    void shouldReturnUserProfileWhenUserIdExists() {
        User user = User.builder().id(1L).email("test@gmail.com").nickname("Test User").role(Role.USER).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserProfile result = userService.getMyInfo(1L);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("test@gmail.com");
        assertThat(result.getNickname()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("userId가 존재하지 않으면 AuthException(USER_NOT_FOUND)를 던져야 한다")
    void shouldThrowUserNotFoundWhenUserIdDoesNotExist() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        AuthException exception = assertThrows(AuthException.class, () -> userService.getMyInfo(999L));

        assertThat(exception.getErrorCode()).isEqualTo(AuthErrorCode.USER_NOT_FOUND);
    }
}
