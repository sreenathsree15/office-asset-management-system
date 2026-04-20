package com.office.assetmanagement.document.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDocumentDto {

    private Long docId;

    private Long assetId;

    private String assetDisplayId;

    private String assetName;

    private String fileName;

    private String fileType;

    private String documentType;

    private LocalDateTime uploadDate;

    private String description;

    private String batchId;

    private Long fileSize;

    private String downloadUrl;
}
