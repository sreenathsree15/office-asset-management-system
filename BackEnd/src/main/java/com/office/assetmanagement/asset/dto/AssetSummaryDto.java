package com.office.assetmanagement.asset.dto;

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
public class AssetSummaryDto {

    private long totalAssets;

    private long availableAssets;

    private long assignedAssets;

    private long damagedAssets;

    private long expiredAssets;
}
