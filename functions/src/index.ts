import { FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import nodemailer from "nodemailer";

initializeApp();

const smtpHost = defineSecret("SMTP_HOST");
const smtpPort = defineSecret("SMTP_PORT");
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");

const DEFAULT_WHATSAPP_LINK = "https://chat.whatsapp.com/BCeLjXhQHrxFxOlxkb7DPc";

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toPositiveInt = (value: string, fallback: number): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const sendEnrollmentWelcomeEmail = onDocumentCreated(
  {
    region: "us-central1",
    document: "artifacts/{appId}/public/data/leads/{leadId}",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [smtpHost, smtpPort, smtpUser, smtpPass]
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.warn("Lead trigger fired without snapshot", { eventId: event.id });
      return;
    }

    const lead = snap.data() as Record<string, unknown>;
    const intent = asString(lead.intent).toLowerCase();

    if (intent !== "enroll") {
      return;
    }

    const leadEmail = asString(lead.email).toLowerCase();
    const leadName = asString(lead.fullName) || "there";
    const status = asString(lead.emailStatus).toLowerCase();

    if (!leadEmail) {
      await snap.ref.set(
        {
          emailStatus: "failed",
          emailError: "Missing email field on enrollment document",
          emailProcessedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );
      logger.error("Enrollment lead is missing email", {
        leadId: event.params.leadId,
        appId: event.params.appId
      });
      return;
    }

    if (status === "sent") {
      return;
    }

    const host = smtpHost.value();
    const user = smtpUser.value();
    const pass = smtpPass.value();
    const port = toPositiveInt(smtpPort.value(), 587);
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });

    const subject = "Welcome to PM-X Accelerator";
    const text = [
      `Hi ${leadName},`,
      "",
      "Thanks for enrolling in PM-X Accelerator.",
      `Join our WhatsApp community: ${DEFAULT_WHATSAPP_LINK}`,
      "",
      "Team StepSmart"
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <p>Hi ${leadName},</p>
        <p>Thanks for enrolling in <strong>PM-X Accelerator</strong>.</p>
        <p>
          Join our WhatsApp community:
          <a href="${DEFAULT_WHATSAPP_LINK}" target="_blank" rel="noopener noreferrer">
            Click here
          </a>
        </p>
        <p>Team StepSmart</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `StepSmart <${user}>`,
        to: leadEmail,
        subject,
        text,
        html
      });

      await snap.ref.set(
        {
          emailStatus: "sent",
          emailSentAt: FieldValue.serverTimestamp(),
          emailProvider: "smtp"
        },
        { merge: true }
      );

      logger.info("Welcome email sent", {
        leadId: event.params.leadId,
        appId: event.params.appId,
        to: leadEmail
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";

      await snap.ref.set(
        {
          emailStatus: "failed",
          emailError: message,
          emailProcessedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      logger.error("Failed to send welcome email", {
        leadId: event.params.leadId,
        appId: event.params.appId,
        to: leadEmail,
        message
      });
    }
  }
);
