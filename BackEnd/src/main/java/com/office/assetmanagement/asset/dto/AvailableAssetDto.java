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
public class AvailableAssetDto {

    private Long assetId;

    private String assetName;

    private String serialNumber;

    private String categoryName;
}
