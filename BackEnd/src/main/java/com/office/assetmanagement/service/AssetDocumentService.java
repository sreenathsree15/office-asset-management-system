package com.office.assetmanagement.service;

import com.office.assetmanagement.document.dto.AssetDocumentDto;
import com.office.assetmanagement.document.dto.DocumentArchivePayload;
import com.office.assetmanagement.document.dto.DocumentDownloadPayload;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface AssetDocumentService {

    List<AssetDocumentDto> listDocumentsByAsset(Long assetId);

    AssetDocumentDto uploadDocument(
            Long assetId,
            MultipartFile file,
            String documentType,
            String description
    );

    List<AssetDocumentDto> uploadSharedDocument(
            List<Long> assetIds,
            MultipartFile file,
            String documentType,
            String description,
            String batchId
    );

    DocumentDownloadPayload downloadDocument(Long documentId);

    DocumentArchivePayload downloadDocumentsArchive(Long assetId);
}
