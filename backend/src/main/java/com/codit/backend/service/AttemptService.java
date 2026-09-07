package com.codit.backend.service;

import com.codit.backend.domain.Attempt;
import com.codit.backend.repository.AttemptRepository;
import com.codit.backend.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final TagRepository tagRepository;

    public Attempt createAttempt(Long userId, AttemptCreateCommand command) {
        return null;
    }
}
