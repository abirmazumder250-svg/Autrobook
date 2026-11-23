export async function enforceMandatoryVerification(
  supabase,
  verifyPageUrl = "/verify-otp.html",
  bannedPageUrl = "/banned.html"
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.user) {
    window.location.replace("/login.html");
    return false;
  }

  const user = session.user;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_verified, is_banned, role, full_name, username")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    if (user.email) {
      sessionStorage.setItem("pending_verify_email", user.email.toLowerCase());
    }
    window.location.replace(verifyPageUrl);
    return false;
  }

  if (profile.is_banned === true) {
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace(bannedPageUrl);
    return false;
  }

  if (profile.is_verified !== true) {
    if (user.email) {
      sessionStorage.setItem("pending_verify_email", user.email.toLowerCase());
    }
    window.location.replace(verifyPageUrl);
    return false;
  }

  return true;
}
