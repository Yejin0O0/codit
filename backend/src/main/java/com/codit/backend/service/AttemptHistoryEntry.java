package com.codit.backend.service;

import com.codit.backend.domain.Attempt;

/** 문제 하나의 시도 상세 목록 안에서, 그 시도의 순번(1부터, createdAt 오름차순)을 함께 담는다. */
public record AttemptHistoryEntry(int seq, Attempt attempt) {
}
