
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Workbook } from './types';

const shareCollectionRef = collection(db, 'shared-workbooks');

export async function shareWorkbook(workbook: Workbook): Promise<string> {
    // Create a new document with a unique, auto-generated ID
    const docRef = await addDoc(shareCollectionRef, {
        ...workbook,
        sharedAt: new Date(),
    });
    return docRef.id;
}

export async function getSharedWorkbook(shareId: string): Promise<Workbook | null> {
    const docRef = doc(db, 'shared-workbooks', shareId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // We can remove the sharedAt date before returning the workbook
        const { sharedAt, ...workbook } = data;
        return workbook as Workbook;
    } else {
        console.error("No such document!");
        return null;
    }
}
