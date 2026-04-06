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
public class HistoryReportRowDto {

    private Long historyId;

    private LocalDateTime eventDate;

    private String assetDisplayId;

    private String assetName;

    private String categoryName;

    private String action;

    private String oldStatus;

    private String newStatus;

    private String details;

    private String source;
}
