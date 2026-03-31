package com.office.assetmanagement.asset.dto;

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
public class AssetExpireDto {

    @NotNull(message = "Asset is required.")
    @Positive(message = "Asset is required.")
    private Long assetId;

    @NotNull(message = "Expiry date is required.")
    private LocalDate expiryDate;

    @Size(max = 250, message = "Reason must be 250 characters or fewer.")
    private String reason;

    @Size(max = 500, message = "Remarks must be 500 characters or fewer.")
    private String remarks;
}
