package com.office.assetmanagement.report.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
public class DetailedReportRowDto {

    private Long assetId;

    private String assetDisplayId;

    private String assetName;

    private String categoryName;

    private String employeeName;

    private String section;

    private String seatNumber;

    private String status;

    private String serialNumber;

    private String brand;

    private String model;

    private LocalDate purchaseDate;

    private LocalDate warrantyExpiryDate;

    private LocalDate dateOfIssue;

    private String remarks;

    private LocalDateTime updatedAt;
}
