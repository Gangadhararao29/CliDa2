import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from '@angular/fire/auth';
import { Firestore, collection, doc, getDocs, writeBatch } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  async signInWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
  }

  async loadCloudData(uid: string): Promise<any[]> {
    const userCollection = collection(this.firestore, uid);
    const snapshot = await getDocs(userCollection);
    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => doc.data());
  }

  async uploadToCloud(uid: string, clientsData: any[]): Promise<void> {
    const db = this.firestore;
    const batch = writeBatch(db);
    clientsData.forEach((record) => {
      const clientRef = doc(db, uid, record.name);
      batch.set(clientRef, record);
    });
    await batch.commit();
  }
}
