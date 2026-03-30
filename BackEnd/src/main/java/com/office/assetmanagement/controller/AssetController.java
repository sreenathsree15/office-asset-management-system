package com.office.assetmanagement.controller;

import com.office.assetmanagement.asset.dto.AssetBulkDto;
import com.office.assetmanagement.asset.dto.AssetSingleDto;
import com.office.assetmanagement.model.Asset;
import com.office.assetmanagement.service.AssetService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @PostMapping("/single")
    public ResponseEntity<Asset> createSingleAsset(@Valid @RequestBody AssetSingleDto assetSingleDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assetService.createSingleAsset(assetSingleDto));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Asset>> createBulkAssets(@Valid @RequestBody AssetBulkDto assetBulkDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assetService.createBulkAssets(assetBulkDto));
    }
}
