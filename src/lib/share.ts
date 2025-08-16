
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import type { Workbook } from './types';

const shareCollection = collection(db, 'shared-workbooks');

export async function shareWorkbook(workbook: Workbook): Promise<string> {
    const shareId = workbook.id; // Use workbook's own ID for sharing
    const docRef = doc(shareCollection, shareId);
    await setDoc(docRef, {
        ...workbook,
        sharedAt: new Date(),
    });
    return shareId;
}

export async function getSharedWorkbook(shareId: string): Promise<Workbook | null> {
    const docRef = doc(shareCollection, shareId);
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
