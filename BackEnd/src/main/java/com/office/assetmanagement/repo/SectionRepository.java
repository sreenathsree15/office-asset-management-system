package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.Section;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, Long> {

    List<Section> findAllByOrderBySectionNameAsc();

    boolean existsBySectionNameIgnoreCase(String sectionName);

    Optional<Section> findBySectionNameIgnoreCase(String sectionName);
}
