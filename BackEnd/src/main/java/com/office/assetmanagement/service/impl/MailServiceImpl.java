package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.service.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    private final JavaMailSender javaMailSender;

    @Value("${app.mail.from:}")
    private String fromEmail;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Override
    public void sendOtpMail(String recipientEmail, String username, String otp) {
        String senderEmail = StringUtils.hasText(fromEmail) ? fromEmail : smtpUsername;

        if (!StringUtils.hasText(senderEmail)) {
            throw new IllegalStateException(
                    "SMTP mail sender is not configured. Set spring.mail.username or app.mail.from."
            );
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(recipientEmail);
        message.setSubject("Office Asset Management Password Reset OTP");
        message.setText(buildMailBody(username, otp));
        javaMailSender.send(message);
    }

    private String buildMailBody(String username, String otp) {
        return """
                Hello %s,

                Use the following OTP to reset your Office Asset Management password:
                %s

                If you did not request this reset, please ignore this email.
                """.formatted(username, otp);
    }
}
