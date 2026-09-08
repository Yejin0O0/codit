package com.codit.backend.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    private String token;

    private LocalDateTime expiresAt;

    /**
     * 기존 row를 삭제 후 재삽입(delete+insert)하지 않고 같은 row를 제자리에서 갱신한다.
     * 동시에 여러 refresh 요청이 들어와도(별도 탭/기기 등) 이 유저의 row가 늘어나거나
     * 지워졌다 다시 생기는 창(window)이 없어, delete+insert 방식에서 발생하던 중복 INSERT
     * 레이스(AuthServiceImpl rotateRefreshToken 참고)가 원천적으로 발생하지 않는다.
     */
    public void rotate(String newToken, LocalDateTime newExpiresAt) {
        this.token = newToken;
        this.expiresAt = newExpiresAt;
    }
}
