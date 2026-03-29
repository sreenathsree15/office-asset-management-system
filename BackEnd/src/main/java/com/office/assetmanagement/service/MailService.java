package com.office.assetmanagement.service;

public interface MailService {

    void sendOtpMail(String recipientEmail, String username, String otp);
}
