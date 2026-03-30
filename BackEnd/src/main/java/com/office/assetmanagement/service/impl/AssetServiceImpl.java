package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.asset.dto.AssetBulkDto;
import com.office.assetmanagement.asset.dto.AssetSingleDto;
import com.office.assetmanagement.model.Asset;
import com.office.assetmanagement.model.Category;
import com.office.assetmanagement.repo.AssetRepository;
import com.office.assetmanagement.repo.CategoryRepository;
import com.office.assetmanagement.service.AssetService;
import com.office.assetmanagement.util.SerialNumberGenerator;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private static final String AVAILABLE_STATUS = "available";
    private static final int MAX_SERIAL_GENERATION_ATTEMPTS = 10000;

    private final AssetRepository assetRepository;
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
}
