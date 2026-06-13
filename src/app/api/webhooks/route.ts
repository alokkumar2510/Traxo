export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { logger } from "@/utils/logger";

// Helper to decode JWT token payload securely
function decodeToken(token: string): { uid: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonPayload);
    return {
      uid: payload.user_id ?? payload.uid ?? payload.sub ?? "",
      email: payload.email ?? "",
    };
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/webhooks
 * Lists all registered webhooks for the user
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Missing authorization token" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = decodeToken(token);
    if (!decoded || !decoded.uid) {
      return NextResponse.json({ success: false, error: "Invalid authorization token" }, { status: 401 });
    }

    const userId = decoded.uid;
    const webhooksRef = collection(db, "users", userId, "webhooks");
    const snap = await getDocs(webhooksRef);

    const webhooks = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, webhooks });
  } catch (error: any) {
    logger.error({
      service: "notification",
      event: "list_webhooks_api_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/webhooks
 * Creates a new webhook connection
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Missing authorization token" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = decodeToken(token);
    if (!decoded || !decoded.uid) {
      return NextResponse.json({ success: false, error: "Invalid authorization token" }, { status: 401 });
    }

    const userId = decoded.uid;
    const body = await req.json();
    const { url, platform, events } = body;

    if (!url || !platform || !events || !Array.isArray(events)) {
      return NextResponse.json({ success: false, error: "Missing required fields: url, platform, events" }, { status: 400 });
    }

    const webhookId = crypto.randomUUID();
    const webhookDocRef = doc(db, "users", userId, "webhooks", webhookId);

    const newWebhook = {
      id: webhookId,
      url: url.trim(),
      platform: platform || "custom",
      events,
      active: true,
      createdAt: Timestamp.now(),
    };

    await setDoc(webhookDocRef, newWebhook);

    logger.info({
      service: "notification",
      event: "webhook_created",
      userId,
      metadata: { webhookId, platform },
    });

    return NextResponse.json({ success: true, webhook: newWebhook }, { status: 201 });
  } catch (error: any) {
    logger.error({
      service: "notification",
      event: "create_webhook_api_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks
 * Deletes a webhook connection
 */
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Missing authorization token" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = decodeToken(token);
    if (!decoded || !decoded.uid) {
      return NextResponse.json({ success: false, error: "Invalid authorization token" }, { status: 401 });
    }

    const userId = decoded.uid;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing webhook id parameter" }, { status: 400 });
    }

    const webhookDocRef = doc(db, "users", userId, "webhooks", id);
    await deleteDoc(webhookDocRef);

    logger.info({
      service: "notification",
      event: "webhook_deleted",
      userId,
      metadata: { webhookId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({
      service: "notification",
      event: "delete_webhook_api_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

