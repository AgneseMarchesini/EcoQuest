// Funzione per testare il caricamento delle missioni
async function testMissioni() {
    // Usiamo coordinate di test (Trento)
    const lat = 46.066423;
    const lng = 11.125760;

    console.log("--- TEST INIZIATO: Recupero missioni in corso... ---");

    try {
        const response = await fetch(`http://localhost:3000/mission/listaMissioni?latitudine=${lat}&longitudine=${lng}`);
        
        if(!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const json = await response.json();

        console.log("STATO RISPOSTA:", response.status);
        console.log("QUANTITÀ MISSIONI:", json.quantita);
        console.log("DATI RICEVUTI:", json.dati);

        const dinamiche = json.dati.filter(m => !m.predefinita);
        const predefinite = json.dati.filter(m => m.predefinita);
        
        console.log(`Verifica: ${predefinite.length} predefinite, ${dinamiche.length} generate al momento.`);
        console.table(json.dati);

    } catch (error) {
        console.error("ERRORE NEL TEST:", error);
    }
}

testMissioni();