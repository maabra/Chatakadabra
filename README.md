Špranca projekta 

(podložno promjenama)

#Chatakadabra je distribuirana chat platforma fokusirana na korisnika, inspirirana klasičnim chat sobama. Izgrađena je koristeći koncepte distribuiranih sustava. Korisnici se autentificiraju pomoću JWT tokena, a sustav osigurava sigurnu komunikaciju u stvarnom vremenu. Platforma podržava više chat soba, backend servere i dinamičko stvaranje soba koristeći FastAPI, DynamoDB i Docker.


#Ključne mogućnosti:


JWT Autentifikacija, sigurna prijava s JWT tokenima za autentifikaciju i autorizaciju korisnika

Glavna chat soba, zadana glavna chat soba podijeljena i sinkronizirana kroz više FastAPI servera

Stvaranje soba, bilo koji autentificirani korisnik može stvarati i pridružiti se dodatnim chat sobama

Real-time sinkronizacija, sve poruke koriste asyncio/aiohttp za asinkronu komunikaciju i odmah se repliciraju kroz DynamoDB

Otpornost na greške, preživljava kvarove servera/mreže koristeći Docker kontejnere i DynamoDB replikaciju



#Korišteni principi RS:


DynamoDB replikacija, chat podaci se automatski repliciraju kroz DynamoDB Global Tables za otpornost na greške, drugim riječima ako jedna otkaže, druge nastavljaju raditi

Asinkroni xustav, kritične operacije koriste Python asyncio za neblokiran rad, omogućujući tisuće istovremenih WebSocket konekcija

Eventual consistency, DynamoDB osigurava eventual consistency za chat poruke, što može proći za chat aplikacije

Containerized State, Docker kontejneri omogućuju stateless backend servise, s DynamoDB kao vanjskim state store-om

JWT Sigurnost, svaka WebSocket konekcija i API poziv autoriziran je putem JWT tokena za sigurnu komunikaciju


Prvi izgled frontenda, tj. UI-a:


<img width="2559" height="1276" alt="Screenshot 2025-08-28 213154" src="https://github.com/user-attachments/assets/9be4be96-4ce0-412a-8d31-ea4841b060f8" />
<img width="2558" height="1388" alt="Screenshot 2025-08-28 213133" src="https://github.com/user-attachments/assets/033a521e-633c-4bd7-87b7-f9c34734062c" />
