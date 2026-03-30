package com.office.assetmanagement.util;

import com.office.assetmanagement.model.Category;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class SerialNumberGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    public String generate(Category category, LocalDate referenceDate, long sequence) {
        LocalDate effectiveDate = referenceDate == null ? LocalDate.now() : referenceDate;
        return "%s-%s-%05d".formatted(
                toCategoryPrefix(category == null ? null : category.getName()),
                DATE_FORMATTER.format(effectiveDate),
                sequence
        );
    }

    private String toCategoryPrefix(String categoryName) {
        String normalized = categoryName == null
                ? ""
                : categoryName.replaceAll("[^A-Za-z0-9 ]", " ").trim();

        if (!StringUtils.hasText(normalized)) {
            return "AS";
        }

        String[] parts = normalized.split("\\s+");

        if (parts.length > 1) {
            StringBuilder prefixBuilder = new StringBuilder();

            for (String part : parts) {
                if (StringUtils.hasText(part)) {
                    prefixBuilder.append(part.substring(0, 1).toUpperCase(Locale.ROOT));
                }

                if (prefixBuilder.length() == 3) {
                    break;
                }
            }

            if (prefixBuilder.length() >= 2) {
                return prefixBuilder.toString();
            }
        }

        String collapsed = normalized.replace(" ", "").toUpperCase(Locale.ROOT);

        if (collapsed.length() <= 3) {
            return collapsed;
        }

        return collapsed.substring(0, 2);
    }
}
