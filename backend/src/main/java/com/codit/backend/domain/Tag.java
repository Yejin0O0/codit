package com.codit.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String normalizedName;

    @Column(nullable = false)
    private String category;

    public Tag(String name, String normalizedName, String category) {
        this.name = name;
        this.normalizedName = normalizedName;
        this.category = category;
    }

    public void rename(String name, String normalizedName) {
        // TODO(tdd-green): Green 단계에서 구현
    }
}
