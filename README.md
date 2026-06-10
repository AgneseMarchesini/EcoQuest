<a name="readme-top"></a>

# EcoQuest

Questo progetto propone un sistema di generazione di **missioni urbane sostenibili nella città di Trento**, progettato per i cittadini e per incentivare uno stile di vita più consapevole e attivo. A differenza delle tradizionali applicazioni di navigazione o turismo, il sistema non si limita a suggerire percorsi, ma coinvolge l’utente attraverso missioni dinamiche che promuovono comportamenti ecologici, come l’uso della bicicletta, gli spostamenti a piedi e il supporto alle attività locali.
Il sistema è un generatore di missioni basato sulla mappa della città, che collega i principali **punti di interesse** (come Piazza Duomo, MUSE e Castello del Buonconsiglio) attraverso percorsi urbani. Operando come un sistema context-aware, l'algoritmo seleziona e adatta dinamicamente le attività in base a variabili ambientali e personali, tra cui sostenibilità, meteo, livello di affollamento e preferenze dell'utente, per poi integrarle in un framework di gamification. L'assegnazione di punti, badge e ricompense serve così a incentivare l’adozione continuativa di comportamenti sostenibili nella vita quotidiana.
L’obiettivo finale è **migliorare la qualità della vita urbana**, **promuovendo mobilità sostenibile**, benessere individuale e **valorizzazione dell’economia locale**, trasformando le attività quotidiane dei cittadini in un’esperienza interattiva e coinvolgente.

## 📂 Struttura della Repository

Il progetto segue un'architettura modulare per separare chiaramente il frontend dal backend e la logica di business dalle rotte API.

```text
EcoQuest-dev/
├── app.js                        # Punto di ingresso principale dell'applicazione (es. server Express)
├── ecoquestApi.yaml              # Documentazione delle API (formato OpenAPI/Swagger)
├── package.json                  # Dipendenze e script del progetto Node.js
├── utils.js                      # Funzioni di utilità condivise
│
├── external_apis/                # Integrazioni con API di terze parti
│   └── weather.js                # Servizio per il recupero dei dati meteo
│
├── frontend/                     # Codice lato client (Interfaccia Utente)
│   ├── assets/                   # Immagini, loghi e icone (es. pin della mappa)
│   ├── css/                      # Fogli di stile per le varie pagine
│   ├── js/                       # Logica client-side per l'interazione delle pagine
│   └── *.html                    # Pagine HTML dell'applicazione (login, mappa, missioni, ecc.)
│
├── mission_system/               # Logica core per la gestione e generazione delle missioni
│   ├── contextService.js         # Gestione del contesto (es. meteo, ora) per le missioni
│   ├── missionGenerator.js       # Motore di generazione delle missioni dinamiche
│   ├── missionService.js         # Servizi di base per le missioni
│   ├── missionTemplates.js       # Modelli predefiniti per le missioni
│   ├── poiFilter.js              # Filtraggio dei Punti di Interesse (POI)
│   └── scoringService.js         # Logica di assegnazione punti e ricompense
│
├── models/                       # Modelli del database (es. Mongoose/MongoDB)
│   ├── POI.js                    # Modello per i Punti di Interesse
│   ├── amministratore.js         # Modello utente Amministratore
│   ├── esercente.js              # Modello utente Esercente
│   ├── missione.js               # Modello delle Missioni
│   ├── missioneUtente.js         # Relazione tra utenti e missioni intraprese
│   ├── persona.js                # Classe base per le anagrafiche
│   └── utente.js                 # Modello utente standard (Giocatore)
|   └── attivita.js               # Modello dell'Attivita
│   └── coupon.js                 # Modello del Coupon
|   └── couponAcquistato.js       # Modello del Coupon una volta acquistato
|
└── routes/                       # Definizione degli endpoint (Rotter) dell'API
    ├── routeAdmin.js             # Rotte dedicate al pannello di amministrazione
    ├── routeAuth.js              # Rotte per l'autenticazione (login, registrazione)
    ├── routeHome.js              # Rotte per la homepage/dashboard
    ├── routeMission.js           # Rotte per la gestione delle missioni
    └── routePOI.js               # Rotte per la gestione dei Punti di Interesse
    └── routeUser.js              # Rotte per accedere ai dati dell'Utente interni all'app
    └── routeCoupon.js            # Rotte per la gestione dei Coupon
    └── routeEsercente.js.        # Rotte per le azioni dell'Esercente (creazione attività e coupon)
```

Gruppo 8

Alessandro Bignami 242884
Agnese Marchesini 244658
Michele Zanetti 244710

<p align="right">(<a href="#readme-top">torna in alto</a>)</p>
