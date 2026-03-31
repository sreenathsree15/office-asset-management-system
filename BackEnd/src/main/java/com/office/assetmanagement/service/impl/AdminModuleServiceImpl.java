package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.config.JwtService;
import com.office.assetmanagement.dto.AdminNameUpdateRequest;
import com.office.assetmanagement.dto.AdminNameUpdateResponse;
import com.office.assetmanagement.dto.AdminPasswordUpdateRequest;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.dto.SeatNumberRequestDto;
import com.office.assetmanagement.dto.SectionRequestDto;
import com.office.assetmanagement.dto.SectionResponseDto;
import com.office.assetmanagement.model.Section;
import com.office.assetmanagement.model.SeatNumber;
import com.office.assetmanagement.model.UserAdmin;
import com.office.assetmanagement.repo.SectionRepository;
import com.office.assetmanagement.repo.SeatNumberRepository;
import com.office.assetmanagement.repo.UserAdminRepository;
import com.office.assetmanagement.service.AdminModuleService;
import jakarta.transaction.Transactional;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminModuleServiceImpl implements AdminModuleService {

    private static final String ACTIVE_STATUS = "N";

    private final SectionRepository sectionRepository;
    private final SeatNumberRepository seatNumberRepository;
    private final UserAdminRepository userAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public List<SectionResponseDto> listSections() {
        return sectionRepository.findAllByOrderBySectionNameAsc()
                .stream()
                .map(this::toSectionResponse)
                .toList();
    }

    @Override
    @Transactional
    public SectionResponseDto createSection(SectionRequestDto sectionRequestDto) {
        String sectionName = normalize(sectionRequestDto.getSectionName());

        if (sectionRepository.existsBySectionNameIgnoreCase(sectionName)) {
            throw new IllegalArgumentException("Section name already exists.");
        }

        Section section = sectionRepository.save(Section.builder()
                .sectionName(sectionName)
                .sectionCode(normalizeOptional(sectionRequestDto.getSectionCode()))
                .description(normalizeOptional(sectionRequestDto.getDescription()))
                .build());

        return toSectionResponse(section);
    }

    @Override
    @Transactional
    public BasicMessageResponse createSeatNumber(SeatNumberRequestDto seatNumberRequestDto) {
        Section section = sectionRepository.findById(seatNumberRequestDto.getSectionId())
                .orElseThrow(() -> new IllegalArgumentException("Selected section does not exist."));
        String seatNumber = normalize(seatNumberRequestDto.getSeatNumber());

        if (seatNumberRepository.existsBySectionIdAndSeatNumberIgnoreCase(section.getId(), seatNumber)) {
            throw new IllegalArgumentException("Seat number already exists in the selected section.");
        }

        seatNumberRepository.save(SeatNumber.builder()
                .seatNumber(seatNumber)
                .section(section)
                .description(normalizeOptional(seatNumberRequestDto.getDescription()))
                .build());

        return BasicMessageResponse.builder()
                .message("Seat number saved successfully.")
                .build();
    }

    @Override
    @Transactional
    public AdminNameUpdateResponse updateAdminName(
            String currentUsername,
            AdminNameUpdateRequest adminNameUpdateRequest
    ) {
        UserAdmin userAdmin = findActiveAdmin(currentUsername);
        String newName = normalize(adminNameUpdateRequest.getNewName());

        userAdminRepository.findByUsernameIgnoreCaseAndDeleteStatus(newName, ACTIVE_STATUS)
                .filter(existingAdmin -> !existingAdmin.getId().equals(userAdmin.getId()))
                .ifPresent(existingAdmin -> {
                    throw new IllegalArgumentException("Admin name already exists.");
                });

        userAdmin.setUsername(newName);
        userAdminRepository.save(userAdmin);

        org.springframework.security.core.userdetails.UserDetails userDetails =
                org.springframework.security.core.userdetails.User.builder()
                        .username(userAdmin.getUsername())
                        .password(userAdmin.getPassword())
                        .authorities(List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN")))
                        .build();

        return AdminNameUpdateResponse.builder()
                .message("Admin name updated successfully.")
                .username(userAdmin.getUsername())
                .token(jwtService.generateToken(userDetails))
                .tokenType("Bearer")
                .role("ADMIN")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse updateAdminPassword(
            String currentUsername,
            AdminPasswordUpdateRequest adminPasswordUpdateRequest
    ) {
        UserAdmin userAdmin = findActiveAdmin(currentUsername);

        if (!passwordEncoder.matches(adminPasswordUpdateRequest.getCurrentPassword(), userAdmin.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect.");
        }

        if (!adminPasswordUpdateRequest.getNewPassword().equals(adminPasswordUpdateRequest.getConfirmNewPassword())) {
            throw new IllegalArgumentException("New password and confirm new password must match.");
        }

        userAdmin.setPassword(passwordEncoder.encode(adminPasswordUpdateRequest.getNewPassword()));
        userAdminRepository.save(userAdmin);

        return BasicMessageResponse.builder()
                .message("Password updated successfully.")
                .build();
    }

    private UserAdmin findActiveAdmin(String username) {
        return userAdminRepository.findByUsernameIgnoreCaseAndDeleteStatus(normalize(username), ACTIVE_STATUS)
                .orElseThrow(() -> new IllegalArgumentException("Admin account not found."));
    }

    private SectionResponseDto toSectionResponse(Section section) {
        return SectionResponseDto.builder()
                .id(section.getId())
                .sectionName(section.getSectionName())
                .sectionCode(section.getSectionCode())
                .description(section.getDescription())
                .build();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeOptional(String value) {
        String normalized = normalize(value);
        return normalized.isEmpty() ? null : normalized;
    }
}
