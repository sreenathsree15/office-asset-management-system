package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.asset.dto.AssetBulkDto;
import com.office.assetmanagement.asset.dto.ActiveAssetDto;
import com.office.assetmanagement.asset.dto.AssetAssignDto;
import com.office.assetmanagement.asset.dto.AssetDamageDto;
import com.office.assetmanagement.asset.dto.AssetDeleteDto;
import com.office.assetmanagement.asset.dto.AssetExpireDto;
import com.office.assetmanagement.asset.dto.AssetReassignDto;
import com.office.assetmanagement.asset.dto.AssetReturnDto;
import com.office.assetmanagement.asset.dto.AssetRestoreDto;
import com.office.assetmanagement.asset.dto.AssetSummaryDto;
import com.office.assetmanagement.asset.dto.AvailableAssetDto;
import com.office.assetmanagement.asset.dto.DeletableAssetDto;
import com.office.assetmanagement.asset.dto.EditableAssetDto;
import com.office.assetmanagement.asset.dto.AssignedAssetDto;
import com.office.assetmanagement.asset.dto.AssetSingleDto;
import com.office.assetmanagement.asset.dto.AssetUpdateDto;
import com.office.assetmanagement.asset.dto.SerialNumberAvailabilityDto;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.model.Asset;
import com.office.assetmanagement.model.AssetDeletionLog;
import com.office.assetmanagement.model.AssetReturnRecord;
import com.office.assetmanagement.model.AssetStatusHistory;
import com.office.assetmanagement.model.Category;
import com.office.assetmanagement.model.Section;
import com.office.assetmanagement.repo.AssetRepository;
import com.office.assetmanagement.repo.AssetDeletionLogRepository;
import com.office.assetmanagement.repo.AssetReturnRecordRepository;
import com.office.assetmanagement.repo.AssetStatusHistoryRepository;
import com.office.assetmanagement.repo.CategoryRepository;
import com.office.assetmanagement.repo.SectionRepository;
import com.office.assetmanagement.repo.SeatNumberRepository;
import com.office.assetmanagement.service.AssetService;
import com.office.assetmanagement.util.AssetDisplayIdUtil;
import com.office.assetmanagement.util.SerialNumberGenerator;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private static final String AVAILABLE_STATUS = "available";
    private static final String ASSIGNED_STATUS = "assigned";
    private static final String DAMAGED_STATUS = "damaged";
    private static final String EXPIRED_STATUS = "expired";
    private static final String DELETED_STATUS = "deleted";
    private static final String EDIT_SOURCE = "EDIT_ASSET";
    private static final String NEW_ASSET_SOURCE = "NEW_ASSET";
    private static final String ASSIGN_SOURCE = "ASSIGN_ASSET";
    private static final String REASSIGN_SOURCE = "REASSIGN_ASSET";
    private static final String DAMAGE_SOURCE = "DAMAGE_ASSET";
    private static final String EXPIRE_SOURCE = "EXPIRE_ASSET";
    private static final String RETURN_SOURCE = "RETURN_ASSET";
    private static final String DELETE_SOURCE = "DELETE_ASSET";
    private static final String RESTORE_SOURCE = "RESTORE_ASSET";
    private static final String GOOD_CONDITION = "good";
    private static final String DAMAGED_CONDITION = "damaged";
    private static final String DEFAULT_ACTION_USER = "Admin";
    private static final int MAX_SERIAL_GENERATION_ATTEMPTS = 10000;
    private static final Set<String> SEAT_REQUIRED_CATEGORIES = Set.of("desktop", "printer", "ups");
    private static final DateTimeFormatter BULK_BATCH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AssetRepository assetRepository;
    private final AssetDeletionLogRepository assetDeletionLogRepository;
    private final AssetReturnRecordRepository assetReturnRecordRepository;
    private final AssetStatusHistoryRepository assetStatusHistoryRepository;
    private final CategoryRepository categoryRepository;
    private final SectionRepository sectionRepository;
    private final SeatNumberRepository seatNumberRepository;
    private final SerialNumberGenerator serialNumberGenerator;

    @Override
    @Transactional
    public Asset createSingleAsset(AssetSingleDto assetSingleDto) {
        String assetName = normalize(assetSingleDto.getAssetName());
        String serialNumber = normalize(assetSingleDto.getSerialNumber());
        Category category = findCategory(assetSingleDto.getCategoryId());

        if (assetRepository.existsByAssetNameIgnoreCase(assetName)) {
            throw new IllegalArgumentException("Asset name already exists.");
        }

        if (assetRepository.existsBySerialNumberIgnoreCase(serialNumber)) {
            throw new IllegalArgumentException("Serial number already exists.");
        }

        validateWarrantyDates(assetSingleDto.getPurchaseDate(), assetSingleDto.getWarrantyExpiryDate());

        Asset asset = buildAsset(
                assetName,
                category,
                assetSingleDto.getBrand(),
                assetSingleDto.getModel(),
                serialNumber,
                null,
                assetSingleDto.getPurchaseDate(),
                assetSingleDto.getWarrantyExpiryDate(),
                assetSingleDto.getRemarks()
        );

        Asset savedAsset = assetRepository.save(asset);
        assetStatusHistoryRepository.save(createHistoryEntry(
                savedAsset,
                "New",
                capitalize(AVAILABLE_STATUS),
                NEW_ASSET_SOURCE,
                "Asset added to inventory."
        ));

        return savedAsset;
    }

    @Override
    @Transactional
    public List<Asset> createBulkAssets(AssetBulkDto assetBulkDto) {
        Category category = findCategory(assetBulkDto.getCategoryId());
        validateWarrantyDates(assetBulkDto.getPurchaseDate(), assetBulkDto.getWarrantyExpiryDate());

        List<Asset> assetsToSave = new ArrayList<>(assetBulkDto.getQuantity());
        Set<String> generatedSerialNumbers = new HashSet<>();
        LocalDate serialReferenceDate = LocalDate.now();
        String batchId = generateBulkBatchId();
        long sequence = 1L;

        for (int index = 0; index < assetBulkDto.getQuantity(); index++) {
            String serialNumber = generateUniqueSerialNumber(category, serialReferenceDate, generatedSerialNumbers, sequence);
            sequence += 1L;

            assetsToSave.add(buildAsset(
                    assetBulkDto.getAssetName(),
                    category,
                    assetBulkDto.getBrand(),
                    assetBulkDto.getModel(),
                    serialNumber,
                    batchId,
                    assetBulkDto.getPurchaseDate(),
                    assetBulkDto.getWarrantyExpiryDate(),
                    assetBulkDto.getRemarks()
            ));
        }

        List<Asset> savedAssets = assetRepository.saveAll(assetsToSave);
        assetStatusHistoryRepository.saveAll(savedAssets.stream()
                .map(asset -> createHistoryEntry(
                        asset,
                        "New",
                        capitalize(AVAILABLE_STATUS),
                        NEW_ASSET_SOURCE,
                        "Asset added to inventory through bulk import."
                ))
                .toList());

        return savedAssets;
    }

    @Override
    public List<EditableAssetDto> listEditableAssets() {
        return assetRepository.findAllByStatusNotIgnoreCaseOrderByUpdatedAtDesc(DELETED_STATUS)
                .stream()
                .map(this::toEditableAssetDto)
                .toList();
    }

    @Override
    public List<ActiveAssetDto> listActiveAssets() {
        return assetRepository.findAllByStatusInOrderByUpdatedAtDesc(List.of(AVAILABLE_STATUS, ASSIGNED_STATUS))
                .stream()
                .map(asset -> ActiveAssetDto.builder()
                        .assetId(asset.getId())
                        .assetName(asset.getAssetName())
                        .serialNumber(asset.getSerialNumber())
                        .categoryName(asset.getCategory().getName())
                        .status(capitalize(asset.getStatus()))
                        .build())
                .toList();
    }

    @Override
    public List<AvailableAssetDto> listAvailableAssets() {
        return assetRepository.findAllByStatusIgnoreCaseOrderByUpdatedAtDesc(AVAILABLE_STATUS)
                .stream()
                .map(asset -> AvailableAssetDto.builder()
                        .assetId(asset.getId())
                        .assetName(asset.getAssetName())
                        .serialNumber(asset.getSerialNumber())
                        .categoryName(asset.getCategory().getName())
                        .build())
                .toList();
    }

    @Override
    public List<AssignedAssetDto> listAssignedAssets() {
        return assetRepository.findAllByStatusIgnoreCaseOrderByUpdatedAtDesc(ASSIGNED_STATUS)
                .stream()
                .map(asset -> AssignedAssetDto.builder()
                        .assetId(asset.getId())
                        .assetName(asset.getAssetName())
                        .serialNumber(asset.getSerialNumber())
                        .categoryName(asset.getCategory().getName())
                        .assignedTo(asset.getAssignedTo())
                        .section(asset.getSection())
                        .seatNumber(asset.getSeatNumber())
                        .dateOfIssue(asset.getDateOfIssue())
                        .build())
                .toList();
    }

    @Override
    public List<DeletableAssetDto> listDeletableAssets() {
        return assetRepository.findAllByStatusNotIgnoreCaseOrderByUpdatedAtDesc(DELETED_STATUS)
                .stream()
                .map(asset -> DeletableAssetDto.builder()
                        .assetId(asset.getId())
                        .assetDisplayId(buildAssetDisplayId(asset))
                        .assetName(asset.getAssetName())
                        .status(capitalize(asset.getStatus()))
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public Asset updateAsset(Long assetId, AssetUpdateDto assetUpdateDto) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Selected asset does not exist."));

        if (DELETED_STATUS.equals(normalize(asset.getStatus()))) {
            throw new IllegalArgumentException("Deleted assets must be restored before editing.");
        }

        Category category = findCategory(assetUpdateDto.getCategoryId());
        String assetName = normalize(assetUpdateDto.getAssetName());
        String serialNumber = normalize(assetUpdateDto.getSerialNumber());

        validateWarrantyDates(assetUpdateDto.getPurchaseDate(), assetUpdateDto.getWarrantyExpiryDate());

        if (assetRepository.existsByAssetNameIgnoreCaseAndIdNot(assetName, assetId)) {
            throw new IllegalArgumentException("Asset name already exists.");
        }

        if (assetRepository.existsBySerialNumberIgnoreCaseAndIdNot(serialNumber, assetId)) {
            throw new IllegalArgumentException("Serial number already exists.");
        }

        String previousStatus = normalizeStatus(asset.getStatus());
        String updatedStatus = normalizeStatus(assetUpdateDto.getStatus());

        if (ASSIGNED_STATUS.equals(updatedStatus) && !ASSIGNED_STATUS.equals(previousStatus)) {
            throw new IllegalArgumentException("Use Assign Asset to move an asset into Assigned status.");
        }

        asset.setAssetName(assetName);
        asset.setCategory(category);
        asset.setBrand(normalize(assetUpdateDto.getBrand()));
        asset.setModel(normalize(assetUpdateDto.getModel()));
        asset.setSerialNumber(serialNumber);
        asset.setPurchaseDate(assetUpdateDto.getPurchaseDate());
        asset.setWarrantyExpiryDate(assetUpdateDto.getWarrantyExpiryDate());
        asset.setStatus(updatedStatus);
        asset.setRemarks(resolveUpdatedRemarks(asset.getRemarks(), assetUpdateDto.getRemarks()));

        if (ASSIGNED_STATUS.equals(updatedStatus)) {
            String assignedTo = normalize(assetUpdateDto.getAssignedTo());

            if (assignedTo.isEmpty()) {
                throw new IllegalArgumentException("Assigned To is required for assigned assets.");
            }

            asset.setAssignedTo(assignedTo);

            if (requiresSeatNumber(category.getName())) {
                String currentSection = normalize(asset.getSection());
                String currentSeatNumber = normalize(asset.getSeatNumber());

                if (currentSection.isEmpty() || currentSeatNumber.isEmpty()) {
                    throw new IllegalArgumentException(
                            "Assigned Desktop, Printer, and UPS assets must have a valid section and seat number. Use Reassign Asset to update the assignment details."
                    );
                }

                asset.setSeatNumber(
                        resolveAssignedSeatNumber(category.getName(), currentSection, currentSeatNumber)
                );
            } else {
                asset.setSeatNumber(null);
            }
        }

        if (!ASSIGNED_STATUS.equals(updatedStatus)) {
            asset.setAssignedTo(null);
            asset.setSection(null);
            asset.setSeatNumber(null);
            asset.setDateOfIssue(null);
        }

        if (EXPIRED_STATUS.equals(updatedStatus)) {
            if (asset.getExpiryDate() == null) {
                asset.setExpiryDate(LocalDate.now());
            }

            if (asset.getExpiryReason() == null || asset.getExpiryReason().isBlank()) {
                asset.setExpiryReason("Updated via Edit Asset");
            }
        } else {
            asset.setExpiryDate(null);
            asset.setExpiryReason(null);
        }

        if (DAMAGED_STATUS.equals(updatedStatus)) {
            if (asset.getDamageDate() == null) {
                asset.setDamageDate(LocalDate.now());
            }
        } else {
            asset.setDamageDate(null);
            asset.setDamageDescription(null);
            asset.setDamageSeverity(null);
        }

        Asset savedAsset = assetRepository.save(asset);

        if (!previousStatus.equals(updatedStatus)) {
            assetStatusHistoryRepository.save(createHistoryEntry(
                    savedAsset,
                    capitalize(previousStatus),
                    capitalize(updatedStatus),
                    EDIT_SOURCE,
                    "Status updated through Edit Asset."
            ));
        }

        return savedAsset;
    }

    @Override
    public SerialNumberAvailabilityDto checkSerialNumberAvailability(String serialNumber, Long excludeAssetId) {
        String normalizedSerialNumber = normalize(serialNumber);

        if (normalizedSerialNumber.isEmpty()) {
            return SerialNumberAvailabilityDto.builder()
                    .available(false)
                    .message("Serial number is required.")
                    .build();
        }

        boolean available = excludeAssetId == null
                ? !assetRepository.existsBySerialNumberIgnoreCase(normalizedSerialNumber)
                : !assetRepository.existsBySerialNumberIgnoreCaseAndIdNot(normalizedSerialNumber, excludeAssetId);

        return SerialNumberAvailabilityDto.builder()
                .available(available)
                .message(available ? "Serial number is available." : "Serial number already exists.")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse assignAsset(AssetAssignDto assetAssignDto) {
        Asset asset = assetRepository.findByIdAndStatusIgnoreCase(assetAssignDto.getAssetId(), AVAILABLE_STATUS)
                .orElseThrow(() -> new IllegalArgumentException("Selected asset is not currently available."));
        String sectionName = normalize(assetAssignDto.getSection());
        String normalizedSeatNumber = normalize(assetAssignDto.getSeatNumber());

        if (assetAssignDto.getDateOfIssue().isBefore(asset.getPurchaseDate())) {
            throw new IllegalArgumentException("Date of issue cannot be before purchase date.");
        }

        asset.setStatus(ASSIGNED_STATUS);
        asset.setAssignedTo(normalize(assetAssignDto.getAssignedTo()));
        asset.setSection(sectionName);
        asset.setSeatNumber(resolveAssignedSeatNumber(asset.getCategory().getName(), sectionName, normalizedSeatNumber));
        asset.setDateOfIssue(assetAssignDto.getDateOfIssue());
        asset.setRemarks(resolveUpdatedRemarks(asset.getRemarks(), assetAssignDto.getRemarks()));

        Asset savedAsset = assetRepository.save(asset);
        assetStatusHistoryRepository.save(createHistoryEntry(
                savedAsset,
                capitalize(AVAILABLE_STATUS),
                capitalize(ASSIGNED_STATUS),
                ASSIGN_SOURCE,
                buildAssignmentHistoryDetails(savedAsset)
        ));

        return BasicMessageResponse.builder()
                .message("Asset assigned successfully.")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse reassignAsset(AssetReassignDto assetReassignDto) {
        Asset asset = assetRepository.findByIdAndStatusIgnoreCase(assetReassignDto.getAssetId(), ASSIGNED_STATUS)
                .orElseThrow(() -> new IllegalArgumentException("Selected asset is not currently assigned."));
        String previousAssignedTo = normalizeOptional(asset.getAssignedTo());
        String previousSection = normalizeOptional(asset.getSection());
        String previousSeatNumber = normalizeOptional(asset.getSeatNumber());
        String nextSection = normalize(assetReassignDto.getSection());
        String nextAssignedTo = normalize(assetReassignDto.getAssignedTo());
        String nextSeatNumber = normalize(assetReassignDto.getSeatNumber());

        if (assetReassignDto.getDateOfIssue().isBefore(asset.getPurchaseDate())) {
            throw new IllegalArgumentException("Date of issue cannot be before purchase date.");
        }

        asset.setAssignedTo(nextAssignedTo);
        asset.setSection(nextSection);
        asset.setSeatNumber(resolveAssignedSeatNumber(asset.getCategory().getName(), nextSection, nextSeatNumber));
        asset.setDateOfIssue(assetReassignDto.getDateOfIssue());
        asset.setRemarks(resolveUpdatedRemarks(asset.getRemarks(), assetReassignDto.getRemarks()));

        Asset savedAsset = assetRepository.save(asset);
        assetStatusHistoryRepository.save(createHistoryEntry(
                savedAsset,
                capitalize(ASSIGNED_STATUS),
                capitalize(ASSIGNED_STATUS),
                REASSIGN_SOURCE,
                buildReassignmentHistoryDetails(
                        previousAssignedTo,
                        previousSection,
                        previousSeatNumber,
                        savedAsset
                )
        ));

        return BasicMessageResponse.builder()
                .message("Asset reassigned successfully.")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse damageAsset(AssetDamageDto assetDamageDto) {
        Asset asset = assetRepository.findByIdAndStatusIn(
                        assetDamageDto.getAssetId(),
                        List.of(AVAILABLE_STATUS, ASSIGNED_STATUS)
                )
                .orElseThrow(() -> new IllegalArgumentException("Selected asset is not active."));

        if (assetDamageDto.getDamageDate().isBefore(asset.getPurchaseDate())) {
            throw new IllegalArgumentException("Damage date cannot be before purchase date.");
        }

        String normalizedSeverity = normalizeSeverity(assetDamageDto.getSeverity());
        String oldStatus = capitalize(normalizeStatus(asset.getStatus()));

        asset.setStatus(DAMAGED_STATUS);
        asset.setDamageDate(assetDamageDto.getDamageDate());
        asset.setDamageDescription(normalize(assetDamageDto.getDamageDescription()));
        asset.setDamageSeverity(capitalize(normalizedSeverity));
        asset.setRemarks(resolveUpdatedRemarks(asset.getRemarks(), assetDamageDto.getRemarks()));
        asset.setAssignedTo(null);
        asset.setSection(null);
        asset.setSeatNumber(null);
        asset.setDateOfIssue(null);

        Asset savedAsset = assetRepository.save(asset);
        assetStatusHistoryRepository.save(createHistoryEntry(
                savedAsset,
                oldStatus,
                capitalize(DAMAGED_STATUS),
                DAMAGE_SOURCE,
                buildDamageHistoryDetails(savedAsset)
        ));

        return BasicMessageResponse.builder()
                .message("Asset marked as damaged successfully.")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse expireAsset(AssetExpireDto assetExpireDto) {
        Asset asset = assetRepository.findByIdAndStatusIn(
                        assetExpireDto.getAssetId(),
                        List.of(AVAILABLE_STATUS, ASSIGNED_STATUS)
                )
                .orElseThrow(() -> new IllegalArgumentException("Selected asset is not active."));

        if (assetExpireDto.getExpiryDate().isBefore(asset.getPurchaseDate())) {
            throw new IllegalArgumentException("Expiry date cannot be before purchase date.");
        }

        String oldStatus = capitalize(normalizeStatus(asset.getStatus()));

        asset.setStatus(EXPIRED_STATUS);
        asset.setExpiryDate(assetExpireDto.getExpiryDate());
        asset.setExpiryReason(normalizeOptional(assetExpireDto.getReason()));
        asset.setRemarks(resolveUpdatedRemarks(asset.getRemarks(), assetExpireDto.getRemarks()));
        asset.setAssignedTo(null);
        asset.setSection(null);
        asset.setSeatNumber(null);
        asset.setDateOfIssue(null);

        Asset savedAsset = assetRepository.save(asset);
        assetStatusHistoryRepository.save(createHistoryEntry(
                savedAsset,
                oldStatus,
                capitalize(EXPIRED_STATUS),
                EXPIRE_SOURCE,
                buildExpiryHistoryDetails(savedAsset)
        ));

        return BasicMessageResponse.builder()
                .message("Asset marked as expired successfully.")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse returnAsset(AssetReturnDto assetReturnDto) {
        Asset asset = assetRepository.findByIdAndStatusIgnoreCase(assetReturnDto.getAssetId(), ASSIGNED_STATUS)
                .orElseThrow(() -> new IllegalArgumentException("Selected asset is not currently assigned."));

        LocalDate returnDate = assetReturnDto.getReturnDate();

        if (asset.getDateOfIssue() != null && returnDate.isBefore(asset.getDateOfIssue())) {
            throw new IllegalArgumentException("Return date cannot be before date of issue.");
        }

        String normalizedCondition = normalizeCondition(assetReturnDto.getConditionAtReturn());
        String updatedStatus = GOOD_CONDITION.equals(normalizedCondition) ? AVAILABLE_STATUS : DAMAGED_STATUS;
        String previousAssignedTo = normalizeOptional(asset.getAssignedTo());
        String previousSection = normalizeOptional(asset.getSection());
        String previousSeatNumber = normalizeOptional(asset.getSeatNumber());

        AssetReturnRecord assetReturnRecord = AssetReturnRecord.builder()
                .asset(asset)
                .assignedTo(previousAssignedTo)
                .section(previousSection)
                .seatNumber(previousSeatNumber)
                .dateOfIssue(asset.getDateOfIssue())
                .returnDate(returnDate)
                .conditionAtReturn(capitalize(normalizedCondition))
                .remarks(normalizeOptional(assetReturnDto.getRemarks()))
                .build();

        asset.setStatus(updatedStatus);
        asset.setAssignedTo(null);
        asset.setSection(null);
        asset.setSeatNumber(null);
        asset.setDateOfIssue(null);

        Asset savedAsset = assetRepository.save(asset);
        assetReturnRecordRepository.save(assetReturnRecord);
        assetStatusHistoryRepository.save(createHistoryEntry(
                savedAsset,
                capitalize(ASSIGNED_STATUS),
                capitalize(updatedStatus),
                RETURN_SOURCE,
                buildReturnHistoryDetails(
                        capitalize(normalizedCondition),
                        previousAssignedTo,
                        previousSection,
                        previousSeatNumber
                )
        ));

        return BasicMessageResponse.builder()
                .message("Asset returned successfully. Status updated to %s.".formatted(capitalize(updatedStatus)))
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse deleteAsset(AssetDeleteDto assetDeleteDto) {
        Asset asset = assetRepository.findById(assetDeleteDto.getAssetId())
                .orElseThrow(() -> new IllegalArgumentException("Selected asset does not exist."));

        if (DELETED_STATUS.equals(normalize(asset.getStatus()))) {
            throw new IllegalArgumentException("Selected asset is already deleted.");
        }

        String oldStatus = capitalize(normalizeStatus(asset.getStatus()));
        AssetDeletionLog deletionLog = AssetDeletionLog.builder()
                .asset(asset)
                .reason(normalizeOptional(assetDeleteDto.getReason()))
                .deletedBy(DEFAULT_ACTION_USER)
                .build();

        asset.setStatus(DELETED_STATUS);
        asset.setAssignedTo(null);
        asset.setSection(null);
        asset.setSeatNumber(null);
        asset.setDateOfIssue(null);

        Asset savedAsset = assetRepository.save(asset);
        AssetDeletionLog savedDeletionLog = assetDeletionLogRepository.save(deletionLog);
        assetStatusHistoryRepository.save(createHistoryEntry(
                savedAsset,
                oldStatus,
                capitalize(DELETED_STATUS),
                DELETE_SOURCE,
                buildDeletionHistoryDetails(savedDeletionLog)
        ));

        return BasicMessageResponse.builder()
                .message("Asset deleted successfully.")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse restoreAsset(AssetRestoreDto assetRestoreDto) {
        Asset asset = assetRepository.findById(assetRestoreDto.getAssetId())
                .orElseThrow(() -> new IllegalArgumentException("Selected asset does not exist."));

        if (!DELETED_STATUS.equals(normalize(asset.getStatus()))) {
            throw new IllegalArgumentException("Selected asset is not deleted.");
        }

        AssetDeletionLog deletionLog = assetDeletionLogRepository
                .findFirstByAsset_IdAndRestoredAtIsNullOrderByDeletionDateDesc(asset.getId())
                .orElseThrow(() -> new IllegalArgumentException("No active deletion log exists for this asset."));

        asset.setStatus(AVAILABLE_STATUS);
        asset.setAssignedTo(null);
        asset.setSection(null);
        asset.setSeatNumber(null);
        asset.setDateOfIssue(null);
        asset.setExpiryDate(null);
        asset.setExpiryReason(null);
        asset.setDamageDate(null);
        asset.setDamageDescription(null);
        asset.setDamageSeverity(null);

        deletionLog.setRestoredAt(java.time.LocalDateTime.now());
        deletionLog.setRestoredBy(DEFAULT_ACTION_USER);

        Asset savedAsset = assetRepository.save(asset);
        assetDeletionLogRepository.save(deletionLog);
        assetStatusHistoryRepository.save(createHistoryEntry(
                savedAsset,
                capitalize(DELETED_STATUS),
                capitalize(AVAILABLE_STATUS),
                RESTORE_SOURCE,
                buildRestoreHistoryDetails(savedAsset)
        ));

        return BasicMessageResponse.builder()
                .message("Asset restored successfully.")
                .build();
    }

    @Override
    public AssetSummaryDto getAssetSummary() {
        return AssetSummaryDto.builder()
                .totalAssets(assetRepository.countByStatusNotIgnoreCase(DELETED_STATUS))
                .availableAssets(assetRepository.countByStatusIgnoreCase(AVAILABLE_STATUS))
                .assignedAssets(assetRepository.countByStatusIgnoreCase(ASSIGNED_STATUS))
                .damagedAssets(assetRepository.countByStatusIgnoreCase(DAMAGED_STATUS))
                .expiredAssets(assetRepository.countByStatusIgnoreCase(EXPIRED_STATUS))
                .build();
    }

    private Category findCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Selected category does not exist."));
    }

    private void validateWarrantyDates(LocalDate purchaseDate, LocalDate warrantyExpiryDate) {
        if (!warrantyExpiryDate.isAfter(purchaseDate)) {
            throw new IllegalArgumentException(
                    "Warranty expiry date must be later than the purchase date."
            );
        }
    }

    private String resolveAssignedSeatNumber(String categoryName, String sectionName, String seatNumber) {
        if (!requiresSeatNumber(categoryName)) {
            return null;
        }

        if (seatNumber.isEmpty()) {
            throw new IllegalArgumentException("Seat number is required for Desktop, Printer, and UPS assets.");
        }

        Section section = sectionRepository.findBySectionNameIgnoreCase(sectionName)
                .orElseThrow(() -> new IllegalArgumentException("Selected section does not exist."));

        if (!seatNumberRepository.existsBySectionIdAndSeatNumberIgnoreCase(section.getId(), seatNumber)) {
            throw new IllegalArgumentException("Selected seat number does not belong to the chosen section.");
        }

        return seatNumber;
    }

    private Asset buildAsset(
            String assetName,
            Category category,
            String brand,
            String model,
            String serialNumber,
            String batchId,
            LocalDate purchaseDate,
            LocalDate warrantyExpiryDate,
            String remarks
    ) {
        return Asset.builder()
                .assetName(normalize(assetName))
                .category(category)
                .brand(normalize(brand))
                .model(normalize(model))
                .serialNumber(normalize(serialNumber))
                .batchId(normalizeOptional(batchId))
                .purchaseDate(purchaseDate)
                .warrantyExpiryDate(warrantyExpiryDate)
                .status(AVAILABLE_STATUS)
                .remarks(normalizeOptional(remarks))
                .build();
    }

    private String generateBulkBatchId() {
        return "BULK-%s-%s".formatted(
                LocalDateTime.now().format(BULK_BATCH_FORMATTER),
                UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT)
        );
    }

    private String generateUniqueSerialNumber(
            Category category,
            LocalDate referenceDate,
            Set<String> generatedSerialNumbers,
            long startingSequence
    ) {
        long currentSequence = startingSequence;

        for (int attempt = 0; attempt < MAX_SERIAL_GENERATION_ATTEMPTS; attempt++) {
            String serialNumber = serialNumberGenerator.generate(category, referenceDate, currentSequence);
            currentSequence += 1L;

            if (generatedSerialNumbers.contains(serialNumber)) {
                continue;
            }

            if (assetRepository.existsBySerialNumberIgnoreCase(serialNumber)) {
                continue;
            }

            generatedSerialNumbers.add(serialNumber);
            return serialNumber;
        }

        throw new IllegalStateException("Unable to generate a unique serial number for the selected category.");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeOptional(String value) {
        String normalized = normalize(value);
        return normalized.isEmpty() ? null : normalized;
    }

    private String resolveUpdatedRemarks(String existingRemarks, String newRemarks) {
        String normalizedNewRemarks = normalizeOptional(newRemarks);

        if (normalizedNewRemarks == null) {
            return normalizeOptional(existingRemarks);
        }

        return normalizedNewRemarks;
    }

    private AssetStatusHistory createHistoryEntry(
            Asset asset,
            String oldStatus,
            String newStatus,
            String source,
            String details
    ) {
        return AssetStatusHistory.builder()
                .asset(asset)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changeSource(source)
                .details(normalizeOptional(details))
                .build();
    }

    private String buildAssignmentHistoryDetails(Asset asset) {
        String seatNumber = normalizeOptional(asset.getSeatNumber());
        return seatNumber == null
                ? "Assigned to %s in %s.".formatted(asset.getAssignedTo(), asset.getSection())
                : "Assigned to %s in %s at seat %s.".formatted(
                        asset.getAssignedTo(),
                        asset.getSection(),
                        seatNumber
                );
    }

    private String buildReassignmentHistoryDetails(
            String previousAssignedTo,
            String previousSection,
            String previousSeatNumber,
            Asset asset
    ) {
        String nextSeatNumber = normalizeOptional(asset.getSeatNumber());
        StringBuilder builder = new StringBuilder("Reassigned");

        if (previousAssignedTo != null) {
            builder.append(" from ").append(previousAssignedTo);
        }

        if (previousSection != null) {
            builder.append(" in ").append(previousSection);
        }

        if (previousSeatNumber != null) {
            builder.append(" at seat ").append(previousSeatNumber);
        }

        builder.append(" to ").append(asset.getAssignedTo()).append(" in ").append(asset.getSection());

        if (nextSeatNumber != null) {
            builder.append(" at seat ").append(nextSeatNumber);
        }

        builder.append(".");
        return builder.toString();
    }

    private String buildDamageHistoryDetails(Asset asset) {
        String description = normalizeOptional(asset.getDamageDescription());
        return description == null
                ? "Severity: %s.".formatted(asset.getDamageSeverity())
                : "Severity: %s. %s".formatted(asset.getDamageSeverity(), description);
    }

    private String buildExpiryHistoryDetails(Asset asset) {
        String reason = normalizeOptional(asset.getExpiryReason());
        return reason == null ? "Asset marked as expired." : "Reason: %s".formatted(reason);
    }

    private String buildReturnHistoryDetails(
            String condition,
            String assignedTo,
            String section,
            String seatNumber
    ) {
        StringBuilder builder = new StringBuilder("Condition: ").append(condition);

        if (assignedTo != null) {
            builder.append(". Returned from ").append(assignedTo);
        }

        if (section != null) {
            builder.append(" in ").append(section);
        }

        if (seatNumber != null) {
            builder.append(" at seat ").append(seatNumber);
        }

        builder.append(".");
        return builder.toString();
    }

    private String buildDeletionHistoryDetails(AssetDeletionLog deletionLog) {
        String reason = normalizeOptional(deletionLog.getReason());
        return reason == null
                ? "Deleted by %s.".formatted(deletionLog.getDeletedBy())
                : "Deleted by %s. Reason: %s".formatted(deletionLog.getDeletedBy(), reason);
    }

    private String buildRestoreHistoryDetails(Asset asset) {
        return "Restored and returned to Available status for %s.".formatted(asset.getAssetName());
    }

    private boolean requiresSeatNumber(String categoryName) {
        return SEAT_REQUIRED_CATEGORIES.contains(normalize(categoryName).toLowerCase(Locale.ROOT));
    }

    private EditableAssetDto toEditableAssetDto(Asset asset) {
        return EditableAssetDto.builder()
                .assetId(asset.getId())
                .assetDisplayId(buildAssetDisplayId(asset))
                .assetName(asset.getAssetName())
                .categoryId(asset.getCategory().getId())
                .categoryName(asset.getCategory().getName())
                .brand(asset.getBrand())
                .model(asset.getModel())
                .serialNumber(asset.getSerialNumber())
                .purchaseDate(asset.getPurchaseDate())
                .warrantyExpiryDate(asset.getWarrantyExpiryDate())
                .status(capitalize(asset.getStatus()))
                .assignedTo(asset.getAssignedTo())
                .remarks(asset.getRemarks())
                .build();
    }

    private String buildAssetDisplayId(Asset asset) {
        return AssetDisplayIdUtil.build(asset);
    }

    private String normalizeStatus(String value) {
        String normalizedStatus = normalize(value).toLowerCase(Locale.ROOT);

        if (!List.of(AVAILABLE_STATUS, ASSIGNED_STATUS, DAMAGED_STATUS, EXPIRED_STATUS).contains(normalizedStatus)) {
            throw new IllegalArgumentException("Status must be Available, Assigned, Damaged, or Expired.");
        }

        return normalizedStatus;
    }

    private String normalizeSeverity(String value) {
        String normalizedSeverity = normalize(value).toLowerCase(Locale.ROOT);

        if (!List.of("minor", "major").contains(normalizedSeverity)) {
            throw new IllegalArgumentException("Severity must be Minor or Major.");
        }

        return normalizedSeverity;
    }

    private String normalizeCondition(String value) {
        String normalizedCondition = normalize(value).toLowerCase();

        if (!GOOD_CONDITION.equals(normalizedCondition) && !DAMAGED_CONDITION.equals(normalizedCondition)) {
            throw new IllegalArgumentException("Condition at return must be Good or Damaged.");
        }

        return normalizedCondition;
    }

    private String capitalize(String value) {
        String normalized = normalize(value).toLowerCase();

        if (normalized.isEmpty()) {
            return normalized;
        }

        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }
}
