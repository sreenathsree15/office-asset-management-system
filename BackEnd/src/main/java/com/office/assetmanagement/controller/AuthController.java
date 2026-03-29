package com.office.assetmanagement.controller;

import com.office.assetmanagement.dto.AuthResponse;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.dto.ForgotPasswordOtpRequest;
import com.office.assetmanagement.dto.LoginRequest;
import com.office.assetmanagement.dto.ResetPasswordRequest;
import com.office.assetmanagement.dto.VerifyOtpRequest;
import com.office.assetmanagement.dto.UserProfileResponse;
import com.office.assetmanagement.service.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserAdminService userAdminService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(userAdminService.authenticate(loginRequest));
    }

    @PostMapping("/forgot-password/request-otp")
    public ResponseEntity<BasicMessageResponse> requestOtp(
            @RequestBody ForgotPasswordOtpRequest forgotPasswordOtpRequest
    ) {
        return ResponseEntity.ok(userAdminService.sendPasswordResetOtp(forgotPasswordOtpRequest));
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<BasicMessageResponse> verifyOtp(@RequestBody VerifyOtpRequest verifyOtpRequest) {
        return ResponseEntity.ok(userAdminService.verifyPasswordResetOtp(verifyOtpRequest));
    }

    @PostMapping("/forgot-password/reset-password")
    public ResponseEntity<BasicMessageResponse> resetPassword(
            @RequestBody ResetPasswordRequest resetPasswordRequest
    ) {
        return ResponseEntity.ok(userAdminService.resetPassword(resetPasswordRequest));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> currentUser(Authentication authentication) {
        return ResponseEntity.ok(userAdminService.getCurrentUser(authentication.getName()));
    }
}
