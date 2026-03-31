package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.AssetStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetStatusHistoryRepository extends JpaRepository<AssetStatusHistory, Long> {
}
