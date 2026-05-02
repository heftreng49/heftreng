const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyCZByW_n4B888Ec4cjNQDoQovU-rVN75gs',
  projectId: 'bloggerheftreng',
});

const db = getFirestore(app);

async function inspectCollections() {
  const collections = ['feed', 'users', 'follows', 'notifications'];
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      if (snap.size > 0) {
        console.log(`\n=== ${col} (${snap.size} döküman) ===`);
        console.log('Fields:', Object.keys(snap.docs[0].data()).join(', '));
      }
    } catch(e) { console.log(`${col}: ${e.message}`); }
  }
}

inspectCollections();
