package com.office.assetmanagement.controller;

import com.office.assetmanagement.asset.dto.AssetBulkDto;
import com.office.assetmanagement.asset.dto.ActiveAssetDto;
import com.office.assetmanagement.asset.dto.AssetAssignDto;
import com.office.assetmanagement.asset.dto.AssetDamageDto;
import com.office.assetmanagement.asset.dto.AssetExpireDto;
import com.office.assetmanagement.asset.dto.AssetReturnDto;
import com.office.assetmanagement.asset.dto.AssetSummaryDto;
import com.office.assetmanagement.asset.dto.AvailableAssetDto;
import com.office.assetmanagement.asset.dto.EditableAssetDto;
import com.office.assetmanagement.asset.dto.AssignedAssetDto;
import com.office.assetmanagement.asset.dto.AssetSingleDto;
import com.office.assetmanagement.asset.dto.AssetUpdateDto;
import com.office.assetmanagement.asset.dto.SerialNumberAvailabilityDto;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.model.Asset;
import com.office.assetmanagement.service.AssetService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/editable")
    public ResponseEntity<List<EditableAssetDto>> listEditableAssets() {
        return ResponseEntity.ok(assetService.listEditableAssets());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ActiveAssetDto>> listActiveAssets() {
        return ResponseEntity.ok(assetService.listActiveAssets());
    }

    @GetMapping("/available")
    public ResponseEntity<List<AvailableAssetDto>> listAvailableAssets() {
        return ResponseEntity.ok(assetService.listAvailableAssets());
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<AssignedAssetDto>> listAssignedAssets() {
        return ResponseEntity.ok(assetService.listAssignedAssets());
    }

    @PostMapping("/assign")
    public ResponseEntity<BasicMessageResponse> assignAsset(@Valid @RequestBody AssetAssignDto assetAssignDto) {
        return ResponseEntity.ok(assetService.assignAsset(assetAssignDto));
    }

    @PostMapping("/damage")
    public ResponseEntity<BasicMessageResponse> damageAsset(@Valid @RequestBody AssetDamageDto assetDamageDto) {
        return ResponseEntity.ok(assetService.damageAsset(assetDamageDto));
    }

    @PutMapping("/{assetId}")
    public ResponseEntity<Asset> updateAsset(
            @PathVariable Long assetId,
            @Valid @RequestBody AssetUpdateDto assetUpdateDto
    ) {
        return ResponseEntity.ok(assetService.updateAsset(assetId, assetUpdateDto));
    }

    @GetMapping("/serial-availability")
    public ResponseEntity<SerialNumberAvailabilityDto> checkSerialNumberAvailability(
            @RequestParam String serialNumber,
            @RequestParam(required = false) Long excludeAssetId
    ) {
        return ResponseEntity.ok(assetService.checkSerialNumberAvailability(serialNumber, excludeAssetId));
    }

    @PostMapping("/expire")
    public ResponseEntity<BasicMessageResponse> expireAsset(@Valid @RequestBody AssetExpireDto assetExpireDto) {
        return ResponseEntity.ok(assetService.expireAsset(assetExpireDto));
    }

    @PostMapping("/return")
    public ResponseEntity<BasicMessageResponse> returnAsset(@Valid @RequestBody AssetReturnDto assetReturnDto) {
        return ResponseEntity.ok(assetService.returnAsset(assetReturnDto));
    }

    @GetMapping("/summary")
    public ResponseEntity<AssetSummaryDto> getAssetSummary() {
        return ResponseEntity.ok(assetService.getAssetSummary());
    }
}
