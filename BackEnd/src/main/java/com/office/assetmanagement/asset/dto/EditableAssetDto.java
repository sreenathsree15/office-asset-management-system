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
public class EditableAssetDto {

    private Long assetId;

    private String assetDisplayId;

    private String assetName;

    private Long categoryId;

    private String categoryName;

    private String brand;

    private String model;

    private String serialNumber;

    private LocalDate purchaseDate;

    private LocalDate warrantyExpiryDate;

    private String status;

    private String assignedTo;

    private String remarks;
}
