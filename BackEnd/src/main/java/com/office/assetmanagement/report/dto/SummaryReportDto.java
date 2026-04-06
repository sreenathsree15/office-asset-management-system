package com.office.assetmanagement.report.dto;

import java.util.List;
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
public class SummaryReportDto {

    private long totalAssets;

    private long availableAssets;

    private long assignedAssets;

    private long damagedAssets;

    private long expiredAssets;

    private long assignedWithSeatNumber;

    private List<ReportMetricDto> categoryBreakdown;

    private List<ReportMetricDto> statusBreakdown;

    private List<ReportMetricDto> sectionBreakdown;
}
