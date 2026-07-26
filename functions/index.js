const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Cloud Function to send OTP email
exports.sendOtpEmail = functions.https.onCall(async (data, context) => {
  try {
    const { email, otp } = data;

    if (!email || !otp) {
      throw new functions.https.HttpsError("invalid-argument", "Email and OTP are required");
    }

    // Email content
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@trackmla.in",
      subject: "MLASarkar - Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🏛️ MLASarkar</h1>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>

          <div style="background: #f3f4f6; padding: 2rem; text-align: center;">
            <h2 style="color: #1f2937; margin-top: 0;">Your Verification Code</h2>
            <p style="color: #6b7280; font-size: 1rem; margin-bottom: 2rem;">
              Use this code to complete your account verification:
            </p>

            <div style="background: white; border: 2px dashed #2563eb; padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
              <p style="font-size: 2.5rem; font-weight: bold; color: #2563eb; margin: 0; letter-spacing: 8px;">
                ${otp}
              </p>
            </div>

            <p style="color: #6b7280; font-size: 0.9rem; margin: 2rem 0 0 0;">
              This code expires in 10 minutes. Do not share this code with anyone.
            </p>
          </div>

          <div style="background: #ffffff; padding: 2rem; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">
              If you didn't request this email, please ignore it.
            </p>
            <p style="color: #9ca3af; font-size: 0.85rem; margin: 1rem 0 0 0;">
              © 2026 MLASarkar. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Send email via SendGrid
    await sgMail.send(msg);

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Cloud Function to send issue confirmation email
exports.sendIssueConfirmation = functions.https.onCall(async (data, context) => {
  try {
    const { email, issueTitle, issueId } = data;

    if (!email || !issueTitle || !issueId) {
      throw new functions.https.HttpsError("invalid-argument", "Email, issue title, and issue ID are required");
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@trackmla.in",
      subject: "Issue Report Received - MLASarkar",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🏛️ MLASarkar</h1>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Issue Reported Successfully</p>
          </div>

          <div style="background: #f3f4f6; padding: 2rem;">
            <h2 style="color: #1f2937; margin-top: 0;">Thank You for Reporting!</h2>
            <p style="color: #6b7280;">Your issue has been received and is pending moderation.</p>

            <div style="background: white; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #16a34a; margin: 2rem 0;">
              <p style="color: #6b7280; font-size: 0.85rem; margin: 0 0 0.5rem 0;">Issue Title</p>
              <p style="color: #1f2937; font-weight: bold; margin: 0 0 1rem 0;">${issueTitle}</p>

              <p style="color: #6b7280; font-size: 0.85rem; margin: 0 0 0.5rem 0;">Issue ID</p>
              <p style="color: #2563eb; font-family: monospace; margin: 0;">${issueId}</p>
            </div>

            <p style="color: #6b7280; font-size: 0.9rem;">
              Our team will review your report and it will appear on the leaderboard once approved.
            </p>
          </div>

          <div style="background: #ffffff; padding: 2rem; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">
              © 2026 MLASarkar. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    return { success: true, message: "Confirmation email sent" };
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
