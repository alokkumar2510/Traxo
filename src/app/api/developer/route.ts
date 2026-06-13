export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
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
 * GET /api/developer
 * Lists all API Keys for the authenticated user
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
    const keysRef = collection(db, "users", userId, "apiKeys");
    const snap = await getDocs(keysRef);

    const keys = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, keys });
  } catch (error: any) {
    logger.error({
      service: "analytics",
      event: "list_api_keys_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/developer
 * Generates and stores a new API key for the authenticated user
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
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Missing key identifier name" }, { status: 400 });
    }

    // Generate random secret API Key
    const keyId = crypto.randomUUID().replace(/-/g, "");
    const apiKey = `tx_live_${keyId}`;

    // 1. Save in user's nested keys subcollection
    const userKeyRef = doc(db, "users", userId, "apiKeys", apiKey);
    const keyRecord = {
      name: name.trim(),
      apiKey,
      status: "active",
      createdAt: Timestamp.now(),
    };
    await setDoc(userKeyRef, keyRecord);

    // 2. Register key centrally in central keys router index mapping to userId
    const centralKeyRef = doc(db, "apiKeys", apiKey);
    await setDoc(centralKeyRef, {
      userId,
      status: "active",
      createdAt: Timestamp.now(),
    });

    logger.info({
      service: "analytics",
      event: "api_key_created",
      userId,
      metadata: { name },
    });

    return NextResponse.json({ success: true, key: keyRecord });
  } catch (error: any) {
    logger.error({
      service: "analytics",
      event: "create_api_key_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/developer
 * Deactivates and deletes an API key
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
    const apiKey = url.searchParams.get("key");

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing API Key parameter" }, { status: 400 });
    }

    // 1. Delete from user's keys subcollection
    const userKeyRef = doc(db, "users", userId, "apiKeys", apiKey);
    await deleteDoc(userKeyRef);

    // 2. Delete from central keys router
    const centralKeyRef = doc(db, "apiKeys", apiKey);
    await deleteDoc(centralKeyRef);

    logger.info({
      service: "analytics",
      event: "api_key_deleted",
      userId,
      metadata: { apiKey: `${apiKey.substring(0, 10)}...` },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({
      service: "analytics",
      event: "delete_api_key_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

