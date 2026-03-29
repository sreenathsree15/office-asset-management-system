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
public class ResetPasswordRequest {

    private String username;

    private String otp;

    private String newPassword;

    private String confirmPassword;
}
