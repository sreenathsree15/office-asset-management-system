package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.config.JwtService;
import com.office.assetmanagement.dto.AdminNameUpdateRequest;
import com.office.assetmanagement.dto.AdminNameUpdateResponse;
import com.office.assetmanagement.dto.AdminPasswordUpdateRequest;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.dto.SeatNumberRequestDto;
import com.office.assetmanagement.dto.SeatNumberResponseDto;
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
    public List<SeatNumberResponseDto> listSeatNumbers() {
        return seatNumberRepository.findAllByOrderBySectionSectionNameAscSeatNumberAsc()
                .stream()
                .map(this::toSeatNumberResponse)
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
    public SectionResponseDto updateSection(Long sectionId, SectionRequestDto sectionRequestDto) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Selected section does not exist."));
        String sectionName = normalize(sectionRequestDto.getSectionName());

        sectionRepository.findBySectionNameIgnoreCase(sectionName)
                .filter(existingSection -> !existingSection.getId().equals(section.getId()))
                .ifPresent(existingSection -> {
                    throw new IllegalArgumentException("Section name already exists.");
                });

        section.setSectionName(sectionName);
        section.setSectionCode(normalizeOptional(sectionRequestDto.getSectionCode()));
        section.setDescription(normalizeOptional(sectionRequestDto.getDescription()));

        return toSectionResponse(sectionRepository.save(section));
    }

    @Override
    @Transactional
    public BasicMessageResponse deleteSection(Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Selected section does not exist."));

        if (seatNumberRepository.existsBySectionId(section.getId())) {
            throw new IllegalArgumentException(
                    "Delete or move the seat numbers under this section before deleting it."
            );
        }

        sectionRepository.delete(section);

        return BasicMessageResponse.builder()
                .message("Section deleted successfully.")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse createSeatNumber(SeatNumberRequestDto seatNumberRequestDto) {
        Section section = sectionRepository.findById(seatNumberRequestDto.getSectionId())
                .orElseThrow(() -> new IllegalArgumentException("Selected section does not exist."));
        String seatNumber = normalize(seatNumberRequestDto.getSeatNumber());

        if (seatNumberRepository.existsBySeatNumberIgnoreCase(seatNumber)) {
            throw new IllegalArgumentException("Seat number already exists. Use a unique seat number.");
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
    public SeatNumberResponseDto updateSeatNumber(Long seatNumberId, SeatNumberRequestDto seatNumberRequestDto) {
        SeatNumber seatNumber = seatNumberRepository.findById(seatNumberId)
                .orElseThrow(() -> new IllegalArgumentException("Selected seat number does not exist."));
        Section section = sectionRepository.findById(seatNumberRequestDto.getSectionId())
                .orElseThrow(() -> new IllegalArgumentException("Selected section does not exist."));
        String nextSeatNumber = normalize(seatNumberRequestDto.getSeatNumber());

        if (seatNumberRepository.existsBySeatNumberIgnoreCaseAndIdNot(nextSeatNumber, seatNumber.getId())) {
            throw new IllegalArgumentException("Seat number already exists. Use a unique seat number.");
        }

        seatNumber.setSeatNumber(nextSeatNumber);
        seatNumber.setSection(section);
        seatNumber.setDescription(normalizeOptional(seatNumberRequestDto.getDescription()));

        return toSeatNumberResponse(seatNumberRepository.save(seatNumber));
    }

    @Override
    @Transactional
    public BasicMessageResponse deleteSeatNumber(Long seatNumberId) {
        SeatNumber seatNumber = seatNumberRepository.findById(seatNumberId)
                .orElseThrow(() -> new IllegalArgumentException("Selected seat number does not exist."));

        seatNumberRepository.delete(seatNumber);

        return BasicMessageResponse.builder()
                .message("Seat number deleted successfully.")
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

    private SeatNumberResponseDto toSeatNumberResponse(SeatNumber seatNumber) {
        return SeatNumberResponseDto.builder()
                .id(seatNumber.getId())
                .seatNumber(seatNumber.getSeatNumber())
                .sectionId(seatNumber.getSection().getId())
                .sectionName(seatNumber.getSection().getSectionName())
                .description(seatNumber.getDescription())
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
