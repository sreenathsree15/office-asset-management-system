package com.office.assetmanagement.service;

import com.office.assetmanagement.asset.dto.AssetBulkDto;
import com.office.assetmanagement.asset.dto.ActiveAssetDto;
import com.office.assetmanagement.asset.dto.AssetAssignDto;
import com.office.assetmanagement.asset.dto.AssetDamageDto;
import com.office.assetmanagement.asset.dto.AssetExpireDto;
import com.office.assetmanagement.asset.dto.AssetDeleteDto;
import com.office.assetmanagement.asset.dto.AssetReassignDto;
import com.office.assetmanagement.asset.dto.AssetReturnDto;
import com.office.assetmanagement.asset.dto.AssetRestoreDto;
import com.office.assetmanagement.asset.dto.AssetSummaryDto;
import com.office.assetmanagement.asset.dto.AvailableAssetDto;
import com.office.assetmanagement.asset.dto.DeletableAssetDto;
import com.office.assetmanagement.asset.dto.EditableAssetDto;
import com.office.assetmanagement.asset.dto.AssignedAssetDto;
import com.office.assetmanagement.asset.dto.AssetSingleDto;
import com.office.assetmanagement.asset.dto.AssetUpdateDto;
import com.office.assetmanagement.asset.dto.SerialNumberAvailabilityDto;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.model.Asset;
import java.util.List;

public interface AssetService {

    Asset createSingleAsset(AssetSingleDto assetSingleDto);

    List<Asset> createBulkAssets(AssetBulkDto assetBulkDto);

    List<EditableAssetDto> listEditableAssets();

    List<ActiveAssetDto> listActiveAssets();

    List<AvailableAssetDto> listAvailableAssets();

    List<AssignedAssetDto> listAssignedAssets();

    List<DeletableAssetDto> listDeletableAssets();

    Asset updateAsset(Long assetId, AssetUpdateDto assetUpdateDto);

    SerialNumberAvailabilityDto checkSerialNumberAvailability(String serialNumber, Long excludeAssetId);

    BasicMessageResponse assignAsset(AssetAssignDto assetAssignDto);

    BasicMessageResponse reassignAsset(AssetReassignDto assetReassignDto);

    BasicMessageResponse damageAsset(AssetDamageDto assetDamageDto);

    BasicMessageResponse expireAsset(AssetExpireDto assetExpireDto);

    BasicMessageResponse returnAsset(AssetReturnDto assetReturnDto);

    BasicMessageResponse deleteAsset(AssetDeleteDto assetDeleteDto);

    BasicMessageResponse restoreAsset(AssetRestoreDto assetRestoreDto);

    AssetSummaryDto getAssetSummary();
}
