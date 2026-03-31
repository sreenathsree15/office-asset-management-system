package com.office.assetmanagement.bootstrap;

import com.office.assetmanagement.model.Category;
import com.office.assetmanagement.repo.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
public class CategoryBootstrap implements CommandLineRunner {

    private static final List<String> DEFAULT_CATEGORIES = List.of(
            "Laptop",
            "Desktop",
            "UPS",
            "Printer",
            "Photocopier",
            "Plotter"
    );

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        for (String categoryName : DEFAULT_CATEGORIES) {
            categoryRepository.findByNameIgnoreCase(categoryName)
                    .orElseGet(() -> categoryRepository.save(Category.builder().name(categoryName).build()));
        }
    }
}
