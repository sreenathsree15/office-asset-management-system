package com.office.assetmanagement.asset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class AssetUpdateDto {

    @NotBlank(message = "Asset name is required.")
    private String assetName;

    @NotNull(message = "Category is required.")
    @Positive(message = "Category is required.")
    private Long categoryId;

    @NotBlank(message = "Brand is required.")
    private String brand;

    @NotBlank(message = "Model is required.")
    private String model;

    @NotBlank(message = "Serial number is required.")
    private String serialNumber;

    @NotNull(message = "Purchase date is required.")
    @PastOrPresent(message = "Purchase date cannot be in the future.")
    private LocalDate purchaseDate;

    @NotNull(message = "Warranty expiry date is required.")
    private LocalDate warrantyExpiryDate;

    @NotBlank(message = "Status is required.")
    private String status;

    @Size(max = 120, message = "Assigned To must be 120 characters or fewer.")
    private String assignedTo;

    @Size(max = 500, message = "Remarks must be 500 characters or fewer.")
    private String remarks;
}
