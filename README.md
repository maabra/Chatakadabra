1.	OPIS APLIKACIJE
   Chatakadabra je chat platforma inspirirana klasičnim chat sobama. Izgrađena je koristeći koncepte distribuiranih sustava. Aplikacija osigurava komunikaciju u stvarnom vremenu. Platforma podržava više chat soba, backend servere i dinamičko stvaranje soba koristeći FastAPI, DynamoDB i Docker.
Aplikacija pohranjuje sve sobe i poruke u DynamoDB putem FastAPI-ja kroz jedan ili više frontend-a, 3 backend-a te 2 database-a. Za pristup DynamoDB-ju se koristi boto3, za modele koji su izrađeni za backend se koristi Pydantic.
Frontend (React, port 3000) komunicira preko HTTP-a s više backend instanci. Tri backend instance (FastAPI) spajaju se na dva zajednička DynamoDB (dynamodb-local-1 i dynamodb-local-2). Stanje i informacije (sobe i poruke) pohranjene su u DynamoDB.
Određene operacije (npr. login) koriste hash korisničkog imena kako bi više klijenata imalo specifično odabran backend. No, druge operacije mogu birati slučajnu backend instancu. Drugim riječima, podaci su vidljivi na svim instancama jer se čuvaju u zajedničkoj bazi.
Nažalost, nema autentikacije ni autorizacije; „/login“ endpoint dodjeljuje samo lokalni id. i tu autentifikacija i autorizacija prestaje.
Backend instance su stateless; svi podaci su u DynamoDB. Poruke se zapisuju u „chat_messages“; čitanja koriste „ConsistentRead=True“ kako bi se smanjila latencija eventualne nedosljednosti nakon zapisa.
Postoji i „Spam 10 RND” gumb u „ChatRoom“ kojim se dodaje više poruka kako bi se provjerila stabilnost i performanse prikaza/repliciranja poruka te funkcionalnost samog raspodijeljenog sustava.
Koristi se i poseban .js api.js. api.js je klijentski “helper” za pozivanje API-ja iz browsera, a main.py je stvarni API server koji obrađuje zahtjeve, vodi podatke i vraća odgovore. Drugim riječima, funkcije iz api.js kao „getRooms“, „createRoom“, „getMessages“, „sendMessage“I „login“ zovu odgovarajuće rute iz main.py. Ako backend radi ispravno, api.js će dobiti JSON i proslijediti ga UI-ju. Ako backend vrati grešku, api.js baci iznimku.
Frontend koristi i tri zasebne komponente za UI, to su ChatList.js, ChatRoom.js, Login.js. Sama imena odaju njihove funkcije, te se one zovu po potrebi, prve dvije su stalni dio UI-ja, a Login.js je prvobitni meni kojim započinje rad frontend-a aplikacije.

3.	POKRETANJE APLIKACIJE
   Za izradu aplikacije koristio sam primarno Docker i Docker Compose, Node.js te Python. Aplikacija se pokreće kroz docker-compose.yml tj. „docker compose up –build“. Frontend koristi prethodno postavljen popis „REACT_APP_API_BACKENDS“ kako bi znao popis backend baza URL-ova. S druge strane, backend koristi DYNAMO_ENDPOINT i DYNAMO_ENDPOINT_SECONDARY da bi se povezao s DynamoDB.
Docker Compose se sastoji od frontend (port 3000), backend-1 (port 8001), backend-2 (8002), backend-3 (8003), dynamodb-local-1 (port 8000), dynamodb-local-2 (port 8004).
Prije postavljanja Dockera koristio sam „npm start“ za frontend te „uvicorn main:app --reload --host 0.0.0.0 --port 8000“ za backend.
3.	SPECIFIKACIJA API-JA
<img width="792" height="278" alt="image" src="https://github.com/user-attachments/assets/d8b0a3ea-dcaf-4adc-86e1-7ef0cd951378" />


Gore prikazani handler definira GET endpoint na „/rooms“ koji vraća listu soba kao JSON. Ako primarna veza na DynamoDB (primary_ddb) nije dostupna, odnah vraća praznu listu. U suprotnom, poziva scan nad ROOMS_TABLE, prolazi kroz dobivene stavke i za svaku kreira Room s id i name. FastAPI preko response_model=List[Room] validira i serijalizira/normalizira odgovor u očekivani format. 

<img width="792" height="278" alt="image" src="https://github.com/user-attachments/assets/66d8bf35-78b9-488a-913a-9f1de3240526" />



Gore prikazani endpoint je POST endpoint „/rooms” koji prima JSON tijelo u obliku RoomCreate (s imenom sobe) i kreira novu sobu. Generira ID sobe iz trenutnog vremena i sastavlja Room objekt s tim ID om i nazivom iz payload a. Zatim upisuje sobu u primarnu DynamoDB tablicu ROOMS_TABLE, a sekundarnu pokušava ažurirati unutar try/except bloka kako bi izbjegao rušenje na grešci. Dodaje novu sobu i inicijalizira praznu listu poruka za taj room ID. Na kraju vraća stvoreni Room, a FastAPI preko response_model=Room serijalizira ga u JSON.

<img width="820" height="539" alt="image" src="https://github.com/user-attachments/assets/dbfdebe3-7cbd-4c4c-992c-5c930a3c199e" />

Gore prikazano je FastAPI GET endpoint na „/rooms/{room_id}/messages“ koji vraća listu poruka (MessageOut) za zadani room_id. Ako primarna veza na DynamoDB nije dostupna, funkcija odmah vraća praznu listu. Ako je, otvara tablicu MESSAGES_TABLE i izvršava query po ključu roomId == room_id, s konzistentnim čitanjem (prije spomenuto) i uzlaznim poretkom po id-u. Zatim iz rezultata gradi MessageOut objekte, eksplicitno pretvarajući id u int i timestamp u float, te preuzima text i user. Na kraju osvježava messages_by_room za taj room i vraća učitanu listu poruka. 
<img width="797" height="755" alt="image" src="https://github.com/user-attachments/assets/d412a938-0b17-4746-85cf-c8d05fb92c8c" />

Gore prikazani API je POST endpoint na „/rooms/{room_id}/messages“ koji prima MessageIn i kreira novu poruku u toj sobi. Na početku osigurava da postoji lista poruka za taj room (setdefault) te standardizira ulaz: prazni/whitespace text zamjenjuje s „...“ i ako korisnik nije zadan (možemo reći failsafe), koristi „Anon“. Zatim sastavlja MessageOut s jedinstvenim ID‑jem temeljenim na currentTimeMillis, proslijeđenim tekstom/korisnikom i timestampom. Poruka se dodaje u messages_by_room kako bi bila odmah dostupna procesu. Priprema se zapis za DynamoDB (timestamp se pohranjuje kao Decimal od stringa) i upisuje u primarnu tablicu, dok se sekundarna ažurira “best‑effort” unutar try/except bloka. Na kraju vraća kreiranu poruku, a FastAPI preko response_model=MessageOut validira i serijalizira/normalizira odgovor u JSON.


<img width="739" height="211" alt="image" src="https://github.com/user-attachments/assets/27bcc5b7-81ab-49f2-9e47-00d40a0e7e88" />


Gore prikazani endpoint je POST endpoint „/login“ koji prima username, dodjeljuje mu novi ID, sprema par {id: username} u mapu users i vraća taj id i username kao JSON. Kao što sam i prije naveo, implementacija je vrlo jednostavna. Nema provjere autorizacije, autentifikacije sesija ni trajne pohrane, pa se stanje gubi pri restartu procesa.

4.	SLIKE PROJEKTA
<img width="974" height="804" alt="image" src="https://github.com/user-attachments/assets/2f9b7ce2-33b0-4725-9ef6-b3b6d7963190" />

Prva slika prikazuje login ekran za aplikaciju koristeći element Login.js. Korisnik upisuje proizvoljno ime te će gumbom „Enter“ ući u glavni meni.
<img width="974" height="868" alt="image" src="https://github.com/user-attachments/assets/0c333ca5-b700-42ed-b32c-579299be9099" />

Slika iznad prikazuje početni ekran glavnog UI-ja. Prikazani su elementi ChatList.js-a uz ponešto glavnog UI-ja u samom App.js-u. Statusna traka na vrhu prozora pokazuje aktivnog korisnika (npr. „User: Matej”) i broj soba. Lijevo je lista „Chat Rooms” s poljem „Room name…” i gumbom Add (ChatList.js), s desne strane je .gif oblačića teksta i malo „splash“ teksta.


 
<img width="974" height="867" alt="image" src="https://github.com/user-attachments/assets/0c29563e-bc16-444b-ad92-825726692b2c" />


Sljedeća slika prikazuje UI sa otvorenom sobom. Kao prije rečeno, lijevo je ChatList.js, a desno je odabrana soba s porukama i vremenima, te polje za unos poruke s gumbima Send i „Spam 10 RND”. To je nova komponenta ChatRoom.js. Na ovoj slici su prikazane i funkcionalnosti aplikacije. Prvu koju možemo navesti je dodavanje sobe. Upiše se naziv u „Room name…” i klikne Add; nova soba se odmah pojavljuje u listi (npr. “Newly Created Chat”) i može se odmah otvoriti. Sljedeća funkcionalnost je selektiranje sobe. Klikom na naziv u listi odabrana soba postaje vizualno istaknuta (plavo), a desni panel prikazuje njezin naslov i poruke. Nadalje, funkcionalnost „Spam 10 RND“ je gumb u donjem desnom kutu automatski pošalje 10 nasumičnih kratkih poruka u trenutno otvorenu sobu (za demo/test opterećenja i lakšeg prikaza fukncija aplikacije). Zadnja koju možemo vidjeti je dodavanje poruka kao korisnik: u donje polje se upiše poruka i klikne gumb „Send“; poruka se pojavi u listi s prethodno odabranim korisničkim imenom (npr. “USER Matej”) i vizualno je istaknuta (ovdje zelenom pozadinom), uz vremensku oznaku s desne strane kao i ostale poruke.


<img width="918" height="328" alt="image" src="https://github.com/user-attachments/assets/c10b2f0d-103e-4d75-b5a9-f349c30d242e" />

	
Ovo je slika Docker Dektop-a u rubrici Containers koji prikazuje sve zasebne kontejnere instanci koje su potrebne za rad aplikacije. Dvije baze, tri backenda te jedan frontend. Svaka instanca/kontejner ima vlastiti port s vlastitim kodom/slikom. 

<img width="888" height="809" alt="image" src="https://github.com/user-attachments/assets/8849faad-af68-4a88-8ddf-e3cb90a6bfaa" />

 

Za kraj, ovo je prikaz sve tri instance backenda koje funkcioniraju individualno po svakom API call-u. Svaki backend je stateless i upise radi u zajedničku bazu, pa bez obzira što pozivi stižu “u isto vrijeme” na različite kontejnere, podaci završavaju na istom mjestu. Čitanja poruka koriste konzistentno čitanje, pa se svježe promjene odmah vide neovisno o tome koji je backend obradio upis a koji čitanje — sustav se „usuglašava” i ponaša kao jedan backend + jedna baza. „Spamovi“ POST poziva (kad se klikne “Spam 10 RND”) jasno se vide kao serije 200 OK preko više backendova; sve poruke završavaju u istoj tablici i jasno se prikažu u frontend-u.
