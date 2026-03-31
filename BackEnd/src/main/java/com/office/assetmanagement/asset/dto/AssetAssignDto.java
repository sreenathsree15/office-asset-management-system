package com.office.assetmanagement.asset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class AssetAssignDto {

    @NotNull(message = "Asset is required.")
    @Positive(message = "Asset is required.")
    private Long assetId;

    @NotBlank(message = "Assigned To is required.")
    private String assignedTo;

    @NotBlank(message = "Section is required.")
    private String section;

    @NotNull(message = "Date of issue is required.")
    private LocalDate dateOfIssue;

    @Size(max = 500, message = "Remarks must be 500 characters or fewer.")
    private String remarks;
}
