package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.SeatNumber;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatNumberRepository extends JpaRepository<SeatNumber, Long> {

    List<SeatNumber> findAllByOrderBySectionSectionNameAscSeatNumberAsc();

    boolean existsBySeatNumberIgnoreCase(String seatNumber);

    boolean existsBySeatNumberIgnoreCaseAndIdNot(String seatNumber, Long id);

    boolean existsBySectionIdAndSeatNumberIgnoreCase(Long sectionId, String seatNumber);

    boolean existsBySectionId(Long sectionId);

    Optional<SeatNumber> findBySeatNumberIgnoreCase(String seatNumber);
}
