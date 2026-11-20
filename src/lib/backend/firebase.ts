import {initializeApp,getApps} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInAnonymously} from 'firebase/auth';
import {initializeFirestore,connectFirestoreEmulator,type FirestoreSettings} from 'firebase/firestore';
import config from './firebase-config.json';
import {shouldUseFetchStreams} from './transport';
// Safari workaround shared with ../jaipur; see firebase/firebase-js-sdk#9789.
const firestoreSettings=():FirestoreSettings&{useFetchStreams:boolean}=>({useFetchStreams:shouldUseFetchStreams(typeof navigator==='undefined'?undefined:navigator)});
let connection:ReturnType<typeof connect>|undefined;
async function connect(){const app=getApps()[0]??initializeApp(import.meta.env.VITE_USE_FIREBASE_EMULATORS==='true'?{...config,apiKey:'demo-key',projectId:'demo-hellsbells',appId:'demo-app'}:config);const auth=getAuth(app),db=initializeFirestore(app,firestoreSettings());if(import.meta.env.VITE_USE_FIREBASE_EMULATORS==='true'){connectAuthEmulator(auth,'http://127.0.0.1:19297',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',18297);}await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);return {auth,db,uid:auth.currentUser!.uid};}
export function connectFirebase(){return connection??=connect().catch(error=>{connection=undefined;throw error;});}
