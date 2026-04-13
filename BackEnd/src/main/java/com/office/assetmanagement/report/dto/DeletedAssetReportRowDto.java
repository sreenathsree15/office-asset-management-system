package com.office.assetmanagement.report.dto;

import java.time.LocalDateTime;
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
public class DeletedAssetReportRowDto {

    private Long deletionLogId;

    private Long assetId;

    private String assetDisplayId;

    private String assetName;

    private LocalDateTime deletionDate;

    private String reason;

    private String deletedBy;
}
