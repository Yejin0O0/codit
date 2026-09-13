package com.codit.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codit.backend.controller.dto.CreateTagRequest;
import com.codit.backend.controller.dto.TagResponse;
import com.codit.backend.controller.dto.UpdateTagRequest;
import com.codit.backend.service.TagService;
import com.codit.backend.service.TagUpsertResult;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagResponse>> getTags() {
        List<TagResponse> tags = tagService.getAllTags().stream()
            .map(TagResponse::from)
            .toList();
        return ResponseEntity.ok(tags);
    }

    @PostMapping
    public ResponseEntity<TagResponse> createTag(@RequestBody CreateTagRequest request) {
        TagUpsertResult result = tagService.upsertTag(request.name());
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(TagResponse.from(result.tag()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagResponse> updateTag(@PathVariable Long id, @RequestBody UpdateTagRequest request) {
        return null; // TODO(tdd-green): Green 단계에서 구현
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        return null; // TODO(tdd-green): Green 단계에서 구현
    }
}
