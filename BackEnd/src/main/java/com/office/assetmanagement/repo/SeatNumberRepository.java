package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.SeatNumber;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatNumberRepository extends JpaRepository<SeatNumber, Long> {

    boolean existsBySectionIdAndSeatNumberIgnoreCase(Long sectionId, String seatNumber);
}
