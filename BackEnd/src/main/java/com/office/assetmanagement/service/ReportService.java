package com.office.assetmanagement.service;

import com.office.assetmanagement.report.dto.DetailedReportRowDto;
import com.office.assetmanagement.report.dto.DeletedAssetReportRowDto;
import com.office.assetmanagement.report.dto.HistoryReportRowDto;
import com.office.assetmanagement.report.dto.PagedReportResponseDto;
import com.office.assetmanagement.report.dto.SummaryReportDto;

public interface ReportService {

    PagedReportResponseDto<DetailedReportRowDto> getDetailedReport(
            String search,
            String category,
            String status,
            String sortBy,
            String sortDir,
            int page,
            int size
    );

    PagedReportResponseDto<HistoryReportRowDto> getHistoryReport(
            String search,
            String action,
            int page,
            int size
    );

    PagedReportResponseDto<DeletedAssetReportRowDto> getDeletedAssetsReport(
            String search,
            int page,
            int size
    );

    SummaryReportDto getSummaryReport();
}
