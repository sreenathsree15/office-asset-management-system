package com.office.assetmanagement.asset.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignedAssetDto {

    private Long assetId;

    private String assetName;

    private String serialNumber;

    private String categoryName;

    private String assignedTo;

    private String section;

    private String seatNumber;

    private LocalDate dateOfIssue;
}
