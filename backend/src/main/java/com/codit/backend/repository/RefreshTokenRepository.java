package com.codit.backend.repository;

import com.codit.backend.domain.RefreshToken;
import com.codit.backend.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByUser(User user);

    void deleteByUser(User user);
}
