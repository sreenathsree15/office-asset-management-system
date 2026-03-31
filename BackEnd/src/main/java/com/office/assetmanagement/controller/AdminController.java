package com.office.assetmanagement.controller;

import com.office.assetmanagement.dto.AdminNameUpdateRequest;
import com.office.assetmanagement.dto.AdminNameUpdateResponse;
import com.office.assetmanagement.dto.AdminPasswordUpdateRequest;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.dto.SeatNumberRequestDto;
import com.office.assetmanagement.dto.SectionRequestDto;
import com.office.assetmanagement.dto.SectionResponseDto;
import com.office.assetmanagement.service.AdminModuleService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminModuleService adminModuleService;

    @GetMapping("/sections")
    public ResponseEntity<List<SectionResponseDto>> listSections() {
        return ResponseEntity.ok(adminModuleService.listSections());
    }

    @PostMapping("/sections")
    public ResponseEntity<SectionResponseDto> createSection(@Valid @RequestBody SectionRequestDto sectionRequestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminModuleService.createSection(sectionRequestDto));
    }

    @PostMapping("/seats")
    public ResponseEntity<BasicMessageResponse> createSeatNumber(
            @Valid @RequestBody SeatNumberRequestDto seatNumberRequestDto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminModuleService.createSeatNumber(seatNumberRequestDto));
    }

    @PostMapping("/profile/name")
    public ResponseEntity<AdminNameUpdateResponse> updateAdminName(
            Authentication authentication,
            @Valid @RequestBody AdminNameUpdateRequest adminNameUpdateRequest
    ) {
        return ResponseEntity.ok(
                adminModuleService.updateAdminName(authentication.getName(), adminNameUpdateRequest)
        );
    }

    @PostMapping("/profile/password")
    public ResponseEntity<BasicMessageResponse> updateAdminPassword(
            Authentication authentication,
            @Valid @RequestBody AdminPasswordUpdateRequest adminPasswordUpdateRequest
    ) {
        return ResponseEntity.ok(
                adminModuleService.updateAdminPassword(authentication.getName(), adminPasswordUpdateRequest)
        );
    }
}
