package com.office.assetmanagement.service;

import com.office.assetmanagement.dto.AuthResponse;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.dto.ForgotPasswordOtpRequest;
import com.office.assetmanagement.dto.LoginRequest;
import com.office.assetmanagement.dto.ResetPasswordRequest;
import com.office.assetmanagement.dto.VerifyOtpRequest;
import com.office.assetmanagement.dto.UserProfileResponse;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface UserAdminService extends UserDetailsService {

    AuthResponse authenticate(LoginRequest loginRequest);

    UserProfileResponse getCurrentUser(String username);

    BasicMessageResponse sendPasswordResetOtp(ForgotPasswordOtpRequest forgotPasswordOtpRequest);

    BasicMessageResponse verifyPasswordResetOtp(VerifyOtpRequest verifyOtpRequest);

    BasicMessageResponse resetPassword(ResetPasswordRequest resetPasswordRequest);

    void migrateLegacyPasswords();
}
