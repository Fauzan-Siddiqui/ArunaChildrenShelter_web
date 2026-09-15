import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "./firebase";

type Tab = "dashboard" | "children" | "donations" | "travel";

type Child = {
  id: string;
  name: string;
  age: string;
  gender: string;
  status: string;
  dateOfBirth: string;
  admissionDate: string;
  guardianName: string;
  guardianContact: string;
  profilePhotoUri: string;
  createdAt: number;
};

type ProfileSection = "main" | "admission" | "documents" | "tracking";

type Donation = {
  id: string;
  donor: string;
  donationType: "Monetary" | "Goods" | "Services";
  donationDetails: string;
  date: string;
  receiptNumber: string;
  createdAt: number;
};

type TravelReceipt = {
  id: string;
  date: string;
  description: string;
  amount: string;
  createdAt: number;
};

type TravelMonth = {
  year: number;
  month: number;
  receipts: TravelReceipt[];
};

const TRAVEL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TRAVEL_STORAGE_KEY = "hopehouse_travel_months";

const avatarColors = [
  "#7C3AED",
  "#3B82F6",
  "#14B8A6",
];

function calculateAge(dateOfBirth: string): string {
  const parts = dateOfBirth.split("/");

  if (parts.length !== 3) return "";

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (!day || !month || !year) return "";

  const today = new Date();

  let age = today.getFullYear() - year;

  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month &&
      today.getDate() < day)
  ) {
    age--;
  }

  return Math.max(age, 0).toString();
}

function formatDateForDisplay(value: string): string {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatDateForInput(value: string): string {
  if (!value) return "";

  const parts = value.split("/");

  if (parts.length !== 3) return "";

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}



function SplashScreen({ onTimeout }: { onTimeout: () => void }) {
  useEffect(() => {
    const animationTimer = window.setTimeout(onTimeout, 3600);
    return () => window.clearTimeout(animationTimer);
  }, [onTimeout]);

  return (
    <div className="splash-screen">
      <div className="splash-title">ARUNA CHILDREN'S SHELTER</div>
    </div>
  );
}


function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function handleLogin() {
  if (!email.trim() || !password) {
    setErrorMessage("Please enter email and password");
    return;
  }

  setErrorMessage("");
  setIsLoading(true);

  try {
    await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    setIsLoading(false);
    onLoginSuccess();
  } catch (error: any) {
    setIsLoading(false);

    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        setErrorMessage("Invalid email or password");
        break;

      case "auth/invalid-email":
        setErrorMessage("Please enter a valid email address");
        break;

      case "auth/too-many-requests":
        setErrorMessage("Too many attempts. Please try again later");
        break;

      default:
        setErrorMessage("Login failed. Please try again");
        console.error("Firebase login error:", error);
    }
  }
}

  return (
    <div className="login-screen">
      <div className="login-content">
        <div className="login-icon-circle">
          <LockIcon />
        </div>

        <h1>Welcome</h1>
        <p className="login-subtitle">Sign in to access the dashboard</p>

        <form className="login-fields" onSubmit={(event) => {
          event.preventDefault();
          if (!isLoading) handleLogin();
        }} noValidate>
          <label className="login-field">
            <span className="login-field-icon"><EmailIcon /></span>
            <input
              type="email"
              value={email}
              placeholder="Enter email"
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorMessage("");
              }}
              autoComplete="email"
              aria-label="Email"
            />
          </label>

          <label className="login-field">
            <span className="login-field-icon"><LockIcon /></span>
            <input
              type={passwordVisible ? "text" : "password"}
              value={password}
              placeholder="Enter password"
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage("");
              }}
              autoComplete="current-password"
              aria-label="Password"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </label>

          {errorMessage && (
            <div className="login-error">{errorMessage}</div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? <span className="login-spinner" /> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}


function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h6V7a3 3 0 0 0-6 0v3Zm3 3a2 2 0 0 0-1 3.732V19h2v-2.268A2 2 0 0 0 12 13Z" />
    </svg>
  );
}


function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 3.2V17h16V8.2l-8 5.1-8-5.1Zm1.2-1.2L12 11.3 18.8 7H5.2Z" />
    </svg>
  );
}


function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c5.2 0 8.8 4.2 10 7-1.2 2.8-4.8 7-10 7s-8.8-4.2-10-7c1.2-2.8 4.8-7 10-7Zm0 2C8.4 7 5.5 9.5 4.2 12 5.5 14.5 8.4 17 12 17s6.5-2.5 7.8-5C18.5 9.5 15.6 7 12 7Zm0 2.5A2.5 2.5 0 1 1 12 14a2.5 2.5 0 0 1 0-4.5Z" />
    </svg>
  );
}


function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3.3 2.3 18.4 18.4-1.4 1.4-3.1-3.1A11.4 11.4 0 0 1 12 19c-5.2 0-8.8-4.2-10-7a15.4 15.4 0 0 1 4.2-5.5L1.9 3.7l1.4-1.4ZM7.7 7.7A10.8 10.8 0 0 0 4.2 12c1.3 2.5 4.2 5 7.8 5 1.6 0 3-.4 4.2-1.1l-2.1-2.1A3.5 3.5 0 0 1 9.2 9.8L7.7 7.7Zm5.5 5.5-2.4-2.4a1.5 1.5 0 0 0 2.4 2.4ZM12 7c-.7 0-1.4.1-2 .2L8.3 5.5A10.8 10.8 0 0 1 12 5c5.2 0 8.8 4.2 10 7a15.3 15.3 0 0 1-3 4.4l-1.4-1.4c.9-.9 1.6-1.9 2.2-3-1.3-2.5-4.2-5-7.8-5Z" />
    </svg>
  );
}

const CLOUDINARY_CLOUD_NAME = "vrya78nk";
const CLOUDINARY_UPLOAD_PRESET = "tzxidssx";
const CLOUDINARY_IMAGE_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_AUTO_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

async function uploadDocumentToCloudinary(file: File, childId: string, documentName: string): Promise<string> {
  // Documents are uploaded as the actual selected file. Unlike the profile
  // picture, scanned documents do not use the cropper.
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append(
    "folder",
    `hopehouse/documents/${childId}/${safeFirestoreId(documentName)}`
  );

  const uploadResponse = await fetch(CLOUDINARY_AUTO_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const result = await uploadResponse.json();

  if (!uploadResponse.ok || !result?.secure_url) {
    throw new Error(
      result?.error?.message || "Cloudinary document upload failed."
    );
  }

  return result.secure_url as string;
}

async function uploadCroppedProfilePhoto(dataUrl: string, childId: string): Promise<string> {
  // The original image is never sent here. dataUrl is produced only after
  // the cropper has rendered the selected/captured image onto a canvas.
  const response = await fetch(dataUrl);
  const croppedBlob = await response.blob();

  const formData = new FormData();
  formData.append("file", croppedBlob, `profile_${childId}.jpg`);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "hopehouse/profile_photos");

  const uploadResponse = await fetch(CLOUDINARY_IMAGE_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const result = await uploadResponse.json();

  if (!uploadResponse.ok || !result?.secure_url) {
    throw new Error(
      result?.error?.message || "Cloudinary profile photo upload failed."
    );
  }

  return result.secure_url as string;
}

const FIRESTORE_PROJECT_ID = "hopehouse-5041d";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

function createFirestoreDocumentId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  throw new Error("Unsupported Firestore field value.");
}

function fromFirestoreValue(value: any): unknown {
  if (!value || typeof value !== "object") return "";
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  return "";
}

function fromFirestoreObject(value: any): any {
  if (!value || typeof value !== "object") return "";
  if ("mapValue" in value) {
    const fields = value.mapValue?.fields ?? {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, fieldValue]) => [key, fromFirestoreObject(fieldValue)])
    );
  }
  if ("arrayValue" in value) {
    return (value.arrayValue?.values ?? []).map((item: any) => fromFirestoreObject(item));
  }
  return fromFirestoreValue(value);
}

function toFirestoreObject(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toFirestoreObject(item)])
        ),
      },
    };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => toFirestoreObject(item)) } };
  }
  return toFirestoreValue(value);
}

function safeFirestoreId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "_");
}

function firestoreDocumentToDonation(document: any): Donation {
  const fields = document?.fields ?? {};
  return {
    id: document?.name?.split("/").pop() ?? String(fromFirestoreValue(fields.id) ?? ""),
    donor: String(fromFirestoreValue(fields.donor) ?? ""),
    donationType: String(fromFirestoreValue(fields.donationType) ?? "Monetary") as Donation["donationType"],
    donationDetails: String(fromFirestoreValue(fields.donationDetails) ?? ""),
    date: String(fromFirestoreValue(fields.date) ?? ""),
    receiptNumber: String(fromFirestoreValue(fields.receiptNumber) ?? ""),
    createdAt: Number(fromFirestoreValue(fields.createdAt) ?? 0),
  };
}

function donationToFirestoreFields(donation: Donation): Record<string, Record<string, unknown>> {
  return {
    id: toFirestoreValue(donation.id),
    donor: toFirestoreValue(donation.donor),
    donationType: toFirestoreValue(donation.donationType),
    donationDetails: toFirestoreValue(donation.donationDetails),
    date: toFirestoreValue(donation.date),
    receiptNumber: toFirestoreValue(donation.receiptNumber),
    createdAt: toFirestoreValue(donation.createdAt),
  };
}

async function listFirestoreDocuments(currentUser: User, path: string): Promise<any[]> {
  const url = `${FIRESTORE_BASE_URL}/${path}`;
  const response = await firestoreRestRequest(currentUser, url);
  return Array.isArray(response?.documents) ? response.documents : [];
}

async function patchFirestoreDocument(currentUser: User, path: string, fields: Record<string, Record<string, unknown>>): Promise<void> {
  await firestoreRestRequest(currentUser, `${FIRESTORE_BASE_URL}/${path}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

async function deleteFirestoreDocument(currentUser: User, path: string): Promise<void> {
  await firestoreRestRequest(currentUser, `${FIRESTORE_BASE_URL}/${path}`, { method: "DELETE" });
}

async function fetchDonationsFromFirestore(currentUser: User): Promise<Donation[]> {
  const documents = await listFirestoreDocuments(currentUser, "donations?pageSize=300");
  return documents.map(firestoreDocumentToDonation).sort((a, b) => b.createdAt - a.createdAt);
}

async function patchDonationInFirestore(currentUser: User, donation: Donation): Promise<void> {
  await patchFirestoreDocument(currentUser, `donations/${encodeURIComponent(donation.id)}`, donationToFirestoreFields(donation));
}

async function fetchTravelMonthsFromFirestore(currentUser: User): Promise<TravelMonth[]> {
  const monthDocuments = await listFirestoreDocuments(currentUser, "travel_months?pageSize=300");
  const months = await Promise.all(monthDocuments.map(async (document: any) => {
    const fields = document?.fields ?? {};
    const year = Number(fromFirestoreValue(fields.year) ?? 0);
    const month = Number(fromFirestoreValue(fields.month) ?? 0);
    if (!year || !month) return null;
    const key = document?.name?.split("/").pop() ?? `${year}_${String(month).padStart(2, "0")}`;
    const receiptDocuments = await listFirestoreDocuments(currentUser, `travel_months/${encodeURIComponent(key)}/receipts?pageSize=300`);
    const receipts: TravelReceipt[] = receiptDocuments.map((receiptDocument: any) => {
      const receiptFields = receiptDocument?.fields ?? {};
      return {
        id: receiptDocument?.name?.split("/").pop() ?? String(fromFirestoreValue(receiptFields.id) ?? ""),
        date: String(fromFirestoreValue(receiptFields.date) ?? ""),
        description: String(fromFirestoreValue(receiptFields.description) ?? ""),
        amount: String(fromFirestoreValue(receiptFields.amount) ?? ""),
        createdAt: Number(fromFirestoreValue(receiptFields.createdAt) ?? 0),
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
    return { year, month, receipts } as TravelMonth;
  }));
  return months.filter((month): month is TravelMonth => month !== null)
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

function travelMonthFields(month: TravelMonth): Record<string, Record<string, unknown>> {
  return { year: toFirestoreValue(month.year), month: toFirestoreValue(month.month) };
}

function travelReceiptFields(receipt: TravelReceipt): Record<string, Record<string, unknown>> {
  return {
    id: toFirestoreValue(receipt.id),
    date: toFirestoreValue(receipt.date),
    description: toFirestoreValue(receipt.description),
    amount: toFirestoreValue(receipt.amount),
    createdAt: toFirestoreValue(receipt.createdAt),
  };
}

async function saveIntakeFormToFirestore(currentUser: User, childId: string, formName: string, answers: Record<string, string>): Promise<void> {
  const path = `users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(childId)}/intakeForms/${encodeURIComponent(safeFirestoreId(formName))}`;
  await patchFirestoreDocument(currentUser, path, {
    formName: toFirestoreValue(formName),
    answers: toFirestoreObject(answers),
    updatedAt: toFirestoreValue(Date.now()),
  });
}

async function fetchIntakeFormsFromFirestore(currentUser: User, childId: string): Promise<Record<string, Record<string, string>>> {
  const path = `users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(childId)}/intakeForms?pageSize=100`;
  const documents = await listFirestoreDocuments(currentUser, path);
  return Object.fromEntries(documents.map((document: any) => {
    const fields = document?.fields ?? {};
    const formName = String(fromFirestoreValue(fields.formName) ?? document?.name?.split("/").pop() ?? "");
    const answers = fromFirestoreObject(fields.answers);
    return [formName, (answers && typeof answers === "object" ? answers : {}) as Record<string, string>];
  }));
}

async function saveDocumentUrlToFirestore(
  currentUser: User,
  childId: string,
  documentName: string,
  imageUrl: string
): Promise<void> {
  const path = `users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(childId)}/documents/${encodeURIComponent(safeFirestoreId(documentName))}`;
  await patchFirestoreDocument(currentUser, path, {
    documentName: toFirestoreValue(documentName),
    imageUrl: toFirestoreValue(imageUrl),
    updatedAt: toFirestoreValue(Date.now()),
  });
}

async function fetchDocumentUrlsFromFirestore(
  currentUser: User,
  childId: string
): Promise<Record<string, string>> {
  const path = `users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(childId)}/documents?pageSize=100`;
  const documents = await listFirestoreDocuments(currentUser, path);
  return Object.fromEntries(
    documents.map((document: any) => {
      const fields = document?.fields ?? {};
      const documentName = String(
        fromFirestoreValue(fields.documentName) ??
        document?.name?.split("/").pop() ??
        ""
      );
      const imageUrl = String(fromFirestoreValue(fields.imageUrl) ?? "");
      return [documentName, imageUrl];
    }).filter(([name, url]) => Boolean(name && url))
  );
}

async function deleteDocumentUrlFromFirestore(
  currentUser: User,
  childId: string,
  documentName: string
): Promise<void> {
  const path = `users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(childId)}/documents/${encodeURIComponent(safeFirestoreId(documentName))}`;
  await deleteFirestoreDocument(currentUser, path);
}

async function addTrackingEntryToFirestore(currentUser: User, childId: string, formName: string, answers: Record<string, string>): Promise<TrackingEntry> {
  const entryId = createFirestoreDocumentId();
  const entry: TrackingEntry = { ...answers } as TrackingEntry;
  const path = `users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(childId)}/tracking/${encodeURIComponent(safeFirestoreId(formName))}/entries/${encodeURIComponent(entryId)}`;
  await patchFirestoreDocument(currentUser, path, {
    formName: toFirestoreValue(formName),
    answers: toFirestoreObject(answers),
    createdAt: toFirestoreValue(Date.now()),
  });
  return entry;
}

async function fetchTrackingEntriesFromFirestore(currentUser: User, childId: string, formName: string): Promise<TrackingEntry[]> {
  const path = `users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(childId)}/tracking/${encodeURIComponent(safeFirestoreId(formName))}/entries?pageSize=300`;
  const documents = await listFirestoreDocuments(currentUser, path);
  return documents.map((document: any) => {
    const answers = fromFirestoreObject(document?.fields?.answers);
    return (answers && typeof answers === "object" ? answers : {}) as TrackingEntry;
  });
}

function childToFirestoreFields(child: Child): Record<string, Record<string, unknown>> {
  return {
    id: toFirestoreValue(child.id),
    name: toFirestoreValue(child.name),
    age: toFirestoreValue(child.age),
    gender: toFirestoreValue(child.gender),
    status: toFirestoreValue(child.status),
    dateOfBirth: toFirestoreValue(child.dateOfBirth),
    admissionDate: toFirestoreValue(child.admissionDate),
    guardianName: toFirestoreValue(child.guardianName),
    guardianContact: toFirestoreValue(child.guardianContact),
    profilePhotoUri: toFirestoreValue(child.profilePhotoUri),
    createdAt: toFirestoreValue(child.createdAt),
  };
}

function firestoreDocumentToChild(document: any): Child {
  const fields = document?.fields ?? {};
  return {
    id: document?.name?.split("/").pop() ?? String(fromFirestoreValue(fields.id) ?? ""),
    name: String(fromFirestoreValue(fields.name) ?? ""),
    age: String(fromFirestoreValue(fields.age) ?? ""),
    gender: String(fromFirestoreValue(fields.gender) ?? ""),
    status: String(fromFirestoreValue(fields.status) ?? "Active"),
    dateOfBirth: String(fromFirestoreValue(fields.dateOfBirth) ?? ""),
    admissionDate: String(fromFirestoreValue(fields.admissionDate) ?? ""),
    guardianName: String(fromFirestoreValue(fields.guardianName) ?? ""),
    guardianContact: String(fromFirestoreValue(fields.guardianContact) ?? ""),
    profilePhotoUri: String(fromFirestoreValue(fields.profilePhotoUri) ?? ""),
    createdAt: Number(fromFirestoreValue(fields.createdAt) ?? 0),
  };
}

async function firestoreRestRequest(
  currentUser: User,
  url: string,
  init: RequestInit = {}
): Promise<any> {
  const idToken = await currentUser.getIdToken();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!response.ok) {
      const firebaseMessage = body?.error?.message;
      throw new Error(
        firebaseMessage
          ? `Firestore error ${response.status}: ${firebaseMessage}`
          : `Firestore request failed (${response.status}).`
      );
    }

    return body;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Firebase request timed out. The browser could not reach Firestore.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchChildrenFromFirestore(currentUser: User): Promise<Child[]> {
  const url = `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(currentUser.uid)}/children?pageSize=300`;
  const response = await firestoreRestRequest(currentUser, url);
  const documents = Array.isArray(response?.documents) ? response.documents : [];
  return documents
    .map(firestoreDocumentToChild)
    .sort((a: Child, b: Child) => b.createdAt - a.createdAt);
}

async function patchChildInFirestore(currentUser: User, child: Child): Promise<void> {
  const url = `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(child.id)}`;
  await firestoreRestRequest(currentUser, url, {
    method: "PATCH",
    body: JSON.stringify({
      fields: childToFirestoreFields(child),
    }),
  });
}

async function deleteChildFromFirestore(currentUser: User, childId: string): Promise<void> {
  const url = `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(currentUser.uid)}/children/${encodeURIComponent(childId)}`;
  await firestoreRestRequest(currentUser, url, { method: "DELETE" });
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const isLoggedIn = firebaseUser !== null;

  // Firebase Authentication is the single source of truth for login state.
  // This keeps the web app in sync with the same Firebase account used by Android.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Website security behavior:
  // Do NOT log out while the website is open/visible.
  // When Chrome puts the page into the background (including minimizing
  // the browser), immediately sign the user out.
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void signOut(auth).catch((error) => {
          console.error("Automatic logout error:", error);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn]);
  const [selectedTab, setSelectedTab] =
    useState<Tab>("dashboard");

  const [children, setChildren] = useState<Child[]>([]);

  const [donations, setDonations] = useState<Donation[]>([]);

  const [selectedChild, setSelectedChild] =
    useState<Child | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setChildren([]);
      setSelectedChild(null);
      return;
    }

    let cancelled = false;

    const syncChildren = async () => {
      try {
        const cloudChildren = await fetchChildrenFromFirestore(firebaseUser);
        if (cancelled) return;

        setChildren(cloudChildren);
        setSelectedChild((current) => {
          if (!current) return null;
          return cloudChildren.find((child) => child.id === current.id) ?? null;
        });
      } catch (error) {
        console.error("Firestore children sync error:", error);
      }
    };

    void syncChildren();
    const intervalId = window.setInterval(() => {
      void syncChildren();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) {
      setDonations([]);
      return;
    }

    let cancelled = false;
    const syncDonations = async () => {
      try {
        const cloudDonations = await fetchDonationsFromFirestore(firebaseUser);
        if (!cancelled) setDonations(cloudDonations);
      } catch (error) {
        console.error("Firestore donations sync error:", error);
      }
    };

    void syncDonations();
    const intervalId = window.setInterval(() => void syncDonations(), 3000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, [firebaseUser]);

  async function addDonation(donation: Omit<Donation, "id" | "receiptNumber" | "date" | "createdAt">) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No Firebase user is signed in. Please log in again.");

    const maxReceipt = donations.reduce((max, item) => {
      const number = Number.parseInt(item.receiptNumber, 10);
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 0);

    const now = new Date();
    const date = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " • " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const newDonation: Donation = { ...donation, id: createFirestoreDocumentId(), receiptNumber: String(maxReceipt + 1).padStart(4, "0"), date, createdAt: Date.now() };

    await patchDonationInFirestore(currentUser, newDonation);
    setDonations((current) => [newDonation, ...current]);
  }

  async function updateDonation(updated: Donation) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await patchDonationInFirestore(currentUser, updated);
    setDonations((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  async function deleteDonation(donationId: string) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await deleteFirestoreDocument(currentUser, `donations/${encodeURIComponent(donationId)}`);
    setDonations((current) => current.filter((item) => item.id !== donationId));
  }

  async function addChild(child: Child): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No Firebase user is signed in. Please log in again.");
    }

    const childId = createFirestoreDocumentId();
    const newChild: Child = {
      ...child,
      id: childId,
      createdAt: Date.now(),
      status: "Active",
      profilePhotoUri: "",
    };

    try {
      await patchChildInFirestore(currentUser, newChild);
      console.log("Child successfully saved to Firestore REST API:", childId);
    } catch (error: any) {
      console.error("Firestore REST add child error:", error);
      throw new Error(
        error?.message || "Failed to save the child to Firebase."
      );
    }
  }

  async function deleteChild(child: Child) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await deleteChildFromFirestore(currentUser, child.id);
      setSelectedChild(null);
    } catch (error) {
      console.error("Firestore REST delete child error:", error);
    }
  }

  async function updateChild(updatedChild: Child): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No Firebase user is signed in. Please log in again.");
    }

    try {
      await patchChildInFirestore(currentUser, updatedChild);
      setSelectedChild(updatedChild);
    } catch (error) {
      console.error("Firestore REST update child error:", error);
      throw error;
    }
  }

  function handleTabChange(tab: Tab) {
    setSelectedTab(tab);
    setSelectedChild(null);
  }

  if (showSplash) {
    return <SplashScreen onTimeout={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <div className="app">
      {/* Decorative shelter background — shown only after login. */}
      <div className="app-background-art" aria-hidden="true" />

      {/* TOP BAR */}
      <header className="top-bar">

        <div className="brand">

          <img
            src="/app_logo.png"
            alt="Aruna Children Shelter Logo"
            className="app-logo"
          />

          <span className="brand-name">
            Aruna Children Shelter
          </span>

        </div>

        <button
          className="logout-button"
          aria-label="Logout"
         onClick={async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
   await signOut(auth);
  }
}}
        >
          <LogoutIcon />
        </button>

      </header>

      {/* BACK BUTTON — dashboard is the root screen, so it has no back button. */}
      {(selectedTab !== "dashboard" || selectedChild) && (
        <div className="back-navigation-row">
          <button
            type="button"
            className="app-back-button"
            onClick={() => {
              if (selectedChild) {
                setSelectedChild(null);
              } else {
                setSelectedTab("dashboard");
              }
            }}
            aria-label="Back to previous screen"
          >
            ← Back
          </button>
        </div>
      )}


      {/* MAIN CONTENT */}
      <main className="main-content">

        {selectedChild ? (

          <ChildProfileScreen
            child={selectedChild}
            onBack={() => setSelectedChild(null)}
            onDeleteChild={deleteChild}
            onUpdateChild={updateChild}
          />

        ) : (

          <>
            {selectedTab === "dashboard" && (
              <DashboardScreen
                children={children}
                donations={donations}
              />
            )}

            {selectedTab === "children" && (
              <ChildrenScreen
                children={children}
                onAddChild={addChild}
                onChildClick={setSelectedChild}
              />
            )}

            {selectedTab === "donations" && (
              <DonationsScreen
                donations={donations}
                onAddDonation={addDonation}
                onUpdateDonation={updateDonation}
                onDeleteDonation={deleteDonation}
              />
            )}

            {selectedTab === "travel" && (
              <TravelReceiptScreen />
            )}
          </>

        )}

      </main>


      {/* BOTTOM NAVIGATION */}
      {!selectedChild && (
        <nav className="bottom-navigation">

          <NavigationItem
            selected={selectedTab === "dashboard"}
            label="Dashboard"
            onClick={() =>
              handleTabChange("dashboard")
            }
          >
            <HomeIcon />
          </NavigationItem>

          <NavigationItem
            selected={selectedTab === "children"}
            label="Children"
            onClick={() =>
              handleTabChange("children")
            }
          >
            <PeopleIcon />
          </NavigationItem>

          <NavigationItem
            selected={selectedTab === "donations"}
            label="Donations"
            onClick={() =>
              handleTabChange("donations")
            }
          >
            <CurrencyIcon />
          </NavigationItem>

          <NavigationItem
            selected={selectedTab === "travel"}
            label="Traveling Receipt"
            onClick={() =>
              handleTabChange("travel")
            }
          >
            <ReceiptIcon />
          </NavigationItem>

        </nav>
      )}

    </div>
  );
}


/* ========================================================================= */
/* DASHBOARD                                                                */
/* ========================================================================= */

function DashboardScreen({
  children,
  donations,
}: {
  children: Child[];
  donations: Donation[];
}) {
  const activeChildren = children.filter(
    (child) => child.status === "Active"
  );

  const totalDonations = donations.reduce((sum, donation) => {
    if (donation.donationType !== "Monetary") return sum;
    const amount = Number.parseFloat(donation.donationDetails.replace(/[^0-9.]/g, ""));
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  const totalDonors = new Set(
    donations.map((donation) => donation.donor.trim().toLowerCase()).filter(Boolean)
  ).size;

  return (
    <section className="screen dashboard-screen">

      <div className="screen-heading">
        <h1>Dashboard</h1>

        <p>
          Welcome back! Here's what's happening.
        </p>
      </div>


      <MetricCard
        title="Active Children"
        value={activeChildren.length.toString()}
        subtitle="Currently active"
        iconBackground="#3B82F6"
      >
        <PersonIcon />
      </MetricCard>


      <MetricCard
        title="Total Donations"
        value={`₹${totalDonations.toLocaleString("en-IN")}`}
        subtitle="Total amount received"
        iconBackground="#22C55E"
      >
        <CurrencyIcon />
      </MetricCard>


      <MetricCard
        title="Total Donors"
        value={totalDonors.toString()}
        subtitle="People who have supported"
        iconBackground="#F59E0B"
      >
        <HeartIcon />
      </MetricCard>

    </section>
  );
}


function MetricCard({
  title,
  value,
  subtitle,
  iconBackground,
  children,
}: {
  title: string;
  value: string;
  subtitle: string;
  iconBackground: string;
  children: React.ReactNode;
}) {
  return (
    <div className="metric-card">

      <div
        className="metric-icon"
        style={{
          backgroundColor: iconBackground,
        }}
      >
        {children}
      </div>

      <div className="metric-information">

        <div className="metric-title">
          {title}
        </div>

        <div className="metric-value">
          {value}
        </div>

        <div className="metric-subtitle">
          {subtitle}
        </div>

      </div>

    </div>
  );
}


/* ========================================================================= */
/* CHILDREN SCREEN                                                          */
/* ========================================================================= */

function ChildrenScreen({
  children,
  onAddChild,
  onChildClick,
}: {
  children: Child[];
  onAddChild: (child: Child) => Promise<void>;
  onChildClick: (child: Child) => void;
}) {
  const [showAddDialog, setShowAddDialog] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const filteredChildren = useMemo(() => {
    return children
      .filter((child) =>
        child.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
      .sort(
        (a, b) => b.createdAt - a.createdAt
      );
  }, [children, searchQuery]);

  return (
    <section className="screen">

      <div className="screen-heading">

        <h1>Children</h1>

        <p>
          {children.length} children registered
        </p>

      </div>


      <button
        className="primary-button"
        onClick={() =>
          setShowAddDialog(true)
        }
      >
        <PlusIcon />

        <span>Add Child</span>
      </button>


      <div className="children-search-row">

        <div className="search-box">

          <SearchIcon />

          <input
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search children..."
          />

        </div>


        <button
          className="filter-button"
          aria-label="Filter"
        >
          <FilterIcon />
        </button>

      </div>


      <div className="children-list">

        {filteredChildren.map(
          (child, index) => (
            <ChildCardItem
              key={child.id}
              child={child}
              index={index}
              onClick={() =>
                onChildClick(child)
              }
            />
          )
        )}

      </div>


      {showAddDialog && (
  <AddChildDialog
    onDismiss={() =>
      setShowAddDialog(false)
    }
    onSave={async (child) => {
      await onAddChild(child);
      setShowAddDialog(false);
    }}
  />
)}

    </section>
  );
}


/* ========================================================================= */
/* CHILD CARD                                                               */
/* ========================================================================= */

function ChildCardItem({
  child,
  index,
  onClick,
}: {
  child: Child;
  index: number;
  onClick: () => void;
}) {
  const initials = child.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const bgColor =
    avatarColors[index % avatarColors.length];

  return (
    <button
      className="child-card"
      onClick={onClick}
    >

      <div className="child-card-left">

        <div
          className="child-avatar"
          style={{
            backgroundColor: bgColor,
          }}
        >
          {initials}
        </div>


        <div className="child-information">

          <div className="child-name">
            {child.name}
          </div>

          <div className="child-secondary">
            {child.age} years • {child.gender}
          </div>

          <div className="status-badge">
            {child.status}
          </div>

        </div>

      </div>


      <ChevronRightIcon />

    </button>
  );
}


/* ========================================================================= */
/* ADD CHILD DIALOG                                                         */
/* ========================================================================= */

function AddChildDialog({
  onDismiss,
  onSave,
}: {
  onDismiss: () => void;
  onSave: (child: Child) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] =
    useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [admissionDate, setAdmissionDate] =
    useState("");
  const [guardianName, setGuardianName] =
    useState("");
  const [guardianContact, setGuardianContact] =
    useState("");

  function handleDateOfBirthChange(
    value: string
  ) {
    const displayDate =
      formatDateForDisplay(value);

    setDateOfBirth(displayDate);
    setAge(calculateAge(displayDate));
  }

 const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState("");

async function handleSave() {
  if (!name.trim() || !dateOfBirth || !gender || !admissionDate) {
    setSaveError("Please complete all required fields.");
    return;
  }

  setSaveError("");
  setIsSaving(true);

  try {
    await onSave({
      id: "",
      name: name.trim(),
      age,
      gender,
      status: "Active",
      dateOfBirth,
      admissionDate,
      guardianName: guardianName.trim(),
      guardianContact,
      profilePhotoUri: "",
      createdAt: 0,
    });
  } catch (error: any) {
    console.error("Add Child save failed:", error);

    setSaveError(
      error?.message ||
      "Could not save the child to Firebase."
    );
  } finally {
    setIsSaving(false);
  }
}

  return (
    <div className="modal-overlay">

      <div className="modal add-child-modal">

        <div className="modal-header">

          <h2>Add Child Profile</h2>

          <button
            className="modal-close"
            onClick={onDismiss}
          >
            ×
          </button>

        </div>


        <div className="modal-body">

          <TextField
            label="Full name *"
            value={name}
            onChange={setName}
          />


          <DateField
            label="Date of birth *"
            value={dateOfBirth}
            onChange={handleDateOfBirthChange}
          />


          <TextField
            label="Age (calculated automatically)"
            value={age}
            readOnly
            onChange={() => {}}
          />


          <div className="form-field">

            <label>Gender *</label>

            <select
              value={gender}
              onChange={(event) =>
                setGender(event.target.value)
              }
            >
              <option value="">
                Select gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>


          <DateField
            label="Admission date *"
            value={admissionDate}
            onChange={(value) =>
              setAdmissionDate(
                formatDateForDisplay(value)
              )
            }
          />


          <TextField
            label="Guardian name"
            value={guardianName}
            onChange={setGuardianName}
          />


          <TextField
            label="Guardian contact number"
            value={guardianContact}
            type="tel"
            onChange={(value) =>
              setGuardianContact(
                value
                  .replace(/\D/g, "")
                  .slice(0, 10)
              )
            }
          />

        </div>


       {saveError && (
  <div className="login-error" style={{ marginBottom: "12px" }}>
    {saveError}
  </div>
)}

<div className="modal-footer">

  <button
    className="text-button"
    onClick={onDismiss}
    disabled={isSaving}
  >
    Cancel
  </button>

  <button
    className="save-button"
    onClick={handleSave}
    disabled={isSaving}
  >
    {isSaving ? "Saving..." : "Save"}
  </button>

</div>

      </div>

    </div>
  );
}


/* ========================================================================= */
/* TEXT FIELD                                                               */
/* ========================================================================= */

function TextField({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <div className="form-field">

      <label>{label}</label>

      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

    </div>
  );
}


/* ========================================================================= */
/* DATE FIELD                                                               */
/* ========================================================================= */

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = `date-${label.replace(/[^a-z0-9]/gi, "-")}`;

  function openPicker() {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;

    try {
      input.showPicker?.();
    } catch {
      input.click();
    }
  }

  return (
    <div className="form-field">
      <label>{label}</label>

      <button
        type="button"
        className="date-input-wrapper"
        onClick={openPicker}
        aria-label={`Select ${label}`}
      >
        <span className={value ? "date-display" : "date-display placeholder"}>
          {value || "DD/MM/YYYY"}
        </span>

        <input
          id={inputId}
          className="native-date-input"
          type="date"
          value={formatDateForInput(value)}
          onChange={(event) => onChange(event.target.value)}
          tabIndex={-1}
          aria-hidden="true"
        />

        <CalendarIcon />
      </button>
    </div>
  );
}

/* ========================================================================= */
/* CHILD PROFILE                                                            */
/* ========================================================================= */

function ChildProfileScreen({
  child,
  onBack,
  onDeleteChild,
  onUpdateChild,
}: {
  child: Child;
  onBack: () => void;
  onDeleteChild: (child: Child) => void;
  onUpdateChild: (child: Child) => Promise<void>;
}) {
  const [currentSection, setCurrentSection] =
    useState<ProfileSection>("main");

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (currentSection === "tracking") return;

      if (currentSection !== "main") {
        setCurrentSection("main");
      } else {
        onBack();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [currentSection, onBack]);

  if (currentSection !== "main") {
    return (
      <section className="profile-section-screen">

        {currentSection === "admission" && (
          <AdmissionForm
            child={child}
            onBack={() =>
              setCurrentSection("main")
            }
          />
        )}


        {currentSection === "documents" && (
          <DocumentsPlaceholder
            child={child}
            onBack={() =>
              setCurrentSection("main")
            }
          />
        )}


        {currentSection === "tracking" && (
          <TrackingPlaceholder
            child={child}
            onBack={() =>
              setCurrentSection("main")
            }
          />
        )}

      </section>
    );
  }

  return (
    <section className="profile-screen">

      <h1>{child.name}</h1>


      <ProfilePhotoCard
        child={child}
        onUpdateChild={onUpdateChild}
      />


      <PersonalDetailsCard
        child={child}
      />


      <SectionCard
        title="Digital Form"
        subtitle="Admission Form"
        onClick={() =>
          setCurrentSection("admission")
        }
      />


      <SectionCard
        title="Scanned Documents"
        subtitle="Identity, Family Docs, Academics,etc."
        onClick={() =>
          setCurrentSection("documents")
        }
      />


      <SectionCard
        title="Tracking & Care"
        subtitle="Health, Notes"
        onClick={() =>
          setCurrentSection("tracking")
        }
      />


      <button
        className="delete-child-button"
        onClick={() =>
          setShowDeleteDialog(true)
        }
      >
        <TrashIcon />
        Delete Child
      </button>


      {showDeleteDialog && (
        <div className="modal-overlay">

          <div className="modal delete-modal">

            <h2>
              Delete {child.name}?
            </h2>

            <p>
              This will remove this child from
              Aruna Children Shelter.
            </p>


            <div className="modal-footer">

              <button
                className="text-button"
                onClick={() =>
                  setShowDeleteDialog(false)
                }
              >
                Cancel
              </button>

              <button
                className="delete-confirm-button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  onDeleteChild(child);
                }}
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}


/* ========================================================================= */
/* PROFILE PHOTO                                                            */
/* ========================================================================= */

function ProfilePhotoCard({
  child,
  onUpdateChild,
}: {
  child: Child;
  onUpdateChild: (child: Child) => void | Promise<void>;
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [sourceImage, setSourceImage] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  function handleImageFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError("");

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      // Keep the selected/captured original only in browser memory.
      // It is NOT uploaded to Cloudinary.
      setSourceImage(result);
      setShowOptions(false);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
    setFileInputKey((value) => value + 1);
  }

  async function saveCroppedPhoto(dataUrl: string) {
    if (isUploading) return;

    setPhotoError("");
    setIsUploading(true);

    try {
      // dataUrl is the already-cropped 600x600 JPEG generated by the cropper.
      // Only this cropped result is converted to a Blob and uploaded.
      const cloudinaryUrl = await uploadCroppedProfilePhoto(dataUrl, child.id);

      // Firebase receives only the Cloudinary secure_url, never the image data.
      await onUpdateChild({
        ...child,
        profilePhotoUri: cloudinaryUrl,
      });

      setShowCropper(false);
      setSourceImage("");
    } catch (error) {
      console.error("Profile photo upload/save error:", error);
      setPhotoError(
        error instanceof Error
          ? error.message
          : "Could not upload the cropped profile photo."
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function removePhoto() {
    setPhotoError("");

    try {
      // This clears the Firebase URL. The existing Cloudinary asset is not
      // deleted here because unsigned browser uploads cannot securely delete
      // assets without a server-side signed operation.
      await onUpdateChild({ ...child, profilePhotoUri: "" });
    } catch (error) {
      console.error("Remove profile photo error:", error);
      setPhotoError(
        error instanceof Error ? error.message : "Could not remove the photo."
      );
    }
  }

  const initials = child.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="profile-photo-card">
      {child.profilePhotoUri ? (
        <img src={child.profilePhotoUri} alt={`Profile photo of ${child.name}`} className="profile-photo" />
      ) : (
        <div className="profile-photo-placeholder">{initials}</div>
      )}

      <div className="profile-photo-title">Profile Picture</div>

      <div className="profile-photo-actions">
        <button
          className="save-button"
          onClick={() => {
            setPhotoError("");
            setShowOptions(true);
          }}
          disabled={isUploading}
        >
          <EditIcon />
          {isUploading ? "Uploading..." : child.profilePhotoUri ? "Edit Photo" : "Add Photo"}
        </button>
        {child.profilePhotoUri && (
          <button
            className="outline-button"
            onClick={() => void removePhoto()}
            disabled={isUploading}
          >
            Remove
          </button>
        )}
      </div>

      {photoError && (
        <div className="login-error" style={{ marginTop: "12px" }}>
          {photoError}
        </div>
      )}

      {showOptions && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Profile Picture</h2>
            <div className="photo-options">
              <button className="save-button" onClick={() => document.getElementById("profile-camera-input")?.click()}>
                <CameraIcon />
                Take Photo
              </button>
              <button className="outline-button" onClick={() => document.getElementById("profile-gallery-input")?.click()}>
                <GalleryIcon />
                Upload from Gallery
              </button>
            </div>
            <button className="text-button" onClick={() => setShowOptions(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showCropper && sourceImage && (
        <ImageCropperModal
          imageSrc={sourceImage}
          onCancel={() => {
            if (isUploading) return;
            setShowCropper(false);
            setSourceImage("");
          }}
          onSave={saveCroppedPhoto}
          isSaving={isUploading}
        />
      )}

      <input
        key={`gallery-${fileInputKey}`}
        id="profile-gallery-input"
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageFile}
      />
      <input
        id="profile-camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleImageFile}
      />
    </div>
  );
}

function ImageCropperModal({
  imageSrc,
  onCancel,
  onSave,
  isSaving = false,
}: {
  imageSrc: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void | Promise<void>;
  isSaving?: boolean;
}) {
  const cropSize = 300;
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = React.useRef({ x: 0, y: 0 });
  const startOffset = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  const baseScale = image
    ? Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight)
    : 1;

  function clampOffset(x: number, y: number, scale: number) {
    if (!image) return { x, y };
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const maxX = Math.max(0, (width - cropSize) / 2);
    const maxY = Math.max(0, (height - cropSize) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }

  function beginDrag(event: React.PointerEvent<HTMLDivElement>) {
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY };
    startOffset.current = offset;
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const scale = baseScale * zoom;
    const next = clampOffset(
      startOffset.current.x + event.clientX - dragStart.current.x,
      startOffset.current.y + event.clientY - dragStart.current.y,
      scale
    );
    setOffset(next);
  }

  function finishDrag() {
    setDragging(false);
  }

  function changeZoom(value: number) {
    const nextZoom = Math.max(1, Math.min(3, value));
    setZoom(nextZoom);
    setOffset(clampOffset(offset.x, offset.y, baseScale * nextZoom));
  }

  function save() {
    if (!image) return;
    const outputSize = 600;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = baseScale * zoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = (cropSize - drawWidth) / 2 + offset.x;
    const drawY = (cropSize - drawHeight) / 2 + offset.y;
    const factor = outputSize / cropSize;

    ctx.drawImage(image, drawX * factor, drawY * factor, drawWidth * factor, drawHeight * factor);
    onSave(canvas.toDataURL("image/jpeg", 0.88));
  }

  return (
    <div className="modal-overlay cropper-overlay">
      <div className="modal cropper-modal">
        <div className="modal-header">
          <h2>Crop Profile Picture</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <p className="cropper-help">Move the photo and zoom it so the child fits inside the square.</p>

        <div
          className={`cropper-area ${dragging ? "dragging" : ""}`}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onPointerLeave={finishDrag}
        >
          {image && (
            <img
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                width: image.naturalWidth * baseScale * zoom,
                height: image.naturalHeight * baseScale * zoom,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          <div className="cropper-square" />
        </div>

        <div className="cropper-zoom">
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} />
        </div>

        <div className="modal-footer">
          <button className="text-button" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button className="save-button" onClick={save} disabled={!image || isSaving}>
            {isSaving ? "Uploading..." : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* PERSONAL DETAILS                                                         */
/* ========================================================================= */

function PersonalDetailsCard({
  child,
}: {
  child: Child;
}) {
  return (
    <div className="personal-details-card">

      <h2>Personal Details</h2>

      <DetailRow
        label="Date of birth"
        value={child.dateOfBirth}
      />

      <DetailRow
        label="Age"
        value={child.age}
      />

      <DetailRow
        label="Gender"
        value={child.gender}
      />

      <DetailRow
        label="Status"
        value={child.status}
      />

      <DetailRow
        label="Admission date"
        value={child.admissionDate}
      />

      <DetailRow
        label="Guardian"
        value={child.guardianName}
      />

      <DetailRow
        label="Guardian contact"
        value={child.guardianContact}
      />

    </div>
  );
}


function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value) return null;

  return (
    <div className="detail-row">
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
}


/* ========================================================================= */
/* SECTION CARD                                                             */
/* ========================================================================= */

function SectionCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      className="section-card"
      onClick={onClick}
    >

      <div>

        <div className="section-card-title">
          {title}
        </div>

        <div className="section-card-subtitle">
          {subtitle}
        </div>

      </div>

      <ChevronRightIcon />

    </button>
  );
}


/* ========================================================================= */
/* ADMISSION FORM                                                           */
/* ========================================================================= */

function AdmissionForm({
  child,
  onBack,
}: {
  child: Child;
  onBack: () => void;
}) {
  const storageKey = `hopehouse_admission_${child.id}`;
  const [showPreview, setShowPreview] = useState(() => Boolean(localStorage.getItem(storageKey)));
  const [form, setForm] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }

    return {
      "Date of Admission": child.admissionDate,
      "Name of Child": child.name,
      "Age or Date of Birth": child.dateOfBirth,
      "Refer from": "",
      "Mother/Parents Name": child.guardianName,
      "Present Address": "",
      "Permanent Address": "",
      "Mobile no": child.guardianContact,
      "Education status": "",
      "If yes, In which std.": "",
      "Name of School": "",
      "Which medium": "",
      "Health status": "",
      "General Health condition": "",
      "Nutritional status of the child": "",
      "Suffer from any Major Disease": "",
      "Major Disease - which": "",
      "Physically handicapped": "",
      "Any other problem at the time of Admission": "",
      "Who come to meet your child once a month ?": "",
      "Mother Name and Signature": "",
      "Who has recommended for Admission": "",
    };
  });

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const requiredFieldsCompleted =
    Boolean(form["Present Address"]?.trim()) &&
    Boolean(form["Permanent Address"]?.trim()) &&
    Boolean(form["General Health condition"]?.trim()) &&
    Boolean(form["Nutritional status of the child"]?.trim()) &&
    Boolean(form["Suffer from any Major Disease"]?.trim()) &&
    Boolean(form["Physically handicapped"]?.trim());

  async function saveForm() {
    const finalForm = {
      ...form,
      "Major Disease - which": form["Suffer from any Major Disease"] === "Yes" ? form["Major Disease - which"] || "" : "",
    };

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await saveIntakeFormToFirestore(currentUser, child.id, "Admission Form", finalForm);
      localStorage.setItem(storageKey, JSON.stringify(finalForm));
      setForm(finalForm);
      setShowPreview(true);
    } catch (error) {
      console.error("Firestore admission form save error:", error);
      window.alert(error instanceof Error ? error.message : "Failed to save Admission Form to Firebase.");
    }
  }

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !child.id) return;
    void fetchIntakeFormsFromFirestore(currentUser, child.id).then((forms) => {
      const firebaseForm = forms["Admission Form"];
      if (!firebaseForm) return;
      setForm(firebaseForm);
      setShowPreview(true);
      localStorage.setItem(storageKey, JSON.stringify(firebaseForm));
    }).catch((error) => console.error("Firestore admission form load error:", error));
  }, [child.id, storageKey]);

  if (showPreview) {
    return (
      <AdmissionPreview
        child={child}
        form={form}
        onBack={onBack}
        onEdit={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="admission-form">
      <div className="inner-toolbar">
        <h2>Admission Form</h2>
      </div>

      <div className="admission-card">
        <h3>THE SALVATION ARMY, I.W.T</h3>
        <h3>ARUNA CHILDREN's SHELTER</h3>
        <h3 className="purple-text">ADMISSION FORM</h3>
        <p>Photo will be taken automatically from the child's saved profile photo.</p>
      </div>

      <h3 className="form-section-title">Basic Details</h3>
      <FormInput label="Date of Admission" value={form["Date of Admission"]} readOnly onChange={() => {}} />
      <FormInput label="Name of Child" value={form["Name of Child"]} readOnly onChange={() => {}} />
      <FormInput label="Age or Date of Birth" value={form["Age or Date of Birth"]} readOnly onChange={() => {}} />
      <FormInput label="Refer from" value={form["Refer from"]} onChange={(v) => update("Refer from", v)} />
      <FormInput label="Mother/Parents Name" value={form["Mother/Parents Name"]} readOnly onChange={() => {}} />
      <FormInput label="Present Address *" value={form["Present Address"]} minLines={3} onChange={(v) => update("Present Address", v)} />
      <FormInput label="Permanent Address *" value={form["Permanent Address"]} minLines={3} onChange={(v) => update("Permanent Address", v)} />
      <FormInput label="Mobile no" value={form["Mobile no"]} readOnly onChange={() => {}} />

      <h3 className="form-section-title">Education Details</h3>
      <FormInput label="Education status" value={form["Education status"]} onChange={(v) => update("Education status", v)} />
      <FormInput label="If yes, In which std." value={form["If yes, In which std."]} onChange={(v) => update("If yes, In which std.", v)} />
      <FormInput label="Name of School" value={form["Name of School"]} onChange={(v) => update("Name of School", v)} />
      <FormInput label="Which medium" value={form["Which medium"]} onChange={(v) => update("Which medium", v)} />

      <h3 className="form-section-title">Health Details</h3>
      <FormInput label="Health status" value={form["Health status"]} onChange={(v) => update("Health status", v)} />
      <ChoiceRow label="General Health condition *" options={["Good", "Moderate", "Poor"]} selected={form["General Health condition"]} onSelected={(v) => update("General Health condition", v)} />
      <ChoiceRow label="Nutritional status of the child *" options={["Nourished", "Malnutrition"]} selected={form["Nutritional status of the child"]} onSelected={(v) => update("Nutritional status of the child", v)} />
      <ChoiceRow label="Suffer from any Major Disease *" options={["Yes", "No"]} selected={form["Suffer from any Major Disease"]} onSelected={(v) => update("Suffer from any Major Disease", v)} />
      {form["Suffer from any Major Disease"] === "Yes" && (
        <FormInput label="If yes, which disease?" value={form["Major Disease - which"]} onChange={(v) => update("Major Disease - which", v)} />
      )}
      <ChoiceRow label="Physically handicapped *" options={["Yes", "No"]} selected={form["Physically handicapped"]} onSelected={(v) => update("Physically handicapped", v)} />
      <FormInput label="Any other problem at the time of Admission" value={form["Any other problem at the time of Admission"]} minLines={3} onChange={(v) => update("Any other problem at the time of Admission", v)} />

      <h3 className="form-section-title">Family / Approval Details</h3>
      <FormInput label="Who come to meet your child once a month ?" value={form["Who come to meet your child once a month ?"]} onChange={(v) => update("Who come to meet your child once a month ?", v)} />
      <FormInput label="Mother Name and Signature" value={form["Mother Name and Signature"]} onChange={(v) => update("Mother Name and Signature", v)} />
      <FormInput label="Who has recommended for Admission" value={form["Who has recommended for Admission"]} onChange={(v) => update("Who has recommended for Admission", v)} />

      {!requiredFieldsCompleted && <p className="required-warning">Complete all fields marked with * to save the Admission Form.</p>}

      <button className="primary-button" disabled={!requiredFieldsCompleted} onClick={saveForm}>
        Save Admission Form
      </button>
    </div>
  );
}

function AdmissionPreview({
  child,
  form,
  
  onEdit,
}: {
  child: Child;
  form: Record<string, string>;
  onBack: () => void;
  onEdit: () => void;
}) {
  function printAdmissionForm() {
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) return;

    const sections: Array<[string, string[]]> = [
      ["Basic Details", ["Date of Admission", "Name of Child", "Age or Date of Birth", "Refer from", "Mother/Parents Name", "Present Address", "Permanent Address", "Mobile no"]],
      ["Education Details", ["Education status", "If yes, In which std.", "Name of School", "Which medium"]],
      ["Health Details", ["Health status", "General Health condition", "Nutritional status of the child", "Suffer from any Major Disease", "Major Disease - which", "Physically handicapped", "Any other problem at the time of Admission"]],
      ["Family / Approval Details", ["Who come to meet your child once a month ?", "Mother Name and Signature", "Who has recommended for Admission"]],
    ];

    const sectionHtml = sections.map(([title, keys]) => `
      <section class="section">
        <h2>${escapeHtml(title)}</h2>
        <table>
          <tbody>
            ${keys.map((key) => `
              <tr>
                <th>${escapeHtml(key)}</th>
                <td>${escapeHtml(form[key] || "—").replace(/\n/g, "<br>")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    `).join("");

    const photoHtml = child.profilePhotoUri
      ? `<img src="${escapeHtml(child.profilePhotoUri)}" alt="Child" class="child-photo" />`
      : `<div class="child-photo placeholder">${escapeHtml(child.name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase())}</div>`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Admission Form - ${escapeHtml(child.name)}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #fff; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 10px; }
            .page { width: 100%; }
            .letterhead {
              display: grid;
              grid-template-columns: 22mm 1fr 26mm;
              align-items: center;
              gap: 4mm;
              padding-bottom: 4mm;
              border-bottom: 1.5px solid #222;
            }
            .logo { width: 18mm; height: 18mm; object-fit: contain; }
            .head-text { text-align: center; }
            .org { font-size: 13px; font-weight: 700; }
            .shelter { font-size: 11px; font-weight: 700; margin-top: 1.5mm; }
            .title { font-size: 12px; font-weight: 700; margin-top: 1.5mm; }
            .child-photo { width: 22mm; height: 22mm; object-fit: cover; border: 1px solid #555; }
            .child-photo.placeholder { display: flex; align-items: center; justify-content: center; background: #f3f3f3; font-size: 14px; font-weight: 700; }
            .subtitle { margin: 3mm 0; font-size: 9px; color: #555; }
            .section { margin-top: 3.5mm; break-inside: avoid; page-break-inside: avoid; }
            .section h2 { margin: 0 0 1.5mm; padding: 1.5mm 2mm; border: 1px solid #333; background: #f4f4f4; font-size: 10px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #777; padding: 1.6mm 2mm; vertical-align: top; line-height: 1.25; }
            th { width: 34%; text-align: left; font-weight: 700; background: #fafafa; }
            td { width: 66%; white-space: normal; overflow-wrap: anywhere; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            .signature { display: flex; justify-content: flex-end; margin-top: 7mm; break-inside: avoid; page-break-inside: avoid; }
            .signature-box { width: 48mm; text-align: center; }
            .signature-line { border-top: 1px solid #222; margin-bottom: 1.5mm; }
            .signature-box span { font-size: 9px; }
            @media print { .page { width: 100%; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="letterhead">
              <img class="logo" src="${window.location.origin}/salvation_army_logo.png" alt="The Salvation Army" />
              <div class="head-text">
                <div class="org">THE SALVATION ARMY, I.W.T</div>
                <div class="shelter">ARUNA CHILDREN's SHELTER</div>
                <div class="title">ADMISSION FORM</div>
              </div>
              ${photoHtml}
            </div>
            <div class="subtitle">Admission record for ${escapeHtml(child.name)}</div>
            ${sectionHtml}
            <div class="signature">
              <div class="signature-box">
                <div class="signature-line"></div>
                <span>Signature &amp; Stamp<br />Officer In Charge</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      window.setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 150);
    };
  }

  return (
    <div className="admission-preview">
      <div className="inner-toolbar no-print">
        <h2>Admission Form</h2>
        <div className="preview-toolbar-actions">
          <button className="outline-button preview-edit-button" onClick={onEdit}>
            <EditIcon />
            <span>Edit</span>
          </button>
          <button className="save-button preview-print-button" onClick={printAdmissionForm}>
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="admission-preview-card">
        <div className="preview-letterhead">
          <img src="/salvation_army_logo.png" alt="The Salvation Army" className="preview-letterhead-logo" />
          <div className="preview-letterhead-text">
            <div className="preview-org">THE SALVATION ARMY, I.W.T</div>
            <div className="preview-shelter">ARUNA CHILDREN's SHELTER</div>
            <div className="preview-title">ADMISSION FORM</div>
          </div>
          {child.profilePhotoUri ? (
            <img src={child.profilePhotoUri} alt="Child" className="preview-child-photo" />
          ) : (
            <div className="preview-child-photo-placeholder">{child.name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}</div>
          )}
        </div>
        <div className="preview-record-subtitle">Admission record for {child.name}</div>

        {[
          ["Basic Details", ["Date of Admission", "Name of Child", "Age or Date of Birth", "Refer from", "Mother/Parents Name", "Present Address", "Permanent Address", "Mobile no"]],
          ["Education Details", ["Education status", "If yes, In which std.", "Name of School", "Which medium"]],
          ["Health Details", ["Health status", "General Health condition", "Nutritional status of the child", "Suffer from any Major Disease", "Major Disease - which", "Physically handicapped", "Any other problem at the time of Admission"]],
          ["Family / Approval Details", ["Who come to meet your child once a month ?", "Mother Name and Signature", "Who has recommended for Admission"]],
        ].map(([section, keys]) => (
          <div className="preview-section" key={section as string}>
            <h3>{section as string}</h3>
            {(keys as string[]).map((key) => (
              <div className="preview-row" key={key}>
                <strong>{key}</strong>
                <span>{form[key] || "—"}</span>
              </div>
            ))}
          </div>
        ))}

        <div className="officer-signature-area">
          <div className="signature-box">
            <div className="signature-line" />
            <span>Signature &amp; Stamp</span>
          </div>
          <div className="officer-label">Officer In Charge</div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* FORM INPUT                                                               */
/* ========================================================================= */

function FormInput({
  label,
  value,
  onChange,
  readOnly = false,
  minLines = 1,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minLines?: number;
}) {
  return (
    <div className="form-field">

      <label>{label}</label>

      <textarea
        value={value}
        readOnly={readOnly}
        rows={minLines}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

    </div>
  );
}


/* ========================================================================= */
/* CHOICE ROW                                                               */
/* ========================================================================= */

function ChoiceRow({
  label,
  options,
  selected,
  onSelected,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelected: (value: string) => void;
}) {
  return (
    <div className="choice-row">

      <div className="choice-label">
        {label}
      </div>

      <div className="choice-options">

        {options.map((option) => (

          <button
            key={option}
            className={
              selected === option
                ? "choice-chip selected"
                : "choice-chip"
            }
            onClick={() =>
              onSelected(option)
            }
          >
            {option}
          </button>

        ))}

      </div>

    </div>
  );
}


/* ========================================================================= */
/* DOCUMENTS — NEXT MODULE                                                 */
/* ========================================================================= */

const DOCUMENT_NAMES = [
  "First Counselling Form",
  "Mission Vatsalya Form",
  "Mother Consent",
  "Case Story",
  "Home Visit Report",
  "Child Aadhaar Card",
  "Mother Aadhaar Card",
  "Address Proof",
  "PAN Card",
  "LC (Leaving Certificate)",
  "Ration Card",
  "Voting Card",
  "Birth Certificate",
  "Bank Passbook",
  "Mark Sheets",
  "Activities Papers",
  "Certificates",
  "Ayushman Card",
  "Letters (School, Holiday, etc.)",
  "Leave Form",
  "Counselling Form",
  "Care Plan",
];

function openStoredDocument(url: string) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

function DocumentsPlaceholder({
  child,
}: {
  child: Child;
  onBack: () => void;
}) {
  const storageKey = `hopehouse_documents_${child.id}`;
  const [documents, setDocuments] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  });
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState("");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !child.id) return;

    void fetchDocumentUrlsFromFirestore(currentUser, child.id)
      .then((cloudDocuments) => {
        setDocuments(cloudDocuments);
        localStorage.setItem(storageKey, JSON.stringify(cloudDocuments));
      })
      .catch((error) => {
        console.error("Firestore documents load error:", error);
      });
  }, [child.id, storageKey]);

  async function uploadDocument(name: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDocumentError("No Firebase user is signed in. Please log in again.");
      return;
    }

    if (uploadingDocument) return;

    setDocumentError("");
    setUploadingDocument(name);

    try {
      // The selected scanned document is uploaded directly to Cloudinary.
      // Nothing is stored as a base64/data URL in Firebase or localStorage.
      const cloudinaryUrl = await uploadDocumentToCloudinary(file, child.id, name);

      // Firebase stores only the Cloudinary secure_url, matching the Android
      // documents/{documentName} schema.
      await saveDocumentUrlToFirestore(currentUser, child.id, name, cloudinaryUrl);

      setDocuments((current) => {
        const next = { ...current, [name]: cloudinaryUrl };
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error("Document upload/save error:", error);
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Could not upload the document."
      );
    } finally {
      setUploadingDocument(null);
    }
  }

  async function removeDocument(name: string) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDocumentError("No Firebase user is signed in. Please log in again.");
      return;
    }

    setDocumentError("");

    try {
      // Remove the Firebase reference. The Cloudinary file itself is retained
      // for now because secure deletion requires a signed/server-side request.
      await deleteDocumentUrlFromFirestore(currentUser, child.id, name);
      setDocuments((current) => {
        const next = { ...current };
        delete next[name];
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error("Document delete error:", error);
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Could not delete the document."
      );
    }
  }

  return (
    <div className="documents-screen">
      <div className="inner-toolbar">
        <h2>Scanned Documents</h2>
      </div>
      <p className="section-description">Identity, Family Docs, Academics,etc.</p>

      {documentError && (
        <div className="login-error" style={{ marginBottom: "14px" }}>
          {documentError}
        </div>
      )}

      <div className="document-list">
        {DOCUMENT_NAMES.map((name, index) => {
          const isUploading = uploadingDocument === name;

          return (
            <div className="document-item" key={name}>
              <div className="document-item-icon"><span>{index + 1}</span></div>
              <div className="document-item-info">
                <div className="document-item-title">{name}</div>
                <div className={documents[name] ? "document-status added" : "document-status"}>
                  {documents[name] ? "Added" : isUploading ? "Uploading..." : "Not added"}
                </div>
              </div>

              {documents[name] ? (
                <div className="document-actions">
                  <button className="outline-button" onClick={() => openStoredDocument(documents[name])}>
                    View
                  </button>
                  <button
                    className="delete-small-button"
                    onClick={() => void removeDocument(name)}
                    disabled={Boolean(uploadingDocument)}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <label className="save-button document-upload-button">
                  {isUploading ? "Uploading..." : "Upload"}
                  {!isUploading && (
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      hidden
                      onChange={(event) => void uploadDocument(name, event)}
                    />
                  )}
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TRACKING_FORMS = ["Height/Weight Chart", "Monthly/Daily Notes"];

type TrackingEntry = {
  DATE: string;
  HEIGHT?: string;
  WEIGHT?: string;
  Notes?: string;
};

function TrackingPlaceholder({
  child,
  onBack,
}: {
  child: Child;
  onBack: () => void;
}) {
  const storageKey = `hopehouse_tracking_${child.id}`;
  const [entries, setEntries] = useState<Record<string, TrackingEntry[]>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  });
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (selectedForm !== null) {
        setSelectedForm(null);
      } else {
        onBack();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedForm, onBack]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !child.id) return;
    void Promise.all(TRACKING_FORMS.map(async (formName) => {
      const loaded = await fetchTrackingEntriesFromFirestore(currentUser, child.id, formName);
      return [formName, loaded] as const;
    })).then((pairs) => {
      const next = Object.fromEntries(pairs) as Record<string, TrackingEntry[]>;
      setEntries(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
    }).catch((error) => console.error("Firestore tracking load error:", error));
  }, [child.id, storageKey]);

  async function saveEntry() {
    if (!selectedForm) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const date = new Date().toLocaleDateString("en-GB");
    const entry: TrackingEntry = selectedForm === "Height/Weight Chart"
      ? { DATE: date, HEIGHT: height.trim(), WEIGHT: weight.trim() }
      : { DATE: date, Notes: notes.trim() };

    try {
      await addTrackingEntryToFirestore(currentUser, child.id, selectedForm, entry);
      const next: Record<string, TrackingEntry[]> = { ...entries, [selectedForm]: [...(entries[selectedForm] || []), entry] };
      setEntries(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setHeight(""); setWeight(""); setNotes("");
    } catch (error) {
      console.error("Firestore tracking save error:", error);
      window.alert(error instanceof Error ? error.message : "Failed to save tracking entry to Firebase.");
    }
  }

  if (selectedForm) {
    const history = entries[selectedForm] || [];
    const isHeightWeight = selectedForm === "Height/Weight Chart";

    return (
      <div className="tracking-screen tracking-detail-screen">
        <div className="inner-toolbar">
          <div>
            <h2>{selectedForm}</h2>
            <p className="tracking-subtitle">{child.name}</p>
          </div>
        </div>

        <div className="tracking-form-card">
          <div className="tracking-form-heading">
            <div>
              <h3>New Entry</h3>
              <p>{isHeightWeight ? "Record the child's height and weight." : "Add a monthly or daily care note."}</p>
            </div>
          </div>

          {isHeightWeight ? (
            <div className="tracking-two-fields">
              <FormInput label="HEIGHT" value={height} onChange={setHeight} />
              <FormInput label="WEIGHT" value={weight} onChange={setWeight} />
            </div>
          ) : (
            <FormInput label="Notes" value={notes} minLines={5} onChange={setNotes} />
          )}

          <button
            className="save-button tracking-submit-button"
            disabled={isHeightWeight ? !(height.trim() && weight.trim()) : !notes.trim()}
            onClick={saveEntry}
          >
            ENTER
          </button>
        </div>

        <div className="tracking-history-section">
          <div className="tracking-history-header">
            <div>
              <h3>Entries</h3>
              <p>{history.length ? `${history.length} saved ${history.length === 1 ? "entry" : "entries"}` : "No entries added yet."}</p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="empty-state compact tracking-empty">
              <h2>No tracking history yet.</h2>
              <p>Add the first entry using the form above.</p>
            </div>
          ) : (
            <div className="tracking-history">
              {[...history].reverse().map((entry, reverseIndex) => {
                const entryNumber = history.length - reverseIndex;
                return (
                  <div className="tracking-history-card" key={`${entry.DATE}-${reverseIndex}`}>
                    <div className="tracking-history-card-header">
                      <span>Entry #{entryNumber}</span>
                      <span>{entry.DATE}</span>
                    </div>
                    <div className="tracking-values">
                      {entry.HEIGHT && <div><span>Height</span><strong>{entry.HEIGHT}</strong></div>}
                      {entry.WEIGHT && <div><span>Weight</span><strong>{entry.WEIGHT}</strong></div>}
                      {entry.Notes && <div className="tracking-note-row"><span>Notes</span><strong>{entry.Notes}</strong></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-screen">
      <div className="inner-toolbar">
        <h2>Tracking & Care</h2>
      </div>
      <p className="section-description">Health, Notes</p>
      <div className="tracking-list">
        {TRACKING_FORMS.map((name) => {
          const count = entries[name]?.length || 0;
          return (
            <button className="tracking-card" key={name} onClick={() => setSelectedForm(name)}>
              <div><div className="section-card-title">{name}</div><div className={count ? "document-status added" : "section-card-subtitle"}>{count ? `${count} entries` : "Not added"}</div></div>
              <ChevronRightIcon />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* OTHER TABS — CURRENTLY PLACEHOLDERS                                      */
/* ========================================================================= */

function DonationsScreen({
  donations,
  onAddDonation,
  onUpdateDonation,
  onDeleteDonation,
}: {
  donations: Donation[];
  onAddDonation: (donation: Omit<Donation, "id" | "receiptNumber" | "date" | "createdAt">) => Promise<void>;
  onUpdateDonation: (donation: Donation) => Promise<void>;
  onDeleteDonation: (id: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [editing, setEditing] = useState(false);
  const [donor, setDonor] = useState("");
  const [type, setType] = useState<Donation["donationType"]>("Monetary");
  const [details, setDetails] = useState("");

  const sortedDonations = useMemo(
    () => [...donations].sort((a, b) => b.createdAt - a.createdAt),
    [donations]
  );

  const totalAmount = donations.reduce((sum, donation) => {
    if (donation.donationType !== "Monetary") return sum;
    const amount = Number.parseFloat(donation.donationDetails.replace(/[^0-9.]/g, ""));
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  function openAdd() {
    setEditing(false);
    setSelectedDonation(null);
    setDonor("");
    setType("Monetary");
    setDetails("");
    setShowForm(true);
  }

  function openEdit(donation: Donation) {
    setEditing(true);
    setSelectedDonation(donation);
    setDonor(donation.donor);
    setType(donation.donationType);
    setDetails(donation.donationDetails);
    setShowForm(true);
  }

  async function saveDonation() {
    if (!donor.trim() || !details.trim()) return;

    if (editing && selectedDonation) {
      await onUpdateDonation({
        ...selectedDonation,
        donor: donor.trim(),
        donationType: type,
        donationDetails: details.trim(),
      });
    } else {
      await onAddDonation({
        donor: donor.trim(),
        donationType: type,
        donationDetails: details.trim(),
      });
    }

    setShowForm(false);
    setSelectedDonation(null);
  }

  function printReceipt(donation: Donation) {
    setSelectedDonation(donation);

    window.setTimeout(() => {
      const receipt = document.querySelector(".print-receipt");
      if (!receipt) {
        window.print();
        return;
      }

      const printWindow = window.open("", "_blank", "width=700,height=900");
      if (!printWindow) {
        window.print();
        return;
      }

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Donation Receipt ${donation.receiptNumber}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              @page { size: A5 portrait; margin: 0; }
              * { box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 0;
                width: 148mm;
                height: 210mm;
                background: #fff;
                font-family: Arial, Helvetica, sans-serif;
              }
              .receipt {
                width: 148mm;
                height: 210mm;
                padding: 16mm 12mm;
                border: 1px solid #d6d6d6;
                background: #fff;
                color: #111;
                overflow: hidden;
              }
              .letterhead {
                display: grid;
                grid-template-columns: 22mm 1fr 22mm;
                gap: 3mm;
                align-items: center;
              }
              .letterhead img {
                width: 18mm;
                height: 18mm;
                object-fit: contain;
                justify-self: start;
              }
              .letterhead .spacer { width: 18mm; height: 18mm; }
              .letterhead-text {
                text-align: center;
                display: flex;
                flex-direction: column;
                gap: 4px;
              }
              .letterhead-text strong { font-size: 15px; }
              .letterhead-text span, .letterhead-text b { font-size: 14px; }
              .letterhead-text b { color: #2563eb; }
              .line { height: 1px; background: #1e293b; margin: 7mm 0; }
              .meta { display: flex; justify-content: space-between; gap: 20px; }
              .meta div { display: flex; flex-direction: column; gap: 4px; }
              .meta div:last-child { align-items: flex-end; }
              .label { color: #64748b; font-size: 13px; }
              .value { font-size: 16px; font-weight: 700; }
              .field { display: flex; flex-direction: column; gap: 3mm; margin: 10mm 0; }
              .field .value { font-size: 19px; }
              .signature { margin-top: 18mm; margin-left: auto; width: 55mm; text-align: center; }
              .signature-line { border-top: 1px solid #111; }
              .signature span { display: block; margin-top: 7px; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="letterhead">
                <img src="${window.location.origin}/salvation_army_logo.png" alt="The Salvation Army" />
                <div class="letterhead-text">
                  <strong>THE SALVATION ARMY I.W.T.</strong>
                  <span>ARUNA CHILDREN's SHELTER</span>
                  <b>DONATION RECEIPT</b>
                </div>
                <div class="spacer"></div>
              </div>
              <div class="line"></div>
              <div class="meta">
                <div><span class="label">Receipt No.</span><strong class="value">${donation.receiptNumber}</strong></div>
                <div><span class="label">Date</span><strong class="value">${donation.date}</strong></div>
              </div>
              <div class="line"></div>
              <div class="field"><span class="label">Donor Name</span><strong class="value">${escapeHtml(donation.donor)}</strong></div>
              <div class="field"><span class="label">Type of Donation</span><strong class="value">${escapeHtml(donation.donationType)}</strong></div>
              <div class="field">
                <span class="label">${donation.donationType === "Monetary" ? "Amount" : donation.donationType === "Goods" ? "Goods Donated" : "Service Provided"}</span>
                <strong class="value">${donation.donationType === "Monetary" ? "₹" + escapeHtml(donation.donationDetails) : escapeHtml(donation.donationDetails)}</strong>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <span>Signature of In-Charge</span>
              </div>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };
    }, 100);
  }

  return (
    <section className="screen donations-screen">
      <div className="donations-header">
        <div className="screen-heading">
          <h1>Donations</h1>
        </div>
        <button className="donation-add-button" onClick={openAdd} aria-label="Add Donation">
          <PlusIcon />
        </button>
      </div>

      <div className="donation-total-card">
        <span>Total Funds Raised</span>
        <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
      </div>

      {sortedDonations.length === 0 ? (
        <div className="donation-empty">
          <CurrencyIcon />
          <h2>No donations recorded yet.</h2>
          <p>Tap the + button to record a donation.</p>
        </div>
      ) : (
        <div className="donation-list">
          {sortedDonations.map((donation) => {
            const label = donation.donationType === "Monetary"
              ? `Amount: ₹${donation.donationDetails}`
              : donation.donationType === "Goods"
                ? `Goods: ${donation.donationDetails}`
                : `Service: ${donation.donationDetails}`;

            return (
              <button
                key={donation.id}
                className="donation-card"
                onClick={() => setSelectedDonation(donation)}
              >
                <div className="donation-card-top">
                  <strong>{donation.donor}</strong>
                  <span>Receipt No. {donation.receiptNumber}</span>
                </div>
                <div className="donation-divider" />
                <div className="donation-type">Type of Donation: {donation.donationType}</div>
                <div className="donation-details">{label}</div>
                <div className="donation-date">{donation.date}</div>
              </button>
            );
          })}
        </div>
      )}

      {selectedDonation && !showForm && (
        <div className="donation-detail-overlay" onClick={() => setSelectedDonation(null)}>
          <div className="donation-detail-panel" onClick={(event) => event.stopPropagation()}>
            <div className="donation-detail-toolbar">
              <button className="icon-button" onClick={() => setSelectedDonation(null)} aria-label="Close">
                <ChevronRightIcon />
              </button>
              <h2>Donation Receipt</h2>
              <div className="donation-detail-actions">
                <button className="icon-button donation-edit-icon" onClick={() => openEdit(selectedDonation)} aria-label="Edit">
                  <EditIcon />
                </button>
                <button
                  className="icon-button donation-delete-icon"
                  onClick={() => {
                    if (window.confirm(`Delete donation from ${selectedDonation.donor}?`)) {
                      void onDeleteDonation(selectedDonation.id);
                      setSelectedDonation(null);
                    }
                  }}
                  aria-label="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            <div className="donation-receipt-card print-receipt">
              <div className="donation-receipt-letterhead">
                <img src="/salvation_army_logo.png" alt="The Salvation Army" />
                <div>
                  <strong>THE SALVATION ARMY I.W.T.</strong>
                  <span>ARUNA CHILDREN's SHELTER</span>
                  <b>DONATION RECEIPT</b>
                </div>
              </div>
              <div className="donation-receipt-line" />
              <div className="donation-receipt-meta">
                <div><span>Receipt No.</span><strong>{selectedDonation.receiptNumber}</strong></div>
                <div><span>Date</span><strong>{selectedDonation.date}</strong></div>
              </div>
              <div className="donation-receipt-line" />
              <div className="donation-receipt-field"><span>Donor Name</span><strong>{selectedDonation.donor}</strong></div>
              <div className="donation-receipt-field"><span>Type of Donation</span><strong>{selectedDonation.donationType}</strong></div>
              <div className="donation-receipt-field">
                <span>{selectedDonation.donationType === "Monetary" ? "Amount" : selectedDonation.donationType === "Goods" ? "Goods Donated" : "Service Provided"}</span>
                <strong>{selectedDonation.donationType === "Monetary" ? `₹${selectedDonation.donationDetails}` : selectedDonation.donationDetails}</strong>
              </div>
              <div className="donation-signature">
                <div />
                <span>Signature of In-Charge</span>
              </div>
            </div>

            <button className="donation-print-button" onClick={() => printReceipt(selectedDonation)}>
              <PrintIcon />
              <span>Print / Save Slip</span>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="donation-form-overlay" onClick={() => setShowForm(false)}>
          <div className="donation-form-dialog" onClick={(event) => event.stopPropagation()}>
            <h2>{editing ? "Edit Donation" : "Add New Donation"}</h2>

            <label>
              Donor's Name
              <input value={donor} onChange={(event) => setDonor(event.target.value)} autoFocus />
            </label>

            <div className="donation-type-group">
              <span>Type of Donation</span>
              <div className="donation-radio-row">
                {(["Monetary", "Goods", "Services"] as const).map((item) => (
                  <label key={item} className="donation-radio">
                    <input
                      type="radio"
                      name="donation-type"
                      checked={type === item}
                      onChange={() => {
                        setType(item);
                        setDetails("");
                      }}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <label>
              {type === "Monetary" ? "How much amount is being donated?" : type === "Goods" ? "What type of goods are being donated?" : "What type of service is being provided?"}
              <input
                value={details}
                onChange={(event) => setDetails(type === "Monetary" ? event.target.value.replace(/[^0-9.]/g, "") : event.target.value)}
                inputMode={type === "Monetary" ? "decimal" : "text"}
              />
            </label>

            <div className="donation-form-actions">
              <button className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="primary-button donation-save-button" disabled={!donor.trim() || !details.trim()} onClick={saveDonation}>Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TravelReceiptScreen() {
  const [months, setMonths] = useState<TravelMonth[]>(() => {
    try {
      const saved = localStorage.getItem(TRAVEL_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [showMonthDialog, setShowMonthDialog] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState<TravelMonth | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setMonths([]);
      return;
    }
    let cancelled = false;
    const syncTravel = async () => {
      try {
        const cloudMonths = await fetchTravelMonthsFromFirestore(currentUser);
        if (!cancelled) {
          setMonths(cloudMonths);
          localStorage.setItem(TRAVEL_STORAGE_KEY, JSON.stringify(cloudMonths));
        }
      } catch (error) {
        console.error("Firestore travel sync error:", error);
      }
    };
    void syncTravel();
    const intervalId = window.setInterval(() => void syncTravel(), 3000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, []);

  const sortedMonths = useMemo(
    () => [...months].sort((a, b) => b.year - a.year || b.month - a.month),
    [months]
  );

  const selectedMonth = months.find(
    (month) => `${month.year}_${month.month}` === selectedMonthKey
  ) ?? null;

  async function addMonth(year: number, month: number): Promise<boolean> {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    const exists = months.some((item) => item.year === year && item.month === month);
    if (exists) return false;
    const newMonth: TravelMonth = { year, month, receipts: [] };
    const key = `${year}_${month}`;
    try {
      await patchFirestoreDocument(currentUser, `travel_months/${encodeURIComponent(key)}`, travelMonthFields(newMonth));
      setMonths((current) => [...current, newMonth]);
      setShowMonthDialog(false);
      return true;
    } catch (error) {
      console.error("Firestore travel month save error:", error);
      return false;
    }
  }

  async function deleteMonth(month: TravelMonth) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const key = `${month.year}_${month.month}`;
    try {
      await deleteFirestoreDocument(currentUser, `travel_months/${encodeURIComponent(key)}`);
      setMonths((current) => current.filter((item) => !(item.year === month.year && item.month === month.month)));
      setMonthToDelete(null);
      setSelectedMonthKey(null);
    } catch (error) {
      console.error("Firestore travel month delete error:", error);
    }
  }

  async function updateMonth(updated: TravelMonth) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const key = `${updated.year}_${updated.month}`;
    try {
      await patchFirestoreDocument(currentUser, `travel_months/${encodeURIComponent(key)}`, travelMonthFields(updated));
      setMonths((current) => current.map((item) => item.year === updated.year && item.month === updated.month ? updated : item));
    } catch (error) {
      console.error("Firestore travel month update error:", error);
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (showMonthDialog) {
        setShowMonthDialog(false);
        return;
      }
      if (monthToDelete) {
        setMonthToDelete(null);
        return;
      }
      if (selectedMonth) {
        setSelectedMonthKey(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMonthDialog, monthToDelete, selectedMonth]);

  if (selectedMonth) {
    return (
      <TravelReceiptMonthScreen
        month={selectedMonth}
        onBack={() => setSelectedMonthKey(null)}
        onUpdateMonth={updateMonth}
      />
    );
  }

  return (
    <section className="screen travel-screen">
      <div className="screen-heading">
        <h1>Traveling Receipt</h1>
      </div>

      <button
        className="primary-button travel-add-month-button"
        onClick={() => setShowMonthDialog(true)}
      >
        <PlusIcon />
        <span>Add Travel Month</span>
      </button>

      {sortedMonths.length === 0 ? (
        <div className="travel-empty-state">
          <CalendarIcon />
          <h2>No travel months added yet</h2>
          <p>Tap 'Add Travel Month' to record receipts.</p>
        </div>
      ) : (
        <div className="travel-month-list">
          {sortedMonths.map((month) => {
            const key = `${month.year}_${month.month}`;
            const total = month.receipts.reduce(
              (sum, receipt) => sum + (Number.parseFloat(receipt.amount) || 0),
              0
            );

            return (
              <div className="travel-month-card" key={key}>
                <button
                  className="travel-month-main"
                  onClick={() => setSelectedMonthKey(key)}
                >
                  <div className="travel-month-icon">
                    <CalendarIcon />
                  </div>
                  <div className="travel-month-info">
                    <strong>{TRAVEL_MONTH_NAMES[month.month - 1]} {month.year}</strong>
                    <span>{month.receipts.length} {month.receipts.length === 1 ? "receipt" : "receipts"}</span>
                    {month.receipts.length > 0 && (
                      <small>Total: ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</small>
                    )}
                  </div>
                  <ChevronRightIcon />
                </button>
                <button
                  className="travel-delete-button"
                  onClick={() => setMonthToDelete(month)}
                  aria-label={`Delete ${TRAVEL_MONTH_NAMES[month.month - 1]} ${month.year}`}
                >
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showMonthDialog && (
        <AddTravelMonthDialog
          existingMonths={months}
          onDismiss={() => setShowMonthDialog(false)}
          onSave={addMonth}
        />
      )}

      {monthToDelete && (
        <div className="modal-overlay" onClick={() => setMonthToDelete(null)}>
          <div className="travel-confirm-dialog" onClick={(event) => event.stopPropagation()}>
            <h2>Delete Travel Month?</h2>
            <p>
              This will remove {TRAVEL_MONTH_NAMES[monthToDelete.month - 1]} {monthToDelete.year} and all its receipts.
            </p>
            <div className="travel-dialog-actions">
              <button className="travel-cancel-button" onClick={() => setMonthToDelete(null)}>Cancel</button>
              <button className="travel-danger-button" onClick={() => deleteMonth(monthToDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AddTravelMonthDialog({
  existingMonths,
  onDismiss,
  onSave,
}: {
  existingMonths: TravelMonth[];
  onDismiss: () => void;
  onSave: (year: number, month: number) => Promise<boolean>;
}) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [error, setError] = useState("");

  async function save() {
    const parsedYear = Number(year);
    const parsedMonth = Number(month);

    if (!/^\d{4}$/.test(year) || parsedYear < 2000 || parsedYear > 2100) {
      setError("Please enter a valid year.");
      return;
    }

    if (existingMonths.some((item) => item.year === parsedYear && item.month === parsedMonth)) {
      setError("This travel month has already been added.");
      return;
    }

    const saved = await onSave(parsedYear, parsedMonth);
    if (!saved) setError("Could not save this travel month to Firebase.");
  }

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="travel-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>Add Travel Month</h2>
        <p className="travel-dialog-subtitle">Select the year and month you want to record.</p>

        <label className="travel-field-label">
          Year
          <input
            className="travel-input"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) => { setYear(event.target.value); setError(""); }}
          />
        </label>

        <label className="travel-field-label">
          Month
          <select
            className="travel-input"
            value={month}
            onChange={(event) => { setMonth(event.target.value); setError(""); }}
          >
            {TRAVEL_MONTH_NAMES.map((name, index) => (
              <option value={index + 1} key={name}>{name}</option>
            ))}
          </select>
        </label>

        {error && <p className="travel-form-error">{error}</p>}

        <div className="travel-dialog-actions">
          <button className="travel-cancel-button" onClick={onDismiss}>Cancel</button>
          <button className="travel-save-button" onClick={save}>Add</button>
        </div>
      </div>
    </div>
  );
}

function TravelReceiptMonthScreen({
  month,
  onBack,
  onUpdateMonth,
}: {
  month: TravelMonth;
  onBack: () => void;
  onUpdateMonth: (month: TravelMonth) => void;
}) {
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<TravelReceipt | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showAddReceipt) {
          setShowAddReceipt(false);
        } else if (receiptToDelete) {
          setReceiptToDelete(null);
        } else {
          onBack();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddReceipt, receiptToDelete, onBack]);

  async function addReceipt(receipt: Omit<TravelReceipt, "id" | "createdAt">) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const newReceipt: TravelReceipt = { ...receipt, id: createFirestoreDocumentId(), createdAt: Date.now() };
    const key = `${month.year}_${month.month}`;
    try {
      await patchFirestoreDocument(currentUser, `travel_months/${encodeURIComponent(key)}/receipts/${encodeURIComponent(newReceipt.id)}`, travelReceiptFields(newReceipt));
      onUpdateMonth({ ...month, receipts: [...month.receipts, newReceipt] });
      setShowAddReceipt(false);
    } catch (error) {
      console.error("Firestore travel receipt save error:", error);
      window.alert(error instanceof Error ? error.message : "Failed to save travel receipt to Firebase.");
    }
  }

  async function deleteReceipt(receipt: TravelReceipt) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const key = `${month.year}_${month.month}`;
    try {
      await deleteFirestoreDocument(currentUser, `travel_months/${encodeURIComponent(key)}/receipts/${encodeURIComponent(receipt.id)}`);
      onUpdateMonth({ ...month, receipts: month.receipts.filter((item) => item.id !== receipt.id) });
      setReceiptToDelete(null);
    } catch (error) {
      console.error("Firestore travel receipt delete error:", error);
    }
  }

  function printTravelReceipt() {
    const printWindow = window.open("", "_blank", "width=700,height=900");
    if (!printWindow) return;

    const total = month.receipts.reduce(
      (sum, receipt) => sum + (Number.parseFloat(receipt.amount) || 0),
      0
    );

    const rows = month.receipts.map((receipt, index) => `
      <tr>
        <td class="no">${index + 1}</td>
        <td>${escapeHtml(receipt.date)}</td>
        <td>${escapeHtml(receipt.description)}</td>
        <td class="amount">₹${escapeHtml(receipt.amount)}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Traveling Receipt - ${TRAVEL_MONTH_NAMES[month.month - 1]} ${month.year}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #fff; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #111;
              width: 100%;
              font-size: 11px;
            }
            .receipt {
              width: 100%;
              min-height: 250mm;
              margin: 0;
              padding: 8mm;
              border: 1px solid #222;
            }
            .header {
              display: grid;
              grid-template-columns: 28mm 1fr 28mm;
              align-items: center;
              min-height: 25mm;
              margin-bottom: 4mm;
            }
            .header img {
              width: 21mm;
              height: 21mm;
              object-fit: contain;
              justify-self: start;
            }
            .header-copy { text-align: center; }
            .header strong { display: block; font-size: 16px; line-height: 1.2; }
            .header span { display: block; font-size: 12px; font-weight: 700; margin-top: 1.5mm; }
            .header b { display: block; font-size: 13px; margin-top: 1.5mm; }
            .header-spacer { width: 21mm; height: 21mm; }
            .line { border-top: 1.5px solid #222; margin: 2mm 0 3mm; }
            .month { text-align: center; font-size: 13px; font-weight: 700; margin-bottom: 4mm; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
            th, td {
              padding: 3mm 2.5mm;
              text-align: left;
              vertical-align: top;
              overflow-wrap: anywhere;
              border: 1px solid #555;
            }
            thead th { background: #f2f2f2; border: 1px solid #333; }
            tbody tr:nth-child(even) td { background: #fafafa; }
            th { font-size: 10.5px; font-weight: 700; }
            .no { width: 9%; text-align: center; }
            th:nth-child(2), td:nth-child(2) { width: 18%; }
            th:nth-child(3), td:nth-child(3) { width: 48%; }
            th:last-child, td:last-child { width: 25%; }
            .amount { text-align: right; white-space: nowrap; }
            .total {
              display: flex;
              justify-content: flex-end;
              gap: 10mm;
              margin-top: 5mm;
              padding: 3mm 2.5mm;
              border: 1px solid #333;
              font-size: 12px;
              font-weight: 700;
              background: #f7f7f7;
            }
            @media print {
              html, body { width: auto; }
              .receipt { width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <img src="${window.location.origin}/salvation_army_logo.png" alt="The Salvation Army" />
              <div class="header-copy">
                <strong>THE SALVATION ARMY I.W.T.</strong>
                <span>ARUNA CHILDREN's SHELTER</span>
                <b>TRAVELING RECEIPT</b>
              </div>
              <div class="header-spacer"></div>
            </div>
            <div class="line"></div>
            <div class="month">${TRAVEL_MONTH_NAMES[month.month - 1]} ${month.year}</div>
            <table>
              <thead><tr><th class="no">No.</th><th>Date</th><th>Details / Sentence</th><th>Traveling Expense</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="total"><span>TOTAL AMOUNT</span><span>₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  }

  const totalAmount = month.receipts.reduce(
    (sum, receipt) => sum + (Number.parseFloat(receipt.amount) || 0),
    0
  );

  return (
    <section className="screen travel-month-screen">
      <div className="travel-month-heading">
        <div>
          <h1>{TRAVEL_MONTH_NAMES[month.month - 1]} {month.year}</h1>
          <p>Travel receipts for this month</p>
        </div>
      </div>

      <div className="travel-action-row">
        <button className="primary-button travel-add-receipt-button" onClick={() => setShowAddReceipt(true)}>
          <PlusIcon />
          <span>Add Receipt</span>
        </button>
        <button
          className="travel-icon-action"
          onClick={printTravelReceipt}
          disabled={month.receipts.length === 0}
          title="Print / Save PDF"
        >
          <PrintIcon />
        </button>
      </div>

      {month.receipts.length === 0 ? (
        <div className="travel-empty-state travel-receipts-empty">
          <ReceiptIcon />
          <h2>No receipts found for {TRAVEL_MONTH_NAMES[month.month - 1]} {month.year}</h2>
          <p>Tap 'Add Receipt' to record a travel expense.</p>
        </div>
      ) : (
        <div className="travel-receipt-list">
          {month.receipts.map((receipt, index) => (
            <div className="travel-receipt-card" key={receipt.id}>
              <div className="travel-receipt-card-top">
                <div className="travel-entry-number">Entry {index + 1}</div>
                <span className="travel-date-pill">{receipt.date}</span>
                <button
                  className="travel-delete-small"
                  onClick={() => setReceiptToDelete(receipt)}
                  aria-label="Delete receipt"
                >
                  <TrashIcon />
                </button>
              </div>
              <div className="travel-receipt-details">
                <div>
                  <span>Details / Sentence</span>
                  <strong>{receipt.description}</strong>
                </div>
                <div>
                  <span>Traveling Expense</span>
                  <strong>₹{receipt.amount}</strong>
                </div>
              </div>
            </div>
          ))}

          <div className="travel-total-card">
            <span>Total Amount</span>
            <strong>₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      )}

      {showAddReceipt && (
        <AddTravelReceiptDialog
          month={month}
          onDismiss={() => setShowAddReceipt(false)}
          onSave={addReceipt}
        />
      )}

      {receiptToDelete && (
        <div className="modal-overlay" onClick={() => setReceiptToDelete(null)}>
          <div className="travel-confirm-dialog" onClick={(event) => event.stopPropagation()}>
            <h2>Delete Receipt?</h2>
            <p>Are you sure you want to delete this travel entry?</p>
            <div className="travel-dialog-actions">
              <button className="travel-cancel-button" onClick={() => setReceiptToDelete(null)}>Cancel</button>
              <button className="travel-danger-button" onClick={() => deleteReceipt(receiptToDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TravelMonthCalendar({
  year,
  month,
  selectedDate,
  onSelect,
}: {
  year: number;
  month: number;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const openDatePicker = () => {
    const input = inputRef.current;
    if (!input) return;

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    }
  };

  return (
    <div className="travel-date-picker">
      <button
        type="button"
        className="travel-date-button"
        onClick={openDatePicker}
        aria-label={`Select date in ${TRAVEL_MONTH_NAMES[month - 1]} ${year}`}
      >
        <CalendarIcon />
        <span className={`travel-date-display${selectedDate ? "" : " is-placeholder"}`}>
          {selectedDate ? formatDateForDisplay(selectedDate) : "Select date"}
        </span>
      </button>

      <input
        ref={inputRef}
        type="date"
        className="travel-date-native-input"
        value={selectedDate}
        min={monthStart}
        max={monthEnd}
        onChange={(event) => onSelect(event.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}


function AddTravelReceiptDialog({
  month,
  onDismiss,
  onSave,
}: {
  month: TravelMonth;
  onDismiss: () => void;
  onSave: (receipt: Omit<TravelReceipt, "id" | "createdAt">) => void;
}) {
  // Start empty so the user must choose the actual travel date.
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  const monthStart = `${month.year}-${String(month.month).padStart(2, "0")}-01`;
  const lastDay = new Date(month.year, month.month, 0).getDate();
  const monthEnd = `${month.year}-${String(month.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  function save() {
    if (!date || date < monthStart || date > monthEnd) {
      setError(`Please select a date inside ${TRAVEL_MONTH_NAMES[month.month - 1]} ${month.year}.`);
      return;
    }
    if (!description.trim()) {
      setError("Please enter the travel details.");
      return;
    }
    if (!amount.trim()) {
      setError("Please enter the traveling expense.");
      return;
    }

    onSave({
      date: formatDateForDisplay(date),
      description: description.trim(),
      amount: amount.trim(),
    });
  }

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="travel-dialog travel-receipt-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>Add Traveling Receipt</h2>

        <div className="travel-field-label">
          Date
          <TravelMonthCalendar
            year={month.year}
            month={month.month}
            selectedDate={date}
            onSelect={(selected) => { setDate(selected); setError(""); }}
          />
        </div>

        <label className="travel-field-label">
          Details / Sentence
          <textarea
            className="travel-input travel-textarea"
            rows={3}
            value={description}
            onChange={(event) => { setDescription(event.target.value); setError(""); }}
            placeholder="Enter travel details"
          />
        </label>

        <label className="travel-field-label">
          Traveling Expense (₹)
          <input
            className="travel-input"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value.replace(/[^0-9.]/g, ""));
              setError("");
            }}
            placeholder="Enter amount"
          />
        </label>

        {error && <p className="travel-form-error">{error}</p>}

        <div className="travel-dialog-actions">
          <button className="travel-cancel-button" onClick={onDismiss}>Cancel</button>
          <button className="travel-save-button" onClick={save}>Add</button>
        </div>
      </div>
    </div>
  );
}


/* ========================================================================= */
/* NAVIGATION                                                               */
/* ========================================================================= */

function NavigationItem({
  selected,
  label,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={
        selected
          ? "navigation-item selected"
          : "navigation-item"
      }
      onClick={onClick}
    >

      <span className="navigation-icon">
        {children}
      </span>

      <span className="navigation-label">
        {label}
      </span>

    </button>
  );
}


/* ========================================================================= */
/* ICONS                                                                    */
/* ========================================================================= */

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z" />
    </svg>
  );
}


function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4ZM8 13c-.34 0-.71.02-1.1.05C4.67 13.35 2 14.45 2 17v3h4v-3c0-1.45.68-2.67 2.03-3.58L8 13Z" />
    </svg>
  );
}


function CurrencyIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M13 2v2.07c2.83.25 5 2.64 5 5.56h-2a3.5 3.5 0 0 0-3-3.46v4.02l1.5.5c2.15.72 3.5 2.23 3.5 4.31 0 2.65-2.11 4.75-5 5v2h-2v-2.07c-2.83-.25-5-2.64-5-5.56h2a3.5 3.5 0 0 0 3 3.46v-4.02l-1.5-.5C7.35 12.59 6 11.08 6 9c0-2.65 2.11-4.75 5-5V2h2Zm0 13.5v2.48c1.74-.22 3-1.22 3-2.48 0-1.02-.66-1.7-2-2.17l-1-.33v2.5Zm-2-8.87C9.26 6.85 8 7.85 8 9.11c0 1.02.66 1.7 2 2.17l1 .33V6.63Z" />
    </svg>
  );
}


function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Zm3 4v2h6V6H9Zm0 4v2h6v-2H9Zm0 4v2h4v-2H9Z" />
    </svg>
  );
}


function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3Zm5.59 4.59L14.17 9 16.17 11H8v2h8.17l-2 2 1.42 1.41L20 12l-4.41-4.41Z" />
    </svg>
  );
}


function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z" />
    </svg>
  );
}


function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m12 21-1.45-1.32C5.4 15 2 11.92 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.03 6.03 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.42-3.4 6.5-8.55 11.18L12 21Z" />
    </svg>
  );
}


function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 9V3h12v6h1a3 3 0 0 1 3 3v5h-4v4H6v-4H2v-5a3 3 0 0 1 3-3h1Zm2-4v4h8V5H8Zm6 14v-4H10v4h4Zm4-5h2v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2h2v-1h12v1Z" />
    </svg>
  );
}


function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2Z" />
    </svg>
  );
}


function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m21 19.59-4.35-4.35A7.94 7.94 0 0 0 18 10a8 8 0 1 0-8 8 7.94 7.94 0 0 0 5.24-1.35L19.59 21 21 19.59ZM4 10a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z" />
    </svg>
  );
}


function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 7h10v2H4V7Zm0 8h16v2H4v-2Zm12-4h4v2h-4v-2ZM4 11h8v2H4v-2Z" />
    </svg>
  );
}


function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2Zm12 7H5v11h14V9ZM7 11h3v3H7v-3Zm5 0h3v3h-3v-3Z" />
    </svg>
  );
}


function ChevronRightIcon() {
  return (
    <svg
      className="chevron-icon"
      viewBox="0 0 24 24"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}


function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 7h12l-1 14H7L6 7Zm3-4h6l1 2h4v2H4V5h4l1-2Z" />
    </svg>
  );
}


function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function EditIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m4 17.25V21h3.75L18.81 9.94l-3.75-3.75L4 17.25ZM21 7.75a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75L21 7.75Z" />
    </svg>
  );
}


function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M9 3 7.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2.5L15 3H9Zm3 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
    </svg>
  );
}


function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v10l3-3 3 3 3-4 5 5V5H5Zm3 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}

export default App;