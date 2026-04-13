package com.office.assetmanagement.asset.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class AssetRestoreDto {

    @NotNull(message = "Asset is required.")
    @Positive(message = "Asset is required.")
    private Long assetId;
}
