Opis projekta 

**Chatakadabra je distribuirana chat platforma inspirirana klasičnim chat sobama. Izgrađena će biti koristeći koncepte distribuiranih sustava. Korisnici se autentificiraju pomoću JWT tokena, a sustav osigurava sigurnu komunikaciju u stvarnom vremenu. Platforma podržava više chat soba, backend servere i dinamičko stvaranje soba koristeći FastAPI, DynamoDB i Docker.**

(ciljevi vs trenutno stanje)

**Ključne mogućnosti:**


JWT Autentifikacija, sigurna prijava s JWT tokenima za autentifikaciju i autorizaciju korisnika (slaba implementacija)

 - izdaje se token na /login (PyJWT), ali se još ne verificira na API pozivima ni WebSocketu

Glavna chat soba, zadana glavna chat soba podijeljena i sinkronizirana kroz više FastAPI servera (dobra implementacija)

 - postojeće sobe, frontend selekcijom backenda osigurava se da svi klijenti iste sobe završe na istoj instanci, a time sve radi u stvarnom vremenu

Stvaranje soba, bilo koji autentificirani korisnik može stvarati i pridružiti se dodatnim chat sobama (dobra implementacija)

 - radi kroz API (POST /rooms), sprema se u DynamoDB, prikaz u frontendu; nova soba dobiva vlastiti WebSocket kanal i povijest

Real-time sinkronizacija, sve poruke koriste asyncio/aiohttp za asinkronu komunikaciju i odmah se repliciraju kroz DynamoDB (dobra implementacija)

 - WebSocket po sobi; poruke se broadcastaju unutar te backend instance i zapisuju u DynamoDB (kao i prije opisano)

Otpornost na greške, preživljava kvarove servera/mreže koristeći Docker kontejnere i DynamoDB replikaciju (osrednja implementacija)

 - više backend kontejnera i odvajanje state-a u DynamoDB Local, s druge strane DynamoDB je in-memory i nema global tables


**Korišteni principi RS:**


DynamoDB replikacija, tj. chat podaci se automatski repliciraju kroz DynamoDB Global Tables za otpornost na greške, drugim riječima ako jedna otkaže, druge nastavljaju raditi (slaba implementacija)

- samo lokalni DynamoDB bez global tables-a

Asinkroni sustav, tj. kritične operacije koriste Python asyncio za neblokiran rad, omogućujući tisuće istovremenih WebSocket konekcija (dobra implementacija)

- FastAPI async endpoint-ovi uz WebSocket implementirani

Eventual consistency, tj. DynamoDB osigurava eventual consistency za chat poruke, što može proći za chat aplikacije (osrednja implementacija)

- lazy-load + cache

Containerized state, tj. Docker kontejneri omogućuju stateless backend servise, s DynamoDB kao vanjskim state store-om (dobra implementacija)

- sve unutar Docker Compose-a, frontend, tri backend instance (8001/8002/8003) i dynamodb-local

JWT sigurnost, tj. svaka WebSocket konekcija i API poziv autoriziran je putem JWT tokena za sigurnu komunikaciju (slaba implementacija)

 -izdavanje tokena postoji, ali nema verifikacije


 (dodati slike?)