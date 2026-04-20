package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.document.dto.AssetDocumentDto;
import com.office.assetmanagement.document.dto.DocumentArchivePayload;
import com.office.assetmanagement.document.dto.DocumentDownloadPayload;
import com.office.assetmanagement.model.Asset;
import com.office.assetmanagement.model.AssetDocument;
import com.office.assetmanagement.repo.AssetDocumentRepository;
import com.office.assetmanagement.repo.AssetRepository;
import com.office.assetmanagement.service.AssetDocumentService;
import com.office.assetmanagement.util.AssetDisplayIdUtil;
import jakarta.transaction.Transactional;
import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AssetDocumentServiceImpl implements AssetDocumentService {

    private static final String DELETED_STATUS = "deleted";
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    private final AssetRepository assetRepository;
    private final AssetDocumentRepository assetDocumentRepository;

    @Value("${app.uploads.dir:uploads}")
    private String uploadDirectory;

    private Path uploadsRoot;

    @PostConstruct
    void initializeUploadsDirectory() {
        try {
            uploadsRoot = Paths.get(uploadDirectory).toAbsolutePath().normalize();
            Files.createDirectories(uploadsRoot);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to initialize uploads directory.", exception);
        }
    }

    @Override
    public List<AssetDocumentDto> listDocumentsByAsset(Long assetId) {
        Asset asset = findAsset(assetId);

        return assetDocumentRepository.findAllByAssetIdOrderByUploadDateDesc(asset.getId())
                .stream()
                .map(this::toDocumentDto)
                .toList();
    }

    @Override
    @Transactional
    public AssetDocumentDto uploadDocument(
            Long assetId,
            MultipartFile file,
            String documentType,
            String description
    ) {
        Asset asset = findAsset(assetId);
        validateFile(file);

        String storedPath = storeFile(file, asset.getId());
        AssetDocument document = AssetDocument.builder()
                .asset(asset)
                .fileName(resolveOriginalFileName(file))
                .filePath(storedPath)
                .fileType(resolveContentType(file))
                .documentType(normalizeOptional(documentType))
                .description(normalizeOptional(description))
                .fileSize(file.getSize())
                .build();

        AssetDocument savedDocument = assetDocumentRepository.save(document);
        return toDocumentDto(savedDocument);
    }

    @Override
    @Transactional
    public List<AssetDocumentDto> uploadSharedDocument(
            List<Long> assetIds,
            MultipartFile file,
            String documentType,
            String description,
            String batchId
    ) {
        if (assetIds == null || assetIds.isEmpty()) {
            throw new IllegalArgumentException("Select at least one asset for bulk document upload.");
        }

        validateFile(file);

        List<Asset> assets = assetRepository.findAllById(assetIds);
        if (assets.size() != assetIds.size()) {
            throw new IllegalArgumentException("One or more selected assets do not exist.");
        }

        for (Asset asset : assets) {
            if (DELETED_STATUS.equals(normalize(asset.getStatus()))) {
                throw new IllegalArgumentException("Deleted assets cannot receive uploaded documents.");
            }
        }

        String resolvedBatchId = normalizeOptional(batchId);
        if (resolvedBatchId == null) {
            resolvedBatchId = UUID.randomUUID().toString();
        }

        String storedPath = storeFile(file, null);
        List<AssetDocument> documents = new ArrayList<>(assets.size());

        for (Asset asset : assets) {
            documents.add(AssetDocument.builder()
                    .asset(asset)
                    .fileName(resolveOriginalFileName(file))
                    .filePath(storedPath)
                    .fileType(resolveContentType(file))
                    .documentType(normalizeOptional(documentType))
                    .description(normalizeOptional(description))
                    .batchId(resolvedBatchId)
                    .fileSize(file.getSize())
                    .uploadDate(LocalDateTime.now())
                    .build());
        }

        return assetDocumentRepository.saveAll(documents)
                .stream()
                .map(this::toDocumentDto)
                .toList();
    }

    @Override
    public DocumentDownloadPayload downloadDocument(Long documentId) {
        AssetDocument document = assetDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Requested document does not exist."));

        Path filePath = resolveStoredPath(document.getFilePath());
        Resource resource = toResource(filePath);

        return new DocumentDownloadPayload(
                resource,
                document.getFileName(),
                document.getFileType()
        );
    }

    @Override
    public DocumentArchivePayload downloadDocumentsArchive(Long assetId) {
        Asset asset = findAsset(assetId);
        List<AssetDocument> documents = assetDocumentRepository.findAllByAssetIdOrderByUploadDateDesc(asset.getId());

        if (documents.isEmpty()) {
            throw new IllegalArgumentException("No documents are available for the selected asset.");
        }

        try (ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
             ZipOutputStream zipStream = new ZipOutputStream(byteStream)) {

            for (AssetDocument document : documents) {
                Path filePath = resolveStoredPath(document.getFilePath());
                if (!Files.exists(filePath)) {
                    continue;
                }

                zipStream.putNextEntry(new ZipEntry(buildArchiveEntryName(document)));
                try (InputStream inputStream = Files.newInputStream(filePath)) {
                    inputStream.transferTo(zipStream);
                }
                zipStream.closeEntry();
            }

            zipStream.finish();

            return new DocumentArchivePayload(
                    byteStream.toByteArray(),
                    "%s-documents.zip".formatted(AssetDisplayIdUtil.build(asset)),
                    "application/zip"
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to create document archive.", exception);
        }
    }

    private Asset findAsset(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Selected asset does not exist."));

        if (DELETED_STATUS.equals(normalize(asset.getStatus()))) {
            throw new IllegalArgumentException("Deleted assets are not available for document upload.");
        }

        return asset;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Select a file to upload.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds 5MB. Upload a smaller file.");
        }

        String contentType = resolveContentType(file);
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only PDF, JPG, and PNG files are supported.");
        }
    }

    private String storeFile(MultipartFile file, Long assetId) {
        String originalFileName = resolveOriginalFileName(file);
        String extension = resolveFileExtension(originalFileName);
        String storedFileName = "%s%s".formatted(UUID.randomUUID(), extension);
        Path targetDirectory = assetId == null
                ? uploadsRoot.resolve("shared")
                : uploadsRoot.resolve("asset-%s".formatted(assetId));

        try {
            Files.createDirectories(targetDirectory);
            Path targetFile = targetDirectory.resolve(storedFileName).normalize();
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            return uploadsRoot.relativize(targetFile).toString().replace('\\', '/');
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to store the uploaded file.", exception);
        }
    }

    private Path resolveStoredPath(String storedRelativePath) {
        return uploadsRoot.resolve(storedRelativePath).normalize();
    }

    private Resource toResource(Path path) {
        try {
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) {
                throw new IllegalArgumentException("Requested file does not exist on the server.");
            }

            return resource;
        } catch (MalformedURLException exception) {
            throw new IllegalStateException("Unable to resolve the requested file.", exception);
        }
    }

    private String buildArchiveEntryName(AssetDocument document) {
        String typePrefix = normalizeOptional(document.getDocumentType());
        String safeFileName = sanitizeArchiveSegment(document.getFileName());
        return typePrefix == null
                ? safeFileName
                : "%s-%s".formatted(sanitizeArchiveSegment(typePrefix), safeFileName);
    }

    private String sanitizeArchiveSegment(String value) {
        return value.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private AssetDocumentDto toDocumentDto(AssetDocument document) {
        Asset asset = document.getAsset();

        return AssetDocumentDto.builder()
                .docId(document.getId())
                .assetId(asset.getId())
                .assetDisplayId(AssetDisplayIdUtil.build(asset))
                .assetName(asset.getAssetName())
                .fileName(document.getFileName())
                .fileType(document.getFileType())
                .documentType(document.getDocumentType())
                .uploadDate(document.getUploadDate())
                .description(document.getDescription())
                .batchId(document.getBatchId())
                .fileSize(document.getFileSize())
                .downloadUrl("/api/assets/documents/%s/download".formatted(document.getId()))
                .build();
    }

    private String resolveOriginalFileName(MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "document" : file.getOriginalFilename());
        return originalFileName.replaceAll("[\\r\\n]", "_");
    }

    private String resolveFileExtension(String fileName) {
        int extensionIndex = fileName.lastIndexOf('.');
        return extensionIndex >= 0 ? fileName.substring(extensionIndex) : "";
    }

    private String resolveContentType(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        String normalized = value == null ? "" : value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
