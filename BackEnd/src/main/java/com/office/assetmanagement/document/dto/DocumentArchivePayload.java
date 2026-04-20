package com.office.assetmanagement.document.dto;

public record DocumentArchivePayload(
        byte[] content,
        String fileName,
        String contentType
) {
}
