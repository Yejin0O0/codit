package com.codit.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String problemId;

    @Column(nullable = false)
    private int elapsedTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptResult result;

    @Column(columnDefinition = "text")
    private String memo;

    @ManyToMany
    @JoinTable(name = "attempt_tag", joinColumns = @JoinColumn(name = "attempt_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private List<Tag> tags = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Attempt(Long userId, String problemId, int elapsedTime, AttemptResult result, String memo, List<Tag> tags) {
        this.userId = userId;
        this.problemId = problemId;
        this.elapsedTime = elapsedTime;
        this.result = result;
        this.memo = memo;
        this.tags = new ArrayList<>(tags);
        this.createdAt = LocalDateTime.now();
    }
}
