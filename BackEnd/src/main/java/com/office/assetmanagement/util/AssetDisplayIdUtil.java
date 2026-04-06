package com.office.assetmanagement.util;

import com.office.assetmanagement.model.Asset;
import java.util.Locale;

public final class AssetDisplayIdUtil {

    private AssetDisplayIdUtil() {
    }

    public static String build(Asset asset) {
        String prefix = switch (normalize(asset.getCategory().getName())) {
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

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
