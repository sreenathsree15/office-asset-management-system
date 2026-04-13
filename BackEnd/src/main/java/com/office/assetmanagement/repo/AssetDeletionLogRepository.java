package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.AssetDeletionLog;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetDeletionLogRepository extends JpaRepository<AssetDeletionLog, Long> {

    List<AssetDeletionLog> findAllByRestoredAtIsNullOrderByDeletionDateDesc();

    Optional<AssetDeletionLog> findFirstByAsset_IdAndRestoredAtIsNullOrderByDeletionDateDesc(Long assetId);
}
