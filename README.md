# Autrobook — Safety First Social Media Platform

Autrobook is a safety-focused social medianetworking web application designed to keep users connected while prioritizing their security. It combines standard social media features with emergency response tools, making it a reliable platform for personal safety.

## 🚀 Key Features

- **News Feed:** Create text and image posts, like and comment on updates.
- **Missing Person Alerts:** Quickly broadcast alerts for missing individuals with location and contact details.
- **Blood Donor Requests:** Post urgent blood requirements with hospital and contact information.
- **NID Verification:** Upload National ID and selfie for identity verification to get a verified badge.
- **My Shield (Security Score):** A dynamic security score based on profile completeness, NID verification, and emergency contacts.
- **Emergency SOS:** Share your live location instantly with trusted contacts.
- **Panic Mode:** Activate a high-priority alert to all trusted contacts in critical situations.
- **Safety Tips & Emergency Contacts:** Access essential safety guidelines and national emergency numbers.
- **Dark Mode:** Toggle between light and dark themes for better user experience.

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend/Database:** Supabase (PostgreSQL & Storage)
- **Icons:** Font Awesome

## 📁 Project Structure

- `index.html` — Main application interface.
- `css/index.css` — Styling and responsive design.
- `js/index.js` — Core logic, event handlers, and Supabase integration.
- `logo.png` — Project logo.

## ⚙️ Setup & Installation

1. Clone the repository.
2. Ensure your Supabase project is set up with the required tables (`security_logs`, `appeals`, etc.).
3. Create a storage bucket named `images` for post uploads and `appeals-documents` for NID verifications.
4. Update the `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/index.js` with your project credentials.
5. Run the application using any local web server (e.g., Live Server).

## 🔒 Security & Privacy

User data and uploaded documents are handled securely via Supabase. NID documents are kept private, while public posts and alerts are accessible to the community.

---
*Built for safety, designed for connection.*
