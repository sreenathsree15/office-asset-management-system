package com.office.assetmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatNumberResponseDto {

    private Long id;

    private String seatNumber;

    private Long sectionId;

    private String sectionName;

    private String description;
}
