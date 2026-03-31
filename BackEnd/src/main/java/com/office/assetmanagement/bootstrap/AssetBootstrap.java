package com.office.assetmanagement.bootstrap;

import com.office.assetmanagement.model.Asset;
import com.office.assetmanagement.model.Category;
import com.office.assetmanagement.repo.AssetRepository;
import com.office.assetmanagement.repo.CategoryRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
public class AssetBootstrap implements CommandLineRunner {

    private final AssetRepository assetRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (assetRepository.count() > 0) {
            return;
        }

        Category laptop = findCategory("Laptop");
        Category desktop = findCategory("Desktop");
        Category printer = findCategory("Printer");
        Category ups = findCategory("UPS");
        Category photocopier = findCategory("Photocopier");
        Category plotter = findCategory("Plotter");

        List<Asset> sampleAssets = List.of(
                buildAsset("Dell Latitude 5420", laptop, "Dell", "Latitude 5420", "LT-SAMPLE-0001",
                        "available", LocalDate.of(2025, 1, 10), LocalDate.of(2028, 1, 10), null, null, null, null, null, null, null),
                buildAsset("HP ProBook 440", laptop, "HP", "ProBook 440 G9", "LT-SAMPLE-0002",
                        "assigned", LocalDate.of(2025, 2, 5), LocalDate.of(2028, 2, 5), "Akhil", "IT", LocalDate.of(2026, 3, 15), null, null, null, null),
                buildAsset("Lenovo ThinkCentre M70", desktop, "Lenovo", "ThinkCentre M70", "DT-SAMPLE-0001",
                        "available", LocalDate.of(2024, 11, 18), LocalDate.of(2027, 11, 18), null, null, null, null, "Workstation asset", null, null),
                buildAsset("Canon LBP2900", printer, "Canon", "LBP2900", "PR-SAMPLE-0001",
                        "damaged", LocalDate.of(2024, 8, 21), LocalDate.of(2027, 8, 21), null, null, null, null, "Paper feed issue", LocalDate.of(2026, 1, 9), "Major"),
                buildAsset("APC Back-UPS 1100", ups, "APC", "BX1100C", "UP-SAMPLE-0001",
                        "available", LocalDate.of(2025, 4, 2), LocalDate.of(2028, 4, 2), null, null, null, null, null, null, null),
                buildAsset("Ricoh IM 2702", photocopier, "Ricoh", "IM 2702", "PC-SAMPLE-0001",
                        "expired", LocalDate.of(2022, 6, 12), LocalDate.of(2025, 6, 12), null, null, null, LocalDate.of(2026, 2, 18), "Warranty expired", null, null),
                buildAsset("HP DesignJet T250", plotter, "HP", "DesignJet T250", "PL-SAMPLE-0001",
                        "available", LocalDate.of(2025, 6, 30), LocalDate.of(2028, 6, 30), null, null, null, null, "Planning section", null, null)
        );

        assetRepository.saveAll(sampleAssets);
    }

    private Category findCategory(String categoryName) {
        return categoryRepository.findByNameIgnoreCase(categoryName)
                .orElseThrow(() -> new IllegalStateException("Category not found: " + categoryName));
    }

    private Asset buildAsset(
            String assetName,
            Category category,
            String brand,
            String model,
            String serialNumber,
            String status,
            LocalDate purchaseDate,
            LocalDate warrantyExpiryDate,
            String assignedTo,
            String section,
            LocalDate dateOfIssue,
            LocalDate expiryDate,
            String remarks,
            LocalDate damageDate,
            String damageSeverity
    ) {
        Asset asset = Asset.builder()
                .assetName(assetName)
                .category(category)
                .brand(brand)
                .model(model)
                .serialNumber(serialNumber)
                .purchaseDate(purchaseDate)
                .warrantyExpiryDate(warrantyExpiryDate)
                .status(status)
                .assignedTo(assignedTo)
                .section(section)
                .dateOfIssue(dateOfIssue)
                .expiryDate(expiryDate)
                .damageDate(damageDate)
                .damageSeverity(damageSeverity)
                .remarks(remarks)
                .build();

        if (expiryDate != null) {
            asset.setExpiryReason("Seeded sample asset");
        }

        if (damageDate != null) {
            asset.setDamageDescription("Seeded damaged asset");
        }

        return asset;
    }
}
