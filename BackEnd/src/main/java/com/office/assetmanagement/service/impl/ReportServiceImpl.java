package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.model.Asset;
import com.office.assetmanagement.model.AssetDeletionLog;
import com.office.assetmanagement.model.AssetStatusHistory;
import com.office.assetmanagement.repo.AssetDeletionLogRepository;
import com.office.assetmanagement.repo.AssetDocumentRepository;
import com.office.assetmanagement.repo.AssetRepository;
import com.office.assetmanagement.repo.AssetStatusHistoryRepository;
import com.office.assetmanagement.report.dto.DetailedReportRowDto;
import com.office.assetmanagement.report.dto.DeletedAssetReportRowDto;
import com.office.assetmanagement.report.dto.HistoryReportRowDto;
import com.office.assetmanagement.report.dto.PagedReportResponseDto;
import com.office.assetmanagement.report.dto.ReportMetricDto;
import com.office.assetmanagement.report.dto.SummaryReportDto;
import com.office.assetmanagement.service.ReportService;
import com.office.assetmanagement.util.AssetDisplayIdUtil;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final String DELETED_STATUS = "deleted";

    private final AssetRepository assetRepository;
    private final AssetDeletionLogRepository assetDeletionLogRepository;
    private final AssetDocumentRepository assetDocumentRepository;
    private final AssetStatusHistoryRepository assetStatusHistoryRepository;

    @Override
    public PagedReportResponseDto<DetailedReportRowDto> getDetailedReport(
            String search,
            String category,
            String status,
            String sortBy,
            String sortDir,
            int page,
            int size
    ) {
        List<Asset> assets = assetRepository.findAllByStatusNotIgnoreCaseOrderByUpdatedAtDesc(DELETED_STATUS);
        Map<Long, Long> documentCounts = getDocumentCountMap(assets);

        List<DetailedReportRowDto> filteredItems = assets.stream()
                .map(asset -> toDetailedRow(asset, documentCounts.getOrDefault(asset.getId(), 0L)))
                .filter(item -> matchesDetailedSearch(item, search))
                .filter(item -> matchesFilter(item.getCategoryName(), category))
                .filter(item -> matchesFilter(item.getStatus(), status))
                .sorted(buildDetailedComparator(sortBy, sortDir))
                .toList();

        return paginate(filteredItems, page, size);
    }

    @Override
    public PagedReportResponseDto<HistoryReportRowDto> getHistoryReport(
            String search,
            String action,
            int page,
            int size
    ) {
        List<HistoryReportRowDto> filteredItems = assetStatusHistoryRepository.findAllByOrderByChangedAtDesc()
                .stream()
                .map(this::toHistoryRow)
                .filter(item -> matchesHistorySearch(item, search))
                .filter(item -> matchesFilter(item.getAction(), action))
                .toList();

        return paginate(filteredItems, page, size);
    }

    @Override
    public PagedReportResponseDto<DeletedAssetReportRowDto> getDeletedAssetsReport(
            String search,
            int page,
            int size
    ) {
        List<DeletedAssetReportRowDto> filteredItems = assetDeletionLogRepository.findAllByRestoredAtIsNullOrderByDeletionDateDesc()
                .stream()
                .map(this::toDeletedAssetRow)
                .filter(item -> matchesDeletedSearch(item, search))
                .toList();

        return paginate(filteredItems, page, size);
    }

    @Override
    public SummaryReportDto getSummaryReport() {
        List<Asset> assets = assetRepository.findAllByStatusNotIgnoreCaseOrderByUpdatedAtDesc(DELETED_STATUS);

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        statusCounts.put("Available", 0L);
        statusCounts.put("Assigned", 0L);
        statusCounts.put("Damaged", 0L);
        statusCounts.put("Expired", 0L);

        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        Map<String, Long> sectionCounts = new LinkedHashMap<>();

        long assignedWithSeatNumber = 0L;

        for (Asset asset : assets) {
            String status = capitalize(asset.getStatus());
            statusCounts.computeIfPresent(status, (key, value) -> value + 1L);
            categoryCounts.merge(asset.getCategory().getName(), 1L, Long::sum);

            if ("assigned".equals(normalize(asset.getStatus())) && asset.getSection() != null && !asset.getSection().isBlank()) {
                sectionCounts.merge(asset.getSection(), 1L, Long::sum);
            }

            if (asset.getSeatNumber() != null && !asset.getSeatNumber().isBlank()) {
                assignedWithSeatNumber += 1L;
            }
        }

        return SummaryReportDto.builder()
                .totalAssets(assets.size())
                .availableAssets(statusCounts.get("Available"))
                .assignedAssets(statusCounts.get("Assigned"))
                .damagedAssets(statusCounts.get("Damaged"))
                .expiredAssets(statusCounts.get("Expired"))
                .assignedWithSeatNumber(assignedWithSeatNumber)
                .categoryBreakdown(toMetrics(categoryCounts))
                .statusBreakdown(toMetrics(statusCounts))
                .sectionBreakdown(toMetrics(sectionCounts))
                .build();
    }

    private DetailedReportRowDto toDetailedRow(Asset asset, long documentCount) {
        return DetailedReportRowDto.builder()
                .assetId(asset.getId())
                .assetDisplayId(AssetDisplayIdUtil.build(asset))
                .assetName(asset.getAssetName())
                .categoryName(asset.getCategory().getName())
                .employeeName(defaultText(asset.getAssignedTo()))
                .section(defaultText(asset.getSection()))
                .seatNumber(defaultText(asset.getSeatNumber()))
                .status(capitalize(asset.getStatus()))
                .documentCount(documentCount)
                .serialNumber(asset.getSerialNumber())
                .batchId(defaultText(asset.getBatchId()))
                .brand(asset.getBrand())
                .model(asset.getModel())
                .purchaseDate(asset.getPurchaseDate())
                .warrantyExpiryDate(asset.getWarrantyExpiryDate())
                .dateOfIssue(asset.getDateOfIssue())
                .remarks(defaultText(asset.getRemarks()))
                .updatedAt(asset.getUpdatedAt())
                .build();
    }

    private Map<Long, Long> getDocumentCountMap(List<Asset> assets) {
        if (assets.isEmpty()) {
            return Map.of();
        }

        return assetDocumentRepository.countDocumentsByAssetIds(
                        assets.stream().map(Asset::getId).toList()
                ).stream()
                .collect(LinkedHashMap::new, (map, projection) -> map.put(
                        projection.getAssetId(),
                        projection.getDocumentCount()
                ), LinkedHashMap::putAll);
    }

    private HistoryReportRowDto toHistoryRow(AssetStatusHistory history) {
        Asset asset = history.getAsset();

        return HistoryReportRowDto.builder()
                .historyId(history.getId())
                .eventDate(history.getChangedAt())
                .assetDisplayId(AssetDisplayIdUtil.build(asset))
                .assetName(asset.getAssetName())
                .categoryName(asset.getCategory().getName())
                .action(humanizeAction(history.getChangeSource()))
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .details(defaultText(history.getDetails()))
                .source(history.getChangeSource())
                .build();
    }

    private DeletedAssetReportRowDto toDeletedAssetRow(AssetDeletionLog deletionLog) {
        Asset asset = deletionLog.getAsset();

        return DeletedAssetReportRowDto.builder()
                .deletionLogId(deletionLog.getId())
                .assetId(asset.getId())
                .assetDisplayId(AssetDisplayIdUtil.build(asset))
                .assetName(asset.getAssetName())
                .deletionDate(deletionLog.getDeletionDate())
                .reason(defaultText(deletionLog.getReason()))
                .deletedBy(defaultText(deletionLog.getDeletedBy()))
                .build();
    }

    private Comparator<DetailedReportRowDto> buildDetailedComparator(String sortBy, String sortDir) {
        Comparator<DetailedReportRowDto> comparator = switch (normalize(sortBy)) {
            case "assetname" -> comparingText(DetailedReportRowDto::getAssetName);
            case "category" -> comparingText(DetailedReportRowDto::getCategoryName);
            case "employeename" -> comparingText(DetailedReportRowDto::getEmployeeName);
            case "section" -> comparingText(DetailedReportRowDto::getSection);
            case "status" -> comparingText(DetailedReportRowDto::getStatus);
            case "serialnumber" -> comparingText(DetailedReportRowDto::getSerialNumber);
            case "batchid" -> comparingText(DetailedReportRowDto::getBatchId);
            default -> comparingText(DetailedReportRowDto::getAssetDisplayId);
        };

        return "desc".equals(normalize(sortDir)) ? comparator.reversed() : comparator;
    }

    private boolean matchesDetailedSearch(DetailedReportRowDto item, String search) {
        String query = normalize(search);

        if (query.isBlank()) {
            return true;
        }

        return List.of(
                        item.getAssetDisplayId(),
                        item.getAssetName(),
                        item.getCategoryName(),
                        item.getEmployeeName(),
                        item.getSection(),
                        item.getSeatNumber(),
                        item.getSerialNumber(),
                        item.getBatchId()
                ).stream()
                .map(this::normalize)
                .anyMatch(value -> value.contains(query));
    }

    private boolean matchesHistorySearch(HistoryReportRowDto item, String search) {
        String query = normalize(search);

        if (query.isBlank()) {
            return true;
        }

        return List.of(
                        item.getAssetDisplayId(),
                        item.getAssetName(),
                        item.getCategoryName(),
                        item.getAction(),
                        item.getOldStatus(),
                        item.getNewStatus(),
                        item.getDetails()
                ).stream()
                .map(this::normalize)
                .anyMatch(value -> value.contains(query));
    }

    private boolean matchesDeletedSearch(DeletedAssetReportRowDto item, String search) {
        String query = normalize(search);

        if (query.isBlank()) {
            return true;
        }

        return List.of(
                        item.getAssetDisplayId(),
                        item.getAssetName(),
                        item.getReason(),
                        item.getDeletedBy()
                ).stream()
                .map(this::normalize)
                .anyMatch(value -> value.contains(query));
    }

    private boolean matchesFilter(String value, String filter) {
        String normalizedFilter = normalize(filter);
        return normalizedFilter.isBlank() || "all".equals(normalizedFilter) || normalize(value).equals(normalizedFilter);
    }

    private <T> PagedReportResponseDto<T> paginate(List<T> items, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 5 : size;
        int fromIndex = Math.min(safePage * safeSize, items.size());
        int toIndex = Math.min(fromIndex + safeSize, items.size());
        int totalPages = items.isEmpty() ? 1 : (int) Math.ceil((double) items.size() / safeSize);

        return PagedReportResponseDto.<T>builder()
                .items(new ArrayList<>(items.subList(fromIndex, toIndex)))
                .page(safePage)
                .size(safeSize)
                .totalElements(items.size())
                .totalPages(totalPages)
                .build();
    }

    private List<ReportMetricDto> toMetrics(Map<String, Long> source) {
        return source.entrySet()
                .stream()
                .map(entry -> ReportMetricDto.builder()
                        .label(entry.getKey())
                        .value(entry.getValue())
                        .build())
                .toList();
    }

    private Comparator<DetailedReportRowDto> comparingText(Function<DetailedReportRowDto, String> getter) {
        return Comparator.comparing(value -> normalize(getter.apply(value)));
    }

    private String humanizeAction(String source) {
        return switch (normalize(source)) {
            case "new_asset" -> "New Asset";
            case "assign_asset" -> "Assigned";
            case "reassign_asset" -> "Reassigned";
            case "damage_asset" -> "Marked Damaged";
            case "expire_asset" -> "Marked Expired";
            case "return_asset" -> "Returned";
            case "delete_asset" -> "Deleted";
            case "restore_asset" -> "Restored";
            case "edit_asset" -> "Edited";
            default -> defaultText(source);
        };
    }

    private String defaultText(String value) {
        String normalized = value == null ? "" : value.trim();
        return normalized.isEmpty() ? "-" : normalized;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String capitalize(String value) {
        String normalized = normalize(value);

        if (normalized.isEmpty()) {
            return "-";
        }

        return normalized.substring(0, 1).toUpperCase(Locale.ROOT) + normalized.substring(1);
    }
}
