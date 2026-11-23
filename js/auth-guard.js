async function enforceMandatoryVerification(supabase, verifyPageUrl = "/verify-otp.html") {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    window.location.replace("/login.html");
    return false;
  }

  const user = session.user;

  // Check profiles table for is_verified flag
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_verified, full_name, username")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.is_verified !== true) {
    // Store email so OTP page can send/verify directly
    if (user.email) {
      sessionStorage.setItem("pending_verify_email", user.email.toLowerCase());
    }
    window.location.replace(verifyPageUrl);
    return false;
  }

  return true;
}
