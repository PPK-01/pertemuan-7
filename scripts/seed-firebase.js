const fs = require("fs");
const path = require("path");
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} = require("firebase/auth");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} = require("firebase/firestore");

// Muat variabel environment dari .env di root jika ada
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyApqxMup_RqciM7WgUcoioFGs4EPQYaioA",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "rawuh-presensi.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "rawuh-presensi",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "rawuh-presensi.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "530785331905",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:530785331905:web:81b6025c4d0b8e8df58240",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_PASSWORD = "password123";
const INVITE_CODE = process.env.ASISTEN_INVITE_CODE || process.env.EXPO_PUBLIC_ASISTEN_INVITE_CODE;

if (!INVITE_CODE) {
  console.error("\n❌ [ERROR] Kode undangan asisten belum diset di environment!");
  console.error("Tambahkan ASISTEN_INVITE_CODE=<kode> di file .env atau jalankan:");
  console.error("  ASISTEN_INVITE_CODE=kode_asisten node scripts/seed-firebase.js\n");
  process.exit(1);
}

async function getOrCreateUser(email, password, displayName) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    return res.user;
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res.user;
    }
    throw err;
  }
}

async function seed() {
  console.log("=== Mulai Seeding Firebase Auth & Firestore ===");

  const uids = {};

  // 1. Akun Asisten
  const asistenList = [
    { email: "dina@rawuh.ac.id", name: "Dina Pratiwi" },
    { email: "raka@rawuh.ac.id", name: "Raka Pratama" },
  ];

  for (const asisten of asistenList) {
    const user = await getOrCreateUser(asisten.email, DEFAULT_PASSWORD, asisten.name);
    uids[asisten.email] = user.uid;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        name: asisten.name,
        email: asisten.email,
        role: "asisten",
        inviteCode: INVITE_CODE,
        createdAt: serverTimestamp(),
      });
      console.log(`✓ Asisten profile dibuat: ${asisten.name} (${asisten.email}) -> ${user.uid}`);
    } else {
      console.log(`✓ Asisten sudah ada: ${asisten.name} (${asisten.email})`);
    }
  }

  // 2. Akun Praktikan
  const praktikanList = [
    { email: "bagas@rawuh.ac.id", name: "Bagas Saputra", kelas: "A" },
    { email: "citra@rawuh.ac.id", name: "Citra Lestari", kelas: "A" },
    { email: "fajar@rawuh.ac.id", name: "Fajar Nugraha", kelas: "A" },
    { email: "dani@rawuh.ac.id", name: "Dani Firmansyah", kelas: "B" },
    { email: "eka@rawuh.ac.id", name: "Eka Rahmawati", kelas: "B" },
    { email: "gita@rawuh.ac.id", name: "Gita Permata", kelas: "B" },
  ];

  for (const praktikan of praktikanList) {
    const user = await getOrCreateUser(praktikan.email, DEFAULT_PASSWORD, praktikan.name);
    uids[praktikan.email] = user.uid;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        name: praktikan.name,
        email: praktikan.email,
        role: "praktikan",
        kelas: praktikan.kelas,
        createdAt: serverTimestamp(),
      });
      console.log(`✓ Praktikan profile dibuat: ${praktikan.name} (${praktikan.email}) Kelas ${praktikan.kelas}`);
    } else {
      console.log(`✓ Praktikan sudah ada: ${praktikan.name} (${praktikan.email})`);
    }
  }

  // 3. Login kembali sebagai Asisten Dina untuk membuat Kelas dan Sesi
  const dinaUser = await signInWithEmailAndPassword(auth, "dina@rawuh.ac.id", DEFAULT_PASSWORD);
  console.log("\n✓ Login sebagai Asisten Dina untuk konfigurasi Kelas dan Sesi...");

  // Kelas Praktikum
  const kelasList = [
    { id: "kp-1", praktikum: "Basis Data", kelas: "A" },
    { id: "kp-2", praktikum: "Basis Data", kelas: "B" },
    { id: "kp-3", praktikum: "Pemrograman Mobile", kelas: "A" },
    { id: "kp-4", praktikum: "Pemrograman Mobile", kelas: "B" },
  ];

  for (const kp of kelasList) {
    const snap = await getDoc(doc(db, "kelasPraktikum", kp.id));
    if (!snap.exists()) {
      await setDoc(doc(db, "kelasPraktikum", kp.id), {
        praktikum: kp.praktikum,
        kelas: kp.kelas,
        createdBy: dinaUser.user.uid,
      });
      console.log(`✓ Kelas Praktikum dibuat: ${kp.praktikum} - Kelas ${kp.kelas}`);
    } else {
      console.log(`✓ Kelas Praktikum sudah ada: ${kp.praktikum} - Kelas ${kp.kelas}`);
    }
  }

  // Sesi Praktikum
  const sessions = [
    {
      id: "ses-1",
      praktikum: "Basis Data",
      kelas: "A",
      topik: "Normalisasi dan ERD",
      ruang: "Lab Komputer 1",
      startAt: "2026-11-12T08:00:00.000Z",
      endAt: "2026-11-12T10:00:00.000Z",
      status: "open",
      code: "0427",
    },
    {
      id: "ses-2",
      praktikum: "Pemrograman Mobile",
      kelas: "A",
      topik: "React Native Navigation & State",
      ruang: "Lab Komputer 3",
      startAt: "2026-11-13T13:00:00.000Z",
      endAt: "2026-11-13T15:00:00.000Z",
      status: "scheduled",
      code: "8821",
    },
    {
      id: "ses-3",
      praktikum: "Basis Data",
      kelas: "B",
      topik: "Query SQL Lanjutan & Subquery",
      ruang: "Lab Komputer 1",
      startAt: "2026-11-11T08:00:00.000Z",
      endAt: "2026-11-11T10:00:00.000Z",
      status: "closed",
      code: "1234",
    },
  ];

  for (const s of sessions) {
    const snap = await getDoc(doc(db, "sessions", s.id));
    if (!snap.exists()) {
      // Buat initial sebagai scheduled
      await setDoc(doc(db, "sessions", s.id), {
        praktikum: s.praktikum,
        kelas: s.kelas,
        topik: s.topik,
        ruang: s.ruang,
        startAt: s.startAt,
        endAt: s.endAt,
        status: "scheduled",
        createdBy: dinaUser.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Simpan kode 4 digit di subkoleksi private
      await setDoc(doc(db, "sessions", s.id, "private", "code"), {
        code: s.code,
      });

      // Update status jika open atau closed
      if (s.status === "open") {
        await updateDoc(doc(db, "sessions", s.id), {
          status: "open",
          openedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });
      } else if (s.status === "closed") {
        await updateDoc(doc(db, "sessions", s.id), {
          status: "open",
          openedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "sessions", s.id), {
          status: "closed",
          closedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });
      }
      console.log(`✓ Sesi Praktikum dibuat: ${s.praktikum} (${s.status}) Kode: ${s.code}`);
    } else {
      console.log(`✓ Sesi Praktikum sudah ada: ${s.praktikum} (${s.status})`);
    }
  }

  // 4. Buat Presensi Bagas Saputra di Sesi 1
  console.log("\n✓ Login sebagai Praktikan Bagas untuk submit presensi...");
  await signInWithEmailAndPassword(auth, "bagas@rawuh.ac.id", DEFAULT_PASSWORD);
  const bagasUid = uids["bagas@rawuh.ac.id"];
  const attendanceId = `ses-1_${bagasUid}`;

  try {
    const attSnap = await getDoc(doc(db, "attendances", attendanceId));
    if (!attSnap.exists()) {
      await setDoc(doc(db, "attendances", attendanceId), {
        sessionId: "ses-1",
        userId: bagasUid,
        kelas: "A",
        code: "0427",
        timestamp: serverTimestamp(),
      });
      console.log("✓ Presensi Bagas di Sesi 1 berhasil tercatat di Firestore!");
    } else {
      console.log("✓ Presensi Bagas di Sesi 1 sudah ada.");
    }
  } catch (attErr) {
    console.warn("Info attendance:", attErr.message);
  }

  // 5. Buat Pengajuan Izin Citra Lestari di Sesi 1
  console.log("\n✓ Login sebagai Praktikan Citra untuk submit pengajuan izin...");
  await signInWithEmailAndPassword(auth, "citra@rawuh.ac.id", DEFAULT_PASSWORD);
  const citraUid = uids["citra@rawuh.ac.id"];
  const izinId = `ses-1_${citraUid}`;

  try {
    const izSnap = await getDoc(doc(db, "izin", izinId));
    if (!izSnap.exists()) {
      await setDoc(doc(db, "izin", izinId), {
        sessionId: "ses-1",
        userId: citraUid,
        userName: "Citra Lestari",
        kelas: "A",
        alasan: "Saya sakit demam tinggi sejak kemarin malam dan harus istirahat.",
        status: "pending_ai",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update AI result
      await updateDoc(doc(db, "izin", izinId), {
        status: "pending_review",
        ai: {
          state: "success",
          kategori: "sakit",
          saran: "diterima",
          sentimen: "netral",
          skor: { negatif: -0.38, netral: 0.34, positif: -0.41 },
          penjelasan: "Alasan terdeteksi kategori sakit. Sentimen teks: netral (eksperimental).",
          eksperimental: true,
          at: new Date().toISOString(),
        },
        updatedAt: serverTimestamp(),
      });
      console.log("✓ Pengajuan Izin Citra di Sesi 1 berhasil dibuat!");
    } else {
      console.log("✓ Pengajuan Izin Citra di Sesi 1 sudah ada.");
    }
  } catch (izErr) {
    console.warn("Info izin Citra:", izErr.message);
  }

  console.log("\n=== SEEDING SELESAI DENGAN SUKSES! ===");
}

seed().catch((err) => {
  console.error("Seeding gagal:", err);
  process.exit(1);
});
