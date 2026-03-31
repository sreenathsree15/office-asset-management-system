package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.asset.dto.AssetBulkDto;
import com.office.assetmanagement.asset.dto.ActiveAssetDto;
import com.office.assetmanagement.asset.dto.AssetAssignDto;
import com.office.assetmanagement.asset.dto.AssetDamageDto;
import com.office.assetmanagement.asset.dto.AssetExpireDto;
import com.office.assetmanagement.asset.dto.AssetReturnDto;
import com.office.assetmanagement.asset.dto.AssetSummaryDto;
import com.office.assetmanagement.asset.dto.AvailableAssetDto;
import com.office.assetmanagement.asset.dto.EditableAssetDto;
import com.office.assetmanagement.asset.dto.AssignedAssetDto;
import com.office.assetmanagement.asset.dto.AssetSingleDto;
import com.office.assetmanagement.asset.dto.AssetUpdateDto;
import com.office.assetmanagement.asset.dto.SerialNumberAvailabilityDto;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.model.Asset;
import com.office.assetmanagement.model.AssetReturnRecord;
import com.office.assetmanagement.model.AssetStatusHistory;
import com.office.assetmanagement.model.Category;
import com.office.assetmanagement.repo.AssetRepository;
import com.office.assetmanagement.repo.AssetReturnRecordRepository;
import com.office.assetmanagement.repo.AssetStatusHistoryRepository;
import com.office.assetmanagement.repo.CategoryRepository;
import com.office.assetmanagement.service.AssetService;
import com.office.assetmanagement.util.SerialNumberGenerator;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Locale;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private static final String AVAILABLE_STATUS = "available";
    private static final String ASSIGNED_STATUS = "assigned";
    private static final String DAMAGED_STATUS = "damaged";
    private static final String EXPIRED_STATUS = "expired";
    private static final String EDIT_SOURCE = "EDIT_ASSET";
    private static final String GOOD_CONDITION = "good";
    private static final String DAMAGED_CONDITION = "damaged";
    private static final int MAX_SERIAL_GENERATION_ATTEMPTS = 10000;

    private final AssetRepository assetRepository;
    private final AssetReturnRecordRepository assetReturnRecordRepository;
    private final AssetStatusHistoryRepository assetStatusHistoryRepository;
    private final CategoryRepository categoryRepository;
    private final SerialNumberGenerator serialNumberGenerator;

    @Override
    @Transactional
    public Asset createSingleAsset(AssetSingleDto assetSingleDto) {
        String serialNumber = normalize(assetSingleDto.getSerialNumber());
        Category category = findCategory(assetSingleDto.getCategoryId());

        if (assetRepository.existsBySerialNumberIgnoreCase(serialNumber)) {
            throw new IllegalArgumentException("Serial number already exists.");
        }

        validateWarrantyDates(assetSingleDto.getPurchaseDate(), assetSingleDto.getWarrantyExpiryDate());

        Asset asset = buildAsset(
                assetSingleDto.getAssetName(),
                category,
                assetSingleDto.getBrand(),
                assetSingleDto.getModel(),
                serialNumber,
                assetSingleDto.getPurchaseDate(),
                assetSingleDto.getWarrantyExpiryDate(),
                assetSingleDto.getRemarks()
        );

        return assetRepository.save(asset);
    }

    @Override
    @Transactional
    public List<Asset> createBulkAssets(AssetBulkDto assetBulkDto) {
        Category category = findCategory(assetBulkDto.getCategoryId());
        validateWarrantyDates(assetBulkDto.getPurchaseDate(), assetBulkDto.getWarrantyExpiryDate());

        List<Asset> assetsToSave = new ArrayList<>(assetBulkDto.getQuantity());
        Set<String> generatedSerialNumbers = new HashSet<>();
        LocalDate serialReferenceDate = LocalDate.now();
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
                    assetBulkDto.getPurchaseDate(),
                    assetBulkDto.getWarrantyExpiryDate(),
                    assetBulkDto.getRemarks()
            ));
        }

        return assetRepository.saveAll(assetsToSave);
    }

    @Override
    public List<EditableAssetDto> listEditableAssets() {
        return assetRepository.findAllByOrderByUpdatedAtDesc()
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
                        .dateOfIssue(asset.getDateOfIssue())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public Asset updateAsset(Long assetId, AssetUpdateDto assetUpdateDto) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Selected asset does not exist."));
        Category category = findCategory(assetUpdateDto.getCategoryId());
        String serialNumber = normalize(assetUpdateDto.getSerialNumber());

        validateWarrantyDates(assetUpdateDto.getPurchaseDate(), assetUpdateDto.getWarrantyExpiryDate());

        if (assetRepository.existsBySerialNumberIgnoreCaseAndIdNot(serialNumber, assetId)) {
            throw new IllegalArgumentException("Serial number already exists.");
        }

        String previousStatus = normalizeStatus(asset.getStatus());
        String updatedStatus = normalizeStatus(assetUpdateDto.getStatus());

        if (ASSIGNED_STATUS.equals(updatedStatus) && !ASSIGNED_STATUS.equals(previousStatus)) {
            throw new IllegalArgumentException("Use Assign Asset to move an asset into Assigned status.");
        }

        asset.setAssetName(normalize(assetUpdateDto.getAssetName()));
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
        }

        if (!ASSIGNED_STATUS.equals(updatedStatus)) {
            asset.setAssignedTo(null);
            asset.setSection(null);
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
            assetStatusHistoryRepository.save(AssetStatusHistory.builder()
                    .asset(savedAsset)
                    .oldStatus(capitalize(previousStatus))
                    .newStatus(capitalize(updatedStatus))
                    .changeSource(EDIT_SOURCE)
                    .build());
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

        asset.setStatus(ASSIGNED_STATUS);
        asset.setAssignedTo(normalize(assetAssignDto.getAssignedTo()));
        asset.setSection(normalize(assetAssignDto.getSection()));
        asset.setDateOfIssue(assetAssignDto.getDateOfIssue());
        asset.setRemarks(resolveUpdatedRemarks(asset.getRemarks(), assetAssignDto.getRemarks()));

        assetRepository.save(asset);

        return BasicMessageResponse.builder()
                .message("Asset assigned successfully.")
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

        asset.setStatus(DAMAGED_STATUS);
        asset.setDamageDate(assetDamageDto.getDamageDate());
        asset.setDamageDescription(normalize(assetDamageDto.getDamageDescription()));
        asset.setDamageSeverity(capitalize(normalizedSeverity));
        asset.setRemarks(resolveUpdatedRemarks(asset.getRemarks(), assetDamageDto.getRemarks()));
        asset.setAssignedTo(null);
        asset.setSection(null);
        asset.setDateOfIssue(null);

        assetRepository.save(asset);

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

        asset.setStatus(EXPIRED_STATUS);
        asset.setExpiryDate(assetExpireDto.getExpiryDate());
        asset.setExpiryReason(normalizeOptional(assetExpireDto.getReason()));
        asset.setRemarks(resolveUpdatedRemarks(asset.getRemarks(), assetExpireDto.getRemarks()));

        assetRepository.save(asset);

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

        AssetReturnRecord assetReturnRecord = AssetReturnRecord.builder()
                .asset(asset)
                .assignedTo(normalizeOptional(asset.getAssignedTo()))
                .section(normalizeOptional(asset.getSection()))
                .dateOfIssue(asset.getDateOfIssue())
                .returnDate(returnDate)
                .conditionAtReturn(capitalize(normalizedCondition))
                .remarks(normalizeOptional(assetReturnDto.getRemarks()))
                .build();

        asset.setStatus(updatedStatus);
        asset.setAssignedTo(null);
        asset.setSection(null);
        asset.setDateOfIssue(null);

        assetRepository.save(asset);
        assetReturnRecordRepository.save(assetReturnRecord);

        return BasicMessageResponse.builder()
                .message("Asset returned successfully. Status updated to %s.".formatted(capitalize(updatedStatus)))
                .build();
    }

    @Override
    public AssetSummaryDto getAssetSummary() {
        return AssetSummaryDto.builder()
                .totalAssets(assetRepository.count())
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
        if (warrantyExpiryDate.isBefore(purchaseDate)) {
            throw new IllegalArgumentException("Warranty expiry date cannot be before purchase date.");
        }
    }

    private Asset buildAsset(
            String assetName,
            Category category,
            String brand,
            String model,
            String serialNumber,
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
                .purchaseDate(purchaseDate)
                .warrantyExpiryDate(warrantyExpiryDate)
                .status(AVAILABLE_STATUS)
                .remarks(normalizeOptional(remarks))
                .build();
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
        String prefix = switch (normalize(asset.getCategory().getName()).toLowerCase(Locale.ROOT)) {
            case "laptop" -> "LT";
            case "desktop" -> "DT";
            case "printer" -> "PR";
            case "ups" -> "UP";
            case "photocopier" -> "PC";
            case "plotter" -> "PL";
            default -> "AS";
        };

        return "%s%03d".formatted(prefix, asset.getId());
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
