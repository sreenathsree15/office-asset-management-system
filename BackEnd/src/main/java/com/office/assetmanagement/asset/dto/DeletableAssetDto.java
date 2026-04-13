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
public class DeletableAssetDto {

    private Long assetId;

    private String assetDisplayId;

    private String assetName;

    private String status;
}
