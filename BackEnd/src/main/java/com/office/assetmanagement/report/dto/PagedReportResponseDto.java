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
public class PagedReportResponseDto<T> {

    private List<T> items;

    private int page;

    private int size;

    private long totalElements;

    private int totalPages;
}
