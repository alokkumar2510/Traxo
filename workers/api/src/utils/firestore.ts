// Firestore REST Value Converter Helpers
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    }
    return { doubleValue: val };
  }
  if (typeof val === "string") {
    // Check if it looks like an ISO Timestamp
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      return { timestampValue: val };
    }
    return { stringValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
  }
  if (typeof val === "object") {
    // If it has a Firestore Timestamp shape (from core firebase sdk compatibility)
    if (val.seconds !== undefined && val.nanoseconds !== undefined) {
      return { timestampValue: new Date(val.seconds * 1000).toISOString() };
    }
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(fieldVal: any): any {
  if (!fieldVal) return null;
  const [typeKey, value] = Object.entries(fieldVal)[0];

  switch (typeKey) {
    case "nullValue":
      return null;
    case "booleanValue":
      return value;
    case "integerValue":
      return parseInt(value as string, 10);
    case "doubleValue":
      return parseFloat(value as string);
    case "stringValue":
      return value;
    case "timestampValue":
      return value; // Return ISO string for consistency
    case "arrayValue":
      const vals = (value as any).values || [];
      return vals.map(fromFirestoreValue);
    case "mapValue":
      const fields = (value as any).fields || {};
      const obj: Record<string, any> = {};
      for (const [k, v] of Object.entries(fields)) {
        obj[k] = fromFirestoreValue(v);
      }
      return obj;
    default:
      return value;
  }
}

export function mapToFirestore(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

export function mapFromFirestore(fields: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  if (!fields) return obj;
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
}

export class FirestoreClient {
  private baseUrl: string;

  constructor(
    private projectId: string,
    private token: string
  ) {
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Fetches a document by path
   */
  async getDocument<T>(path: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}/${path}`, {
      headers: this.getHeaders(),
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Firestore getDocument failed (${res.status}): ${errBody}`);
    }

    const data = (await res.json()) as any;
    const id = data.name.split("/").pop() || "";
    return {
      id,
      ...mapFromFirestore(data.fields),
    } as any as T;
  }

  /**
   * Creates a document in a collection with a specific document ID
   */
  async createDocument<T extends { id?: string }>(
    parentPath: string,
    docId: string,
    data: T
  ): Promise<T> {
    // Remove the ID from fields since it's defined by path
    const { id, ...fields } = data as any;
    const fieldsPayload = mapToFirestore(fields);

    const url = `${this.baseUrl}/${parentPath}?documentId=${docId}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ fields: fieldsPayload }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Firestore createDocument failed (${res.status}): ${errBody}`);
    }

    const createdData = (await res.json()) as any;
    return {
      id: docId,
      ...mapFromFirestore(createdData.fields),
    } as any as T;
  }

  /**
   * Updates fields in a document using patch updateMask
   */
  async updateDocument<T>(path: string, data: Partial<T>): Promise<void> {
    const fieldsPayload = mapToFirestore(data);
    const queryParams = new URLSearchParams();
    
    // Construct update mask
    for (const key of Object.keys(data)) {
      queryParams.append("updateMask.fieldPaths", key);
    }

    const url = `${this.baseUrl}/${path}?${queryParams.toString()}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify({ fields: fieldsPayload }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Firestore updateDocument failed (${res.status}): ${errBody}`);
    }
  }

  /**
   * Deletes a document
   */
  async deleteDocument(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!res.ok && res.status !== 404) {
      const errBody = await res.text();
      throw new Error(`Firestore deleteDocument failed (${res.status}): ${errBody}`);
    }
  }

  /**
   * Runs a Structured Query on the root or a subpath
   */
  async runQuery<T>(structuredQuery: any, parentPath?: string): Promise<T[]> {
    const url = parentPath
      ? `${this.baseUrl}/${parentPath}:runQuery`
      : `${this.baseUrl}:runQuery`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ structuredQuery }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Firestore runQuery failed (${res.status}): ${errBody}`);
    }

    const results = (await res.json()) as any[];
    const list: T[] = [];

    // runQuery returns a stream-like array of [{ document: ... }, { readTime: ... }]
    for (const item of results) {
      if (item.document) {
        const docName = item.document.name;
        const id = docName.split("/").pop() || "";
        list.push({
          id,
          ...mapFromFirestore(item.document.fields),
        } as any as T);
      }
    }

    return list;
  }
}
