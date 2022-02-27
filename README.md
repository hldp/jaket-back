<p align="center">
    Jaket back
    <br />
    <a href="https://lms.univ-cotedazur.fr/mod/assign/view.php?id=34293/">Course project</a>
    ·
    <a href="https://api-jaket.cleverapps.io/">Website</a>
</p>

### Technical stack

- Framework: NestJS
- ORM: Mongoose
- Test: Jest & Supertest

### Local installation

1. Clone the repo.
   ```sh
   git clone https://github.com/hldp/jaket-back.git
   ```
2. Go to the directory.
   ```sh
    cd jaket-back
   ```
3. Copy `.env.example` to `.env.dev` and configure your local settings. It contains the connection identifiers to the database hosted on the cloud, the launch port and the auth token.
5. Install dependencies.
   ```sh
   npm i
   ```

### Run the tests

   ```sh
   npm run test:e2e
   ```

### Run the project

   ```sh
   npm run start:dev
   ```
   
### Contact in case of problem

- [Nicolas Labrousse](https://github.com/hldp/jaket-back/commits?author=NicolasLabrousse): Price history
- [Lisa-Marie Demmer](https://github.com/hldp/jaket-back/commits?author=Lisa-Demmer): Account and fill history routes
- [Damien Piedanna](https://github.com/hldp/jaket-back/commits?author=damien-piedanna): Station routes
