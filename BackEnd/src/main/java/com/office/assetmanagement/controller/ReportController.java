package com.office.assetmanagement.controller;

import com.office.assetmanagement.report.dto.DetailedReportRowDto;
import com.office.assetmanagement.report.dto.HistoryReportRowDto;
import com.office.assetmanagement.report.dto.PagedReportResponseDto;
import com.office.assetmanagement.report.dto.SummaryReportDto;
import com.office.assetmanagement.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/detailed")
    public ResponseEntity<PagedReportResponseDto<DetailedReportRowDto>> getDetailedReport(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "All") String category,
            @RequestParam(defaultValue = "All") String status,
            @RequestParam(defaultValue = "assetId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return ResponseEntity.ok(
                reportService.getDetailedReport(search, category, status, sortBy, sortDir, page, size)
        );
    }

    @GetMapping("/history")
    public ResponseEntity<PagedReportResponseDto<HistoryReportRowDto>> getHistoryReport(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "All") String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size
    ) {
        return ResponseEntity.ok(reportService.getHistoryReport(search, action, page, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryReportDto> getSummaryReport() {
        return ResponseEntity.ok(reportService.getSummaryReport());
    }
}
