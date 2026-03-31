package com.office.assetmanagement.service;

import com.office.assetmanagement.dto.AdminNameUpdateRequest;
import com.office.assetmanagement.dto.AdminNameUpdateResponse;
import com.office.assetmanagement.dto.AdminPasswordUpdateRequest;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.dto.SeatNumberRequestDto;
import com.office.assetmanagement.dto.SectionRequestDto;
import com.office.assetmanagement.dto.SectionResponseDto;
import java.util.List;

public interface AdminModuleService {

    List<SectionResponseDto> listSections();

    SectionResponseDto createSection(SectionRequestDto sectionRequestDto);

    BasicMessageResponse createSeatNumber(SeatNumberRequestDto seatNumberRequestDto);

    AdminNameUpdateResponse updateAdminName(String currentUsername, AdminNameUpdateRequest adminNameUpdateRequest);

    BasicMessageResponse updateAdminPassword(
            String currentUsername,
            AdminPasswordUpdateRequest adminPasswordUpdateRequest
    );
}
