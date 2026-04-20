package com.office.assetmanagement.controller;

import com.office.assetmanagement.document.dto.AssetDocumentDto;
import com.office.assetmanagement.document.dto.DocumentArchivePayload;
import com.office.assetmanagement.document.dto.DocumentDownloadPayload;
import com.office.assetmanagement.service.AssetDocumentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetDocumentController {

    private final AssetDocumentService assetDocumentService;

    @GetMapping("/{assetId}/documents")
    public ResponseEntity<List<AssetDocumentDto>> listDocuments(@PathVariable Long assetId) {
        return ResponseEntity.ok(assetDocumentService.listDocumentsByAsset(assetId));
    }

    @PostMapping(value = "/{assetId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssetDocumentDto> uploadDocument(
            @PathVariable Long assetId,
            @RequestPart("file") MultipartFile file,
            @RequestParam String documentType,
            @RequestParam(required = false) String description
    ) {
        return ResponseEntity.ok(assetDocumentService.uploadDocument(assetId, file, documentType, description));
    }

    @PostMapping(value = "/documents/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<AssetDocumentDto>> uploadSharedDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam List<Long> assetIds,
            @RequestParam String documentType,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String batchId
    ) {
        return ResponseEntity.ok(
                assetDocumentService.uploadSharedDocument(assetIds, file, documentType, description, batchId)
        );
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) {
        DocumentDownloadPayload payload = assetDocumentService.downloadDocument(documentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(payload.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.fileName() + "\"")
                .body(payload.resource());
    }

    @GetMapping("/{assetId}/documents/archive")
    public ResponseEntity<byte[]> downloadDocumentsArchive(@PathVariable Long assetId) {
        DocumentArchivePayload payload = assetDocumentService.downloadDocumentsArchive(assetId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(payload.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.fileName() + "\"")
                .body(payload.content());
    }
}
