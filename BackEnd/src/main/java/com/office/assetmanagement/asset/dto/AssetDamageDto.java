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
public class AssetDamageDto {

    @NotNull(message = "Asset is required.")
    @Positive(message = "Asset is required.")
    private Long assetId;

    @NotNull(message = "Damage date is required.")
    private LocalDate damageDate;

    @NotBlank(message = "Damage description is required.")
    @Size(max = 500, message = "Damage description must be 500 characters or fewer.")
    private String damageDescription;

    @NotBlank(message = "Severity is required.")
    private String severity;

    @Size(max = 500, message = "Remarks must be 500 characters or fewer.")
    private String remarks;
}
