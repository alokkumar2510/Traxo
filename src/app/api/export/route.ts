export const dynamic = 'force-static';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { TrackerRepository } from "@/services/firestore/trackers";
import { CollectionRepository } from "@/services/firestore/collections";
import { db } from "@/services/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
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

// Helper to convert JSON arrays to CSV strings
function jsonToCsv(items: any[]): string {
  if (items.length === 0) return "";
  const header = Object.keys(items[0]);
  const replacer = (key: string, value: any) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      // Clean up Firestore timestamps or complex metadata nested properties
      if (value.toDate || value._seconds) {
        return value.toDate ? value.toDate().toISOString() : new Date(value._seconds * 1000).toISOString();
      }
      return JSON.stringify(value).replace(/"/g, '""');
    }
    return value;
  };

  const csvRows = [
    header.join(","), // header row
    ...items.map((row) =>
      header
        .map((fieldName) => {
          const val = row[fieldName];
          const formatted = replacer(fieldName, val);
          // Escape quotes and wrap values in quotes if they contain commas
          const stringVal = typeof formatted === "string" ? formatted : String(formatted);
          if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
            return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
        })
        .join(",")
    ),
  ];

  return csvRows.join("\r\n");
}

/**
 * GET /api/export
 * Supported formats: csv, json
 * Supported types: trackers, events, analytics
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
    const url = new URL(req.url);
    const format = url.searchParams.get("format")?.toLowerCase() ?? "json";
    const type = url.searchParams.get("type")?.toLowerCase() ?? "trackers";

    logger.info({
      service: "analytics",
      event: "export_requested",
      userId,
      metadata: { format, type },
    });

    let data: any[] = [];
    let filename = `traxo_${type}_export_${Date.now()}`;

    if (type === "trackers") {
      const { trackers } = await TrackerRepository.listTrackers(userId, 500);
      data = trackers.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description ?? "",
        url: t.url,
        type: t.type,
        status: t.status,
        frequency: t.frequency,
        changeCount: t.changeCount,
        isPublic: t.isPublic,
        createdAt: t.createdAt?.toDate?.()?.toISOString() ?? "",
      }));
    } else if (type === "events") {
      // Fetch events across the user's trackers
      const { trackers } = await TrackerRepository.listTrackers(userId, 100);
      const eventPromises = trackers.map((t) =>
        TrackerRepository.listEvents(t.id, 50).catch(() => [])
      );
      const eventLists = await Promise.all(eventPromises);
      data = eventLists.flat().map((e) => ({
        id: e.id,
        trackerId: e.trackerId,
        type: e.type,
        title: e.title,
        summary: e.summary,
        severity: e.severity,
        createdAt: e.createdAt?.toDate?.()?.toISOString() ?? "",
      }));
    } else if (type === "analytics") {
      // Fetch user analytics doc
      const docRef = doc(db, "analytics", userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        data = [
          {
            userId,
            activeTrackers: d.activeTrackers ?? 0,
            totalScans: d.totalScans ?? 0,
            changesDetected: d.totalChanges ?? d.changesDetected ?? 0,
            notificationsSent: d.notificationsSent ?? 0,
            successfulScans: d.successfulScans ?? 0,
            failedScans: d.failedScans ?? 0,
            updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? "",
          },
        ];
      } else {
        data = [];
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid export type parameter" }, { status: 400 });
    }

    if (format === "csv") {
      const csvString = jsonToCsv(data);
      const response = new NextResponse(csvString, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
      return response;
    } else {
      const response = new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
      return response;
    }
  } catch (error: any) {
    logger.error({
      service: "analytics",
      event: "export_failed",
      error: error.message || error,
    });
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}



