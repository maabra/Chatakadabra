Opis projekta 

**Chatakadabra je distribuirana chat platforma inspirirana klasičnim chat sobama. Izgrađena će biti koristeći koncepte distribuiranih sustava. Sustav osigurava sigurnu komunikaciju u stvarnom vremenu. Platforma podržava više chat soba, backend servere i dinamičko stvaranje soba koristeći FastAPI, DynamoDB i Docker.**

**Ključne mogućnosti:**

 - postojeće sobe, frontend selekcijom backenda osigurava se da svi klijenti iste sobe završe na istoj instanci, a time sve radi u stvarnom vremenu

 - stvaranje soba radi kroz API (POST /rooms), sprema se u DynamoDB, prikaz u frontendu; nova soba dobiva vlastiti WebSocket kanal i povijest

 - sve poruke koriste asyncio/aiohttp za asinkronu komunikaciju i odmah se repliciraju kroz DynamoDB (dobra implementacija)

**Korišteni principi RS:**


DynamoDB replikacija, tj. chat podaci se automatski repliciraju

- samo lokalni DynamoDB bez global tables-a

Asinkroni sustav, tj. kritične operacije koriste Python asyncio za neblokiran rad

- FastAPI async endpoint-ovi uz WebSocket implementirani

Eventual consistency, tj. DynamoDB osigurava eventual consistency za chat poruke

- lazy-load + cache

Containerized state, tj. Docker kontejneri omogućuju stateless backend servise, s DynamoDB kao vanjskim state store-om

- sve unutar Docker Compose-a, frontend, tri backend instance (8001/8002/8003) i dynamodb-local
