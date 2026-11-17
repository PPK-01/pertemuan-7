const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyApqxMup_RqciM7WgUcoioFGs4EPQYaioA",
  authDomain: "rawuh-presensi.firebaseapp.com",
  projectId: "rawuh-presensi",
  storageBucket: "rawuh-presensi.firebasestorage.app",
  messagingSenderId: "530785331905",
  appId: "1:530785331905:web:81b6025c4d0b8e8df58240",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_PASSWORD = "password123";

async function run() {
  console.log("=== Mulai Seeding Data Izin ke Firestore ===");

  // Dapatkan UID Asisten Dina
  const dinaCred = await signInWithEmailAndPassword(auth, "dina@rawuh.ac.id", DEFAULT_PASSWORD);
  const dinaUid = dinaCred.user.uid;
  console.log("✓ Login Asisten Dina UID:", dinaUid);

  // -------------------------------------------------------------
  // Izin 1: Citra Lestari (ses-1, Kelas A) - pending_review (Sakit -> AI Diterima)
  // -------------------------------------------------------------
  try {
    const citraCred = await signInWithEmailAndPassword(auth, "citra@rawuh.ac.id", DEFAULT_PASSWORD);
    const citraUid = citraCred.user.uid;
    const izinId = `ses-1_${citraUid}`;
    try {
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
    } catch {}

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
    console.log("✓ Izin 1 Sukses: Citra Lestari (Sakit - pending_review)");
  } catch (e) {
    console.warn("Izin 1 info:", e.message);
  }

  // -------------------------------------------------------------
  // Izin 2: Bagas Saputra (ses-2, Kelas A) - pending_review (Tidak Jelas -> AI Ditolak)
  // -------------------------------------------------------------
  try {
    const bagasCred = await signInWithEmailAndPassword(auth, "bagas@rawuh.ac.id", DEFAULT_PASSWORD);
    const bagasUid = bagasCred.user.uid;
    const izinId = `ses-2_${bagasUid}`;
    try {
      await setDoc(doc(db, "izin", izinId), {
        sessionId: "ses-2",
        userId: bagasUid,
        userName: "Bagas Saputra",
        kelas: "A",
        alasan: "Saya ketiduran dan bangun kesiangan",
        status: "pending_ai",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {}

    await updateDoc(doc(db, "izin", izinId), {
      status: "pending_review",
      ai: {
        state: "success",
        kategori: "tidak_jelas",
        saran: "ditolak",
        sentimen: "positif",
        skor: { negatif: -0.91, netral: -0.31, positif: 0.35 },
        penjelasan: "Alasan terdeteksi kategori tidak_jelas. Sentimen teks: positif (eksperimental).",
        eksperimental: true,
        at: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });
    console.log("✓ Izin 2 Sukses: Bagas Saputra (Bangun kesiangan - pending_review)");
  } catch (e) {
    console.warn("Izin 2 info:", e.message);
  }

  // -------------------------------------------------------------
  // Izin 3: Fajar Nugraha (ses-1, Kelas A) - pending_ai
  // KHUSUS UNTUK TESTING AI: Di layar detail izin asisten atau praktikan,
  // tombol "Jalankan analisis AI" / loading AI bisa dites langsung!
  // -------------------------------------------------------------
  try {
    const fajarCred = await signInWithEmailAndPassword(auth, "fajar@rawuh.ac.id", DEFAULT_PASSWORD);
    const fajarUid = fajarCred.user.uid;
    const izinId = `ses-1_${fajarUid}`;
    await setDoc(doc(db, "izin", izinId), {
      sessionId: "ses-1",
      userId: fajarUid,
      userName: "Fajar Nugraha",
      kelas: "A",
      alasan: "Saya mewakili kampus mengikuti lomba olimpiade sains tingkat nasional.",
      status: "pending_ai",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("✓ Izin 3 Sukses: Fajar Nugraha (pending_ai - SIAP UNTUK TES MODEL AI)");
  } catch (e) {
    console.warn("Izin 3 info:", e.message);
  }

  // -------------------------------------------------------------
  // Izin 4: Dani Firmansyah (ses-3, Kelas B) - rejected oleh Asisten
  // -------------------------------------------------------------
  try {
    const daniCred = await signInWithEmailAndPassword(auth, "dani@rawuh.ac.id", DEFAULT_PASSWORD);
    const daniUid = daniCred.user.uid;
    const izinId = `ses-3_${daniUid}`;
    try {
      await setDoc(doc(db, "izin", izinId), {
        sessionId: "ses-3",
        userId: daniUid,
        userName: "Dani Firmansyah",
        kelas: "B",
        alasan: "Saya malas datang ke lab hari ini",
        status: "pending_ai",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {}

    await updateDoc(doc(db, "izin", izinId), {
      status: "pending_review",
      ai: {
        state: "success",
        kategori: "tidak_jelas",
        saran: "ditolak",
        sentimen: "negatif",
        skor: { negatif: 0.05, netral: -0.05, positif: -0.61 },
        penjelasan: "Alasan terdeteksi kategori tidak_jelas. Sentimen teks: negatif (eksperimental).",
        eksperimental: true,
        at: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });

    // Dina review: rejected
    await signInWithEmailAndPassword(auth, "dina@rawuh.ac.id", DEFAULT_PASSWORD);
    await updateDoc(doc(db, "izin", izinId), {
      status: "rejected",
      review: {
        reviewedBy: dinaUid,
        keputusan: "rejected",
        catatan: "Alasan malas tidak dapat diterima.",
        reviewedAt: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });
    console.log("✓ Izin 4 Sukses: Dani Firmansyah (Ditolak oleh asisten)");
  } catch (e) {
    console.warn("Izin 4 info:", e.message);
  }

  // -------------------------------------------------------------
  // Izin 5: Eka Rahmawati (ses-3, Kelas B) - approved oleh Asisten
  // -------------------------------------------------------------
  try {
    const ekaCred = await signInWithEmailAndPassword(auth, "eka@rawuh.ac.id", DEFAULT_PASSWORD);
    const ekaUid = ekaCred.user.uid;
    const izinId = `ses-3_${ekaUid}`;
    try {
      await setDoc(doc(db, "izin", izinId), {
        sessionId: "ses-3",
        userId: ekaUid,
        userName: "Eka Rahmawati",
        kelas: "B",
        alasan: "Ibu saya meninggal dunia tadi pagi di kampung halaman.",
        status: "pending_ai",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {}

    await updateDoc(doc(db, "izin", izinId), {
      status: "pending_review",
      ai: {
        state: "success",
        kategori: "keluarga",
        saran: "diterima",
        sentimen: "positif",
        skor: { negatif: -0.68, netral: -0.33, positif: 0.21 },
        penjelasan: "Alasan terdeteksi kategori keluarga. Sentimen teks: positif (eksperimental).",
        eksperimental: true,
        at: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });

    // Dina review: approved
    await signInWithEmailAndPassword(auth, "dina@rawuh.ac.id", DEFAULT_PASSWORD);
    await updateDoc(doc(db, "izin", izinId), {
      status: "approved",
      review: {
        reviewedBy: dinaUid,
        keputusan: "approved",
        catatan: "Turut berduka cita. Izin disetujui.",
        reviewedAt: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });
    console.log("✓ Izin 5 Sukses: Eka Rahmawati (Disetujui oleh asisten)");
  } catch (e) {
    console.warn("Izin 5 info:", e.message);
  }

  console.log("\n=== SEEDING DATA IZIN SELESAI 100%! ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
