package com.office.assetmanagement.asset.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class AssetDeleteDto {

    @NotNull(message = "Asset is required.")
    @Positive(message = "Asset is required.")
    private Long assetId;

    @Size(max = 500, message = "Reason must be 500 characters or fewer.")
    private String reason;
}
