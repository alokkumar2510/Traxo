import { Resend } from "resend";
import { Tracker, TrackerEvent } from "@/types/database";
import { logger } from "@/utils/logger";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends a transactional email using Resend
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    logger.warn({
      service: "notification",
      event: "resend_email_skipped",
      metadata: { reason: "RESEND_API_KEY is not defined in environment variables" },
    });
    return false;
  }

  try {
    const fromAddress = process.env.NEXT_PUBLIC_FROM_EMAIL || "alerts@traxo.alokkumarsahu.in";
    
    logger.info({
      service: "notification",
      event: "resend_email_dispatching",
      metadata: { to, subject },
    });

    const response = await resend.emails.send({
      from: `Traxo Alerts <${fromAddress}>`,
      to,
      subject,
      html,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    logger.info({
      service: "notification",
      event: "resend_email_sent_success",
      metadata: { to, emailId: response.data?.id },
    });

    return true;
  } catch (error: any) {
    logger.error({
      service: "notification",
      event: "resend_email_failed",
      error: error.message || error,
    });
    return false;
  }
}

/**
 * Compiles a premium, glassmorphic styled HTML email for single tracker change alerts
 */
export function compileAlertEmail(tracker: Tracker, event: TrackerEvent): string {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://traxo.alokkumarsahu.in"}/trackers/${tracker.id}`;
  
  // Severity Badge Colors
  let badgeBg = "#1E3A8A"; // Blue
  let badgeText = "#BFDBFE";
  if (event.severity === "high") {
    badgeBg = "#7F1D1D"; // Red
    badgeText = "#FCA5A5";
  } else if (event.severity === "medium") {
    badgeBg = "#78350F"; // Amber/Yellow
    badgeText = "#FDE68A";
  }

  // Type Icon/Emoji
  let typeEmoji = "🌐";
  if (tracker.type === "price") typeEmoji = "🏷️";
  else if (tracker.type === "job") typeEmoji = "💼";
  else if (tracker.type === "pdf") typeEmoji = "📄";
  else if (tracker.type === "section") typeEmoji = "🎯";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Traxo Alert: Change Detected</title>
        <style>
          body {
            background-color: #030712;
            color: #f3f4f6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.025em;
          }
          .body {
            padding: 32px 24px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid #1f2937;
          }
          .tracker-info h2 {
            margin: 0 0 4px 0;
            font-size: 18px;
            color: #ffffff;
          }
          .tracker-info a {
            color: #38bdf8;
            font-size: 13px;
            text-decoration: none;
          }
          .badge {
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .event-card {
            background-color: #1f2937;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .event-card h3 {
            margin: 0 0 8px 0;
            color: #ffffff;
            font-size: 16px;
          }
          .event-card p {
            margin: 0;
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.5;
          }
          .btn-container {
            text-align: center;
            margin-top: 32px;
          }
          .btn {
            background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
          }
          .footer {
            background-color: #0b0f19;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #1f2937;
          }
          .footer a {
            color: #9ca3af;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TRAXO SCANNER</h1>
          </div>
          <div class="body">
            <div class="meta-row">
              <div class="tracker-info">
                <h2>${typeEmoji} ${tracker.name}</h2>
                <a href="${tracker.url}" target="_blank">${tracker.url}</a>
              </div>
              <span class="badge" style="background-color: ${badgeBg}; color: ${badgeText};">${event.severity}</span>
            </div>
            
            <div class="event-card">
              <h3>${event.title}</h3>
              <p>${event.summary}</p>
              
              <!-- URL to the change -->
              <div style="margin-top: 16px; font-size: 13px; border-top: 1px solid #374151; padding-top: 12px;">
                <span style="color: #9ca3af; font-weight: 500;">Link to monitored site:</span>
                <a href="${tracker.url}" target="_blank" style="color: #38bdf8; text-decoration: underline; margin-left: 4px; font-weight: 600;">
                  ${tracker.url}
                </a>
              </div>

              <!-- Image of the change -->
              ${(event.metadata as any)?.visualDiff?.diffImageUrl ? `
                <div style="margin-top: 20px; border-top: 1px solid #374151; padding-top: 16px;">
                  <h4 style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; font-weight: 600;">Visual Screenshot of Change:</h4>
                  <div style="border-radius: 8px; overflow: hidden; border: 1px solid #374151; background-color: #0b0f19;">
                    <a href="${tracker.url}" target="_blank">
                      <img src="${(event.metadata as any).visualDiff.diffImageUrl}" alt="Screenshot of Change" style="width: 100%; max-width: 100%; height: auto; display: block;" />
                    </a>
                  </div>
                  <div style="margin-top: 8px; font-size: 11px; color: #6b7280; text-align: center;">
                    Click image to visit the monitored URL
                  </div>
                </div>
              ` : ""}
            </div>

            <div class="btn-container">
              <a href="${dashboardUrl}" class="btn">View Change Details</a>
            </div>
          </div>
          <div class="footer">
            <p>You received this alert because you are monitoring this website on Traxo.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://traxo.alokkumarsahu.in"}/settings">Manage Notification Preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export interface DigestItem {
  trackerName: string;
  trackerUrl: string;
  type: string;
  title: string;
  summary: string;
  time: string;
}

/**
 * Compiles HTML daily digest templates consolidating multiple tracker updates
 */
export function compileDigestEmail(displayName: string, items: DigestItem[]): string {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://traxo.alokkumarsahu.in"}/dashboard`;
  
  const tableRows = items
    .map((item) => {
      let typeEmoji = "🌐";
      if (item.type === "price") typeEmoji = "🏷️";
      else if (item.type === "job") typeEmoji = "💼";
      else if (item.type === "pdf") typeEmoji = "📄";
      else if (item.type === "section") typeEmoji = "🎯";

      return `
        <tr>
          <td style="padding: 16px 12px; border-bottom: 1px solid #1f2937;">
            <div style="font-weight: 600; color: #ffffff; font-size: 14px;">${typeEmoji} ${item.trackerName}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.time}</div>
          </td>
          <td style="padding: 16px 12px; border-bottom: 1px solid #1f2937;">
            <div style="font-weight: 500; color: #ffffff; font-size: 14px;">${item.title}</div>
            <div style="font-size: 13px; color: #9ca3af; margin-top: 4px; line-height: 1.4;">${item.summary}</div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Traxo Daily Digest</title>
        <style>
          body {
            background-color: #030712;
            color: #f3f4f6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.025em;
          }
          .body {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 24px;
            color: #ffffff;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            margin-bottom: 32px;
          }
          .summary-table th {
            padding: 12px;
            background-color: #1f2937;
            color: #9ca3af;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .btn-container {
            text-align: center;
            margin-top: 16px;
          }
          .btn {
            background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
          }
          .footer {
            background-color: #0b0f19;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #1f2937;
          }
          .footer a {
            color: #9ca3af;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TRAXO DAILY DIGEST</h1>
          </div>
          <div class="body">
            <div class="greeting">Hello ${displayName},</div>
            <p style="font-size: 15px; line-height: 1.5; color: #9ca3af; margin-bottom: 24px;">
              Here are the changes detected across your monitored websites over the last 24 hours:
            </p>
            
            <table class="summary-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Tracker</th>
                  <th style="width: 60%;">Updates</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <div class="btn-container">
              <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>You received this digest because you have configured Daily Digests on Traxo.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://traxo.alokkumarsahu.in"}/settings">Manage Notification Preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}
