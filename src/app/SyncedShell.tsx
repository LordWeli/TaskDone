import { useMemo } from 'react';
import { createFirestoreStore } from '../features/tasks/firestoreStore';
import { firestore } from '../lib/firestore';
import type { Account } from './Dashboard';
import { Shell } from './Shell';

/** Dashboard backed by Firestore for one user. Own chunk: the Firestore SDK is the heaviest part. */
export default function SyncedShell({ uid, account }: { uid: string; account: Account }) {
  const store = useMemo(() => createFirestoreStore(firestore(), uid), [uid]);
  return <Shell store={store} account={account} />;
}
