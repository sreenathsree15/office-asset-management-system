import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import loginArtwork from "../images/Gemini_Generated_Image_10dkob10dkob10dk.png";

const RESET_STEPS = {
  REQUEST_OTP: "request-otp",
  VERIFY_OTP: "verify-otp",
  RESET_PASSWORD: "reset-password"
};

const initialLoginState = {
  username: "",
  password: ""
};

const initialResetState = {
  username: "",
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: ""
};

export default function LoginPage() {
  const {
    login,
    isLoading,
    requestPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPasswordWithOtp
  } = useAuth();
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [resetForm, setResetForm] = useState(initialResetState);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(RESET_STEPS.REQUEST_OTP);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState("");

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const handleResetChange = (event) => {
    const { name, value } = event.target;
    setResetForm((current) => ({ ...current, [name]: value }));
  };

  const resetForgotPasswordState = (closeModal = false) => {
    setResetStep(RESET_STEPS.REQUEST_OTP);
    setForgotPasswordError("");
    setForgotPasswordNotice("");
    setIsResetSubmitting(false);
    setResetForm({
      ...initialResetState,
      username: loginForm.username.trim()
    });

    if (closeModal) {
      setShowForgotPassword(false);
    }
  };

  const openForgotPasswordModal = () => {
    setShowForgotPassword(true);
    setError("");
    setNotice("");
    resetForgotPasswordState(false);
  };

  const closeForgotPasswordModal = () => {
    resetForgotPasswordState(true);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await login(loginForm.username.trim(), loginForm.password);
      setLoginForm(initialLoginState);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!resetForm.username.trim() || !resetForm.email.trim()) {
      setForgotPasswordError("Enter the username and recovery email.");
      setForgotPasswordNotice("");
      return;
    }

    setIsResetSubmitting(true);
    setForgotPasswordError("");

    try {
      const response = await requestPasswordResetOtp(
        resetForm.username.trim(),
        resetForm.email.trim()
      );

      setForgotPasswordNotice(response.message);
      setResetStep(RESET_STEPS.VERIFY_OTP);
    } catch (requestError) {
      setForgotPasswordError(requestError.message);
      setForgotPasswordNotice("");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!resetForm.otp.trim()) {
      setForgotPasswordError("Enter the OTP from your email.");
      setForgotPasswordNotice("");
      return;
    }

    setIsResetSubmitting(true);
    setForgotPasswordError("");

    try {
      const normalizedOtp = resetForm.otp.trim().toUpperCase();
      const response = await verifyPasswordResetOtp(resetForm.username.trim(), normalizedOtp);

      setResetForm((current) => ({
        ...current,
        otp: normalizedOtp
      }));
      setForgotPasswordNotice(response.message);
      setResetStep(RESET_STEPS.RESET_PASSWORD);
    } catch (verifyError) {
      setForgotPasswordError(verifyError.message);
      setForgotPasswordNotice("");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetForm.newPassword || !resetForm.confirmPassword) {
      setForgotPasswordError("Enter and confirm the new password.");
      setForgotPasswordNotice("");
      return;
    }

    setIsResetSubmitting(true);
    setForgotPasswordError("");

    try {
      const response = await resetPasswordWithOtp(
        resetForm.username.trim(),
        resetForm.otp.trim().toUpperCase(),
        resetForm.newPassword,
        resetForm.confirmPassword
      );

      closeForgotPasswordModal();
      setNotice(`${response.message} Please sign in with the new password.`);
      setLoginForm((current) => ({
        ...current,
        username: resetForm.username.trim(),
        password: ""
      }));
    } catch (resetError) {
      setForgotPasswordError(resetError.message);
      setForgotPasswordNotice("");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card loading-card">
          <p>Loading administrator portal...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-split-layout">
        <section className="auth-visual-panel">
          <div className="auth-visual-frame">
            <img
              alt="Office Asset Management for LSGD"
              className="auth-visual-image"
              src={loginArtwork}
            />
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-stage">
            <div className="auth-stage-header">
              <p className="auth-stage-caption">Administrator Portal</p>
            </div>

            <section className="auth-card">
              <div className="auth-card-header">
                <h2>Admin Login</h2>
              </div>

              <form className="auth-form" onSubmit={handleLogin}>
                <label className="field">
                  <span>Username</span>
                  <input
                    autoComplete="username"
                    name="username"
                    onChange={handleLoginChange}
                    placeholder="Enter username"
                    type="text"
                    value={loginForm.username}
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    autoComplete="current-password"
                    name="password"
                    onChange={handleLoginChange}
                    placeholder="Enter password"
                    type="password"
                    value={loginForm.password}
                  />
                </label>

                <div className="auth-form-actions">
                  <button
                    className="link-button"
                    type="button"
                    onClick={openForgotPasswordModal}
                  >
                    Forgot password?
                  </button>
                </div>

                {error ? <p className="message error-message">{error}</p> : null}
                {notice ? <p className="message success-message">{notice}</p> : null}

                <button className="primary-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Signing in..." : "Login"}
                </button>
              </form>
            </section>
          </div>
        </section>
      </section>

      {showForgotPassword ? (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowForgotPassword(false);
            setForgotPasswordError("");
          }}
        >
          <section
            aria-labelledby="forgot-password-title"
            aria-modal="true"
            className="auth-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="auth-modal-header">
              <div>
                <p className="auth-modal-caption">Password Assistance</p>
                <h3 id="forgot-password-title">Forgot Password</h3>
              </div>

              <button
                aria-label="Close forgot password dialog"
                className="modal-close-button"
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordError("");
                }}
              >
                ×
              </button>
            </div>

            <div className="forgot-password-panel">
              <label className="field">
                <span>Recovery Email</span>
                <input
                  autoComplete="email"
                  name="forgotEmail"
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  type="email"
                  value={form.forgotEmail}
                />
              </label>

              {forgotPasswordError ? (
                <p className="message error-message">{forgotPasswordError}</p>
              ) : null}

              <div className="auth-modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="button"
                  onClick={handleForgotPassword}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
