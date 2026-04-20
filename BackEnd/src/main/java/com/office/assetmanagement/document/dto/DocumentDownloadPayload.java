package com.office.assetmanagement.document.dto;

import org.springframework.core.io.Resource;

public record DocumentDownloadPayload(
        Resource resource,
        String fileName,
        String contentType
) {
}
