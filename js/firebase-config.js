// Configuração do Firebase (projeto "mercado-canaverde").
// Usado apenas para guardar o histórico de cotações (coleção "cotacoes"),
// acessível de qualquer computador com internet. Nenhum dado sensível trafega aqui.
const firebaseConfig = {
    apiKey: "AIzaSyBWOR7po9iWDE8FosQQ4okHgt2YEqVHvn0",
    authDomain: "mercado-canaverde.firebaseapp.com",
    projectId: "mercado-canaverde",
    storageBucket: "mercado-canaverde.firebasestorage.app",
    messagingSenderId: "845203742127",
    appId: "1:845203742127:web:6fe52798dbce740940235a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const MAX_COTACOES_HISTORICO = 20;
