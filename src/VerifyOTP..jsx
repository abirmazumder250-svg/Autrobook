import { useState, useEffect } from "react";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [email] = useState(() => localStorage.getItem("autrobook_email") || "");

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!email) {
      setMessage({ type: "error", text: "Email not found. Please start login again." });
      return;
    }

    if (otp.length !== 6) {
      setMessage({ type: "error", text: "Please enter a valid 6-digit OTP." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setMessage({ type: "success", text: "OTP verified successfully. Redirecting..." });
        window.location.href = "/dashboard";
      } else {
        setMessage({
          type: "error",
          text: data.message || data.error || "Invalid or expired OTP.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error while verifying OTP." });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage({ type: "", text: "" });

    if (!email) {
      setMessage({ type: "error", text: "Email not found. Please start login again." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: localStorage.getItem("autrobook_name") || "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setOtp("");
        setTimer(300);
        setMessage({ type: "success", text: "A new OTP has been sent to your email." });
      } else {
        setMessage({
          type: "error",
          text: data.message || data.error || "Failed to resend OTP.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error while resending OTP." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <h2>Enter OTP</h2>
      <p>
        Email: <b>{email || "Not provided"}</b>
      </p>

      {timer > 0 ? (
        <p>
          OTP will expire in <b>{formatTime(timer)}</b>
        </p>
      ) : (
        <p style={{ color: "crimson" }}>OTP expired. Please resend a new OTP.</p>
      )}

      <form onSubmit={handleVerify}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          placeholder="123456"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            fontSize: "18px",
            letterSpacing: "5px",
            textAlign: "center",
            margin: "10px 0",
          }}
        />

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button type="button" onClick={handleResend} disabled={loading || timer > 0}>
            {timer > 0 ? `Resend in ${formatTime(timer)}` : "Resend OTP"}
          </button>
        </div>
      </form>

      {message.text && (
        <p
          style={{
            marginTop: "12px",
            color: message.type === "error" ? "crimson" : "seagreen",
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
