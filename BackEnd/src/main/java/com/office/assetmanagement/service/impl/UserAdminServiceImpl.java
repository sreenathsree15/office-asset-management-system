package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.config.JwtService;
import com.office.assetmanagement.dto.AuthResponse;
import com.office.assetmanagement.dto.BasicMessageResponse;
import com.office.assetmanagement.dto.ForgotPasswordOtpRequest;
import com.office.assetmanagement.dto.LoginRequest;
import com.office.assetmanagement.dto.ResetPasswordRequest;
import com.office.assetmanagement.dto.UserProfileResponse;
import com.office.assetmanagement.dto.VerifyOtpRequest;
import com.office.assetmanagement.model.UserAdmin;
import com.office.assetmanagement.repo.UserAdminRepository;
import com.office.assetmanagement.service.MailService;
import com.office.assetmanagement.service.UserAdminService;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.security.SecureRandom;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserAdminServiceImpl implements UserAdminService {

    private static final String ACTIVE_STATUS = "N";
    private static final String ADMIN_ROLE = "ADMIN";
    private static final String OTP_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final Pattern BCRYPT_PATTERN = Pattern.compile("^\\$2[aby]\\$.{56}$");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserAdminRepository userAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;

    @Value("${app.reset.otp.length}")
    private int otpLength;

    @Value("${app.mail.reset-to:}")
    private String resetRecipientEmail;

    @Override
    public UserDetails loadUserByUsername(String username) {
        UserAdmin userAdmin = findActiveUserByUsername(normalize(username));
        return toUserDetails(userAdmin);
    }

    @Override
    @Transactional
    public AuthResponse authenticate(LoginRequest loginRequest) {
        String username = normalize(loginRequest.getUsername());
        String rawPassword = loginRequest.getPassword();

        if (!StringUtils.hasText(username) || !StringUtils.hasText(rawPassword)) {
            throw new BadCredentialsException("Username and password are required.");
        }

        UserAdmin userAdmin = findActiveUserByUsername(username);

        if (!passwordMatches(rawPassword, userAdmin)) {
            throw new BadCredentialsException("Invalid Password");
        }

        String token = jwtService.generateToken(toUserDetails(userAdmin));

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(userAdmin.getUsername())
                .role(ADMIN_ROLE)
                .build();
    }

    @Override
    public UserProfileResponse getCurrentUser(String username) {
        UserAdmin userAdmin = findActiveUserByUsername(normalize(username));

        return UserProfileResponse.builder()
                .username(userAdmin.getUsername())
                .role(ADMIN_ROLE)
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse sendPasswordResetOtp(ForgotPasswordOtpRequest forgotPasswordOtpRequest) {
        String username = normalize(forgotPasswordOtpRequest.getUsername());
        String email = normalize(resetRecipientEmail);

        if (!StringUtils.hasText(username)) {
            throw new IllegalArgumentException("Username is required.");
        }

        if (!StringUtils.hasText(email)) {
            throw new IllegalStateException("Password reset recipient email is not configured.");
        }

        UserAdmin userAdmin = findActiveUserByUsername(username);
        String otp = generateOtp();

        userAdmin.setOtp(otp);
        userAdminRepository.save(userAdmin);

        try {
            mailService.sendOtpMail(email, userAdmin.getUsername(), otp);
        } catch (IllegalStateException exception) {
            clearOtp(userAdmin);
            throw exception;
        } catch (RuntimeException exception) {
            clearOtp(userAdmin);
            throw new IllegalStateException("Unable to send OTP email. Check SMTP settings and try again.");
        }

        return BasicMessageResponse.builder()
                .message("OTP sent successfully to the configured administrator email.")
                .build();
    }

    @Override
    public BasicMessageResponse verifyPasswordResetOtp(VerifyOtpRequest verifyOtpRequest) {
        String username = normalize(verifyOtpRequest.getUsername());
        String otp = normalizeOtp(verifyOtpRequest.getOtp());

        if (!StringUtils.hasText(username) || !StringUtils.hasText(otp)) {
            throw new IllegalArgumentException("Username and OTP are required.");
        }

        UserAdmin userAdmin = findActiveUserByUsername(username);

        if (!otpMatches(userAdmin, otp)) {
            throw new IllegalArgumentException("Invalid OTP.");
        }

        return BasicMessageResponse.builder()
                .message("OTP verified successfully.")
                .build();
    }

    @Override
    @Transactional
    public BasicMessageResponse resetPassword(ResetPasswordRequest resetPasswordRequest) {
        String username = normalize(resetPasswordRequest.getUsername());
        String otp = normalizeOtp(resetPasswordRequest.getOtp());
        String newPassword = resetPasswordRequest.getNewPassword();
        String confirmPassword = resetPasswordRequest.getConfirmPassword();

        if (!StringUtils.hasText(username) || !StringUtils.hasText(otp)) {
            throw new IllegalArgumentException("Username and OTP are required.");
        }

        if (!StringUtils.hasText(newPassword) || !StringUtils.hasText(confirmPassword)) {
            throw new IllegalArgumentException("New password and confirm password are required.");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("New password and confirm password must match.");
        }

        UserAdmin userAdmin = findActiveUserByUsername(username);

        if (!otpMatches(userAdmin, otp)) {
            throw new IllegalArgumentException("Invalid OTP.");
        }

        userAdmin.setPassword(passwordEncoder.encode(newPassword));
        userAdmin.setOtp(null);
        userAdminRepository.save(userAdmin);

        return BasicMessageResponse.builder()
                .message("Password updated successfully.")
                .build();
    }

    @Override
    @Transactional
    public void migrateLegacyPasswords() {
        List<UserAdmin> usersToUpdate = new ArrayList<>();

        for (UserAdmin userAdmin : userAdminRepository.findAllByDeleteStatus(ACTIVE_STATUS)) {
            if (StringUtils.hasText(userAdmin.getPassword()) && !isBcryptHash(userAdmin.getPassword())) {
                userAdmin.setPassword(passwordEncoder.encode(userAdmin.getPassword()));
                usersToUpdate.add(userAdmin);
            }
        }

        if (!usersToUpdate.isEmpty()) {
            userAdminRepository.saveAll(usersToUpdate);
        }
    }

    private UserAdmin findActiveUserByUsername(String username) {
        return userAdminRepository.findByUsernameAndDeleteStatus(username, ACTIVE_STATUS)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid Username."));
    }

    private boolean passwordMatches(String rawPassword, UserAdmin userAdmin) {
        String storedPassword = userAdmin.getPassword();

        if (!StringUtils.hasText(storedPassword)) {
            return false;
        }

        if (isBcryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        boolean matchesLegacyPassword = storedPassword.equals(rawPassword);

        if (matchesLegacyPassword) {
            userAdmin.setPassword(passwordEncoder.encode(rawPassword));
            userAdminRepository.save(userAdmin);
        }

        return matchesLegacyPassword;
    }

    private boolean otpMatches(UserAdmin userAdmin, String otp) {
        return StringUtils.hasText(userAdmin.getOtp()) && userAdmin.getOtp().equals(otp);
    }

    private UserDetails toUserDetails(UserAdmin userAdmin) {
        return User.builder()
                .username(userAdmin.getUsername())
                .password(userAdmin.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + ADMIN_ROLE)))
                .build();
    }

    private boolean isBcryptHash(String value) {
        return BCRYPT_PATTERN.matcher(value).matches();
    }

    private String generateOtp() {
        int effectiveOtpLength = Math.max(6, otpLength);
        StringBuilder otpBuilder = new StringBuilder(effectiveOtpLength);

        for (int index = 0; index < effectiveOtpLength; index++) {
            int randomIndex = SECURE_RANDOM.nextInt(OTP_CHARACTERS.length());
            otpBuilder.append(OTP_CHARACTERS.charAt(randomIndex));
        }

        return otpBuilder.toString();
    }

    private void clearOtp(UserAdmin userAdmin) {
        userAdmin.setOtp(null);
        userAdminRepository.save(userAdmin);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeOtp(String value) {
        return normalize(value).toUpperCase(Locale.ROOT);
    }
}
